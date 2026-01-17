/**
 * Threads API
 *
 * GET: List email threads in a mailbox with pagination
 */

import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getAccountCredentials} from '$features/mail/server/credentials';
import {getImapClient, releaseConnection, hasAttachments} from '$features/mail/server/imap';
import type {EmailThread} from '$features/mail/types';

export const GET: RequestHandler = async ({locals, url}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  const accountId = url.searchParams.get('accountId');
  const mailbox = url.searchParams.get('mailbox') || 'INBOX';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  if (!accountId) {
    return json({success: false, error: 'Account ID required'}, {status: 400});
  }

  try {
    const credentials = await getAccountCredentials(locals.supabase, session.user.id, accountId);
    if (!credentials) {
      return json({success: false, error: 'Account not found'}, {status: 404});
    }

    const client = await getImapClient(session.user.id, credentials, accountId);

    try {
      // Open the mailbox
      const mailboxInfo = await client.mailboxOpen(mailbox);
      const totalMessages = mailboxInfo.exists || 0;

      if (totalMessages === 0) {
        return json({
          success: true,
          threads: [],
          pagination: {page, limit, total: 0, hasMore: false}
        });
      }

      // Calculate range for pagination (newest first)
      const start = Math.max(1, totalMessages - page * limit + 1);
      const end = Math.max(1, totalMessages - (page - 1) * limit);

      // Fetch messages in range
      const messages: EmailThread[] = [];

      for await (const msg of client.fetch(`${start}:${end}`, {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        internalDate: true,
        size: true
      })) {
        const envelope = msg.envelope;

        messages.push({
          uid: msg.uid,
          messageId: envelope.messageId || `uid-${msg.uid}`,
          threadId: envelope.messageId || `uid-${msg.uid}`, // Use messageId as threadId for now
          subject: envelope.subject || '(No subject)',
          from:
            envelope.from?.[0] ?
              {
                name: envelope.from[0].name || undefined,
                address: envelope.from[0].address || ''
              }
            : {address: 'unknown'},
          date: msg.internalDate?.toISOString() || new Date().toISOString(),
          snippet: '', // Would need to fetch body for snippet
          flags: msg.flags ? Array.from(msg.flags) : [],
          hasAttachments: hasAttachments(msg.bodyStructure),
          size: msg.size || 0,
          mailbox
        });
      }

      // Sort by date descending (newest first)
      messages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return json({
        success: true,
        threads: messages,
        pagination: {
          page,
          limit,
          total: totalMessages,
          hasMore: start > 1
        }
      });
    } finally {
      releaseConnection(session.user.id, accountId);
    }
  } catch (error) {
    console.error('[API/threads] Error:', error);
    return json({success: false, error: 'Failed to load threads'}, {status: 500});
  }
};
