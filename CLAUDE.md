# admin.selify.ai - Internal Operations Dashboard

**Last Updated:** January 19, 2026
**Purpose:** Internal team management, workspace admin, AI-first task board, and ops monitoring

---

## Overview

This is the internal admin dashboard for Selify staff. It provides:

- **AI-First PM Board** - Task management for team ops (`/pm`)
- **AI-First QA Dashboard** - Playwright test automation with natural language (`/qa`)
- Team member onboarding (Temporal workflow)
- Workspace management and billing admin
- Service health monitoring
- Ops tools and quick links

---

## Database Schema Architecture

The database uses **two schemas** to separate concerns:

| Schema     | Purpose         | Tables                                  |
| ---------- | --------------- | --------------------------------------- |
| `public`   | Customer data   | workspaces, profiles, products, billing |
| `internal` | Team operations | tasks, team_members, audit_logs         |

### Querying Internal Schema

```javascript
// For team/ops data, use .schema('internal')
const {data} = await supabase.schema('internal').from('tasks').select('*');

// Helper functions in internal schema
const {data} = await supabase.rpc('internal.get_board_summary');
```

### Key Internal Tables

| Table                      | Purpose                             |
| -------------------------- | ----------------------------------- |
| `internal.tasks`           | AI-first task management (PM board) |
| `internal.team_members`    | Selify staff                        |
| `internal.task_activities` | Full audit trail                    |
| `internal.ai_audit_log`    | AI action history                   |

### QA Tables (public schema)

| Table              | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `qa_test_specs`    | Natural language specs + generated Playwright |
| `qa_test_runs`     | Test execution sessions with results         |
| `qa_test_results`  | Individual test outcomes per run             |

**Full docs:** `backend-selify.ai/DATABASE_SCHEMA_DOCUMENTATION.md`

---

## Auth & SSO

**Shared SSO with dash.selify.ai** via Supabase cookies on `.selify.ai` domain.

- If not authenticated, redirects to `dash.selify.ai/auth?redirect=admin`
- Requires `internal.team_members` record with `status = 'active'`
- Permissions via `internal.team_capabilities` and `get_team_member_capabilities()` RPC

## Capability-Based Permissions

Roles are bundles of capabilities. Check capabilities in server load functions:

```javascript
const {capabilities} = await parent();
if (!capabilities?.includes('team.view') && !capabilities?.includes('*')) {
  throw error(403, {message: 'Access denied'});
}
```

### Roles and Capabilities

| Role        | Key Capabilities                                                      |
| ----------- | --------------------------------------------------------------------- |
| super_admin | `*` (all)                                                             |
| developer   | team.view, ops.tasks.\*, ops.qa.\*, ops.logs.view, admin.workspaces.view |
| ops         | ops.services.\*, ops.tasks.view, ops.qa.view, ops.metrics.view        |
| support     | admin.workspaces.view, admin.billing.view                             |

## Project Structure

```
admin.selify.ai/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte       # Root layout with sidebar
│   │   ├── +layout.server.js    # Auth + team member fetch
│   │   ├── +page.svelte         # Dashboard
│   │   ├── pm/                  # AI-First PM Board
│   │   │   ├── +page.server.js  # Loads tasks from internal.tasks
│   │   │   ├── +page.svelte     # Board initialization
│   │   │   ├── PMBoard.svelte   # Kanban board container
│   │   │   ├── PMColumn.svelte  # Status column with drop zone
│   │   │   ├── IssueCard.svelte # Draggable task card
│   │   │   └── IssueModal.svelte # Task detail/edit modal
│   │   ├── qa/                  # AI-First QA Dashboard
│   │   │   ├── +page.server.js  # Loads specs, runs, dashboard summary
│   │   │   ├── +page.svelte     # QA dashboard initialization
│   │   │   ├── QADashboard.svelte    # Coverage & stats overview
│   │   │   ├── QASpecList.svelte     # Test specs list with filters
│   │   │   ├── QARunList.svelte      # Test runs history
│   │   │   ├── QADocs.svelte         # Architecture documentation
│   │   │   ├── NLTestCreator.svelte  # Natural language test creator
│   │   │   ├── SpecDetailModal.svelte # Spec detail/edit modal
│   │   │   └── RunDetailModal.svelte  # Run results modal
│   │   ├── team/
│   │   │   ├── +page.svelte     # Team list
│   │   │   └── onboard/         # Onboarding form
│   │   ├── workspaces/          # Workspace admin
│   │   └── services/            # Service health
│   ├── lib/
│   │   ├── components/          # UI components
│   │   ├── reactiveStates/
│   │   │   ├── pm.svelte.js     # PMBoardReactiveState (drag-drop, CRUD)
│   │   │   └── qa.svelte.js     # QAReactiveState (specs, runs, NL creator)
│   │   └── utils/               # Helpers
│   └── hooks.server.js          # SSO cookie setup
├── supabase/migrations/         # Database migrations
└── wrangler.toml                # Cloudflare Pages config
```

