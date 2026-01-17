# admin.selify.ai - Internal Operations Dashboard

**Last Updated:** January 17, 2026
**Purpose:** Internal team management, workspace admin, AI-first task board, and ops monitoring

---

## Overview

This is the internal admin dashboard for Selify staff. It provides:

- **AI-First PM Board** - Task management for team ops (`/pm`)
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

| Role        | Key Capabilities                                              |
| ----------- | ------------------------------------------------------------- |
| super_admin | `*` (all)                                                     |
| developer   | team.view, ops.tasks.\*, ops.logs.view, admin.workspaces.view |
| ops         | ops.services.\*, ops.tasks.view, ops.metrics.view             |
| support     | admin.workspaces.view, admin.billing.view                     |

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
│   │   ├── team/
│   │   │   ├── +page.svelte     # Team list
│   │   │   └── onboard/         # Onboarding form
│   │   ├── workspaces/          # Workspace admin
│   │   └── services/            # Service health
│   ├── lib/
│   │   ├── components/          # UI components
│   │   ├── reactiveStates/
│   │   │   └── pm.svelte.js     # PMBoardReactiveState (drag-drop, CRUD)
│   │   └── utils/               # Helpers
│   └── hooks.server.js          # SSO cookie setup
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

## Design System

Uses the same Base16 dark theme as dash.selify.ai:

- Primary: `--color-base0D` (purple)
- Success: `--color-base0B` (green)
- Error: `--color-base08` (red)
- Background: `--color-base0` (dark gray)

## Deployment

Deploy to Cloudflare Pages:

1. Set environment variables in CF Pages dashboard
2. Run `pnpm deploy` or push to connected repo

Required env vars:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `API_BASE_URL`
