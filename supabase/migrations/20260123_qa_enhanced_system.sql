-- ============================================================================
-- QA Enhanced System - Suites, Scheduling, Quarantine, Triage
-- ============================================================================
-- This migration enhances the QA system with:
-- - Test suites (static and dynamic groupings)
-- - Scheduled runs with Discord notifications
-- - Flaky quarantine system
-- - Triage view for failure analysis
-- - Temporal workflow integration
-- - RBAC for production runs
-- ============================================================================

-- ============================================================================
-- NEW ENUMS
-- ============================================================================

-- Suite types
CREATE TYPE qa_suite_type AS ENUM (
  'static',            -- Manually selected specs
  'dynamic'            -- Auto-populated by query (tags, category, etc.)
);

-- Schedule frequency
CREATE TYPE qa_schedule_freq AS ENUM (
  'hourly',
  'daily',
  'weekly',
  'custom'             -- Cron expression
);

-- Quarantine status for specs
CREATE TYPE qa_quarantine_status AS ENUM (
  'none',              -- Not quarantined
  'quarantined',       -- Auto-quarantined due to flakiness
  'monitoring'         -- Post-fix monitoring period
);

-- ============================================================================
-- TABLE: qa_test_suites
-- Groups of tests that run together
-- ============================================================================

CREATE TABLE internal.qa_test_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable ID
  suite_number SERIAL UNIQUE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Type: static (manual) or dynamic (query-based)
  suite_type qa_suite_type NOT NULL DEFAULT 'static',

  -- Static suite: explicit spec IDs
  spec_ids UUID[] DEFAULT '{}',

  -- Dynamic suite: filter criteria
  filter_tags TEXT[] DEFAULT '{}',
  filter_category TEXT,
  filter_target_app qa_target_app,
  filter_priority_min INTEGER,                  -- Include specs with priority >= this

  -- Execution config
  parallel BOOLEAN DEFAULT FALSE,               -- Run specs in parallel
  fail_fast BOOLEAN DEFAULT FALSE,              -- Stop on first failure
  timeout_ms INTEGER DEFAULT 300000,            -- Suite-level timeout (5 min default)
  retries INTEGER DEFAULT 1,

  -- Owner
  owner_id UUID REFERENCES internal.team_members(id),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Stats (updated by triggers)
  last_run_at TIMESTAMPTZ,
  last_run_status qa_run_status,
  avg_duration_ms INTEGER,
  pass_rate DECIMAL(5,2) DEFAULT 0,             -- 0-100

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABLE: qa_schedules
-- Scheduled test runs
-- ============================================================================

CREATE TABLE internal.qa_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable ID
  schedule_number SERIAL UNIQUE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- What to run
  suite_id UUID REFERENCES internal.qa_test_suites(id),
  spec_ids UUID[],                              -- Or specific specs
  tags TEXT[],                                  -- Or by tags

  -- Schedule
  frequency qa_schedule_freq NOT NULL DEFAULT 'daily',
  cron_expression TEXT,                         -- For custom frequency
  timezone TEXT DEFAULT 'UTC',

  -- Next/last run tracking
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_run_id UUID,

  -- Environment
  environment TEXT DEFAULT 'staging',           -- staging, production
  target_app qa_target_app,

  -- Notifications
  notify_on_failure BOOLEAN DEFAULT TRUE,
  notify_on_success BOOLEAN DEFAULT FALSE,
  discord_webhook_url TEXT,                     -- Discord webhook for alerts
  notification_threshold INTEGER DEFAULT 1,     -- Notify after N consecutive failures
  consecutive_failures INTEGER DEFAULT 0,

  -- RBAC for production
  requires_approval BOOLEAN DEFAULT FALSE,      -- Require approval for production runs
  approved_by UUID REFERENCES internal.team_members(id),

  -- Owner
  owner_id UUID REFERENCES internal.team_members(id),

  -- Status
  enabled BOOLEAN DEFAULT TRUE,

  -- Temporal workflow tracking
  workflow_id TEXT,                             -- Active Temporal workflow ID
  workflow_status TEXT,                         -- pending, running, completed, failed

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ADD COLUMNS TO qa_test_specs
-- Quarantine and enhanced tracking
-- ============================================================================

