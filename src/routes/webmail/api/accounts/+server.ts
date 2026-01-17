/**
 * Email Accounts API
 *
 * GET: List all email accounts accessible by the user
 * POST: Add a new email account
 */

import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getUserEmailAccounts, storePersonalEmailAccount} from '$features/mail/server/credentials';

export const GET: RequestHandler = async ({locals, url}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  const workspaceId = url.searchParams.get('workspaceId') || undefined;

  try {
    const accounts = await getUserEmailAccounts(locals.supabase, session.user.id, workspaceId);

    return json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('[API/accounts] Error:', error);
    return json({success: false, error: 'Failed to load accounts'}, {status: 500});
  }
};

export const POST: RequestHandler = async ({locals, request}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  try {
    const body = await request.json();
    const {email, password, displayName, imapHost, imapPort, smtpHost, smtpPort, color} = body;

    // Validate required fields
    if (!email || !password || !imapHost || !smtpHost) {
      return json({success: false, error: 'Missing required fields'}, {status: 400});
    }

    const result = await storePersonalEmailAccount(locals.supabase, session.user.id, {
      email,
      password,
      displayName,
      imapHost,
      imapPort: imapPort || 993,
      smtpHost,
      smtpPort: smtpPort || 465,
      color
    });

    if (!result.success) {
      return json({success: false, error: result.error}, {status: 400});
    }

    return json({
      success: true,
      accountId: result.accountId
    });
  } catch (error) {
    console.error('[API/accounts] Error:', error);
    return json({success: false, error: 'Failed to add account'}, {status: 500});
  }
};
