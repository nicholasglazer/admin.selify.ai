import {error} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('ops.services.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing ops.services.view capability.'});
  }

  const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  const supabase = locals.supabase;

  // Fetch all data in parallel
  const [healthResponse, historyResponse, dashboardResponse, databaseHealthResult] = await Promise.all([
    fetch(`${apiBaseUrl}/api/ops/health`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/ops/health/history?hours=24&bucket_minutes=5`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/ops/dashboard`, {headers}).catch(() => null),
    supabase.schema('internal').rpc('get_database_health').catch(() => ({data: null, error: 'Failed to fetch'}))
  ]);

  // Parse responses
  let services = [];
  let history = [];
  let dashboard = null;
  let databaseHealth = null;

  if (healthResponse?.ok) {
    services = await healthResponse.json();
  }

  if (historyResponse?.ok) {
    history = await historyResponse.json();
  }

  if (dashboardResponse?.ok) {
    dashboard = await dashboardResponse.json();
  }

  if (databaseHealthResult?.data) {
    databaseHealth = databaseHealthResult.data;
  }

  // Group history by service
  const historyByService = history.reduce((acc, h) => {
    if (!acc[h.service_name]) {
      acc[h.service_name] = [];
    }
    acc[h.service_name].push(h);
    return acc;
  }, {});

  // Fallback services if API not available
  if (services.length === 0) {
    services = [
      {name: 'kong', display_name: 'Kong API Gateway', status: 'unknown'},
      {name: 'inference-api', display_name: 'Inference API', status: 'unknown'},
      {name: 'agent-api', display_name: 'Agent API', status: 'unknown'},
      {name: 'temporal-server', display_name: 'Temporal Server', status: 'unknown'},
      {name: 'supabase-db', display_name: 'PostgreSQL', status: 'unknown'}
    ];
  }

  return {
    services,
    historyByService,
    dashboard,
    databaseHealth
  };
};
