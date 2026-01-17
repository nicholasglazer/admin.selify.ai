# AI-First PM Automation Architecture

**Last Updated:** January 17, 2026
**Status:** Planning
**Purpose:** Automate task management with AI agents, connecting user feedback, code fixes, and human approval

---

## Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTOMATED PM PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User Feedback    Service Errors    Manual Tasks    Scheduled Jobs         │
│        │                 │                │                │                 │
│        ▼                 ▼                ▼                ▼                 │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                    PM BOARD (admin.selify.ai)                    │       │
│   │  ┌─────────┐ ┌─────────┐ ┌───────────┐ ┌────────┐ ┌──────┐     │       │
│   │  │ Backlog │→│AI Queue │→│In Progress│→│ Review │→│ Done │     │       │
│   │  └─────────┘ └─────────┘ └───────────┘ └────────┘ └──────┘     │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│              ┌──────────┐   ┌──────────┐   ┌──────────┐                     │
│              │ AI Agent │   │ AI Agent │   │ AI Agent │                     │
│              │(Claude)  │   │(Claude)  │   │(Claude)  │                     │
│              └──────────┘   └──────────┘   └──────────┘                     │
│                    │               │               │                        │
│                    └───────────────┼───────────────┘                        │
│                                    ▼                                         │
│                         ┌──────────────────┐                                │
│                         │  Human Approval  │                                │
│                         │  (PM / Dev Lead) │                                │
│                         └──────────────────┘                                │
│                                    │                                         │
│                                    ▼                                         │
│                         ┌──────────────────┐                                │
│                         │   Auto Deploy    │                                │
│                         │  (Cloudflare)    │                                │
│                         └──────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### 1. Issue Sources (Inputs)

| Source               | Trigger                | Data                                | Destination                             |
| -------------------- | ---------------------- | ----------------------------------- | --------------------------------------- |
| **User Feedback**    | Feedback modal submit  | title, description, screenshot, url | PM Board → Backlog                      |
| **Service Errors**   | SigNoz alert threshold | error trace, service, timestamp     | PM Board → Backlog (priority: critical) |
| **Manual PM Tasks**  | PM creates in admin UI | title, description, labels          | PM Board → Backlog                      |
| **Gitea Issues**     | External/webhook       | issue data, repo, labels            | PM Board → Backlog                      |
| **Scheduled Audits** | Temporal cron          | audit type, findings                | PM Board → Backlog                      |

### 2. Issue Processing (AI Queue)

When an issue moves to **AI Queue**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPORAL WORKFLOW                             │
│                                                                  │
│  1. Analyze Issue                                                │
│     └─ DeepSeek: Classify, estimate complexity, suggest approach │
│                                                                  │
│  2. Gather Context                                               │
│     └─ Read CLAUDE.md, relevant source files, recent commits     │
│                                                                  │
│  3. Execute Fix (Claude Code)                                    │
│     └─ Make code changes, run tests, create PR                   │
│                                                                  │
│  4. Create PR                                                    │
│     └─ Push to Gitea, link to PM issue, request review           │
│                                                                  │
│  5. Update PM Board                                              │
│     └─ Move issue to "Review", attach PR link                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Human Review Gate

When issue reaches **Review**:

- PM/Dev receives notification (email, Slack, admin dashboard)
- Reviews PR diff in Gitea or GitHub mirror
- Options:
  - **Approve** → Auto-merge, deploy, move to Done
  - **Request Changes** → Back to AI Queue with feedback
  - **Reject** → Close issue, move to Done (rejected)

### 4. Auto Deployment

After approval:

```bash
# Triggered by Gitea webhook or manual
source ~/.cloudflare_env && pnpm build && wrangler pages deploy ...
```

---

## Technical Implementation

### Phase 1: Feedback → PM Board (Quick Win)

**Already have:** Feedback modal in dash.selify.ai navbar

**Need to add:**