-- Quarantine status
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS quarantine_status qa_quarantine_status DEFAULT 'none';

-- Quarantine metadata
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS quarantined_at TIMESTAMPTZ;

ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS quarantine_reason TEXT;

ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS quarantine_expires_at TIMESTAMPTZ;

-- Auto-unquarantine after N consecutive passes
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS unquarantine_threshold INTEGER DEFAULT 3;

-- Owner for triage assignment
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES internal.team_members(id);

-- Triage notes
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS triage_notes TEXT;

ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS last_triaged_at TIMESTAMPTZ;

ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS last_triaged_by UUID REFERENCES internal.team_members(id);

-- ============================================================================
-- ADD COLUMNS TO qa_test_runs
-- Suite and Temporal tracking
-- ============================================================================

-- Suite reference
ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS suite_id UUID REFERENCES internal.qa_test_suites(id);

-- Schedule reference
ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES internal.qa_schedules(id);

-- Temporal workflow tracking
ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS temporal_workflow_id TEXT;

ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS temporal_run_id TEXT;

-- Triage tracking
ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS triage_status TEXT DEFAULT 'pending';  -- pending, in_progress, completed, ignored

ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS triaged_by UUID REFERENCES internal.team_members(id);

ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMPTZ;

ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS triage_notes TEXT;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Suites
CREATE INDEX idx_qa_suites_type ON internal.qa_test_suites(suite_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_suites_owner ON internal.qa_test_suites(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_suites_tags ON internal.qa_test_suites USING GIN(tags) WHERE deleted_at IS NULL;

-- Schedules
CREATE INDEX idx_qa_schedules_next_run ON internal.qa_schedules(next_run_at) WHERE enabled = TRUE;
CREATE INDEX idx_qa_schedules_suite ON internal.qa_schedules(suite_id);
CREATE INDEX idx_qa_schedules_workflow ON internal.qa_schedules(workflow_id) WHERE workflow_id IS NOT NULL;

-- Specs quarantine
CREATE INDEX idx_qa_specs_quarantine ON qa_test_specs(quarantine_status) WHERE quarantine_status != 'none';
CREATE INDEX idx_qa_specs_owner ON qa_test_specs(owner_id) WHERE deleted_at IS NULL;

-- Runs triage
CREATE INDEX idx_qa_runs_triage ON qa_test_runs(triage_status, created_at DESC) WHERE triage_status = 'pending';
CREATE INDEX idx_qa_runs_suite ON qa_test_runs(suite_id);
CREATE INDEX idx_qa_runs_schedule ON qa_test_runs(schedule_id);
CREATE INDEX idx_qa_runs_temporal ON qa_test_runs(temporal_workflow_id) WHERE temporal_workflow_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for suites
CREATE OR REPLACE FUNCTION qa_suites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_suites_updated_at_trigger
  BEFORE UPDATE ON internal.qa_test_suites
  FOR EACH ROW
  EXECUTE FUNCTION qa_suites_updated_at();

-- Auto-update updated_at for schedules
CREATE OR REPLACE FUNCTION qa_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_schedules_updated_at_trigger
  BEFORE UPDATE ON internal.qa_schedules
  FOR EACH ROW
  EXECUTE FUNCTION qa_schedules_updated_at();

-- Auto-quarantine flaky specs
CREATE OR REPLACE FUNCTION qa_auto_quarantine_flaky()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-quarantine if flaky_score > 50 and not already quarantined
  IF NEW.flaky_score > 50 AND NEW.quarantine_status = 'none' THEN
    NEW.quarantine_status = 'quarantined';
    NEW.quarantined_at = NOW();
    NEW.quarantine_reason = 'Auto-quarantined: flaky_score exceeded 50 (current: ' || NEW.flaky_score || ')';
    NEW.quarantine_expires_at = NOW() + INTERVAL '7 days';
  END IF;

  -- Auto-unquarantine after consecutive passes
  IF NEW.quarantine_status = 'quarantined'
     AND NEW.consecutive_passes >= NEW.unquarantine_threshold THEN
    NEW.quarantine_status = 'monitoring';
    NEW.quarantine_reason = NEW.quarantine_reason || ' | Monitoring: ' || NEW.consecutive_passes || ' consecutive passes';
  END IF;

  -- Exit monitoring after more consecutive passes
  IF NEW.quarantine_status = 'monitoring'
     AND NEW.consecutive_passes >= (NEW.unquarantine_threshold * 2) THEN
    NEW.quarantine_status = 'none';
    NEW.quarantined_at = NULL;
    NEW.quarantine_reason = NULL;
    NEW.quarantine_expires_at = NULL;
    NEW.flaky_score = GREATEST(0, NEW.flaky_score - 20);  -- Reduce flaky score
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_auto_quarantine_trigger
  BEFORE UPDATE ON qa_test_specs
  FOR EACH ROW
  WHEN (OLD.flaky_score IS DISTINCT FROM NEW.flaky_score
        OR OLD.consecutive_passes IS DISTINCT FROM NEW.consecutive_passes)
  EXECUTE FUNCTION qa_auto_quarantine_flaky();

-- Update suite stats when run completes
CREATE OR REPLACE FUNCTION qa_update_suite_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when run completes
  IF NEW.status IN ('passed', 'failed', 'healed') AND NEW.suite_id IS NOT NULL THEN
    UPDATE internal.qa_test_suites
    SET
      last_run_at = NEW.completed_at,
      last_run_status = NEW.status,
      avg_duration_ms = (
        SELECT AVG(duration_ms)::INTEGER
        FROM qa_test_runs
        WHERE suite_id = NEW.suite_id
        AND status IN ('passed', 'failed', 'healed')
        AND created_at > NOW() - INTERVAL '30 days'
      ),
      pass_rate = (
        SELECT ROUND(
          COUNT(*) FILTER (WHERE status IN ('passed', 'healed'))::DECIMAL /
          NULLIF(COUNT(*), 0) * 100, 1
        )
        FROM qa_test_runs
        WHERE suite_id = NEW.suite_id
        AND created_at > NOW() - INTERVAL '30 days'
      )
    WHERE id = NEW.suite_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_update_suite_stats_trigger
  AFTER UPDATE ON qa_test_runs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION qa_update_suite_stats();

-- ============================================================================
-- FUNCTIONS: Suite Management
-- ============================================================================

-- Resolve suite to spec IDs (handles both static and dynamic)
CREATE OR REPLACE FUNCTION qa_resolve_suite(p_suite_id UUID)
RETURNS UUID[] AS $$
DECLARE
  v_suite internal.qa_test_suites%ROWTYPE;
  v_spec_ids UUID[];
BEGIN
  SELECT * INTO v_suite FROM internal.qa_test_suites WHERE id = p_suite_id AND deleted_at IS NULL;

  IF v_suite.id IS NULL THEN
    RETURN '{}';
  END IF;

  IF v_suite.suite_type = 'static' THEN
    -- Static: return explicit spec_ids (filter out quarantined)
    SELECT ARRAY_AGG(id) INTO v_spec_ids
    FROM qa_test_specs
    WHERE id = ANY(v_suite.spec_ids)
    AND deleted_at IS NULL
    AND status = 'active'
    AND quarantine_status != 'quarantined';
  ELSE
    -- Dynamic: query based on filters
    SELECT ARRAY_AGG(id) INTO v_spec_ids
    FROM qa_test_specs
    WHERE deleted_at IS NULL
    AND status = 'active'
    AND quarantine_status != 'quarantined'
    AND (v_suite.filter_tags = '{}' OR tags && v_suite.filter_tags)
    AND (v_suite.filter_category IS NULL OR category = v_suite.filter_category)
    AND (v_suite.filter_target_app IS NULL OR target_app = v_suite.filter_target_app)
    AND (v_suite.filter_priority_min IS NULL OR priority >= v_suite.filter_priority_min);
  END IF;

  RETURN COALESCE(v_spec_ids, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get suite with resolved specs
CREATE OR REPLACE FUNCTION qa_get_suite_details(p_suite_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'suite', to_jsonb(s.*),
      'resolved_specs', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', sp.id,
          'name', sp.name,
          'category', sp.category,
          'quarantine_status', sp.quarantine_status
        ))
        FROM qa_test_specs sp
        WHERE sp.id = ANY(qa_resolve_suite(s.id))
      ),
      'recent_runs', (
        SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.created_at DESC)
        FROM (
          SELECT id, run_number, status, passed_count, failed_count, duration_ms, created_at
          FROM qa_test_runs
          WHERE suite_id = s.id
          ORDER BY created_at DESC
          LIMIT 10
        ) r
      )
    )
    FROM internal.qa_test_suites s
    WHERE s.id = p_suite_id AND s.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTIONS: Triage
