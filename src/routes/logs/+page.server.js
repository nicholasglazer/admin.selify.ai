import {error} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch, url}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('ops.logs.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing ops.logs.view capability.'});
  }

  const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Get query params
  const service = url.searchParams.get('service') || null;
  const level = url.searchParams.get('level') || null;
  const hours = parseInt(url.searchParams.get('hours') || '1');
  const search = url.searchParams.get('search') || null;

  // Build query string for logs
  const logsParams = new URLSearchParams();
  if (service) logsParams.set('service', service);
  if (level) logsParams.set('level', level);
  logsParams.set('hours', hours.toString());
  if (search) logsParams.set('search', search);
  logsParams.set('limit', '200');

  // Fetch logs and services in parallel
  const [logsResponse, servicesResponse] = await Promise.all([
    fetch(`${apiBaseUrl}/api/ops/logs?${logsParams}`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/ops/logs/services?hours=24`, {headers}).catch(() => null)
  ]);

  // Parse responses
  let logs = [];
  let total = 0;
  let hasMore = false;
  let services = [];

  if (logsResponse?.ok) {
    const data = await logsResponse.json();
    logs = data.logs || [];
    total = data.total || 0;
    hasMore = data.has_more || false;
  }

  if (servicesResponse?.ok) {
    const data = await servicesResponse.json();
    services = data.services || [];
  }

  // Compute stats from logs
  const stats = {
    total: logs.length,
    errors: logs.filter((l) => l.severity_text?.toLowerCase() === 'error').length,
    warnings: logs.filter((l) => l.severity_text?.toLowerCase() === 'warn' || l.severity_text?.toLowerCase() === 'warning').length,
    info: logs.filter((l) => l.severity_text?.toLowerCase() === 'info').length
  };

  return {
    logs,
    services,
    stats,
    hasMore,
    filters: {
      service,
      level,
      hours,
      search
    }
  };
};
