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

  // Get query params for future use when SigNoz integration is ready
  const service = url.searchParams.get('service') || null;
  const level = url.searchParams.get('level') || null;
  const hours = parseInt(url.searchParams.get('hours') || '1');

  // Fetch services for filter dropdown (logs API not yet implemented - pending SigNoz integration)
  const servicesResponse = await fetch(`${apiBaseUrl}/api/ops/health`, {headers}).catch(() => null);

  let services = [];
  if (servicesResponse?.ok) {
    services = await servicesResponse.json();
  }

  // Logs will be fetched from SigNoz when integration is complete
  // For now, return empty array - the UI shows "SigNoz Integration Coming Soon"
  return {
    logs: [],
    services: services.map((s) => s.name).sort(),
    filters: {
      service,
      level,
      hours
    }
  };
};
