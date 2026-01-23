import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch, url}) => {
  const {capabilities} = await parent();

  // Check capability - reuse ops.logs.view or ops.metrics.view
  const hasAccess =
    capabilities?.includes('*') ||
    capabilities?.includes('ops.logs.view') ||
    capabilities?.includes('ops.metrics.view');

  if (!hasAccess) {
    throw error(403, {message: 'Access denied. Missing observability capability.'});
  }

  const apiBaseUrl = locals.apiBaseUrl;
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Get active tab from URL
  const activeTab = url.searchParams.get('tab') || 'logs';

  // Fetch initial data based on active tab
  let initialData = {};

  try {
    if (activeTab === 'traces') {
      // Fetch Zipkin services and recent traces
      const [servicesRes, tracesRes] = await Promise.all([
        fetch('/api/observability/traces?endpoint=services', {headers}).catch(() => null),
        fetch('/api/observability/traces?endpoint=traces&limit=20', {headers}).catch(() => null)
      ]);

      initialData.traces = {
        services: servicesRes?.ok ? await servicesRes.json() : {data: []},
        traces: tracesRes?.ok ? await tracesRes.json() : {traces: []}
      };
    } else if (activeTab === 'metrics') {
      // Fetch Prometheus presets and service health
      const [presetsRes, healthRes, targetsRes] = await Promise.all([
        fetch('/api/observability/metrics?endpoint=presets', {headers}).catch(() => null),
        fetch('/api/observability/metrics?preset=service_health', {headers}).catch(() => null),
        fetch('/api/observability/metrics?endpoint=targets', {headers}).catch(() => null)
      ]);

      initialData.metrics = {
        presets: presetsRes?.ok ? await presetsRes.json() : {presets: []},
        health: healthRes?.ok ? await healthRes.json() : {results: []},
        targets: targetsRes?.ok ? await targetsRes.json() : {data: {activeTargets: []}}
      };
    } else {
      // Default: fetch service logs from existing endpoint
      const logsRes = await fetch(`${apiBaseUrl}/api/ops/logs?hours=1&limit=100`, {headers}).catch(
        () => null
      );

      initialData.serviceLogs = logsRes?.ok ? await logsRes.json() : {logs: []};
    }
  } catch (err) {
    console.error('[Observability] Failed to load initial data:', err);
  }

  // Supabase internal log sources
  const supabaseLogSources = [
    {key: 'kong', label: 'Kong API Gateway', description: 'HTTP requests and routing'},
    {key: 'auth', label: 'Auth (GoTrue)', description: 'Authentication events'},
    {key: 'postgres', label: 'PostgreSQL', description: 'Database logs'},
    {key: 'storage', label: 'Storage', description: 'File storage operations'},
    {key: 'rest', label: 'PostgREST', description: 'REST API queries'},
    {key: 'realtime', label: 'Realtime', description: 'WebSocket connections'},
    {key: 'functions', label: 'Edge Functions', description: 'Serverless function logs'}
  ];

  return {
    activeTab,
    initialData,
    supabaseLogSources,
    zipkinUrl: 'http://localhost:9411',
    prometheusUrl: 'http://localhost:9090',
    apiBaseUrl
  };
};
