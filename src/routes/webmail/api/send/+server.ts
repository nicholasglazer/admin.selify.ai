/**
 * Send Email API
 *
 * POST: Send a new email or reply/forward
 */

import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getAccountCredentials} from '$features/mail/server/credentials';
import {sendEmail} from '$features/mail/server/smtp';
import type {ComposeDraft} from '$features/mail/types';

export const POST: RequestHandler = async ({locals, request}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  try {
    const body = await request.json();
    const {accountId, to, cc, bcc, subject, html, text, replyTo, inReplyTo, references} = body;

    // Validate required fields
    if (!accountId) {
      return json({success: false, error: 'Account ID required'}, {status: 400});
    }

    if (!to || !Array.isArray(to) || to.length === 0) {
      return json({success: false, error: 'At least one recipient required'}, {status: 400});
    }

    if (!subject && !html && !text) {
      return json({success: false, error: 'Subject or body required'}, {status: 400});
    }

    // Get account credentials
    const credentials = await getAccountCredentials(locals.supabase, session.user.id, accountId);
    if (!credentials) {
      return json({success: false, error: 'Account not found'}, {status: 404});
    }

    // Build draft object for sendEmail
    const draft: ComposeDraft = {
      accountId,
      to,
      cc: cc || [],
      bcc: bcc || [],
      subject: subject || '',
      body: html || text || '',
      bodyType: (html ? 'html' : 'text') as 'text' | 'html',
      replyTo:
        inReplyTo ?
          {
            messageId: inReplyTo,
            uid: 0,
            mailbox: '',
            type: 'reply' as const
          }
        : undefined
    };

    // Send the email
    const result = await sendEmail({
      credentials,
      draft
    });

    if (!result.success) {
      return json({success: false, error: result.error}, {status: 500});
    }

    // Note: Most SMTP servers automatically save to Sent folder
    // If needed, implement IMAP append here using:
    // const client = await getImapClient(session.user.id, credentials, accountId);
    // releaseConnection(session.user.id, accountId);

    return json({
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('[API/send] Error:', error);
    return json({success: false, error: 'Failed to send email'}, {status: 500});
  }
};
