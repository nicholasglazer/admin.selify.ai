-- ============================================================================
-- QA System - AI-First Test Management with Playwright Agents
-- ============================================================================
-- Supports:
-- - Natural language test spec creation (DeepSeek generates Playwright)
-- - Playwright Test Agent integration (planner, generator, healer)
-- - Test run history with auto-heal tracking
-- - Visual regression baselines
-- - Coverage mapping per target app
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Test specification status
CREATE TYPE qa_spec_status AS ENUM (
  'draft',           -- Being written, not yet runnable
  'active',          -- Ready to run
  'disabled',        -- Temporarily disabled
  'archived'         -- No longer in use
);

-- Test run status
CREATE TYPE qa_run_status AS ENUM (
  'queued',          -- Waiting to start
  'running',         -- Currently executing
  'passed',          -- All tests passed
  'failed',          -- Some tests failed
  'healed',          -- Tests auto-healed and passed
  'cancelled',       -- Run was cancelled
  'error'            -- Infrastructure/system error
);

-- Individual test result status
CREATE TYPE qa_result_status AS ENUM (
  'passed',
  'failed',
  'skipped',
  'healed',          -- Auto-healed by Playwright healer agent
  'flaky'            -- Passed on retry
);

-- Target applications
CREATE TYPE qa_target_app AS ENUM (
  'dash.selify.ai',
  'admin.selify.ai',
  'api.selify.ai',
  'vr.selify.ai'
);

-- ============================================================================
-- TEST SPECIFICATIONS (Natural language → Playwright)
-- ============================================================================

