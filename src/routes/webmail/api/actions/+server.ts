/**
 * Message Actions API
 *
 * POST: Perform bulk actions on messages (star, delete, archive, move, mark read/unread)
 */

import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getAccountCredentials} from '$features/mail/server/credentials';
import {getImapClient, releaseConnection} from '$features/mail/server/imap';

type ActionType = 'star' | 'unstar' | 'delete' | 'archive' | 'move' | 'markRead' | 'markUnread';

export const POST: RequestHandler = async ({locals, request}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  try {
    const body = await request.json();
    const {accountId, mailbox, uids, action, targetMailbox} = body as {
      accountId: string;
      mailbox: string;
      uids: number[];
      action: ActionType;
      targetMailbox?: string;
    };

    // Validate required fields
    if (!accountId || !mailbox || !uids || !action) {
      return json({success: false, error: 'Missing required fields'}, {status: 400});
    }

    if (!Array.isArray(uids) || uids.length === 0) {
      return json({success: false, error: 'At least one message UID required'}, {status: 400});
    }

    const validActions: ActionType[] = [
      'star',
      'unstar',
      'delete',
      'archive',
      'move',
      'markRead',
      'markUnread'
    ];
    if (!validActions.includes(action)) {
      return json({success: false, error: 'Invalid action'}, {status: 400});
    }

    // Get account credentials
    const credentials = await getAccountCredentials(locals.supabase, session.user.id, accountId);
    if (!credentials) {
      return json({success: false, error: 'Account not found'}, {status: 404});
    }

    const client = await getImapClient(session.user.id, credentials, accountId);

    try {
      // Open the mailbox
      await client.mailboxOpen(mailbox);

      const uidRange = uids.join(',');

      switch (action) {
        case 'star':
          await client.messageFlagsAdd(uidRange, ['\\Flagged'], {uid: true});
          break;

        case 'unstar':
          await client.messageFlagsRemove(uidRange, ['\\Flagged'], {uid: true});
          break;

        case 'markRead':
          await client.messageFlagsAdd(uidRange, ['\\Seen'], {uid: true});
          break;

        case 'markUnread':
          await client.messageFlagsRemove(uidRange, ['\\Seen'], {uid: true});
          break;

        case 'delete': {
          // Find Trash folder
          const mailboxes = await client.list();
          const trashBox = mailboxes.find(
            m =>
              m.specialUse === '\\Trash' ||
              m.path.toLowerCase() === 'trash' ||
              m.path.toLowerCase().includes('trash') ||
              m.path.toLowerCase().includes('deleted')
          );

          if (trashBox && mailbox !== trashBox.path) {
            // Move to trash
            await client.messageMove(uidRange, trashBox.path, {uid: true});
          } else {
            // Already in trash or no trash folder - permanently delete
            await client.messageFlagsAdd(uidRange, ['\\Deleted'], {uid: true});
            await client.messageDelete(uidRange, {uid: true});
          }
          break;
        }

        case 'archive': {
          // Find Archive folder
          const mailboxes = await client.list();
          const archiveBox = mailboxes.find(
            m =>
              m.specialUse === '\\Archive' ||
              m.path.toLowerCase() === 'archive' ||
              m.path.toLowerCase().includes('archive')
          );

          if (archiveBox) {
            await client.messageMove(uidRange, archiveBox.path, {uid: true});
          } else {
            // Create Archive folder if it doesn't exist
            try {
              await client.mailboxCreate('Archive');
              await client.messageMove(uidRange, 'Archive', {uid: true});
            } catch {
              return json({success: false, error: 'Archive folder not available'}, {status: 400});
            }
          }
          break;
        }

        case 'move': {
          if (!targetMailbox) {
            return json({success: false, error: 'Target mailbox required for move'}, {status: 400});
          }
          await client.messageMove(uidRange, targetMailbox, {uid: true});
          break;
        }
      }

      return json({
        success: true,
        affected: uids.length
      });
    } finally {
      releaseConnection(session.user.id, accountId);
    }
  } catch (error) {
    console.error('[API/actions] Error:', error);
    return json({success: false, error: 'Failed to perform action'}, {status: 500});
  }
};