## Commands

```bash
pnpm dev          # Start dev server on port 5174
pnpm build        # Build for production
pnpm deploy       # Deploy to Cloudflare Pages
```

## API Integration

The admin dashboard calls the backend admin API:

- Base URL: `API_BASE_URL` env var (default: `https://api.selify.ai`)
- Auth: Bearer token from session

### Key Endpoints

| Endpoint                       | Purpose                   |
| ------------------------------ | ------------------------- |
| POST /api/admin/team/onboard   | Start onboarding workflow |
| GET /api/admin/team            | List team members         |
| GET /api/admin/workspaces      | List workspaces           |
| GET /api/admin/services/health | Service health status     |
| POST /api/qa/generate-test     | Generate Playwright from NL |
| POST /api/qa/execute-run       | Execute test run           |

## Design System

Uses the same Base16 dark theme as dash.selify.ai:

- Primary: `--color-base0D` (blue)
- Success: `--color-base0B` (green)
- Error: `--color-base08` (red)
- Background: `--color-base00` (dark gray)

### Icons - Lucide (REQUIRED)

**Always use Lucide icons instead of inline SVGs.** Import only the icons you need for tree-shaking:

```svelte
<script>
  // CORRECT - Tree-shaking friendly imports
  import { Search, Plus, Check, X, GripVertical } from '@lucide/svelte';
</script>

<Search size={16} />
<Plus size={14} class="text-base04" />
<GripVertical size={14} strokeWidth={2} />
```

**Common icons for admin:**
| Usage | Icon |
|-------|------|
| Search | `Search` |
| Add/Create | `Plus` |
| Close/Cancel | `X` |
| Confirm/Done | `Check` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Drag handle | `GripVertical` |
| More options | `MoreVertical` |
| Settings | `Settings` |
| Filter | `Filter` |

**NEVER use inline SVGs for standard icons. Always import from @lucide/svelte.**

### Semantic Color Tokens

The theme includes semantic tokens compatible with `@miozu/jera`:

| Token | Maps To | Usage |
|-------|---------|-------|
| `--color-bg` | base00 | Page background |
| `--color-surface` | base01 | Card/panel background |
| `--color-surface-alt` | base02 | Elevated surfaces |
| `--color-text` | base05 | Primary text |
| `--color-text-strong` | base07 | Headings, emphasis |
| `--color-text-muted` | base04 | Secondary text |
| `--color-primary` | base0D | Brand/action color |
| `--color-success` | base0B | Success states |
| `--color-warning` | base0A | Warning states |
| `--color-error` | base08 | Error states |
| `--color-info` | base0C | Info states |

### @miozu/jera Integration

jera components work out-of-the-box with this codebase:

```svelte
<script>
  import { Button, Modal, Input, Badge, Toast } from '@miozu/jera';
</script>

<!-- Works with miozu-dark/miozu-light themes -->
<Button variant="primary">Action</Button>
<Badge variant="success">Active</Badge>
```

**When to use jera vs local components:**
- Use jera for: Generic UI (Modal, Toast, Tabs, forms)
- Use local for: Admin-specific UI (Sidebar, ServiceHealthCard)

---

## CSS & Layout Architecture (2026 Best Practices)

### Layout System

**Root layout provides 20px (p-5) padding.** All pages use 100% width with no centering.

```
+layout.svelte (.content-container)
├── p-5 (20px padding)
├── w-full (100% width)
└── Child pages fill the space
```

### Reusable Layout Utilities

Located in `src/lib/styles/layout.css`. Uses CSS `@layer components` for proper specificity with Tailwind.

| Class | Usage |
|-------|-------|
| `.page` | Standard page container (`w-full h-full`) |
| `.page-flex` | Flex column page (`flex flex-col w-full h-full`) |
| `.page-header` | Page header wrapper (`mb-8`) |
| `.page-title` | Page title (`text-2xl font-semibold`) |
| `.section-header` | Section h2 (`text-xs uppercase`) |
| `.metric-strip` | Stats row with background |
| `.metric-strip-bordered` | Stats row with bottom border |
| `.metric` / `.metric-value` / `.metric-label` | Metric cards |
| `.card` / `.card-hover` / `.card-interactive` | Surface cards |
| `.data-table` | Standard table styles |
| `.tag` / `.tag-ok` / `.tag-warn` / `.tag-err` | Status tags |
| `.tab-nav` / `.tab-btn` | Tab navigation |
| `.btn-primary` / `.btn-secondary` / `.btn-ghost` | Button variants |
| `.status-dot` / `.status-dot-ok` / `.status-dot-warn` | Status indicators |