CREATE TABLE qa_test_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable ID
  spec_number SERIAL UNIQUE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Target application
  target_app qa_target_app NOT NULL DEFAULT 'dash.selify.ai',
  target_url TEXT,                          -- Specific URL to test (optional)

  -- Natural language specification
  nl_spec TEXT NOT NULL,                    -- User's plain English description
  -- Example: "User logs in, navigates to wardrobe, uploads a garment image,
  --           verifies it appears in the wardrobe grid"

  -- Generated Playwright code (by DeepSeek/Playwright Generator)
  generated_code TEXT,                      -- The actual Playwright test code
  generated_at TIMESTAMPTZ,
  generated_by TEXT,                        -- 'deepseek', 'playwright-generator', 'manual'
  generation_model TEXT,                    -- Model version used

  -- Playwright spec file path (relative to tests/)
  spec_file_path TEXT,                      -- e.g., 'specs/wardrobe/upload-garment.md'
  test_file_path TEXT,                      -- e.g., 'tests/wardrobe/upload-garment.spec.ts'

  -- Status
  status qa_spec_status NOT NULL DEFAULT 'draft',

  -- Categorization
  tags TEXT[] DEFAULT '{}',
  category TEXT,                            -- 'auth', 'billing', 'wardrobe', etc.
  priority INTEGER DEFAULT 50,              -- 1-100, higher = more important

  -- Execution config
  timeout_ms INTEGER DEFAULT 30000,
  retries INTEGER DEFAULT 2,
  browser TEXT DEFAULT 'chromium',          -- 'chromium', 'firefox', 'webkit'
  viewport_width INTEGER DEFAULT 1280,
  viewport_height INTEGER DEFAULT 720,

  -- Dependencies
  depends_on UUID[],                        -- Other specs that must run first
  setup_spec_id UUID REFERENCES qa_test_specs(id), -- Seed/setup test

  -- Auto-heal tracking
  heal_count INTEGER DEFAULT 0,             -- Times healer fixed this spec
  last_healed_at TIMESTAMPTZ,
  heal_history JSONB DEFAULT '[]',          -- Array of {date, changes, reason}

  -- Flakiness tracking
  flaky_score DECIMAL(5,2) DEFAULT 0,       -- 0-100, higher = more flaky
  consecutive_passes INTEGER DEFAULT 0,
  consecutive_fails INTEGER DEFAULT 0,

  -- Visual regression
  visual_baseline_url TEXT,                 -- Reference screenshot
  visual_threshold DECIMAL(3,2) DEFAULT 0.01, -- Pixel diff threshold

  -- Creator/owner
  created_by UUID REFERENCES internal.team_members(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TEST RUNS (Execution sessions)
-- ============================================================================

CREATE TABLE qa_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable ID
  run_number SERIAL UNIQUE,

  -- Run info
  name TEXT,                                -- Optional custom name
  description TEXT,

  -- Status
  status qa_run_status NOT NULL DEFAULT 'queued',

  -- Target
  target_app qa_target_app,
  environment TEXT DEFAULT 'staging',       -- 'staging', 'production', 'preview'
  base_url TEXT,                            -- Override URL for this run

  -- Trigger info
  triggered_by UUID REFERENCES internal.team_members(id),
  trigger_type TEXT DEFAULT 'manual',       -- 'manual', 'scheduled', 'ci', 'pr'
  trigger_ref TEXT,                         -- PR number, commit SHA, etc.

  -- Scope
  spec_ids UUID[],                          -- Specific specs to run (NULL = all active)
  tags TEXT[],                              -- Run specs matching these tags

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results summary
  total_specs INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  healed_count INTEGER DEFAULT 0,
  flaky_count INTEGER DEFAULT 0,

  -- Auto-heal summary
  auto_heals_applied INTEGER DEFAULT 0,
  heal_details JSONB DEFAULT '[]',          -- [{specId, oldCode, newCode, reason}]

  -- Artifacts
  report_url TEXT,                          -- Playwright HTML report URL
  trace_url TEXT,                           -- Playwright trace URL
  video_url TEXT,                           -- Recording URL

  -- Error info (if status = 'error')
  error_message TEXT,
  error_stack TEXT,

  -- Git context
  git_branch TEXT,
  git_commit TEXT,
  git_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TEST RESULTS (Individual spec results within a run)
-- ============================================================================

CREATE TABLE qa_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent run
  run_id UUID NOT NULL REFERENCES qa_test_runs(id) ON DELETE CASCADE,

  -- Which spec
  spec_id UUID NOT NULL REFERENCES qa_test_specs(id),

  -- Result
  status qa_result_status NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Retry info
  attempt_number INTEGER DEFAULT 1,
  total_attempts INTEGER DEFAULT 1,

  -- Error info (if failed)
  error_message TEXT,
  error_stack TEXT,
  error_screenshot_url TEXT,
  failure_step TEXT,                        -- Which step failed

  -- Auto-heal info (if healed)
  was_healed BOOLEAN DEFAULT FALSE,
  heal_reason TEXT,
  original_code TEXT,
  healed_code TEXT,
  healer_confidence DECIMAL(3,2),           -- 0-1

  -- Visual regression
  visual_diff_url TEXT,
  visual_diff_percent DECIMAL(5,2),
  visual_passed BOOLEAN,

  -- Artifacts
  screenshot_url TEXT,
  video_url TEXT,
  trace_url TEXT,
  console_logs JSONB,
  network_logs JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Test specs indexes
CREATE INDEX idx_qa_specs_status ON qa_test_specs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_specs_target ON qa_test_specs(target_app) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_specs_category ON qa_test_specs(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_specs_tags ON qa_test_specs USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_specs_flaky ON qa_test_specs(flaky_score DESC) WHERE deleted_at IS NULL AND flaky_score > 10;
CREATE INDEX idx_qa_specs_priority ON qa_test_specs(priority DESC) WHERE deleted_at IS NULL;

-- Full-text search on specs
CREATE INDEX idx_qa_specs_search ON qa_test_specs USING GIN(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(nl_spec, ''))
) WHERE deleted_at IS NULL;

-- Test runs indexes
CREATE INDEX idx_qa_runs_status ON qa_test_runs(status);
CREATE INDEX idx_qa_runs_target ON qa_test_runs(target_app);
CREATE INDEX idx_qa_runs_created ON qa_test_runs(created_at DESC);
CREATE INDEX idx_qa_runs_trigger ON qa_test_runs(trigger_type, trigger_ref);

-- Test results indexes
CREATE INDEX idx_qa_results_run ON qa_test_results(run_id, status);
CREATE INDEX idx_qa_results_spec ON qa_test_results(spec_id, created_at DESC);
CREATE INDEX idx_qa_results_healed ON qa_test_results(was_healed) WHERE was_healed = TRUE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for specs
CREATE OR REPLACE FUNCTION qa_specs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_specs_updated_at_trigger
  BEFORE UPDATE ON qa_test_specs
  FOR EACH ROW
  EXECUTE FUNCTION qa_specs_updated_at();

-- Auto-update updated_at for runs
CREATE OR REPLACE FUNCTION qa_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_runs_updated_at_trigger
  BEFORE UPDATE ON qa_test_runs
  FOR EACH ROW
  EXECUTE FUNCTION qa_runs_updated_at();

-- Update run summary when results change
CREATE OR REPLACE FUNCTION qa_update_run_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qa_test_runs
  SET
    total_specs = (SELECT COUNT(*) FROM qa_test_results WHERE run_id = NEW.run_id),
    passed_count = (SELECT COUNT(*) FROM qa_test_results WHERE run_id = NEW.run_id AND status = 'passed'),
    failed_count = (SELECT COUNT(*) FROM qa_test_results WHERE run_id = NEW.run_id AND status = 'failed'),
    skipped_count = (SELECT COUNT(*) FROM qa_test_results WHERE run_id = NEW.run_id AND status = 'skipped'),
    healed_count = (SELECT COUNT(*) FROM qa_test_results WHERE run_id = NEW.run_id AND status = 'healed'),
    flaky_count = (SELECT COUNT(*) FROM qa_test_results WHERE run_id = NEW.run_id AND status = 'flaky')
  WHERE id = NEW.run_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_update_run_summary_trigger
  AFTER INSERT OR UPDATE ON qa_test_results
  FOR EACH ROW
  EXECUTE FUNCTION qa_update_run_summary();

-- Update spec's last_run_at when result is added
CREATE OR REPLACE FUNCTION qa_update_spec_last_run()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qa_test_specs
  SET last_run_at = NEW.created_at
  WHERE id = NEW.spec_id;

  -- Update flaky score
  IF NEW.status = 'flaky' THEN
    UPDATE qa_test_specs
    SET flaky_score = LEAST(100, flaky_score + 5)
    WHERE id = NEW.spec_id;
  ELSIF NEW.status = 'passed' THEN
    UPDATE qa_test_specs
    SET
      flaky_score = GREATEST(0, flaky_score - 1),
      consecutive_passes = consecutive_passes + 1,
      consecutive_fails = 0
    WHERE id = NEW.spec_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE qa_test_specs
    SET
      consecutive_passes = 0,
      consecutive_fails = consecutive_fails + 1
    WHERE id = NEW.spec_id;
  END IF;

  -- Update heal tracking
  IF NEW.was_healed THEN
    UPDATE qa_test_specs
    SET
      heal_count = heal_count + 1,
      last_healed_at = NEW.created_at,
      heal_history = heal_history || jsonb_build_object(
        'date', NEW.created_at,
        'reason', NEW.heal_reason,
        'run_id', NEW.run_id
      )
    WHERE id = NEW.spec_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_update_spec_last_run_trigger
  AFTER INSERT ON qa_test_results
  FOR EACH ROW
  EXECUTE FUNCTION qa_update_spec_last_run();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE qa_test_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_test_results ENABLE ROW LEVEL SECURITY;

-- Policy: Active team members can access all QA data
CREATE POLICY qa_specs_team_access ON qa_test_specs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal.team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY qa_runs_team_access ON qa_test_runs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal.team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY qa_results_team_access ON qa_test_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal.team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get QA dashboard summary
CREATE OR REPLACE FUNCTION qa_get_dashboard_summary()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_specs', (SELECT COUNT(*) FROM qa_test_specs WHERE deleted_at IS NULL AND status = 'active'),
    'specs_by_target', (
      SELECT jsonb_object_agg(target_app, count)
      FROM (
        SELECT target_app::TEXT, COUNT(*) as count
        FROM qa_test_specs
        WHERE deleted_at IS NULL AND status = 'active'
        GROUP BY target_app
      ) t
    ),
    'recent_runs', (
      SELECT jsonb_agg(r)
      FROM (
        SELECT id, run_number, status, target_app, total_specs, passed_count, failed_count,
               healed_count, created_at, duration_ms
        FROM qa_test_runs
        ORDER BY created_at DESC
        LIMIT 10
      ) r
    ),
    'pass_rate', (
      SELECT ROUND(
        COALESCE(
          SUM(passed_count)::DECIMAL / NULLIF(SUM(total_specs), 0) * 100,
          0
        ), 1
      )
      FROM qa_test_runs
      WHERE created_at > NOW() - INTERVAL '7 days'
    ),
    'heal_rate', (
      SELECT ROUND(
        COALESCE(
          SUM(healed_count)::DECIMAL / NULLIF(SUM(total_specs), 0) * 100,
          0
        ), 1
      )
      FROM qa_test_runs
      WHERE created_at > NOW() - INTERVAL '7 days'
    ),
    'flaky_specs', (
      SELECT jsonb_agg(f)
      FROM (
        SELECT id, name, flaky_score, last_run_at
        FROM qa_test_specs
        WHERE deleted_at IS NULL AND flaky_score > 10
        ORDER BY flaky_score DESC
        LIMIT 5
      ) f
    ),
    'auto_healed_today', (
      SELECT COUNT(*)
      FROM qa_test_results
      WHERE was_healed = TRUE AND created_at > NOW() - INTERVAL '24 hours'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get full spec details with recent results
CREATE OR REPLACE FUNCTION qa_get_spec_details(p_spec_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'spec', to_jsonb(s.*),
      'recent_results', COALESCE((
        SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.created_at DESC)
        FROM (
          SELECT * FROM qa_test_results
          WHERE spec_id = s.id
          ORDER BY created_at DESC
          LIMIT 20
        ) r
      ), '[]'::jsonb),
      'pass_rate_7d', (
        SELECT ROUND(
          COALESCE(
            COUNT(*) FILTER (WHERE status = 'passed')::DECIMAL / NULLIF(COUNT(*), 0) * 100,
            0
          ), 1
        )
        FROM qa_test_results
        WHERE spec_id = s.id AND created_at > NOW() - INTERVAL '7 days'
      )
    )
    FROM qa_test_specs s
    WHERE s.id = p_spec_id AND s.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON qa_test_specs TO authenticated;
GRANT ALL ON qa_test_runs TO authenticated;
GRANT ALL ON qa_test_results TO authenticated;
GRANT USAGE ON SEQUENCE qa_test_specs_spec_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE qa_test_runs_run_number_seq TO authenticated;

GRANT EXECUTE ON FUNCTION qa_get_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION qa_get_spec_details(UUID) TO authenticated;
