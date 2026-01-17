/**
 * IMAP Connection Manager
 *
 * Manages IMAP connections with connection pooling for performance.
 * Supports multiple accounts per user (personal + shared mailboxes).
 *
 * @see https://github.com/postalsys/imapflow
 */

import {ImapFlow} from 'imapflow';
import type {EmailCredentials, EmailAccount} from '../types';

// =============================================================================
// Connection Pool
// =============================================================================

interface PooledConnection {
  client: ImapFlow;
  accountId: string;
  lastUsed: number;
  inUse: boolean;
}

const connectionPool = new Map<string, PooledConnection>();
const CONNECTION_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CONNECTIONS_PER_USER = 5;

/**
 * Generate a unique key for connection pooling
 */
function getConnectionKey(userId: string, accountId: string): string {
  return `${userId}:${accountId}`;
}

/**
 * Clean up stale connections periodically
 */
function cleanupStaleConnections() {
  const now = Date.now();
  for (const [key, conn] of connectionPool.entries()) {
    if (!conn.inUse && now - conn.lastUsed > CONNECTION_TTL) {
      conn.client.logout().catch(() => {});
      connectionPool.delete(key);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStaleConnections, 60 * 1000);
}

// =============================================================================
// Connection Management
// =============================================================================

/**
 * Get or create an IMAP connection for a specific account
 */
export async function getImapClient(
  userId: string,
  credentials: EmailCredentials,
  accountId: string
): Promise<ImapFlow> {
  const key = getConnectionKey(userId, accountId);

  // Check for existing usable connection
  const existing = connectionPool.get(key);
  if (existing?.client.usable && !existing.inUse) {
    existing.lastUsed = Date.now();
    existing.inUse = true;
    return existing.client;
  }

  // Clean up broken connection
  if (existing && !existing.client.usable) {
    await existing.client.logout().catch(() => {});
    connectionPool.delete(key);
  }

  // Create new connection
  const client = new ImapFlow({
    host: credentials.imap.host,
    port: credentials.imap.port,
    secure: true,
    auth: {
      user: credentials.email,
      pass: credentials.password
    },
    logger: false,
    // Optimize for webmail use
    maxIdleTime: 5 * 60 * 1000, // 5 min idle before reconnect
    disableAutoIdle: false,
    tls: {
      rejectUnauthorized: true
    }
  });

  await client.connect();

  connectionPool.set(key, {
    client,
    accountId,
    lastUsed: Date.now(),
    inUse: true
  });

  return client;
}

/**
 * Release a connection back to the pool
 */
export function releaseConnection(userId: string, accountId: string): void {
  const key = getConnectionKey(userId, accountId);
  const conn = connectionPool.get(key);
  if (conn) {
    conn.inUse = false;
    conn.lastUsed = Date.now();
  }
}

/**
 * Close a specific connection
 */
export async function closeConnection(userId: string, accountId: string): Promise<void> {
  const key = getConnectionKey(userId, accountId);
  const conn = connectionPool.get(key);
  if (conn) {
    await conn.client.logout().catch(() => {});
    connectionPool.delete(key);
  }
}

/**
 * Close all connections for a user
 */
export async function closeAllUserConnections(userId: string): Promise<void> {
  const keysToDelete: string[] = [];

  for (const [key, conn] of connectionPool.entries()) {
    if (key.startsWith(`${userId}:`)) {
      await conn.client.logout().catch(() => {});
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => connectionPool.delete(key));
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a body structure has attachments
 */
export function hasAttachments(structure: any): boolean {
  if (!structure) return false;
  if (structure.disposition === 'attachment') return true;
  if (structure.type === 'application' && structure.subtype !== 'pgp-signature') return true;
  if (structure.childNodes) {
    return structure.childNodes.some(hasAttachments);
  }
  return false;
}

/**
 * Get a text snippet from body structure
 */
export function getSnippetPart(structure: any): string | null {
  if (!structure) return null;

  // Prefer plain text
  if (structure.type === 'text' && structure.subtype === 'plain') {
    return structure.part || '1';
  }

  // Check children
  if (structure.childNodes) {
    for (const child of structure.childNodes) {
      const part = getSnippetPart(child);
      if (part) return part;
    }
  }

  // Fallback to HTML
  if (structure.type === 'text' && structure.subtype === 'html') {
    return structure.part || '1';
  }

  return null;
}

/**
 * Map special-use flags to friendly names
 */
export function getMailboxDisplayName(mailbox: {name: string; specialUse?: string}): string {
  const specialUseMap: Record<string, string> = {
    '\\Inbox': 'Inbox',
    '\\Drafts': 'Drafts',
    '\\Sent': 'Sent',
    '\\Trash': 'Trash',
    '\\Junk': 'Spam',
    '\\Archive': 'Archive',
    '\\All': 'All Mail'
  };

  if (mailbox.specialUse && specialUseMap[mailbox.specialUse]) {
    return specialUseMap[mailbox.specialUse];
  }

  return mailbox.name;
}

/**
 * Sort mailboxes with special folders first
 */
export function sortMailboxes<T extends {specialUse?: string; name: string}>(mailboxes: T[]): T[] {
  const order = ['\\Inbox', '\\Drafts', '\\Sent', '\\Archive', '\\Junk', '\\Trash'];

  return [...mailboxes].sort((a, b) => {
    const aIndex = a.specialUse ? order.indexOf(a.specialUse) : -1;
    const bIndex = b.specialUse ? order.indexOf(b.specialUse) : -1;

    // Both have special use
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    // Only a has special use
    if (aIndex >= 0) return -1;
    // Only b has special use
    if (bIndex >= 0) return 1;
    // Neither - sort alphabetically
    return a.name.localeCompare(b.name);
  });
}
