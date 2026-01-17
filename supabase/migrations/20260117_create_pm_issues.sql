-- ============================================================================
-- PM Issues - AI-First Project Management System
-- ============================================================================
-- Supports:
-- - AI agents working on issues (analysis, fixes, updates)
-- - Human PMO creating/managing issues manually
-- - Multiple issue types (bug, feature, task, sales, support, etc.)
-- - Full audit trail and activity history
-- - Assignments to humans or AI agents
-- - Parent/child relationships (epics → stories → tasks)
-- - SLA tracking and due dates
-- - Custom fields per issue type
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Issue types - extensible for different departments
CREATE TYPE pm_issue_type AS ENUM (
  'bug',           -- Software defect
  'feature',       -- New feature request
  'task',          -- General task
  'improvement',   -- Enhancement to existing feature
  'sales',         -- Sales-related task
  'support',       -- Customer support ticket
  'security',      -- Security issue (high priority by default)
  'documentation', -- Docs update
  'infrastructure',-- DevOps/infra task
  'research',      -- Research/investigation
  'epic',          -- Large initiative (parent of stories)
  'story'          -- User story (parent of tasks)
);

-- Issue status - Kanban columns
CREATE TYPE pm_issue_status AS ENUM (
  'backlog',       -- Not yet prioritized
  'triage',        -- Being evaluated/categorized
  'ai_queue',      -- Assigned to AI agent for processing
  'ai_working',    -- AI agent actively working
  'in_progress',   -- Human actively working
  'blocked',       -- Blocked by dependency/issue
  'review',        -- Awaiting review (PR, approval, etc.)
  'testing',       -- In QA/testing
  'done',          -- Completed successfully
  'cancelled',     -- Cancelled/won't do
  'duplicate'      -- Duplicate of another issue
);

-- Priority levels
CREATE TYPE pm_issue_priority AS ENUM (
  'critical',      -- Drop everything, fix now
  'high',          -- Important, do soon
  'medium',        -- Normal priority
  'low',           -- Nice to have
  'backlog'        -- Someday/maybe
);

-- Issue source - where it came from
CREATE TYPE pm_issue_source AS ENUM (
  'manual',        -- Created manually by team member
  'feedback',      -- User feedback from dash.selify.ai
  'alert',         -- System alert (SigNoz, monitoring)
  'gitea',         -- Synced from Gitea
  'github',        -- Synced from GitHub
  'email',         -- From support email
  'slack',         -- From Slack integration
  'api',           -- Created via API
  'ai_generated',  -- AI identified this issue
  'scheduled'      -- Created by scheduled job/audit
);

-- Activity types for audit log
CREATE TYPE pm_activity_type AS ENUM (
  'created',
  'updated',
  'status_changed',
  'assigned',
  'unassigned',
  'priority_changed',
  'commented',
  'ai_analysis',
  'ai_fix_started',
  'ai_fix_completed',
  'ai_fix_failed',
  'pr_created',
  'pr_merged',
  'pr_rejected',
  'deployed',
  'linked',
  'unlinked',
  'labeled',
  'unlabeled',
  'due_date_changed',
  'attachment_added',
  'mentioned'
);

-- ============================================================================
-- MAIN ISSUES TABLE
-- ============================================================================

