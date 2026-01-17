/**
 * Webmail Layout Server Load
 *
 * Loads user's email accounts for the webmail interface.
 */

import type {LayoutServerLoad} from './$types';
import {getUserEmailAccounts} from '$features/mail/server/credentials';

export const load: LayoutServerLoad = async ({locals, depends}) => {
  depends('webmail:accounts');

  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return {
      accounts: [],
      isWebmailSubdomain: locals.isWebmailSubdomain || false
    };
  }

  try {
    // Get all email accounts accessible by this user
    const accounts = await getUserEmailAccounts(locals.supabase, session.user.id);

    return {
      accounts,
      isWebmailSubdomain: locals.isWebmailSubdomain || false
    };
  } catch (error) {
    console.error('[Webmail Layout] Failed to load accounts:', error);
    return {
      accounts: [],
      isWebmailSubdomain: locals.isWebmailSubdomain || false
    };
  }
};
