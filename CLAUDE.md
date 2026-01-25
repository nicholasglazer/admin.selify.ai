# admin.selify.ai - Internal Operations Dashboard

**Last Updated:** January 25, 2026
**Purpose:** Internal team management, workspace admin, AI-first task board, and ops monitoring

---

## Overview

This is the internal admin dashboard for Selify staff. It provides:

- **AI-First PM Board** - Task management for team ops (`/pm`)
- **AI-First QA Dashboard** - Playwright test automation with natural language (`/qa`)
- **Observability & Logs** - Centralized log viewer with filtering (`/logs`)
- **Webmail** - Team email client for @selify.ai accounts (`/webmail`)
- Team member onboarding (Temporal workflow)
- Workspace management and billing admin
- Service health monitoring
- Ops tools and quick links

---

## Database Schema Architecture

The database uses **three schemas** to separate concerns:

| Schema          | Purpose           | Tables                                    |
| --------------- | ----------------- | ----------------------------------------- |
| `public`        | Customer data     | workspaces, profiles, products, billing   |
| `internal`      | Team operations   | tasks, team_members, audit_logs           |
| `observability` | Logs & telemetry  | otel_logs, otel_spans, ai_costs           |

### Event-Driven Architecture (Updated January 2026)

The platform now uses **real-time, event-driven architecture** instead of polling patterns:

- **Real-time notifications**: PostgreSQL LISTEN/NOTIFY triggers for instant updates
- **Supabase real-time**: WebSocket subscriptions for dashboard updates
- **Event-driven workers**: No more setInterval loops or fixed polling
- **Intelligent scheduling**: Activity-aware cron jobs replace fixed intervals

#### Real-Time Features Active
- ✅ **Temporal workflow updates**: Instant status changes, no 5-second polling
- ✅ **Instagram webhook processing**: <50ms response time vs 1-second polls
- ✅ **Activity-aware sync**: Dynamic scheduling (2min-2hr) based on account usage
- ✅ **Session management**: Intelligent cleanup (2hr-24hr) vs fixed hourly intervals

### Querying Internal Schema

```javascript
// For team/ops data, use .schema('internal')
const {data} = await supabase.schema('internal').from('tasks').select('*');

// Helper functions in internal schema
const {data} = await supabase.rpc('internal.get_board_summary');

// Real-time subscriptions (NEW - replaces polling)
const subscription = supabase
  .channel('temporal-workflows')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'temporal_workflows'
  }, (payload) => {
    // Instant updates, no polling needed
    this.handleWorkflowUpdate(payload);
  })
  .subscribe();
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

### Event-Driven Tables (New)

| Table                      | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `webhook_events`           | Real-time event processing (no polling)     |
| `temporal_workflows`       | Workflow status with instant notifications  |
| `account_sync_metadata`    | Activity-aware sync scheduling               |

**Full docs:** `backend-selify.ai/DATABASE_SCHEMA_DOCUMENTATION.md`

---

## Auth & SSO

**Shared SSO with dash.selify.ai** via Supabase cookies on `.selify.ai` domain.

- If not authenticated, redirects to `dash.selify.ai/auth?redirect=admin`
- Requires `internal.team_members` record with `status = 'active'`
- Permissions via `internal.team_capabilities` and `get_team_member_capabilities()` RPC

## Webmail & Team Email System

The admin dashboard includes a full-featured webmail client at `/webmail` for team email accounts.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    admin.selify.ai/webmail                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Sidebar    │  │  Email List  │  │ Email View/  │          │
│  │  (folders)   │  │              │  │   Compose    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MailReactiveState (Svelte 5 runes)         │   │
│  │  - accounts[], mailboxes[], messages[]                  │   │
│  │  - IMAP folder sync, message fetch                      │   │
│  │  - SMTP send via backend API                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    webmail-api service                           │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/accounts      - Add email account                    │
│  GET  /api/mailboxes     - List IMAP folders                    │
│  GET  /api/messages      - Fetch messages from folder           │
│  GET  /api/message/:uid  - Get single message with body         │
│  POST /api/send          - Send email via SMTP                  │
│  POST /api/test-connection - Verify IMAP/SMTP credentials       │
│                                                                 │
│  Uses: ImapFlow (IMAP), Nodemailer (SMTP)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MXRoute Email                              │
├─────────────────────────────────────────────────────────────────┤
│  Host: shadow.mxrouting.net                                     │
│  IMAP: Port 993 (SSL)                                           │
│  SMTP: Port 2525 (STARTTLS) - Ports 465/587 blocked on server  │
└─────────────────────────────────────────────────────────────────┘
```

