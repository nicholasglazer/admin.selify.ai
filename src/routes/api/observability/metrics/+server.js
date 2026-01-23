import {json} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/**
 * Proxy to Prometheus API for metrics
 *
 * Key metrics:
 * - kong_http_requests_total - Request counts
 * - kong_latency_ms - Request latency
 * - process_resident_memory_bytes - Memory usage
 * - up - Service health
 */

const PROMETHEUS_URL = env.PROMETHEUS_URL || 'http://localhost:9090';

// Useful pre-defined queries
const PRESET_QUERIES = {
  // Kong metrics
  request_rate: 'sum(rate(kong_http_requests_total[5m])) by (service)',
  request_latency_p99: 'histogram_quantile(0.99, sum(rate(kong_latency_bucket[5m])) by (le, service))',
  request_latency_p50: 'histogram_quantile(0.50, sum(rate(kong_latency_bucket[5m])) by (le, service))',
  error_rate: 'sum(rate(kong_http_requests_total{code=~"5.."}[5m])) by (service)',

  // Service health
  up: 'up',
  service_health: 'up{job=~"kong|inference-api|agent-api|temporal"}',

  // Memory usage
  memory_usage: 'process_resident_memory_bytes',

  // Custom service metrics
  http_request_duration: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))'
};

/** @type {import('./$types').RequestHandler} */
export async function GET({locals, url}) {
  if (!locals.session) {
    return json({error: 'Not authenticated'}, {status: 401});
  }

  // Parse query params
  const endpoint = url.searchParams.get('endpoint') || 'query';
  const preset = url.searchParams.get('preset') || null;
  const query = url.searchParams.get('query') || (preset ? PRESET_QUERIES[preset] : 'up');
  const start = url.searchParams.get('start') || null;
  const end = url.searchParams.get('end') || null;
  const step = url.searchParams.get('step') || '60s';

  try {
    let promUrl;

    switch (endpoint) {
      case 'query_range':
        // Time series query
        const rangeParams = new URLSearchParams();
        rangeParams.set('query', query);
        rangeParams.set('start', start || (Date.now() / 1000 - 3600).toString());
        rangeParams.set('end', end || (Date.now() / 1000).toString());
        rangeParams.set('step', step);
        promUrl = `${PROMETHEUS_URL}/api/v1/query_range?${rangeParams}`;
        break;

      case 'targets':
        // List scrape targets
        promUrl = `${PROMETHEUS_URL}/api/v1/targets`;
        break;

      case 'labels':
        // List label names
        promUrl = `${PROMETHEUS_URL}/api/v1/labels`;
        break;

      case 'presets':
        // Return available preset queries
        return json({
          presets: Object.entries(PRESET_QUERIES).map(([name, query]) => ({
            name,
            query,
            description: getPresetDescription(name)
          }))
        });

      case 'query':
      default:
        // Instant query
        promUrl = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
        break;
    }

    const response = await fetch(promUrl, {
      headers: {'Accept': 'application/json'}
    });

    if (!response.ok) {
      const text = await response.text();
      return json({
        error: 'Prometheus request failed',
        status: response.status,
        details: text
      }, {status: response.status});
    }

    const data = await response.json();

    // Format response for easier consumption
    if (data.status === 'success' && data.data?.result) {
      const formatted = data.data.result.map(r => ({
        metric: r.metric,
        value: r.value?.[1] || r.values,
        timestamp: r.value?.[0] || null
      }));

      return json({
        status: 'success',
        resultType: data.data.resultType,
        results: formatted,
        query,
        preset
      });
    }

    return json(data);
  } catch (err) {
    console.error('[Observability Metrics] Error:', err);
    return json({
      error: 'Failed to fetch metrics',
      message: err.message,
      prometheusUrl: PROMETHEUS_URL
    }, {status: 500});
  }
}

function getPresetDescription(name) {
  const descriptions = {
    request_rate: 'HTTP requests per second by service',
    request_latency_p99: '99th percentile request latency',
    request_latency_p50: 'Median request latency',
    error_rate: '5xx errors per second',
    up: 'Service availability (1=up, 0=down)',
    service_health: 'Health status of core services',
    memory_usage: 'Process memory usage in bytes',
    http_request_duration: '95th percentile HTTP request duration'
  };
  return descriptions[name] || name;
}
