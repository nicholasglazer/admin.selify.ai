# Webmail Feature - AI Context

**Location:** `admin.selify.ai/src/routes/webmail/`
**Purpose:** Internal team email client for Selify staff
**Subdomain:** `webmail.selify.ai` (routes to this path via hooks.server.js)

---

## Architecture Overview

```
webmail/
├── +page.svelte          # Main 3-pane interface
├── +layout.svelte        # Outer shell wrapper
├── +layout.server.ts     # Server load - fetches user accounts
├── api/
│   ├── accounts/+server.ts      # GET/POST email accounts
│   ├── mailboxes/+server.ts     # GET mailbox list with counts
│   ├── threads/+server.ts       # GET email threads (paginated)
│   ├── message/[uid]/+server.ts # GET full message content
│   ├── send/+server.ts          # POST send email
│   ├── actions/+server.ts       # POST bulk actions (star, delete, etc.)
│   └── test-connection/+server.ts # POST test IMAP/SMTP credentials
└── CLAUDE.md             # This file

$features/mail/           # Feature library
├── components/           # UI components
├── server/               # IMAP/SMTP utilities
├── state/                # Reactive state management
├── types.ts              # TypeScript interfaces
└── index.js              # Barrel export
```

---

## Subdomain Routing

`webmail.selify.ai` is handled by admin's `hooks.server.js`:

```javascript
const isWebmailSubdomain = host.startsWith('webmail.');
if (isWebmailSubdomain) {
  event.locals.isWebmailSubdomain = true;
  // Rewrite /foo to /webmail/foo
  const newPath = url.pathname === '/' ? '/webmail' : `/webmail${url.pathname}`;
  url.pathname = newPath;
}
```

Auth redirects preserve return URL:
- Unauthenticated → `dash.selify.ai/auth?return_to=https://webmail.selify.ai/`
- After auth → returns to webmail

---

## Database Tables

### user_email_accounts (Personal)
```sql
id, user_id, email, display_name, color,
imap_host, imap_port, imap_secure,
smtp_host, smtp_port, smtp_secure,
password_encrypted,  -- AES-GCM encrypted
is_active, last_sync_at, sync_error,
created_at, updated_at
```

### workspace_email_accounts (Shared Team)
Same structure with `workspace_id` instead of `user_id`.

### workspace_email_account_members (Access Control)
```sql
id, account_id, user_id, role ('owner'|'admin'|'member'|'readonly')
```

---

## Reactive State Pattern

The feature uses a centralized reactive state manager:

```javascript
// $features/mail/state/mailState.svelte.js
export function createMailState(initialAccounts = []) {
  // Core state with Svelte 5 runes
  let accounts = $state(initialAccounts);
  let activeAccountId = $state(null);
  let threads = $state([]);
  let currentMessage = $state(null);

  // Derived values
  const activeAccount = $derived(
    accounts.find(a => a.id === activeAccountId)
  );

  // Actions
  async function loadThreads(mailbox, page = 1) { ... }
  async function sendEmail(draft) { ... }

  return {
    // State (read-only externally)
    get accounts() { return accounts; },
    get activeAccount() { return activeAccount; },

    // Actions
    loadThreads,
    sendEmail,
    // ...
  };
}
```

Usage in components:
```svelte
<script>
  import { getContext } from 'svelte';
  const mail = getContext('mail');

  // Reactive access
  const threads = $derived(mail.threads);
</script>
```

---

## Security

### Password Encryption
- **Algorithm:** AES-GCM with Web Crypto API
- **Key Derivation:** PBKDF2 (100k iterations, SHA-256)
- **Storage:** Base64-encoded IV + ciphertext
- **Key Source:** `EMAIL_ENCRYPTION_KEY` env var

### RLS Policies
- Personal accounts: user can only access their own
- Workspace accounts: based on membership role
- All API routes verify session before any operation

---

## Component Structure

### Main Page (+page.svelte)
- Dynamic imports to avoid SSR issues
- 3-pane responsive layout
- Keyboard navigation support
- Mobile view with pane switching

### Key Components
| Component | Purpose |
|-----------|---------|
| `MailboxSidebar` | Folder list, account switcher, compose button |
| `ThreadList` | Email list with search, filters, pagination |
| `MessageView` | Full message display with actions |
| `ComposeModal` | Email composition with attachments |
| `AccountSwitcher` | Multi-account dropdown |
| `AddEmailAccountModal` | Add new account with provider presets |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webmail/api/accounts` | GET | List user's email accounts |
| `/webmail/api/accounts` | POST | Add new personal account |
| `/webmail/api/mailboxes?accountId=X` | GET | Get mailbox list with unread counts |
| `/webmail/api/threads?accountId=X&mailbox=Y` | GET | List threads (50/page) |
| `/webmail/api/message/[uid]?accountId=X&mailbox=Y` | GET | Full message content |
| `/webmail/api/send` | POST | Send email (new, reply, forward) |
| `/webmail/api/actions` | POST | Bulk actions (star, delete, move, etc.) |
| `/webmail/api/test-connection` | POST | Test IMAP/SMTP before saving |

---

## External Dependencies

| Package | Purpose |
|---------|---------|
| `imapflow` | IMAP client with connection pooling |
| `nodemailer` | SMTP email sending |
| `mailparser` | Parse email structure/attachments |
| `date-fns` | Date formatting |

---

## Provider Presets

The add account modal includes presets for:
- MXroute (shadow.mxrouting.net)
- Gmail (imap/smtp.gmail.com)
- Outlook (outlook.office365.com)
- Yahoo (imap/smtp.mail.yahoo.com)
- Fastmail (imap/smtp.fastmail.com)
- ProtonMail Bridge (127.0.0.1)
- Custom (manual configuration)

---

## Common Tasks

### Add New Email Provider Preset
Edit `$features/mail/components/AddEmailAccountModal.svelte`:
```javascript
const PROVIDERS = [
  // Add new provider here
  {
    id: 'provider-id',
    name: 'Provider Name',
    icon: '📧',
    imapHost: 'imap.example.com',
    imapPort: 993,
    smtpHost: 'smtp.example.com',
    smtpPort: 465
  },
  // ...
];
```

### Debug Connection Issues
1. Check `test-connection` endpoint response
2. Verify IMAP/SMTP credentials are correct
3. Check for app-specific password requirements (Gmail, etc.)
4. Review server logs for ImapFlow errors

### Add New Mailbox Action
1. Add action type to `$features/mail/types.ts`
2. Implement in `/api/actions/+server.ts`
3. Add UI trigger in `MessageView` or `ThreadList`
4. Update reactive state if needed

---

## Environment Variables

Required in Cloudflare Pages:
- `EMAIL_ENCRYPTION_KEY` - For password encryption/decryption

---

## Known Limitations

- No PUSH/IDLE for real-time new mail notifications
- Attachment download UI not fully implemented
- No conversation threading (uses UID-based fallback)
- Draft auto-save not persisted to server
- No email signature support yet