### Email Provider: MXRoute

Team email accounts use **MXRoute** as the email provider:

| Setting | Value |
|---------|-------|
| IMAP Host | `shadow.mxrouting.net` |
| IMAP Port | `993` (SSL) |
| SMTP Host | `shadow.mxrouting.net` |
| SMTP Port | `2525` (STARTTLS) |

**Note:** Standard SMTP ports 465 and 587 are blocked on our Hetzner server. Port 2525 uses STARTTLS for encryption.

### Database Schema

Team email accounts are stored in `internal.team_email_accounts`:

```sql
internal.team_email_accounts (
  id UUID PRIMARY KEY,
  team_member_id UUID REFERENCES internal.team_members(id),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,

  -- Server configuration
  imap_host TEXT NOT NULL,
  imap_port INTEGER DEFAULT 993,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER DEFAULT 2525,

  -- Encrypted credentials (AES-256-GCM)
  password_encrypted TEXT NOT NULL,
  password_iv TEXT NOT NULL,
  password_salt TEXT NOT NULL,

  -- UI preferences
  color TEXT DEFAULT '#8b5cf6',
  is_primary BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Password Encryption

Passwords are encrypted at rest using **AES-256-GCM** with PBKDF2 key derivation:

```javascript
// Encryption parameters
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 with 100,000 iterations
- Salt: Random 16 bytes per account
- IV: Random 12 bytes per encryption

// Stored fields
- password_encrypted: Base64-encoded ciphertext + auth tag
- password_iv: Base64-encoded initialization vector
- password_salt: Base64-encoded salt for key derivation
```

### Team Onboarding Integration

Email accounts are automatically provisioned during team member onboarding via Temporal workflow:

```
1. Admin initiates onboarding at /team/onboard
                    │
                    ▼
2. TeamOnboardingWorkflow (Temporal)
   - Creates team_members record
   - Provisions @selify.ai email in MXRoute
   - Creates team_email_accounts record with encrypted password
   - Sends welcome email with credentials
                    │
                    ▼
3. Team member receives onboarding email with:
   - Login credentials for dash.selify.ai
   - Email password for webmail access
```

### Frontend Components

Located in `src/lib/features/mail/`:

| Component | Purpose |
|-----------|---------|
| `MailLayout.svelte` | Main webmail container with three-panel layout |
| `MailboxSidebar.svelte` | Folder list with unread counts, compose button |
| `EmailList.svelte` | Message list with virtualized scrolling |
| `EmailView.svelte` | Message display with HTML rendering |
| `ComposeModal.svelte` | Email composer with rich text |
| `AddEmailAccountModal.svelte` | Add new email account with provider presets |
| `AccountSwitcher.svelte` | Switch between multiple email accounts |

### State Management

`src/lib/features/mail/state/mailState.svelte.js` uses Svelte 5 runes:

```javascript
class MailReactiveState {
  // Reactive state
  accounts = $state([]);
  mailboxes = $state([]);
  messages = $state([]);
  currentAccount = $state(null);
  currentMailbox = $state('INBOX');

  // Derived state
  specialMailboxes = $derived.by(() => {
    // Deduplicated special folders (Inbox, Sent, Drafts, etc.)
  });

  customMailboxes = $derived.by(() => {
    // User-created folders
  });

