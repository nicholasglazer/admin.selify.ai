import {json} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/**
 * Proxy to Zipkin API for distributed tracing
 *
 * Zipkin provides:
 * - /api/v2/traces - List traces
 * - /api/v2/trace/{traceId} - Get single trace
 * - /api/v2/services - List services
 * - /api/v2/spans - Get spans for a service
 */

const ZIPKIN_URL = env.ZIPKIN_URL || 'http://localhost:9411';

/** @type {import('./$types').RequestHandler} */
export async function GET({locals, url}) {
  if (!locals.session) {
    return json({error: 'Not authenticated'}, {status: 401});
  }

  // Parse query params
  const endpoint = url.searchParams.get('endpoint') || 'traces';
  const serviceName = url.searchParams.get('serviceName') || null;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const lookback = parseInt(url.searchParams.get('lookback') || '3600000'); // 1 hour default
  const traceId = url.searchParams.get('traceId') || null;

  try {
    let zipkinUrl;

    switch (endpoint) {
      case 'services':
        zipkinUrl = `${ZIPKIN_URL}/api/v2/services`;
        break;

      case 'trace':
        if (!traceId) {
          return json({error: 'traceId required for trace endpoint'}, {status: 400});
        }
        zipkinUrl = `${ZIPKIN_URL}/api/v2/trace/${traceId}`;
        break;

      case 'spans':
        if (!serviceName) {
          return json({error: 'serviceName required for spans endpoint'}, {status: 400});
        }
        zipkinUrl = `${ZIPKIN_URL}/api/v2/spans?serviceName=${encodeURIComponent(serviceName)}`;
        break;

      case 'traces':
      default:
        const params = new URLSearchParams();
        params.set('limit', limit.toString());
        params.set('lookback', lookback.toString());
        params.set('endTs', Date.now().toString());
        if (serviceName) params.set('serviceName', serviceName);
        zipkinUrl = `${ZIPKIN_URL}/api/v2/traces?${params}`;
        break;
    }

    const response = await fetch(zipkinUrl, {
      headers: {'Accept': 'application/json'}
    });

    if (!response.ok) {
      return json({
        error: 'Zipkin request failed',
        status: response.status
      }, {status: response.status});
    }

    const data = await response.json();

    // For traces, flatten and add summary info
    if (endpoint === 'traces' && Array.isArray(data)) {
      const traces = data.map(spans => {
        const rootSpan = spans.find(s => !s.parentId) || spans[0];
        return {
          traceId: rootSpan?.traceId,
          name: rootSpan?.name,
          serviceName: rootSpan?.localEndpoint?.serviceName,
          timestamp: rootSpan?.timestamp,
          duration: rootSpan?.duration,
          spanCount: spans.length,
          services: [...new Set(spans.map(s => s.localEndpoint?.serviceName).filter(Boolean))],
          hasError: spans.some(s => s.tags?.error === 'true')
        };
      });

      return json({
        traces,
        count: traces.length,
        lookbackMs: lookback
      });
    }

    return json({data, endpoint});
  } catch (err) {
    console.error('[Observability Traces] Error:', err);
    return json({
      error: 'Failed to fetch traces',
      message: err.message,
      zipkinUrl: ZIPKIN_URL
    }, {status: 500});
  }
}