### Page Template

All pages should follow this structure:

```svelte
<div class="page">  <!-- or .page-flex for flex layout -->
  <header class="page-header">
    <h1 class="page-title">Page Title</h1>
    <p class="page-subtitle">Description</p>
  </header>

  <div class="metric-strip">
    <div class="metric">
      <span class="metric-value">42</span>
      <span class="metric-label">Count</span>
    </div>
  </div>

  <section>
    <h2 class="section-header">Section Title</h2>
    <!-- content -->
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  /* Page-specific styles only */
</style>
```

### CSS Best Practices

1. **Use layout.css classes first** - Check `src/lib/styles/layout.css` before writing custom styles
2. **Page-specific only** - Component styles should only contain truly unique patterns
3. **CSS Layers** - Layout uses `@layer components` for proper Tailwind specificity
4. **No max-width centering** - Pages use full width, root layout provides padding
5. **Design tokens** - Use CSS variables from `theme.css` for colors

### Anti-Patterns to Avoid

```css
/* DON'T: Add page-specific max-width/centering */
.my-page {
  @apply max-w-5xl mx-auto;  /* NO - violates layout consistency */
}

/* DON'T: Add extra padding (root layout already provides it) */
.my-section {
  @apply p-6;  /* NO - causes double padding */
}

/* DON'T: Duplicate common patterns */
.my-header h1 {
  @apply text-2xl font-semibold text-base06;  /* NO - use .page-title */
}

/* DO: Use reusable classes */
<h1 class="page-title">Title</h1>
```

### Migrating Existing Pages

When refactoring pages:

1. Replace `max-w-5xl mx-auto` with `w-full`
2. Remove extra `p-6` padding (root provides p-5)
3. Use `.page-header`, `.page-title`, `.section-header` classes
4. Use `.metric-strip` for stats rows
5. Use `.data-table` for tables
6. Use `.card` for card surfaces

## Deployment

Deploy to Cloudflare Pages:

1. Set environment variables in CF Pages dashboard
2. Run `pnpm deploy` or push to connected repo

Required env vars:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `API_BASE_URL`

---

## QA Module Architecture

The QA dashboard (`/qa`) provides AI-first test automation using Playwright Test Agents.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     admin.selify.ai/qa                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Test Specs  │  │  Test Runs   │  │   Coverage   │          │
│  │    List      │  │   History    │  │   Overview   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              QAReactiveState (Svelte 5 runes)           │   │
│  │  - specs[], runs[], dashboardSummary                    │   │
│  │  - nlCreator state (NL → Playwright)                    │   │
│  │  - CRUD operations with optimistic updates              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/qa/generate-test                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Receive NL spec + target app                        │   │
│  │  2. Call DeepSeek API with Playwright context           │   │
│  │  3. Return generated Playwright code                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  POST /api/qa/execute-run                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Fetch specs for run from database                   │   │
│  │  2. Invoke Playwright Test Agents                       │   │
│  │  3. Stream results back, update qa_test_results         │   │
│  │  4. Apply auto-heals if needed                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Playwright Test Agents                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Planner   │ →  │  Generator  │ →  │   Healer    │        │
│  │   Agent     │    │   Agent     │    │   Agent     │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│        │                  │                  │                  │
│        ▼                  ▼                  ▼                  │
│  Explores app,      Converts plan      Auto-fixes broken       │
│  generates MD       to Playwright      selectors/timeouts      │
│  test plan          test files                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Playwright Test Agents

The system integrates with Playwright's native test agents (released Oct 2025):

| Agent       | Purpose                                           | Trigger                  |
| ----------- | ------------------------------------------------- | ------------------------ |
| **Planner** | Explores app, generates markdown test plans       | When creating new specs  |
| **Generator** | Converts plans to executable Playwright tests   | After NL → code generation |
| **Healer**  | Auto-fixes broken selectors/timeouts              | When tests fail          |

#### Agent Commands

```bash
# Initialize agents in your project
npx playwright init-agents --loop=claude

# Directory structure after init
tests/
├── specs/               # Markdown test plans (Planner output)
│   └── login-flow.md
├── seed.spec.ts         # Environment setup test
└── auth/
    └── login.spec.ts    # Generated Playwright tests
```

