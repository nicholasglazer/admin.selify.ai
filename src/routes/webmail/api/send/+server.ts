/**
 * Send Email API - Proxy to backend webmail-api
 */
import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {env} from '$env/dynamic/private';

const API_BASE = env.API_BASE_URL || 'https://api.selify.ai';

export const POST: RequestHandler = async ({locals, request, fetch}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  try {
    const reqBody = await request.json();
    const {accountId, to, cc, bcc, subject, html, text, body, bodyType, inReplyTo, replyTo} = reqBody;

    // Validate required fields
    if (!accountId) {
      return json({success: false, error: 'Account ID required'}, {status: 400});
    }

    if (!to || !Array.isArray(to) || to.length === 0) {
      return json({success: false, error: 'At least one recipient required'}, {status: 400});
    }

    // Build draft for backend - support both old format (html/text) and new format (body/bodyType)
    const emailBody = body || html || text || '';
    const emailBodyType = bodyType || (html ? 'html' : 'text');

    const draft = {
      to,
      cc: cc || [],
      bcc: bcc || [],
      subject: subject || '',
      body: emailBody,
      bodyType: emailBodyType,
      replyTo: replyTo || (inReplyTo ? { messageId: inReplyTo, type: 'reply' } : undefined)
    };

    const response = await fetch(`${API_BASE}/api/webmail/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_KEY || '',
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        userId: session.user.id,
        accountId,
        draft
      })
    });

    const data = await response.json();
    return json(data, {status: response.status});
  } catch (error) {
    console.error('[API/send] Proxy error:', error);
    return json({success: false, error: 'Failed to send email'}, {status: 500});
  }
};