-- ============================================================================

-- Get triage summary (failures needing attention)
CREATE OR REPLACE FUNCTION qa_get_triage_summary()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'pending_runs', (
      SELECT jsonb_agg(r)
      FROM (
        SELECT
          r.id, r.run_number, r.status, r.failed_count, r.healed_count,
          r.created_at, r.triage_status, r.target_app,
          r.git_branch, r.trigger_type,
          s.name as suite_name
        FROM qa_test_runs r
        LEFT JOIN internal.qa_test_suites s ON s.id = r.suite_id
        WHERE r.status = 'failed'
        AND r.triage_status = 'pending'
        ORDER BY r.created_at DESC
        LIMIT 20
      ) r
    ),
    'quarantined_specs', (
      SELECT jsonb_agg(q)
      FROM (
        SELECT
          id, name, quarantine_status, quarantine_reason,
          quarantined_at, quarantine_expires_at, flaky_score,
          owner_id, consecutive_passes, unquarantine_threshold
        FROM qa_test_specs
        WHERE quarantine_status != 'none'
        AND deleted_at IS NULL
        ORDER BY flaky_score DESC
      ) q
    ),
    'flaky_specs', (
      SELECT jsonb_agg(f)
      FROM (
        SELECT
          id, name, flaky_score, consecutive_fails,
          last_run_at, owner_id, category
        FROM qa_test_specs
        WHERE flaky_score > 20
        AND quarantine_status = 'none'
        AND deleted_at IS NULL
        ORDER BY flaky_score DESC
        LIMIT 10
      ) f
    ),
    'recent_heals', (
      SELECT jsonb_agg(h)
      FROM (
        SELECT
          res.id, res.spec_id, res.heal_reason, res.created_at,
          sp.name as spec_name
        FROM qa_test_results res
        JOIN qa_test_specs sp ON sp.id = res.spec_id
        WHERE res.was_healed = TRUE
        AND res.created_at > NOW() - INTERVAL '24 hours'
        ORDER BY res.created_at DESC
        LIMIT 10
      ) h
    ),
    'stats', jsonb_build_object(
      'pending_triage_count', (SELECT COUNT(*) FROM qa_test_runs WHERE status = 'failed' AND triage_status = 'pending'),
      'quarantined_count', (SELECT COUNT(*) FROM qa_test_specs WHERE quarantine_status = 'quarantined' AND deleted_at IS NULL),
      'monitoring_count', (SELECT COUNT(*) FROM qa_test_specs WHERE quarantine_status = 'monitoring' AND deleted_at IS NULL),
      'healed_24h', (SELECT COUNT(*) FROM qa_test_results WHERE was_healed = TRUE AND created_at > NOW() - INTERVAL '24 hours')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark run as triaged
CREATE OR REPLACE FUNCTION qa_triage_run(
  p_run_id UUID,
  p_status TEXT,                -- 'completed', 'ignored', 'in_progress'
  p_notes TEXT DEFAULT NULL,
  p_triaged_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE qa_test_runs
  SET
    triage_status = p_status,
    triage_notes = p_notes,
    triaged_by = p_triaged_by,
    triaged_at = NOW()
  WHERE id = p_run_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manually quarantine a spec
CREATE OR REPLACE FUNCTION qa_quarantine_spec(
  p_spec_id UUID,
  p_reason TEXT,
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE qa_test_specs
  SET
    quarantine_status = 'quarantined',
    quarantined_at = NOW(),
    quarantine_reason = p_reason,
    quarantine_expires_at = NOW() + (p_expires_in_days || ' days')::INTERVAL,
    consecutive_passes = 0
  WHERE id = p_spec_id AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manually unquarantine a spec
CREATE OR REPLACE FUNCTION qa_unquarantine_spec(p_spec_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE qa_test_specs
  SET
    quarantine_status = 'none',
    quarantined_at = NULL,
    quarantine_reason = NULL,
    quarantine_expires_at = NULL
  WHERE id = p_spec_id AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTIONS: Scheduling
-- ============================================================================

-- Get schedules due to run
CREATE OR REPLACE FUNCTION qa_get_due_schedules()
RETURNS TABLE (
  id UUID,
  name TEXT,
  suite_id UUID,
  spec_ids UUID[],
  tags TEXT[],
  environment TEXT,
  target_app qa_target_app,
  discord_webhook_url TEXT,
  notify_on_failure BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.suite_id,
    s.spec_ids,
    s.tags,
    s.environment,
    s.target_app,
    s.discord_webhook_url,
    s.notify_on_failure
  FROM internal.qa_schedules s
  WHERE s.enabled = TRUE
  AND s.next_run_at <= NOW()
  ORDER BY s.next_run_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate next run time for a schedule
CREATE OR REPLACE FUNCTION qa_calculate_next_run(
  p_frequency qa_schedule_freq,
  p_cron_expression TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'hourly' THEN NOW() + INTERVAL '1 hour'
    WHEN 'daily' THEN NOW() + INTERVAL '1 day'
    WHEN 'weekly' THEN NOW() + INTERVAL '1 week'
    WHEN 'custom' THEN
      -- For custom cron, calculate based on expression
      -- This is simplified; real impl would parse cron
      NOW() + INTERVAL '1 day'
    ELSE NOW() + INTERVAL '1 day'
  END;
END;
$$ LANGUAGE plpgsql;

-- Update schedule after run
CREATE OR REPLACE FUNCTION qa_schedule_completed(
  p_schedule_id UUID,
  p_run_id UUID,
  p_success BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_schedule internal.qa_schedules%ROWTYPE;
BEGIN
  SELECT * INTO v_schedule FROM internal.qa_schedules WHERE id = p_schedule_id;

  UPDATE internal.qa_schedules
  SET
    last_run_at = NOW(),
    last_run_id = p_run_id,
    next_run_at = qa_calculate_next_run(v_schedule.frequency, v_schedule.cron_expression, v_schedule.timezone),
    consecutive_failures = CASE
      WHEN p_success THEN 0
      ELSE consecutive_failures + 1
    END
  WHERE id = p_schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTIONS: Enhanced Dashboard
-- ============================================================================

-- Update dashboard summary to include suites and schedules
CREATE OR REPLACE FUNCTION qa_get_dashboard_summary()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    -- Spec stats
    'total_specs', (SELECT COUNT(*) FROM qa_test_specs WHERE deleted_at IS NULL AND status = 'active'),
    'quarantined_specs', (SELECT COUNT(*) FROM qa_test_specs WHERE deleted_at IS NULL AND quarantine_status = 'quarantined'),
    'push_enabled_specs', (SELECT COUNT(*) FROM qa_test_specs WHERE deleted_at IS NULL AND status = 'active' AND run_on_push = TRUE),

    -- Suite stats
    'total_suites', (SELECT COUNT(*) FROM internal.qa_test_suites WHERE deleted_at IS NULL),
    'active_schedules', (SELECT COUNT(*) FROM internal.qa_schedules WHERE enabled = TRUE),

    -- Specs by target
    'specs_by_target', (
      SELECT jsonb_object_agg(target_app, count)
      FROM (
        SELECT target_app::TEXT, COUNT(*) as count
        FROM qa_test_specs
        WHERE deleted_at IS NULL AND status = 'active'
        GROUP BY target_app
      ) t
    ),

    -- Recent runs
    'recent_runs', (
      SELECT jsonb_agg(r)
      FROM (
        SELECT
          r.id, r.run_number, r.status, r.target_app, r.total_specs,
          r.passed_count, r.failed_count, r.healed_count,
          r.created_at, r.duration_ms, r.trigger_type, r.git_repo,
          r.triage_status, s.name as suite_name
        FROM qa_test_runs r
        LEFT JOIN internal.qa_test_suites s ON s.id = r.suite_id
        ORDER BY r.created_at DESC
        LIMIT 10
      ) r
    ),

    -- Suites with stats
    'suites', (
      SELECT jsonb_agg(s)
      FROM (
        SELECT
          id, suite_number, name, suite_type,
          last_run_status, pass_rate, avg_duration_ms,
          array_length(CASE WHEN suite_type = 'static' THEN spec_ids ELSE qa_resolve_suite(id) END, 1) as spec_count
        FROM internal.qa_test_suites
        WHERE deleted_at IS NULL
        ORDER BY name
        LIMIT 20
      ) s
    ),

    -- Upcoming schedules
    'upcoming_schedules', (
      SELECT jsonb_agg(sch)
      FROM (
        SELECT
          s.id, s.name, s.frequency, s.next_run_at, s.environment,
          st.name as suite_name
        FROM internal.qa_schedules s
        LEFT JOIN internal.qa_test_suites st ON st.id = s.suite_id
        WHERE s.enabled = TRUE
        ORDER BY s.next_run_at ASC
        LIMIT 5
      ) sch
    ),

    -- Pass rate (7 days)
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

    -- Heal rate (7 days)
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

    -- Triage stats
    'triage_pending', (SELECT COUNT(*) FROM qa_test_runs WHERE status = 'failed' AND triage_status = 'pending'),

    -- Flaky specs
    'flaky_specs', (
      SELECT jsonb_agg(f)
      FROM (
        SELECT id, name, flaky_score, last_run_at, quarantine_status
        FROM qa_test_specs
        WHERE deleted_at IS NULL AND flaky_score > 10
        ORDER BY flaky_score DESC
        LIMIT 5
      ) f
    ),

    -- Auto healed today
    'auto_healed_today', (
      SELECT COUNT(*)
      FROM qa_test_results
      WHERE was_healed = TRUE AND created_at > NOW() - INTERVAL '24 hours'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE internal.qa_test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal.qa_schedules ENABLE ROW LEVEL SECURITY;

-- Active team members can access suites
CREATE POLICY qa_suites_team_access ON internal.qa_test_suites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal.team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Active team members can access schedules
CREATE POLICY qa_schedules_team_access ON internal.qa_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal.team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON internal.qa_test_suites TO authenticated;
GRANT ALL ON internal.qa_schedules TO authenticated;
GRANT USAGE ON SEQUENCE internal.qa_test_suites_suite_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE internal.qa_schedules_schedule_number_seq TO authenticated;

GRANT EXECUTE ON FUNCTION qa_resolve_suite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_get_suite_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_get_triage_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION qa_triage_run(UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_quarantine_spec(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_unquarantine_spec(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_get_due_schedules() TO authenticated;
GRANT EXECUTE ON FUNCTION qa_calculate_next_run(qa_schedule_freq, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_schedule_completed(UUID, UUID, BOOLEAN) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE internal.qa_test_suites IS 'Test suite groupings - static (manual) or dynamic (query-based)';
COMMENT ON TABLE internal.qa_schedules IS 'Scheduled test runs with Discord notifications';
COMMENT ON COLUMN qa_test_specs.quarantine_status IS 'Flaky test quarantine: none, quarantined, or monitoring';
COMMENT ON COLUMN qa_test_runs.triage_status IS 'Failure triage workflow: pending, in_progress, completed, ignored';