### Natural Language → Playwright Flow

```
1. QA writes: "User logs in, navigates to wardrobe, uploads image"
                              │
                              ▼
2. DeepSeek API generates Playwright code:
   ┌─────────────────────────────────────────────────────────┐
   │  test('user uploads garment to wardrobe', async ({page}) => { │
   │    await page.goto('/auth/login');                       │
   │    await page.fill('[name="email"]', 'test@example.com');│
   │    await page.fill('[name="password"]', 'password123');  │
   │    await page.click('button[type="submit"]');            │
   │    await page.waitForURL('/dashboard');                  │
   │    await page.click('text=Wardrobe');                    │
   │    await page.setInputFiles('input[type="file"]', ...);  │
   │    await expect(page.locator('.garment-grid')).toBeVisible(); │
   │  });                                                     │
   └─────────────────────────────────────────────────────────┘
                              │
                              ▼
3. Saved to qa_test_specs with status='draft'
                              │
                              ▼
4. QA reviews, activates → status='active'
                              │
                              ▼
5. Test runs execute via Playwright, results stored
```

### Auto-Healing

When a test fails due to selector changes:

```
1. Test fails: "Unable to find element [data-testid='old-button']"
                              │
                              ▼
2. Healer Agent activates:
   - Analyzes DOM changes
   - Finds new selector via visual/semantic matching
   - Updates: [data-testid='old-button'] → [data-testid='new-button']
                              │
                              ▼
3. Test re-runs with new selector
                              │
                              ▼
4. If passes:
   - Result marked as 'healed'
   - Heal logged to spec.heal_history
   - Spec's heal_count incremented
```

### Database Schema

```sql
-- Test specifications (NL + generated code)
qa_test_specs (
  id, spec_number, name, nl_spec,
  target_app, category, tags[],
  generated_code, generated_by, generated_at,
  status (draft|active|disabled|archived),
  heal_count, heal_history[], flaky_score,
  last_run_at, created_at
)

-- Test execution sessions
qa_test_runs (
  id, run_number, status (queued|running|passed|failed|healed),
  target_app, environment,
  total_specs, passed_count, failed_count, healed_count,
  duration_ms, report_url, trace_url,
  triggered_by, trigger_type, git_branch, git_commit
)

-- Individual test results
qa_test_results (
  id, run_id, spec_id, status,
  duration_ms, error_message, error_screenshot_url,
  was_healed, heal_reason, original_code, healed_code,
  visual_diff_url, visual_diff_percent
)
```

### Key RPC Functions

```javascript
// Get dashboard summary (stats, recent runs, flaky tests)
const {data} = await supabase.rpc('qa_get_dashboard_summary');

// Get spec with recent results
const {data} = await supabase.rpc('qa_get_spec_details', {p_spec_id: specId});
```

### Capabilities Required

| Capability      | Allows                                |
| --------------- | ------------------------------------- |
| `ops.qa.view`   | View specs, runs, dashboard           |
| `ops.qa.create` | Create/edit specs                     |
| `ops.qa.run`    | Execute test runs                     |
| `ops.qa.admin`  | Delete specs, manage settings         |

### Git Integration (Push-Triggered Tests)

Tests automatically run when code is pushed to configured repos via GitPushWorkflow:

```
Push to backend-selify.ai
    ↓
GitPushWorkflow (Temporal)
    ↓
1. DeepSeek analyzes changes
2. Evaluate trust level
3. Run Playwright tests ← if specs configured for this repo
4. Test failures → force human_required
5. Create approval or auto-approve
```

**Spec Configuration:**

| Column | Purpose |
|--------|---------|
| `run_on_push` | Enable push-triggered runs |
| `trigger_on_repos` | Which repos trigger this spec |
| `push_priority` | Execution order (lower = first) |

**Repo → App Mapping:**

| Repo | Affects |
|------|---------|
| `backend-selify.ai` | api.selify.ai |
| `dash.selify.ai` | dash.selify.ai |
| `admin.selify.ai` | admin.selify.ai |

**Key Functions:**

```javascript
// Toggle push trigger for a spec
await qaState.togglePushTrigger(specId, true);

// Set which repos trigger this spec
await qaState.updatePushRepos(specId, ['backend-selify.ai', 'dash.selify.ai']);

// Get specs for a push
const {data} = await supabase.rpc('qa_get_specs_for_push', {p_repo_name: 'backend-selify.ai'});
```

**Full docs:** `backend-selify.ai/docs/QA_GIT_INTEGRATION.md`
