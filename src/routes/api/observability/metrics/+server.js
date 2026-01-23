import {json} from '@sveltejs/kit';

/**
 * Proxy to backend API for Prometheus metrics
 *
 * Routes through api.selify.ai which can reach Prometheus locally.
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
  const endpoint = url.searchParams.get('endpoint') || 'query';
  const preset = url.searchParams.get('preset') || null;
  const query = url.searchParams.get('query') || null;
  const start = url.searchParams.get('start') || null;
  const end = url.searchParams.get('end') || null;
  const step = url.searchParams.get('step') || '60s';

  try {
    let backendUrl;
    const params = new URLSearchParams();

    switch (endpoint) {
      case 'query_range':
        // Time series query
        backendUrl = `${apiBaseUrl}/api/ops/prometheus/query_range`;
        if (preset) params.set('preset', preset);
        if (query) params.set('query', query);
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        params.set('step', step);
        break;

      case 'targets':
        // List scrape targets
        backendUrl = `${apiBaseUrl}/api/ops/prometheus/targets`;
        break;

      case 'presets':
        // Return available preset queries from backend
        backendUrl = `${apiBaseUrl}/api/ops/prometheus/presets`;
        break;

      case 'query':
      default:
        // Instant query
        backendUrl = `${apiBaseUrl}/api/ops/prometheus/query`;
        if (preset) params.set('preset', preset);
        if (query) params.set('query', query);
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
    console.error('[Observability Metrics] Error:', err);
    return json(
      {
        error: 'Failed to fetch metrics',
        message: err.message,
        hint: 'Backend API may be unavailable'
      },
      {status: 500}
    );
  }
}
