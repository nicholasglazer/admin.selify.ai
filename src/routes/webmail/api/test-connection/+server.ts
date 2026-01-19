/**
 * Test Connection API - Proxy to backend webmail-api
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
    const body = await request.json();

    const response = await fetch(`${API_BASE}/api/webmail/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_KEY || '',
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return json(data, {status: response.status});
  } catch (error) {
    console.error('[API/test-connection] Proxy error:', error);
    return json({success: false, error: 'Connection test failed'}, {status: 500});
  }
};
