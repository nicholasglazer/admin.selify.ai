import {json} from '@sveltejs/kit';

/**
 * Proxy to backend API for Zipkin distributed tracing
 *
 * Routes through api.selify.ai which can reach Zipkin locally.
 * This solves the issue of Cloudflare Pages not being able to reach localhost.
 */

/** @type {import('./$types').RequestHandler} */
export async function GET({locals, url}) {
  if (!locals.session) {
    return json({error: 'Not authenticated'}, {status: 401});
  }

  const apiBaseUrl = locals.apiBaseUrl;
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Parse query params
  const endpoint = url.searchParams.get('endpoint') || 'traces';
  const serviceName = url.searchParams.get('serviceName') || null;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const lookback = parseInt(url.searchParams.get('lookback') || '3600000'); // 1 hour default
  const traceId = url.searchParams.get('traceId') || null;

  try {
    let backendUrl;
    const params = new URLSearchParams();

    switch (endpoint) {
      case 'services':
        backendUrl = `${apiBaseUrl}/api/ops/traces/services`;
        break;

      case 'trace':
        if (!traceId) {
          return json({error: 'traceId required for trace endpoint'}, {status: 400});
        }
        backendUrl = `${apiBaseUrl}/api/ops/traces/${traceId}`;
        break;

      case 'traces':
      default:
        backendUrl = `${apiBaseUrl}/api/ops/traces`;
        params.set('limit', limit.toString());
        params.set('lookback', lookback.toString());
        if (serviceName) params.set('serviceName', serviceName);
        break;
    }

    const finalUrl = params.toString() ? `${backendUrl}?${params}` : backendUrl;

    const response = await fetch(finalUrl, {headers});

    if (!response.ok) {
      const text = await response.text();
      return json(
        {
          error: 'Backend API request failed',
          status: response.status,
          details: text
        },
        {status: response.status}
      );
    }

    const data = await response.json();
    return json(data);
  } catch (err) {
    console.error('[Observability Traces] Error:', err);
    return json(
      {
        error: 'Failed to fetch traces',
        message: err.message,
        hint: 'Backend API may be unavailable'
      },
      {status: 500}
    );
  }
}
