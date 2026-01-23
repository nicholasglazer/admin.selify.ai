import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch, url}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('ops.errors.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing ops.errors.view capability.'});
  }

  // Use environment-aware API base URL from hooks
  const apiBaseUrl = locals.apiBaseUrl;
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Get query params
  const service = url.searchParams.get('service') || null;
  const status = url.searchParams.get('status') || null;
  const hours = parseInt(url.searchParams.get('hours') || '24');

  // Build query string
  const params = new URLSearchParams();
  if (service) params.set('service', service);
  if (status) params.set('status', status);
  params.set('hours', hours.toString());

  // Fetch errors and stats in parallel
  const [errorsResponse, statsResponse, dashboardResponse] = await Promise.all([
    fetch(`${apiBaseUrl}/api/ops/errors?${params}`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/ops/errors/stats?${params}`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/ops/dashboard`, {headers}).catch(() => null)
  ]);

  // Parse responses
  let errors = [];
  let stats = null;
  let dashboard = null;

  if (errorsResponse?.ok) {
    errors = await errorsResponse.json();
  }

  if (statsResponse?.ok) {
    stats = await statsResponse.json();
  }

  if (dashboardResponse?.ok) {
    dashboard = await dashboardResponse.json();
  }

  // Get unique services for filter dropdown
  const services = [...new Set(errors.map((e) => e.service))].sort();

  return {
    errors,
    stats: stats || {
      total_errors: 0,
      total_occurrences: 0,
      unresolved: 0,
      resolved: 0,
      by_service: {},
      by_type: {}
    },
    dashboard,
    services,
    filters: {
      service,
      status,
      hours
    }
  };
};