  // Methods
  async loadAccounts() { ... }
  async selectMailbox(path) { ... }
  async sendEmail(to, subject, body) { ... }
}
```

### API Endpoints (Kong Gateway)

Webmail API is routed through Kong at `/webmail/api/*`:

```yaml
# volumes/api/kong.yml
- name: webmail-api
  url: http://api-webmail:3012
  routes:
    - name: webmail-api-route
      paths:
        - /webmail
  plugins:
    - name: key-auth
    - name: acl
      config:
        allow: [admin]
```

### Provider Presets

The AddEmailAccountModal includes presets for common providers:

| Provider | IMAP Host | SMTP Host | Notes |
|----------|-----------|-----------|-------|
| MXRoute | shadow.mxrouting.net | shadow.mxrouting.net | Port 2525 SMTP |
| Gmail | imap.gmail.com | smtp.gmail.com | Requires App Password |
| Outlook | outlook.office365.com | smtp.office365.com | |
| Yahoo | imap.mail.yahoo.com | smtp.mail.yahoo.com | Requires App Password |
| Fastmail | imap.fastmail.com | smtp.fastmail.com | |
| Custom | (user provided) | (user provided) | |

### Useful Commands

```bash
# Check webmail API logs
docker logs api-webmail --tail 50 -f

# Test SMTP connectivity (port 2525)
openssl s_client -connect shadow.mxrouting.net:2525 -starttls smtp

# Query team email accounts
docker exec supabase-db psql -U postgres -d postgres -c "
  SELECT email, display_name, smtp_port FROM internal.team_email_accounts;
"

# Update all MXRoute accounts to use port 2525
docker exec supabase-db psql -U postgres -d postgres -c "
  UPDATE internal.team_email_accounts SET smtp_port = 2525
  WHERE smtp_host = 'shadow.mxrouting.net';
"
```

---

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
│   │   ├── logs/                # Observability & Logs
│   │   │   └── +page.svelte     # Log viewer with filters
│   │   ├── webmail/             # Team Email Client
│   │   │   └── +page.svelte     # Webmail interface
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

| Endpoint                       | Purpose                    |
| ------------------------------ | -------------------------- |
| POST /api/admin/team/onboard   | Start onboarding workflow  |
| GET /api/admin/team            | List team members          |
| GET /api/admin/workspaces      | List workspaces            |
| GET /api/admin/services/health | Service health status      |
| POST /api/pm/generate-task     | Generate task from NL      |
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

---

## Observability & Logs Module (Updated January 2026)

The admin dashboard provides centralized log viewing and observability at `/logs`.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Docker Container Logs                           │
│  (selify-*, api-*, worker-*, supabase-*)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                    filelog receiver
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              OpenTelemetry Collector                            │
├─────────────────────────────────────────────────────────────────┤
│  Receivers:                                                     │
│  - OTLP (gRPC :4317, HTTP :4318) - SDK instrumented services   │
│  - Zipkin (:9411) - Kong API Gateway traces                    │
│  - filelog/docker - Container JSON logs                        │
│                                                                 │
│  Processors:                                                    │
│  - memory_limiter (1GB)                                        │
│  - filter/healthchecks (drops health check noise)              │
│  - transform (AI cost attribution)                             │
│  - tail_sampling (keep all AI/error traces, sample 10% others) │
│  - batch (efficient transmission)                              │
│                                                                 │
│  Exporters:                                                     │
│  - Zipkin (trace visualization)                                │
│  - PostgreSQL (analytics via postgres-exporter)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL (observability schema)                  │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                        │
│  - otel_logs: Container logs with service name, severity       │
│  - otel_spans: Distributed traces                              │
│  - ai_costs: AI model usage and cost attribution               │
│                                                                 │
│  Retention: 7 days (daily cleanup via pg_cron)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    admin.selify.ai/logs                         │
├─────────────────────────────────────────────────────────────────┤
│  - Filter by service, severity, time range                     │
│  - Search log content                                          │
│  - Real-time updates                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (observability)

```sql
-- Logs from all services
observability.otel_logs (
  id, timestamp, service_name, severity_text,
  body, resource_attributes, log_attributes
)

-- Distributed traces
observability.otel_spans (
  id, trace_id, span_id, parent_span_id,
  service_name, span_name, kind,
  start_time, end_time, duration_ms,
  status_code, attributes
)

-- AI cost tracking
observability.ai_costs (
  id, timestamp, workspace_id, user_id,
  model_provider, model_name,
  input_tokens, output_tokens, cost_usd,
  trace_id, span_id
)
```

### Querying Observability Schema

```javascript
// Query logs from observability schema
const { data } = await supabase
  .schema('observability')
  .from('otel_logs')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(100);

// Get available services
const { data: services } = await supabase
  .schema('observability')
  .from('otel_logs')
  .select('service_name')
  .not('service_name', 'is', null)
  .neq('service_name', '')
  .limit(1000);
```

### Health Check Filtering

The collector automatically filters noisy health check logs:
- `/health`, `/healthz`, `/ready`, `/readyz`, `/metrics`, `/ping`, `/status` endpoints
- Health check patterns in log bodies

### Service Name Extraction

Container logs are parsed to extract service names:
- Pattern: `selify-*`, `api-*`, `worker-*`, `supabase-*`
- Extracted from log body prefix (e.g., `[selify-agent-api] ...`)
- Falls back to "unknown" if no pattern matches

### Log Retention

Automatic cleanup via PostgreSQL cron jobs:

| Job | Schedule | Retention |
|-----|----------|-----------|
| `cleanup-old-logs` | Daily 3:00 AM | 7 days |
| `cleanup-old-health-checks` | Daily 3:15 AM | 3 days |

```sql
-- Manual cleanup if needed
SELECT observability.cleanup_old_logs(7);  -- Keep 7 days
SELECT internal.cleanup_old_health_checks(3);  -- Keep 3 days
```

### Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| otel-collector-config.yaml | `backend-selify.ai/volumes/observability/` | Collector pipeline config |
| postgres-exporter/main.go | `backend-selify.ai/services/postgres-exporter/` | OTLP → PostgreSQL bridge |

### Capabilities Required

| Capability | Allows |
|------------|--------|
| `ops.logs.view` | View logs page and query logs |

### Useful Commands

```bash
# View collector logs
docker logs selify-otel-collector --tail 50 -f

# Check log counts
docker exec supabase-db psql -U postgres -d postgres -c "
  SELECT service_name, COUNT(*) FROM observability.otel_logs
  WHERE timestamp > NOW() - INTERVAL '1 hour'
  GROUP BY service_name ORDER BY count DESC;
"

# Check retention job status
docker exec supabase-db psql -U postgres -d postgres -c "
  SELECT jobname, last_run_time, next_run_time FROM cron.job_run_details
  WHERE jobname LIKE 'cleanup%' ORDER BY last_run_time DESC LIMIT 5;
"
```

---

## Backend Event-Driven Architecture (Updated January 2026)

### System Overview

The Selify platform has been transformed from polling-based to **fully event-driven architecture**, delivering massive performance improvements and cost reductions.

### Before → After Transformation

| Component | Before (Polling) | After (Event-Driven) | Improvement |
|-----------|-----------------|---------------------|-------------|
| **Webhook Processing** | 86,400 DB queries/day | Real-time notifications | **98.3% reduction** |
| **Posts Sync** | Fixed 5-minute intervals | Activity-aware (2min-2hr) | **Adaptive scheduling** |
| **Session Cleanup** | Fixed hourly intervals | Activity-aware (2hr-24hr) | **50-96% reduction** |
| **GPU Job Polling** | 300 API calls/job | ~20 calls/job | **87% reduction** |
| **Processing Latency** | 1-5 seconds | <50ms | **>95% improvement** |

### Event-Driven Components

#### Real-Time Dashboard Updates
```svelte
<!-- Temporal workflow monitoring -->
<script>
  import { TemporalReactiveState } from '$lib/reactiveStates/temporal.svelte.js';

  const temporalState = new TemporalReactiveState(supabase);

  // Real-time subscriptions replace polling
  onMount(() => {
    temporalState.connectToRealtimeWorkflows();
  });
</script>

<!-- Workflows update instantly when backend status changes -->
{#each temporalState.workflows as workflow}
  <WorkflowCard {workflow} />
{/each}
```

#### Backend Service Architecture

**Instagram Bot Service (`bot-instagram`)**:
- ✅ **Event-driven webhook processor**: Real-time PostgreSQL notifications
- ✅ **Optimized posts sync**: Activity-aware cron scheduling
- ✅ **Intelligent session cleanup**: Dynamic frequency based on usage
- ✅ **Configuration controls**: Environment variables for safe rollback

**Inference API Service (`api-tryon`)**:
- ✅ **Exponential backoff GPU polling**: Replaces linear polling
- ✅ **87% reduction in API calls**: From 300 to ~20 calls per job
- ✅ **Smart delay calculation**: Intelligent backoff with jitter

### Performance Metrics

**Database Efficiency**:
- Eliminated 85,000+ daily polling queries
- Real-time event processing with <50ms latency
- Zero overhead during idle periods

**Resource Usage**:
- 97.7% reduction in unnecessary operations
- Near-zero CPU usage when idle
- Memory scales dynamically with demand

**User Experience**:
- Instant webhook processing (was 1-5 second delay)
- Real-time workflow status updates in admin dashboard
- Immediate responses to Instagram messages and social interactions

### Monitoring & Observability

The admin dashboard provides real-time visibility into:
- **Service health**: Instant status updates via event-driven monitoring
- **Workflow progress**: Real-time Temporal workflow tracking
- **Performance metrics**: Event processing latency and throughput
- **Resource utilization**: Dynamic scaling based on actual demand

### Deployment Status

**✅ FULLY DEPLOYED** as of January 20, 2026:
- All database migrations applied
- Instagram bot optimizations active
- GPU provider optimizations enabled
- Real-time subscriptions operational
- Configuration framework established

### Rollback Safety

Safe rollback capability via environment variables:
```bash
# Disable optimizations instantly if needed
export USE_EVENT_DRIVEN_WEBHOOKS=false
export USE_INTELLIGENT_CLEANUP=false
export RUNPOD_POLLING_STRATEGY=linear
```

**Related Documentation**:
- `backend-selify.ai/EVENT_DRIVEN_DEPLOYMENT_RESULTS.md` - Complete deployment summary
- `backend-selify.ai/COMPREHENSIVE_ANTIPATTERN_AUDIT_REPORT.md` - Original analysis
- `backend-selify.ai/COMPREHENSIVE_IMPROVEMENT_ROADMAP.md` - Future optimizations

---

## Svelte 5 Reactivity Patterns (CRITICAL)

**Full guide:** [/docs/reactivity](/docs/reactivity) in admin dashboard

### SvelteKit Execution Order

| Phase | File | Server | Client | Runs |
|-------|------|--------|--------|------|
| 1 | +layout.server.js | ✓ | - | Every request |
| 2 | +layout.js | ✓ | ✓ | **Every navigation** |
| 3 | +layout.svelte script | ✓ | ✓ | Once on mount |
| 4 | onMount() | - | ✓ | Once, client only |

### State Classification & Patterns

| Type | Example | Initialize In | Pass Via |
|------|---------|---------------|----------|
| **Singleton** | Theme, Toast | +layout.svelte | Props |
| **Data-heavy** | User profile, workspace | +layout.server.js | data prop |
| **Feature state** | PMBoardState, QAState | +page.svelte | Props to children |
| **Component-local** | Form inputs, UI toggles | Component | N/A |

### Correct Patterns

**Singletons (theme, toast)** - Initialize once, pass via props:
```svelte
<!-- +layout.svelte -->
<script>
  import { getTheme } from '@miozu/jera';
  const themeState = getTheme();  // Call ONCE
  onMount(() => { themeState.sync(); themeState.init(); });
</script>
<Sidebar {themeState} />  <!-- Pass as prop -->
```

**Feature state** - Create in page, pass to children:
```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
  const pmState = new PMBoardReactiveState(data.supabase, data.tasks);
</script>
<PMBoard {pmState} />
```

### Anti-Patterns (NEVER DO)

```javascript
// ❌ Calling singleton in every component
import { getTheme } from '@miozu/jera';
const theme = getTheme();  // NO - receive as prop instead

// ❌ Creating state in +layout.js (runs every navigation)
export const load = () => {
  const themeState = getTheme();  // NO - wasteful, runs on every nav
  return { themeState };
};

// ❌ Using context for singletons
setContext('theme', getTheme());  // NO - use props for explicit flow
```

### Why This Matters

- **Performance**: +layout.js runs every navigation; +layout.svelte runs once
- **Security**: Explicit prop flow prevents state leakage between requests
- **Testability**: Props can be mocked; singletons/context cannot
- **Scalability**: Clear ownership prevents state management chaos