CREATE TABLE pm_issues (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable ID (auto-incrementing for easy reference)
  issue_number SERIAL UNIQUE,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- Classification
  issue_type pm_issue_type NOT NULL DEFAULT 'task',
  status pm_issue_status NOT NULL DEFAULT 'backlog',
  priority pm_issue_priority NOT NULL DEFAULT 'medium',

  -- Labels/tags (flexible categorization)
  labels TEXT[] DEFAULT '{}',

  -- Assignment
  assignee_id UUID REFERENCES team_members(id),      -- Human assignee
  assignee_type TEXT DEFAULT 'human',                 -- 'human' | 'ai_agent'
  ai_agent_id TEXT,                                   -- Which AI agent (e.g., 'claude-code', 'deepseek')

  -- Reporter/creator
  reporter_id UUID REFERENCES team_members(id),

  -- Source tracking
  source pm_issue_source NOT NULL DEFAULT 'manual',
  source_id TEXT,                                     -- ID in source system
  source_url TEXT,                                    -- Link to source (feedback URL, alert link, etc.)

  -- Hierarchy (for epics, stories, subtasks)
  parent_id UUID REFERENCES pm_issues(id),

  -- Dates
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- SLA tracking
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,

  -- Estimation
  story_points INTEGER,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),

  -- Code/PR tracking
  branch_name TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  pr_status TEXT,                                     -- 'open', 'merged', 'closed'
  commit_sha TEXT,

  -- AI processing metadata
  ai_analysis JSONB DEFAULT '{}',                     -- AI's analysis of the issue
  ai_confidence DECIMAL(3,2),                         -- AI's confidence in fix (0.00-1.00)
  ai_summary TEXT,                                    -- AI-generated summary
  ai_suggested_fix TEXT,                              -- AI's suggested approach
  ai_estimated_complexity TEXT,                       -- 'trivial', 'simple', 'medium', 'complex'
  ai_automatable BOOLEAN,                             -- Can AI fix this automatically?
  ai_requires_human BOOLEAN DEFAULT false,            -- Needs human intervention
  ai_attempts INTEGER DEFAULT 0,                      -- Number of AI fix attempts
  ai_last_error TEXT,                                 -- Last AI error if failed

  -- Custom fields (flexible JSON for type-specific data)
  custom_fields JSONB DEFAULT '{}',
  -- Examples:
  -- For sales: {"deal_value": 50000, "company": "Acme", "contact": "john@acme.com"}
  -- For bugs: {"affected_version": "1.2.3", "browser": "Chrome", "os": "macOS"}
  -- For support: {"customer_id": "ws_123", "urgency": "high", "impact": "billing"}

  -- Rich metadata
  metadata JSONB DEFAULT '{}',
  -- Stores: screenshots, stack traces, reproduction steps, related URLs, etc.

  -- Watchers (users subscribed to updates)
  watchers UUID[] DEFAULT '{}',

  -- Environment/context
  environment TEXT,                                   -- 'production', 'staging', 'development'
  affected_services TEXT[],                           -- Which services are affected
  affected_repos TEXT[],                              -- Which repos need changes

  -- Resolution
  resolution TEXT,                                    -- How it was resolved
  resolution_type TEXT,                               -- 'fixed', 'wontfix', 'duplicate', 'invalid', 'workaround'
  duplicate_of UUID REFERENCES pm_issues(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES team_members(id)
);

-- ============================================================================
-- ACTIVITY LOG (Full audit trail)
-- ============================================================================

CREATE TABLE pm_issue_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES pm_issues(id) ON DELETE CASCADE,

  -- Who did it
  actor_id UUID REFERENCES team_members(id),          -- NULL if AI/system
  actor_type TEXT NOT NULL DEFAULT 'human',           -- 'human', 'ai_agent', 'system'
  actor_name TEXT,                                    -- Display name (for AI: 'Claude Code')

  -- What happened
  activity_type pm_activity_type NOT NULL,

  -- Details
  field_name TEXT,                                    -- Which field changed (for updates)
  old_value TEXT,                                     -- Previous value
  new_value TEXT,                                     -- New value

  -- Rich content (for comments, AI analysis, etc.)
  content TEXT,
  content_html TEXT,                                  -- Rendered markdown

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Separate from activities for easier querying)
-- ============================================================================

CREATE TABLE pm_issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES pm_issues(id) ON DELETE CASCADE,

  -- Author
  author_id UUID REFERENCES team_members(id),
  author_type TEXT NOT NULL DEFAULT 'human',          -- 'human', 'ai_agent', 'system'
  author_name TEXT,

  -- Content
  content TEXT NOT NULL,
  content_html TEXT,

  -- For threaded comments
  parent_id UUID REFERENCES pm_issue_comments(id),

  -- Reactions (emoji counts)
  reactions JSONB DEFAULT '{}',                       -- {"👍": 2, "🎉": 1}

  -- Edit tracking
  edited_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- ATTACHMENTS
