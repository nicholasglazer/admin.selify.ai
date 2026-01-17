/**
 * Single Message API
 *
 * GET: Fetch full message content by UID
 */

import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getAccountCredentials} from '$features/mail/server/credentials';
import {getImapClient, releaseConnection} from '$features/mail/server/imap';
import type {EmailMessage} from '$features/mail/types';
import {simpleParser} from 'mailparser';

export const GET: RequestHandler = async ({locals, url, params}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  const uid = parseInt(params.uid, 10);
  const accountId = url.searchParams.get('accountId');
  const mailbox = url.searchParams.get('mailbox') || 'INBOX';

  if (!accountId) {
    return json({success: false, error: 'Account ID required'}, {status: 400});
  }

  if (isNaN(uid)) {
    return json({success: false, error: 'Invalid message UID'}, {status: 400});
  }

  try {
    const credentials = await getAccountCredentials(locals.supabase, session.user.id, accountId);
    if (!credentials) {
      return json({success: false, error: 'Account not found'}, {status: 404});
    }

    const client = await getImapClient(session.user.id, credentials, accountId);

    try {
      // Open the mailbox
      await client.mailboxOpen(mailbox);

      // Fetch the full message
      const download = await client.download(uid.toString(), undefined, {uid: true});

      if (!download || !download.content) {
        return json({success: false, error: 'Message not found'}, {status: 404});
      }

      // Parse the message content
      const parsed = await simpleParser(download.content);

      // Extract attachments info (without content for initial load)
      const attachments =
        parsed.attachments?.map(att => ({
          filename: att.filename || 'attachment',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
          contentId: att.contentId || undefined,
          partId: att.contentDisposition || undefined
        })) || [];

      // Format addresses
      const formatAddress = (addr: any) => {
        if (!addr) return undefined;
        if (Array.isArray(addr)) {
          return addr.map(a => ({
            name: a.name || undefined,
            address: a.address || ''
          }));
        }
        return [{name: addr.name || undefined, address: addr.address || ''}];
      };

      const message: EmailMessage = {
        uid,
        messageId: parsed.messageId || `uid-${uid}`,
        subject: parsed.subject || '(No subject)',
        from: formatAddress(parsed.from)?.[0] || {address: 'unknown'},
        to: formatAddress(parsed.to) || [],
        cc: formatAddress(parsed.cc),
        bcc: formatAddress(parsed.bcc),
        replyTo: formatAddress(parsed.replyTo)?.[0],
        date: parsed.date?.toISOString() || new Date().toISOString(),
        text: parsed.text || undefined,
        html: sanitizeHtml(parsed.html || parsed.textAsHtml || ''),
        attachments,
        headers: Object.fromEntries(
          Array.from(parsed.headers?.entries() || []).map(([k, v]) => [k, String(v)])
        )
      };

      // Mark as read (add \Seen flag)
      await client.messageFlagsAdd(uid.toString(), ['\\Seen'], {uid: true});

      return json({
        success: true,
        message
      });
    } finally {
      releaseConnection(session.user.id, accountId);
    }
  } catch (error) {
    console.error('[API/message] Error:', error);
    return json({success: false, error: 'Failed to load message'}, {status: 500});
  }
};

/**
 * Basic HTML sanitization for email content
 * In production, use a proper library like DOMPurify on the client
 */
function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URLs
  html = html.replace(/href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, 'href="#"');

  // Remove object/embed/iframe (potential XSS vectors)
  html = html.replace(/<(object|embed|iframe)[^>]*>.*?<\/\1>/gi, '');
  html = html.replace(/<(object|embed|iframe)[^>]*\/?>/gi, '');

  return html;
}
