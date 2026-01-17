/**
 * Mailboxes API
 *
 * GET: List all mailboxes for an email account
 */

import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getAccountCredentials} from '$features/mail/server/credentials';
import {getImapClient, releaseConnection, sortMailboxes} from '$features/mail/server/imap';

export const GET: RequestHandler = async ({locals, url}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  const accountId = url.searchParams.get('accountId');
  if (!accountId) {
    return json({success: false, error: 'Account ID required'}, {status: 400});
  }

  try {
    // Get account credentials
    const credentials = await getAccountCredentials(locals.supabase, session.user.id, accountId);
    if (!credentials) {
      return json({success: false, error: 'Account not found'}, {status: 404});
    }

    // Connect to IMAP and list mailboxes
    const client = await getImapClient(session.user.id, credentials, accountId);

    try {
      const mailboxes = await client.list();

      // Transform to our format with special folder detection
      const formattedMailboxes = mailboxes.map(box => {
        const specialUse = box.specialUse || detectSpecialUse(box.path);

        return {
          path: box.path,
          name: box.name,
          delimiter: box.delimiter,
          specialUse,
          flags: box.flags || [],
          subscribed: box.subscribed !== false,
          listed: box.listed !== false
        };
      });

      // Sort with special folders first
      const sorted = sortMailboxes(formattedMailboxes);

      // Get status (unread counts) for each mailbox
      const mailboxesWithStatus = await Promise.all(
        sorted.map(async mailbox => {
          try {
            const status = await client.status(mailbox.path, {
              messages: true,
              unseen: true
            });
            return {
              ...mailbox,
              totalMessages: status.messages || 0,
              unreadCount: status.unseen || 0
            };
          } catch {
            // Some mailboxes might not support STATUS
            return {
              ...mailbox,
              totalMessages: 0,
              unreadCount: 0
            };
          }
        })
      );

      return json({
        success: true,
        mailboxes: mailboxesWithStatus
      });
    } finally {
      releaseConnection(session.user.id, accountId);
    }
  } catch (error) {
    console.error('[API/mailboxes] Error:', error);
    return json({success: false, error: 'Failed to load mailboxes'}, {status: 500});
  }
};

/**
 * Detect special use from folder name when not provided by server
 */
function detectSpecialUse(path: string): string | undefined {
  const lower = path.toLowerCase();

  if (lower === 'inbox') return '\\Inbox';
  if (lower.includes('sent')) return '\\Sent';
  if (lower.includes('draft')) return '\\Drafts';
  if (lower.includes('trash') || lower.includes('deleted')) return '\\Trash';
  if (lower.includes('junk') || lower.includes('spam')) return '\\Junk';
  if (lower.includes('archive')) return '\\Archive';

  return undefined;
}
