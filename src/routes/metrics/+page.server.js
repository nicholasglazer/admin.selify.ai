import {error} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('ops.metrics.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing ops.metrics.view capability.'});
  }

  const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Fetch dashboard and health data
  const [dashboardResponse, healthResponse] = await Promise.all([
    fetch(`${apiBaseUrl}/api/ops/dashboard`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/ops/health`, {headers}).catch(() => null)
  ]);

  let dashboard = null;
  let services = [];

  if (dashboardResponse?.ok) {
    dashboard = await dashboardResponse.json();
  }

  if (healthResponse?.ok) {
    services = await healthResponse.json();
  }

  // Calculate summary stats
  const healthyServices = services.filter((s) => s.status === 'healthy').length;
  const totalServices = services.length;
  const avgResponseTime =
    services.length > 0
      ? Math.round(
          services.filter((s) => s.response_time_ms).reduce((sum, s) => sum + s.response_time_ms, 0) /
            services.filter((s) => s.response_time_ms).length
        )
      : 0;

  return {
    dashboard,
    services,
    stats: {
      healthyServices,
      totalServices,
      avgResponseTime,
      errorCount: dashboard?.errors?.unresolved_count || 0,
      openTasks: dashboard?.tasks?.error_tasks_open || 0
    }
  };
};
