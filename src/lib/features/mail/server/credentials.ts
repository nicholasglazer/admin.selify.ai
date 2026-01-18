/**
 * Email Credentials Manager
 *
 * Handles secure storage and retrieval of email account credentials.
 * Supports both personal and shared team mailboxes.
 *
 * Database tables required:
 * - user_email_accounts: Personal email accounts
 * - workspace_email_accounts: Shared team accounts (info@, support@, etc.)
 * - workspace_email_account_members: Who has access to shared accounts
 */

import {createClient} from '@supabase/supabase-js';
import {env} from '$env/dynamic/private';
import type {EmailAccount, EmailCredentials} from '../types';

// =============================================================================
// Encryption (using Web Crypto API)
// =============================================================================

// Get encryption key lazily to avoid issues at module load time
function getEncryptionKey(): string {
  const key = env.EMAIL_ENCRYPTION_KEY;
  if (!key) {
    console.error('[Credentials] EMAIL_ENCRYPTION_KEY environment variable is required for email password encryption');
    throw new Error('EMAIL_ENCRYPTION_KEY not configured');
  }
  return key;
}

/**
 * Encrypt sensitive data (passwords)
 */
async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Derive key from secret
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getEncryptionKey()),
    {name: 'PBKDF2'},
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('selify-mail-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt']
  );

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, data);

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypt sensitive data
 */
async function decrypt(encryptedText: string): Promise<string> {
  const encoder = new TextEncoder();
  const combined = Buffer.from(encryptedText, 'base64');

  // Extract IV and data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  // Derive key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getEncryptionKey()),
    {name: 'PBKDF2'},
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('selify-mail-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt']
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, key, data);

  return new TextDecoder().decode(decrypted);
}

// =============================================================================
// Account Management
// =============================================================================

/**
 * Get all email accounts accessible by a user
 * Includes both personal and shared workspace accounts
 */
export async function getUserEmailAccounts(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  workspaceId?: string
): Promise<EmailAccount[]> {
  const accounts: EmailAccount[] = [];

  // Get personal accounts
  const {data: personalAccounts} = await supabase
    .from('user_email_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (personalAccounts) {
    for (const acc of personalAccounts) {
      accounts.push({
        id: acc.id,
        email: acc.email,
        displayName: acc.display_name || acc.email,
        type: 'personal',
        role: 'owner',
        imapHost: acc.imap_host,
        imapPort: acc.imap_port,
        smtpHost: acc.smtp_host,
        smtpPort: acc.smtp_port,
        color: acc.color
      });
    }
  }

  // Get shared workspace accounts (if workspace provided)
  if (workspaceId) {
    const {data: sharedAccounts} = await supabase
      .from('workspace_email_accounts')
      .select(
        `
        *,
        workspace_email_account_members!inner(
          user_id,
          role
        )
      `
      )
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .eq('workspace_email_account_members.user_id', userId);

    if (sharedAccounts) {
      for (const acc of sharedAccounts) {
        const member = acc.workspace_email_account_members[0];
        accounts.push({
          id: acc.id,
          email: acc.email,
          displayName: acc.display_name || acc.email,
          type: 'shared',
          role: member.role,
          imapHost: acc.imap_host,
          imapPort: acc.imap_port,
          smtpHost: acc.smtp_host,
          smtpPort: acc.smtp_port,
          color: acc.color
        });
      }
    }
  }

  return accounts;
}

/**
 * Get credentials for a specific account
 */
export async function getAccountCredentials(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  accountId: string
): Promise<EmailCredentials | null> {
  // Try personal account first
  const {data: personal} = await supabase
    .from('user_email_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (personal) {
    return {
      email: personal.email,
      password: await decrypt(personal.password_encrypted),
      imap: {host: personal.imap_host, port: personal.imap_port},
      smtp: {host: personal.smtp_host, port: personal.smtp_port}
    };
  }

  // Try shared account
  const {data: shared} = await supabase
    .from('workspace_email_accounts')
    .select(
      `
      *,
      workspace_email_account_members!inner(user_id)
    `
    )
    .eq('id', accountId)
    .eq('workspace_email_account_members.user_id', userId)
    .single();

  if (shared) {
    return {
      email: shared.email,
      password: await decrypt(shared.password_encrypted),
      imap: {host: shared.imap_host, port: shared.imap_port},
      smtp: {host: shared.smtp_host, port: shared.smtp_port}
    };
  }

  return null;
}

/**
 * Store credentials for a new personal email account
 */
export async function storePersonalEmailAccount(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  account: {
    email: string;
    password: string;
    displayName?: string;
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
    color?: string;
  }
): Promise<{success: boolean; accountId?: string; error?: string}> {
  try {
    const encryptedPassword = await encrypt(account.password);

    const {data, error} = await supabase
      .from('user_email_accounts')
      .insert({
        user_id: userId,
        email: account.email,
        password_encrypted: encryptedPassword,
        display_name: account.displayName || account.email,
        imap_host: account.imapHost,
        imap_port: account.imapPort,
        smtp_host: account.smtpHost,
        smtp_port: account.smtpPort,
        color: account.color,
        is_active: true
      })
      .select('id')
      .single();

    if (error) throw error;

    return {success: true, accountId: data.id};
  } catch (error) {
    console.error('[Credentials] Store failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store account'
    };
  }
}

/**
 * Store credentials for a shared workspace email account
 */
export async function storeWorkspaceEmailAccount(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  createdBy: string,
  account: {
    email: string;
    password: string;
    displayName?: string;
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
    color?: string;
  }
): Promise<{success: boolean; accountId?: string; error?: string}> {
  try {
    const encryptedPassword = await encrypt(account.password);

    const {data, error} = await supabase
      .from('workspace_email_accounts')
      .insert({
        workspace_id: workspaceId,
        email: account.email,
        password_encrypted: encryptedPassword,
        display_name: account.displayName || account.email,
        imap_host: account.imapHost,
        imap_port: account.imapPort,
        smtp_host: account.smtpHost,
        smtp_port: account.smtpPort,
        color: account.color,
        is_active: true
      })
      .select('id')
      .single();

    if (error) throw error;

    // Add creator as owner
    await supabase.from('workspace_email_account_members').insert({
      account_id: data.id,
      user_id: createdBy,
      role: 'owner'
    });

    return {success: true, accountId: data.id};
  } catch (error) {
    console.error('[Credentials] Store workspace account failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store account'
    };
  }
}

/**
 * Add a member to a shared email account
 */
export async function addAccountMember(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  userId: string,
  role: 'owner' | 'member' = 'member'
): Promise<boolean> {
  const {error} = await supabase.from('workspace_email_account_members').insert({
    account_id: accountId,
    user_id: userId,
    role
  });

  return !error;
}

/**
 * Remove a member from a shared email account
 */
export async function removeAccountMember(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  userId: string
): Promise<boolean> {
  const {error} = await supabase
    .from('workspace_email_account_members')
    .delete()
    .eq('account_id', accountId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Delete an email account
 */
export async function deleteEmailAccount(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  accountId: string,
  type: 'personal' | 'shared'
): Promise<boolean> {
  if (type === 'personal') {
    const {error} = await supabase
      .from('user_email_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);
    return !error;
  } else {
    // For shared, only owners can delete
    const {data: member} = await supabase
      .from('workspace_email_account_members')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .single();

    if (member?.role !== 'owner') {
      return false;
    }

    const {error} = await supabase.from('workspace_email_accounts').delete().eq('id', accountId);

    return !error;
  }
}
