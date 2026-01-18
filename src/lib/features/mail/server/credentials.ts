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
 * Team accounts are stored in internal.team_email_accounts
 * Auto-provisioned during team onboarding
 */
export async function getUserEmailAccounts(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<EmailAccount[]> {
  const accounts: EmailAccount[] = [];

  // Get team email accounts from internal schema
  const {data: teamAccounts, error} = await supabase
    .schema('internal')
    .from('team_email_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('[Credentials] Failed to fetch team accounts:', error.message);
  }

  if (teamAccounts) {
    for (const acc of teamAccounts) {
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
  // Get from internal schema
  const {data: account, error} = await supabase
    .schema('internal')
    .from('team_email_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[Credentials] Failed to get account:', error.message);
    return null;
  }

  if (account) {
    return {
      email: account.email,
      password: await decrypt(account.password_encrypted),
      imap: {host: account.imap_host, port: account.imap_port},
      smtp: {host: account.smtp_host, port: account.smtp_port}
    };
  }

  return null;
}

/**
 * Store credentials for a new team email account
 * Uses internal.team_email_accounts table
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
      .schema('internal')
      .from('team_email_accounts')
      .upsert({
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
      }, {onConflict: 'user_id,email'})
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
