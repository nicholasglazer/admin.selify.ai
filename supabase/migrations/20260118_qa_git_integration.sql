-- ============================================================================
-- QA Git Integration - Link Test Specs to Git Repos for Push-Triggered Tests
-- ============================================================================
-- Enables GitPushWorkflow to discover and run relevant Playwright tests
-- when code is pushed to custom git-api repos.
--
-- Repo → App Mapping Examples:
--   backend-selify.ai → api.selify.ai (and possibly dash.selify.ai)
--   dash.selify.ai    → dash.selify.ai
--   admin.selify.ai   → admin.selify.ai
-- ============================================================================

-- ============================================================================
-- ADD COLUMNS TO qa_test_specs
-- ============================================================================

-- Repos that should trigger this spec on push (e.g., ['backend-selify.ai', 'dash.selify.ai'])
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS trigger_on_repos TEXT[] DEFAULT '{}';

-- Whether to run this spec on git push events
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS run_on_push BOOLEAN DEFAULT FALSE;

-- Priority when running on push (lower = runs first, for critical smoke tests)
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS push_priority INTEGER DEFAULT 100;

-- Max allowed test duration for push-triggered runs (quick tests only)
ALTER TABLE qa_test_specs
ADD COLUMN IF NOT EXISTS push_timeout_ms INTEGER DEFAULT 60000;

-- ============================================================================
-- ADD COLUMNS TO qa_test_runs
-- ============================================================================

-- Link run to git push workflow
ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS git_workflow_id TEXT;

-- Repo that triggered this run
ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS git_repo TEXT;

-- Push SHA that triggered this run
ALTER TABLE qa_test_runs
ADD COLUMN IF NOT EXISTS git_push_sha TEXT;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Find specs to run on push to a specific repo
CREATE INDEX IF NOT EXISTS idx_qa_specs_push_repos
ON qa_test_specs USING GIN(trigger_on_repos)
WHERE deleted_at IS NULL AND status = 'active' AND run_on_push = TRUE;

-- Find runs by workflow
CREATE INDEX IF NOT EXISTS idx_qa_runs_workflow
ON qa_test_runs(git_workflow_id)
WHERE git_workflow_id IS NOT NULL;

-- ============================================================================
-- FUNCTION: Get specs to run for a git push
-- ============================================================================

CREATE OR REPLACE FUNCTION qa_get_specs_for_push(
  p_repo_name TEXT,
  p_max_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  nl_spec TEXT,
  target_app qa_target_app,
  generated_code TEXT,
  push_priority INTEGER,
  push_timeout_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.nl_spec,
    s.target_app,
    s.generated_code,
    s.push_priority,
    s.push_timeout_ms
  FROM qa_test_specs s
  WHERE
    s.deleted_at IS NULL
    AND s.status = 'active'
    AND s.run_on_push = TRUE
    AND s.generated_code IS NOT NULL
    AND p_repo_name = ANY(s.trigger_on_repos)
  ORDER BY s.push_priority ASC, s.created_at ASC
  LIMIT p_max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Create a push-triggered test run
-- ============================================================================

CREATE OR REPLACE FUNCTION qa_create_push_run(
  p_repo_name TEXT,
  p_branch TEXT,
  p_commit_sha TEXT,
  p_workflow_id TEXT,
  p_triggered_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_run_id UUID;
  v_spec_ids UUID[];
BEGIN
  -- Get specs that should run for this repo
  SELECT ARRAY_AGG(id) INTO v_spec_ids
  FROM qa_get_specs_for_push(p_repo_name);

  -- If no specs to run, return NULL
  IF v_spec_ids IS NULL OR array_length(v_spec_ids, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create the run
  INSERT INTO qa_test_runs (
    name,
    description,
    status,
    environment,
    trigger_type,
    trigger_ref,
    spec_ids,
    git_branch,
    git_commit,
    git_repo,
    git_push_sha,
    git_workflow_id,
    triggered_by
  ) VALUES (
    'Push: ' || p_repo_name || '/' || p_branch,
    'Automated test run triggered by push to ' || p_repo_name,
    'queued',
    'staging',
    'push',
    p_commit_sha,
    v_spec_ids,
    p_branch,
    p_commit_sha,
    p_repo_name,
    p_commit_sha,
    p_workflow_id,
    p_triggered_by
  ) RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get push test summary for approval context
-- ============================================================================

CREATE OR REPLACE FUNCTION qa_get_push_run_summary(p_run_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'run_id', r.id,
      'run_number', r.run_number,
      'status', r.status,
      'total_specs', r.total_specs,
      'passed_count', r.passed_count,
      'failed_count', r.failed_count,
      'healed_count', r.healed_count,
      'duration_ms', r.duration_ms,
      'all_passed', (r.status = 'passed' OR r.status = 'healed'),
      'git_repo', r.git_repo,
      'git_branch', r.git_branch,
      'git_commit', LEFT(r.git_commit, 8),
      'failed_specs', (
        SELECT jsonb_agg(jsonb_build_object(
          'name', s.name,
          'error', res.error_message
        ))
        FROM qa_test_results res
        JOIN qa_test_specs s ON s.id = res.spec_id
        WHERE res.run_id = r.id AND res.status = 'failed'
      )
    )
    FROM qa_test_runs r
    WHERE r.id = p_run_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE DASHBOARD SUMMARY TO INCLUDE PUSH STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION qa_get_dashboard_summary()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_specs', (SELECT COUNT(*) FROM qa_test_specs WHERE deleted_at IS NULL AND status = 'active'),
    'push_enabled_specs', (SELECT COUNT(*) FROM qa_test_specs WHERE deleted_at IS NULL AND status = 'active' AND run_on_push = TRUE),
    'specs_by_target', (
      SELECT jsonb_object_agg(target_app, count)
      FROM (
        SELECT target_app::TEXT, COUNT(*) as count
        FROM qa_test_specs
        WHERE deleted_at IS NULL AND status = 'active'
        GROUP BY target_app
      ) t
    ),
    'specs_by_repo', (
      SELECT jsonb_object_agg(repo, count)
      FROM (
        SELECT unnest(trigger_on_repos) as repo, COUNT(*) as count
        FROM qa_test_specs
        WHERE deleted_at IS NULL AND status = 'active' AND run_on_push = TRUE
        GROUP BY repo
      ) t
    ),
    'recent_runs', (
      SELECT jsonb_agg(r)
      FROM (
        SELECT id, run_number, status, target_app, total_specs, passed_count, failed_count,
               healed_count, created_at, duration_ms, trigger_type, git_repo
        FROM qa_test_runs
        ORDER BY created_at DESC
        LIMIT 10
      ) r
    ),
    'recent_push_runs', (
      SELECT jsonb_agg(r)
      FROM (
        SELECT id, run_number, status, total_specs, passed_count, failed_count,
               git_repo, git_branch, LEFT(git_commit, 8) as git_commit_short, created_at
        FROM qa_test_runs
        WHERE trigger_type = 'push'
        ORDER BY created_at DESC
        LIMIT 5
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
    'push_pass_rate', (
      SELECT ROUND(
        COALESCE(
          SUM(passed_count)::DECIMAL / NULLIF(SUM(total_specs), 0) * 100,
          0
        ), 1
      )
      FROM qa_test_runs
      WHERE trigger_type = 'push' AND created_at > NOW() - INTERVAL '7 days'
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

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION qa_get_specs_for_push(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_create_push_run(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION qa_get_push_run_summary(UUID) TO authenticated;