-- ============================================================================

CREATE TABLE pm_issue_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES pm_issues(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES pm_issue_comments(id) ON DELETE CASCADE,

  -- Uploader
  uploaded_by UUID REFERENCES team_members(id),

  -- File info
  filename TEXT NOT NULL,
  file_type TEXT,                                     -- MIME type
  file_size INTEGER,                                  -- Bytes
  storage_path TEXT NOT NULL,                         -- Path in Supabase Storage
  url TEXT,                                           -- Public URL if applicable

  -- For images
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- LINKS (Related issues, external links)
-- ============================================================================

CREATE TABLE pm_issue_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source issue
  source_issue_id UUID NOT NULL REFERENCES pm_issues(id) ON DELETE CASCADE,

  -- Target (either internal issue or external URL)
  target_issue_id UUID REFERENCES pm_issues(id) ON DELETE CASCADE,
  target_url TEXT,
  target_title TEXT,

  -- Link type
  link_type TEXT NOT NULL,                            -- 'blocks', 'blocked_by', 'relates_to', 'duplicates', 'parent', 'child', 'external'

  -- Who created
  created_by UUID REFERENCES team_members(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure at least one target
  CONSTRAINT has_target CHECK (target_issue_id IS NOT NULL OR target_url IS NOT NULL)
);

-- ============================================================================
-- TIME ENTRIES (For tracking actual time spent)
-- ============================================================================

CREATE TABLE pm_issue_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES pm_issues(id) ON DELETE CASCADE,

  -- Who logged time
  user_id UUID REFERENCES team_members(id),
  user_type TEXT DEFAULT 'human',                     -- 'human', 'ai_agent'

  -- Time
  hours DECIMAL(6,2) NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Description
  description TEXT,

  -- Billable?
  billable BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SAVED FILTERS / VIEWS
-- ============================================================================

CREATE TABLE pm_saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (NULL = shared/global)
  owner_id UUID REFERENCES team_members(id),

  -- Filter details
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,

  -- Filter criteria (JSON query)
  filters JSONB NOT NULL DEFAULT '{}',
  -- Example: {"status": ["backlog", "in_progress"], "priority": ["high", "critical"], "assignee_id": "uuid"}

  -- Display options
  columns TEXT[] DEFAULT '{"title", "status", "priority", "assignee"}',
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'desc',

  -- Visibility
  is_public BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,

  -- Position for ordering
  position INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Main issues indexes
CREATE INDEX idx_pm_issues_status ON pm_issues(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_priority ON pm_issues(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_type ON pm_issues(issue_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_assignee ON pm_issues(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_reporter ON pm_issues(reporter_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_parent ON pm_issues(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_source ON pm_issues(source, source_id);
CREATE INDEX idx_pm_issues_created ON pm_issues(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_due ON pm_issues(due_date) WHERE deleted_at IS NULL AND due_date IS NOT NULL;
CREATE INDEX idx_pm_issues_labels ON pm_issues USING GIN(labels) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_issues_ai_queue ON pm_issues(status, ai_automatable) WHERE status = 'ai_queue' AND deleted_at IS NULL;

-- Full-text search on title and description
CREATE INDEX idx_pm_issues_search ON pm_issues USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) WHERE deleted_at IS NULL;

-- Activities indexes
CREATE INDEX idx_pm_activities_issue ON pm_issue_activities(issue_id, created_at DESC);
CREATE INDEX idx_pm_activities_actor ON pm_issue_activities(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_pm_activities_type ON pm_issue_activities(activity_type);

-- Comments indexes
CREATE INDEX idx_pm_comments_issue ON pm_issue_comments(issue_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_comments_author ON pm_issue_comments(author_id) WHERE deleted_at IS NULL;

-- Attachments indexes
CREATE INDEX idx_pm_attachments_issue ON pm_issue_attachments(issue_id);

-- Links indexes
CREATE INDEX idx_pm_links_source ON pm_issue_links(source_issue_id);
CREATE INDEX idx_pm_links_target ON pm_issue_links(target_issue_id) WHERE target_issue_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION pm_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pm_issues_updated_at_trigger
  BEFORE UPDATE ON pm_issues
  FOR EACH ROW
  EXECUTE FUNCTION pm_issues_updated_at();

-- Auto-set started_at when moving to in_progress
CREATE OR REPLACE FUNCTION pm_issues_started_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('in_progress', 'ai_working') AND OLD.status NOT IN ('in_progress', 'ai_working') THEN
    NEW.started_at = COALESCE(NEW.started_at, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pm_issues_started_at_trigger
  BEFORE UPDATE ON pm_issues
  FOR EACH ROW
  EXECUTE FUNCTION pm_issues_started_at();

-- Auto-set completed_at when moving to done
CREATE OR REPLACE FUNCTION pm_issues_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('done', 'cancelled', 'duplicate') AND OLD.status NOT IN ('done', 'cancelled', 'duplicate') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, NOW());
  END IF;
  -- Clear completed_at if reopened
  IF OLD.status IN ('done', 'cancelled', 'duplicate') AND NEW.status NOT IN ('done', 'cancelled', 'duplicate') THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pm_issues_completed_at_trigger
  BEFORE UPDATE ON pm_issues
  FOR EACH ROW
  EXECUTE FUNCTION pm_issues_completed_at();

-- Log status changes to activities
CREATE OR REPLACE FUNCTION pm_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO pm_issue_activities (
      issue_id, actor_type, activity_type, field_name, old_value, new_value
    ) VALUES (
      NEW.id, 'system', 'status_changed', 'status', OLD.status::TEXT, NEW.status::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pm_log_status_change_trigger
  AFTER UPDATE ON pm_issues
  FOR EACH ROW
  EXECUTE FUNCTION pm_log_status_change();

-- Log assignment changes
CREATE OR REPLACE FUNCTION pm_log_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    INSERT INTO pm_issue_activities (
      issue_id, actor_type, activity_type, field_name, old_value, new_value
    ) VALUES (
      NEW.id, 'system',
      CASE WHEN NEW.assignee_id IS NULL THEN 'unassigned' ELSE 'assigned' END,
      'assignee_id',
      OLD.assignee_id::TEXT,
      NEW.assignee_id::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pm_log_assignment_change_trigger
  AFTER UPDATE ON pm_issues
  FOR EACH ROW
  EXECUTE FUNCTION pm_log_assignment_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE pm_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_issue_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_issue_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_issue_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_issue_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_saved_filters ENABLE ROW LEVEL SECURITY;

-- Policy: Active team members can access all issues
CREATE POLICY pm_issues_team_access ON pm_issues
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY pm_activities_team_access ON pm_issue_activities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY pm_comments_team_access ON pm_issue_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY pm_attachments_team_access ON pm_issue_attachments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY pm_links_team_access ON pm_issue_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY pm_time_team_access ON pm_issue_time_entries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Saved filters: own or public
CREATE POLICY pm_filters_access ON pm_saved_filters
  FOR ALL TO authenticated
  USING (
    owner_id = (SELECT id FROM team_members WHERE user_id = auth.uid())
    OR is_public = true
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get issue with all related data
CREATE OR REPLACE FUNCTION pm_get_issue_full(p_issue_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'issue', to_jsonb(i.*),
    'activities', COALESCE((
      SELECT jsonb_agg(to_jsonb(a.*) ORDER BY a.created_at DESC)
      FROM pm_issue_activities a WHERE a.issue_id = i.id
    ), '[]'::jsonb),
    'comments', COALESCE((
      SELECT jsonb_agg(to_jsonb(c.*) ORDER BY c.created_at ASC)
      FROM pm_issue_comments c WHERE c.issue_id = i.id AND c.deleted_at IS NULL
    ), '[]'::jsonb),
    'attachments', COALESCE((
      SELECT jsonb_agg(to_jsonb(att.*))
      FROM pm_issue_attachments att WHERE att.issue_id = i.id
    ), '[]'::jsonb),
    'links', COALESCE((
      SELECT jsonb_agg(to_jsonb(l.*))
      FROM pm_issue_links l WHERE l.source_issue_id = i.id
    ), '[]'::jsonb),
    'children', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title, 'status', c.status))
      FROM pm_issues c WHERE c.parent_id = i.id AND c.deleted_at IS NULL
    ), '[]'::jsonb)
  ) INTO result
  FROM pm_issues i
  WHERE i.id = p_issue_id AND i.deleted_at IS NULL;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get board summary (counts by status)
CREATE OR REPLACE FUNCTION pm_get_board_summary()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(status, count)
    FROM (
      SELECT status::TEXT, COUNT(*) as count
      FROM pm_issues
      WHERE deleted_at IS NULL
      GROUP BY status
    ) counts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search issues with full-text
CREATE OR REPLACE FUNCTION pm_search_issues(
  p_query TEXT,
  p_status pm_issue_status[] DEFAULT NULL,
  p_priority pm_issue_priority[] DEFAULT NULL,
  p_type pm_issue_type[] DEFAULT NULL,
  p_assignee UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  issue_number INTEGER,
  title TEXT,
  status pm_issue_status,
  priority pm_issue_priority,
  issue_type pm_issue_type,
  assignee_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.issue_number,
    i.title,
    i.status,
    i.priority,
    i.issue_type,
    i.assignee_id,
    i.created_at,
    ts_rank(
      to_tsvector('english', coalesce(i.title, '') || ' ' || coalesce(i.description, '')),
      plainto_tsquery('english', p_query)
    ) as rank
  FROM pm_issues i
  WHERE i.deleted_at IS NULL
    AND (p_query IS NULL OR p_query = '' OR
         to_tsvector('english', coalesce(i.title, '') || ' ' || coalesce(i.description, ''))
         @@ plainto_tsquery('english', p_query))
    AND (p_status IS NULL OR i.status = ANY(p_status))
    AND (p_priority IS NULL OR i.priority = ANY(p_priority))
    AND (p_type IS NULL OR i.issue_type = ANY(p_type))
    AND (p_assignee IS NULL OR i.assignee_id = p_assignee)
  ORDER BY
    CASE WHEN p_query IS NOT NULL AND p_query != '' THEN rank ELSE 0 END DESC,
    i.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================================================

-- Uncomment to insert sample data:
/*
INSERT INTO pm_issues (title, description, issue_type, status, priority, labels, source)
VALUES
  ('Fix login redirect on mobile', 'Users are not redirected after login on iOS Safari', 'bug', 'ai_queue', 'high', ARRAY['bug', 'mobile', 'auth'], 'feedback'),
  ('Add dark mode to settings', 'User requested feature for dark mode toggle', 'feature', 'backlog', 'medium', ARRAY['feature', 'ui'], 'feedback'),
  ('Q1 Sales Pipeline Review', 'Review and update Q1 sales targets', 'sales', 'in_progress', 'high', ARRAY['sales', 'q1'], 'manual'),
  ('Update Stripe webhook handlers', 'Deprecated event types need updating', 'task', 'review', 'high', ARRAY['billing', 'api'], 'manual'),
  ('Database connection pooling issue', 'Intermittent failures during high traffic', 'bug', 'backlog', 'critical', ARRAY['database', 'performance'], 'alert');
*/

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users (Supabase handles this via RLS)
GRANT ALL ON pm_issues TO authenticated;
GRANT ALL ON pm_issue_activities TO authenticated;
GRANT ALL ON pm_issue_comments TO authenticated;
GRANT ALL ON pm_issue_attachments TO authenticated;
GRANT ALL ON pm_issue_links TO authenticated;
GRANT ALL ON pm_issue_time_entries TO authenticated;
GRANT ALL ON pm_saved_filters TO authenticated;
GRANT USAGE ON SEQUENCE pm_issues_issue_number_seq TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION pm_get_issue_full(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION pm_get_board_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION pm_search_issues(TEXT, pm_issue_status[], pm_issue_priority[], pm_issue_type[], UUID, INTEGER, INTEGER) TO authenticated;
