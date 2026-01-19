/**
 * Mailboxes API - Proxy to backend webmail-api
 */
import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {env} from '$env/dynamic/private';

const API_BASE = env.API_BASE_URL || 'https://api.selify.ai';

export const GET: RequestHandler = async ({locals, url, fetch}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  const accountId = url.searchParams.get('accountId');
  if (!accountId) {
    return json({success: false, error: 'Account ID required'}, {status: 400});
  }

  try {
    const params = new URLSearchParams({
      userId: session.user.id,
      accountId
    });

    const response = await fetch(`${API_BASE}/api/webmail/mailboxes?${params}`, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY || '',
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
      }
    });

    const data = await response.json();
    return json(data, {status: response.status});
  } catch (error) {
    console.error('[API/mailboxes] Proxy error:', error);
    return json({success: false, error: 'Failed to load mailboxes'}, {status: 500});
  }
};