```javascript
// In dash.selify.ai feedback modal submit handler
async function submitFeedback(feedback) {
  // 1. Save to Supabase (for history)
  const {data: saved} = await supabase
    .from('user_feedback')
    .insert({
      workspace_id: currentWorkspace,
      user_id: currentUser,
      title: feedback.title,
      description: feedback.description,
      url: feedback.url,
      screenshot_url: feedback.screenshot,
      status: 'pending'
    })
    .select()
    .single();

  // 2. Create PM issue via admin API
  await fetch('https://admin.selify.ai/api/pm/issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceToken}`
    },
    body: JSON.stringify({
      title: `[Feedback] ${feedback.title}`,
      description: feedback.description,
      source: 'feedback',
      source_id: saved.id,
      priority: 'medium',
      labels: ['feedback', 'user-reported'],
      metadata: {
        url: feedback.url,
        screenshot: feedback.screenshot,
        user_id: currentUser,
        workspace_id: currentWorkspace
      }
    })
  });
}
```

**Admin API endpoint:**

```javascript
// admin.selify.ai/src/routes/api/pm/issues/+server.js
export async function POST({request, locals}) {
  const issue = await request.json();

  // Save to pm_issues table
  const {data, error} = await locals.supabase
    .from('pm_issues')
    .insert({
      title: issue.title,
      description: issue.description,
      status: 'backlog',
      priority: issue.priority,
      labels: issue.labels,
      source: issue.source,
      source_id: issue.source_id,
      metadata: issue.metadata,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Notify via webhook (optional)
  // await notifySlack(`New issue: ${issue.title}`);

  return json(data);
}
```

### Phase 2: Error Alerts → PM Board

**SigNoz Alert Rule:**

```yaml
# In SigNoz alerting configuration
rules:
  - alert: HighErrorRate
    expr: rate(errors_total[5m]) > 10
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: 'High error rate in {{ $labels.service }}'

  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
```

**Alert Webhook Handler:**

```javascript
// admin.selify.ai/src/routes/api/webhooks/alerts/+server.js
export async function POST({request, locals}) {
  const alert = await request.json();

  // Create PM issue from alert
  await locals.supabase.from('pm_issues').insert({
    title: `[Alert] ${alert.annotations.summary}`,
    description: `
Service: ${alert.labels.service}
Severity: ${alert.labels.severity}
Time: ${alert.startsAt}

${alert.annotations.description || ''}
      `.trim(),
    status: 'backlog',
    priority: alert.labels.severity === 'critical' ? 'critical' : 'high',
    labels: ['alert', 'auto-generated', alert.labels.service],
    source: 'signoz',
    source_id: alert.fingerprint,
    metadata: alert
  });

  return json({ok: true});
}
```

### Phase 3: AI Agent Integration (Temporal)

**Workflow Definition:**

```python
# services/agent-platform/src/workflows/pm_issue_workflow.py
from temporalio import workflow
from temporalio.common import RetryPolicy
from datetime import timedelta

@workflow.defn
class PMIssueWorkflow:
    """Process a PM issue through AI analysis and fix"""

    @workflow.run
    async def run(self, issue_id: str) -> dict:
        # 1. Fetch issue details
        issue = await workflow.execute_activity(
            fetch_issue,
            issue_id,
            start_to_close_timeout=timedelta(seconds=30)
        )

        # 2. Analyze with DeepSeek
        analysis = await workflow.execute_activity(
            analyze_issue,
            issue,
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=RetryPolicy(maximum_attempts=3)
        )

        # 3. Skip if not automatable
        if not analysis['is_automatable']:
            await workflow.execute_activity(
                update_issue_status,
                {'issue_id': issue_id, 'status': 'backlog', 'note': 'Requires human attention'},
                start_to_close_timeout=timedelta(seconds=30)
            )
            return {'status': 'skipped', 'reason': analysis['reason']}

        # 4. Execute fix with Claude Code
        fix_result = await workflow.execute_activity(
            execute_claude_code_fix,
            {
                'issue': issue,
                'analysis': analysis,
                'repo': analysis['target_repo'],
                'branch': f"fix/issue-{issue_id}"
            },
            start_to_close_timeout=timedelta(minutes=30),
            heartbeat_timeout=timedelta(minutes=5)
        )

        # 5. Create PR
        pr = await workflow.execute_activity(
            create_pull_request,
            {
                'repo': analysis['target_repo'],
                'branch': f"fix/issue-{issue_id}",
                'title': f"Fix: {issue['title']}",
                'body': fix_result['summary'],
                'issue_id': issue_id
            },
            start_to_close_timeout=timedelta(minutes=2)
        )

        # 6. Update PM board
        await workflow.execute_activity(
            update_issue_status,
            {
                'issue_id': issue_id,
                'status': 'review',
                'pr_url': pr['url'],
                'ai_summary': fix_result['summary']
            },
            start_to_close_timeout=timedelta(seconds=30)
        )

        return {
            'status': 'success',
            'pr_url': pr['url'],
            'files_changed': fix_result['files_changed']
        }
```

**Activity: Execute Claude Code Fix:**

```python
# services/agent-platform/src/activities/claude_code.py
import subprocess
import json

@activity.defn
async def execute_claude_code_fix(params: dict) -> dict:
    """Run Claude Code to fix an issue"""

    issue = params['issue']
    repo = params['repo']
    branch = params['branch']

    # Clone/checkout repo
    repo_path = f"/tmp/repos/{repo.replace('/', '_')}"
    subprocess.run(['git', 'clone', f'git@gitea.selify.ai:{repo}.git', repo_path], check=True)
    subprocess.run(['git', 'checkout', '-b', branch], cwd=repo_path, check=True)

    # Build prompt for Claude Code
    prompt = f"""
Fix the following issue:

Title: {issue['title']}
Description: {issue['description']}

Instructions:
1. Read the relevant files
2. Make the necessary changes
3. Run tests to verify
4. Commit with a descriptive message

Important:
- Follow the patterns in CLAUDE.md
- Don't over-engineer
- Test your changes
"""

    # Execute Claude Code
    result = subprocess.run(
        ['claude', '--print', '--dangerously-skip-permissions', '-p', prompt],
        cwd=repo_path,
        capture_output=True,
        text=True,
        timeout=1800  # 30 min timeout
    )

    # Get changed files
    diff = subprocess.run(
        ['git', 'diff', '--name-only', 'HEAD~1'],
        cwd=repo_path,
        capture_output=True,
        text=True
    )

    # Push to remote
    subprocess.run(['git', 'push', '-u', 'origin', branch], cwd=repo_path, check=True)

    return {
        'success': result.returncode == 0,
        'output': result.stdout,
        'files_changed': diff.stdout.strip().split('\n'),
        'summary': extract_summary(result.stdout)
    }
```

### Phase 4: Human Approval → Auto Deploy

**PR Approval Webhook:**

```javascript
// admin.selify.ai/src/routes/api/webhooks/gitea/+server.js
export async function POST({request, locals}) {
  const event = await request.json();

  // Handle PR review
  if (event.action === 'reviewed' && event.review.state === 'approved') {
    const pr = event.pull_request;
    const issueId = extractIssueId(pr.body); // Extract from PR body

    // 1. Merge PR
    await fetch(`${GITEA_API}/repos/${pr.base.repo.full_name}/pulls/${pr.number}/merge`, {
      method: 'POST',
      headers: {Authorization: `token ${GITEA_TOKEN}`},
      body: JSON.stringify({merge_method: 'squash'})
    });

    // 2. Trigger deploy (via Temporal or direct)
    await fetch('https://api.selify.ai/deploy', {
      method: 'POST',
      headers: {Authorization: `Bearer ${DEPLOY_TOKEN}`},
      body: JSON.stringify({
        repo: pr.base.repo.full_name,
        branch: pr.base.ref,
        commit: pr.merge_commit_sha
      })
    });

    // 3. Update PM board
    await locals.supabase
      .from('pm_issues')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        pr_merged: true
      })
      .eq('id', issueId);

    // 4. Notify
    await notifySlack(`✅ Issue #${issueId} deployed: ${pr.title}`);
  }

  return json({ok: true});
}
```

---

## Database Schema

```sql
-- PM Issues table
CREATE TABLE pm_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  labels TEXT[] DEFAULT '{}',
  assignee TEXT,

  -- Source tracking
  source TEXT, -- 'feedback', 'alert', 'manual', 'gitea'
  source_id TEXT, -- ID in source system
  metadata JSONB DEFAULT '{}',

  -- AI processing
  ai_analysis JSONB,
  ai_summary TEXT,

  -- PR tracking
  pr_url TEXT,
  pr_merged BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT valid_status CHECK (status IN ('backlog', 'ai_queue', 'in_progress', 'review', 'done')),
  CONSTRAINT valid_priority CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

