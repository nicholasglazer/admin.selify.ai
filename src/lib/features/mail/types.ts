/**
 * Mail Feature Types
 *
 * Type definitions for the webmail system.
 * Supports multi-account, shared mailboxes, and team collaboration.
 */

// =============================================================================
// Email Account Types
// =============================================================================

export interface EmailAccount {
  id: string;
  email: string;
  displayName: string;
  type: 'personal' | 'shared'; // shared = info@, support@, etc.
  role: 'owner' | 'member'; // member can read/reply, owner can configure
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  color?: string; // For visual distinction in UI
  unreadCount?: number;
}

export interface EmailCredentials {
  email: string;
  password: string;
  imap: {host: string; port: number};
  smtp: {host: string; port: number};
}

// =============================================================================
// Mailbox Types
// =============================================================================

export interface Mailbox {
  path: string;
  name: string;
  delimiter: string;
  flags: string[];
  specialUse?: '\\Inbox' | '\\Drafts' | '\\Sent' | '\\Trash' | '\\Junk' | '\\Archive' | '\\All';
  messageCount?: number;
  unseenCount?: number;
}

// =============================================================================
// Thread/Message Types
// =============================================================================

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailThread {
  uid: number;
  messageId: string;
  flags: string[];
  subject: string;
  from: EmailAddress | null;
  to: EmailAddress[];
  cc?: EmailAddress[];
  date: string;
  size: number;
  hasAttachments: boolean;
  snippet?: string;
  // Team collaboration
  assignedTo?: string; // user_id
  labels?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  // Account reference
  accountId: string;
  mailbox: string;
}

export interface EmailMessage extends EmailThread {
  html?: string | null;
  text?: string | null;
  attachments: EmailAttachment[];
  inReplyTo?: string;
  references?: string[];
  // Full headers for debugging/enterprise needs
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  disposition: 'attachment' | 'inline';
}

// =============================================================================
// Compose Types
// =============================================================================

export interface ComposeDraft {
  id?: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  attachments?: File[];
  replyTo?: {
    messageId: string;
    uid: number;
    mailbox: string;
    type: 'reply' | 'replyAll' | 'forward';
  };
  savedAt?: string;
}

// =============================================================================
// Team Collaboration Types
// =============================================================================

export interface EmailAssignment {
  threadUid: number;
  accountId: string;
  mailbox: string;
  assignedTo: string; // user_id
  assignedBy: string; // user_id
  assignedAt: string;
  status: 'assigned' | 'in_progress' | 'resolved' | 'escalated';
  notes?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
  accountId: string;
  isSystem: boolean; // System labels can't be deleted
}

// =============================================================================
// State Types
// =============================================================================

export interface MailStateLoading {
  accounts: boolean;
  mailboxes: boolean;
  threads: boolean;
  message: boolean;
  sending: boolean;
}

export interface MailFilters {
  search: string;
  unreadOnly: boolean;
  starred: boolean;
  hasAttachments: boolean;
  assignedTo?: string;
  labels?: string[];
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ThreadsResponse {
  threads: EmailThread[];
  total: number;
  unseen: number;
  page: number;
  limit: number;
}

export interface MailboxesResponse {
  mailboxes: Mailbox[];
  accountId: string;
}
