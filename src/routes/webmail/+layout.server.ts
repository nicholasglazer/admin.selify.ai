/**
 * Webmail Layout Server Load
 *
 * Loads user's email accounts for the webmail interface.
 * Also passes team member email for auto-provisioning.
 */

import type {LayoutServerLoad} from './$types';
import {getUserEmailAccounts} from '$features/mail/server/credentials';

export const load: LayoutServerLoad = async ({locals, depends, parent}) => {
  depends('webmail:accounts');

  // Get parent data to access teamMember
  const parentData = await parent();
  const teamMemberEmail = parentData?.teamMember?.email || '';

  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return {
      accounts: [],
      isWebmailSubdomain: locals.isWebmailSubdomain || false,
      teamMemberEmail: ''
    };
  }

  try {
    // Get all email accounts accessible by this user
    const accounts = await getUserEmailAccounts(locals.supabase, session.user.id);

    return {
      accounts,
      isWebmailSubdomain: locals.isWebmailSubdomain || false,
      teamMemberEmail
    };
  } catch (error) {
    console.error('[Webmail Layout] Failed to load accounts:', error);
    return {
      accounts: [],
      isWebmailSubdomain: locals.isWebmailSubdomain || false,
      teamMemberEmail
    };
  }
};