CREATE INDEX idx_pm_issues_status ON pm_issues(status);
CREATE INDEX idx_pm_issues_priority ON pm_issues(priority);
CREATE INDEX idx_pm_issues_source ON pm_issues(source);

-- Enable RLS
ALTER TABLE pm_issues ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view/edit
CREATE POLICY pm_issues_team_access ON pm_issues
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );
```

---

## Implementation Roadmap

### Week 1: Foundation

- [ ] Create `pm_issues` table in Supabase
- [ ] Replace mock data with real database queries
- [ ] Add API endpoints for CRUD operations
- [ ] Connect feedback modal to PM board

### Week 2: Alerts Integration

- [ ] Set up SigNoz alert webhooks
- [ ] Create alert → issue pipeline
- [ ] Add real-time updates via Supabase subscriptions

### Week 3: AI Agent (MVP)

- [ ] Create Temporal workflow for issue processing
- [ ] Integrate Claude Code for simple fixes
- [ ] Add PR creation to Gitea

### Week 4: Human Loop

- [ ] Add PR review notifications
- [ ] Implement approval → deploy pipeline
- [ ] Add metrics and reporting

---

## Security Considerations

1. **AI Sandboxing**
   - Claude Code runs in isolated container
   - No production database access
   - File modifications limited to src/ directories

2. **Approval Gates**
   - All AI changes require human approval
   - Critical files (auth, billing) require 2 approvals
   - Auto-reject if tests fail

3. **Audit Trail**
   - All AI actions logged
   - PR history preserved
   - Issue timeline tracked

4. **Rate Limiting**
   - Max 10 AI fixes per hour
   - Budget caps per day
   - Alert on unusual activity

---

## Metrics to Track

| Metric                    | Description                 | Target       |
| ------------------------- | --------------------------- | ------------ |
| **Issue Resolution Time** | Time from creation to done  | < 24h for P1 |
| **AI Fix Success Rate**   | % of AI fixes approved      | > 80%        |
| **Human Review Time**     | Time in review status       | < 4h         |
| **Deploy Frequency**      | Deploys per day             | 3-5          |
| **Feedback → Fix Time**   | User report to deployed fix | < 48h        |

---

## Related Documentation

- [GIT_AND_DEPLOYMENT_ARCHITECTURE.md](../../dash.selify.ai/docs/GIT_AND_DEPLOYMENT_ARCHITECTURE.md)
- [AI_FIRST_DEVELOPMENT_PIPELINE.md](../../dash.selify.ai/docs/AI_FIRST_DEVELOPMENT_PIPELINE.md)
- [OBSERVABILITY_AUDIT.md](../../backend-selify.ai/docs/OBSERVABILITY_AUDIT.md)
