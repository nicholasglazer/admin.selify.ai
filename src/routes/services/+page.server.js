import {error} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('ops.services.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing ops.services.view capability.'});
  }

  // Service health checks
  const services = [
    {name: 'agent-api', url: 'http://localhost:8001/health', type: 'internal'},
    {name: 'inference-api', url: 'http://localhost:3008/health', type: 'internal'},
    {name: 'smart-bot', url: 'http://localhost:8000/health', type: 'internal'},
    {name: 'shopify-sync', url: 'http://localhost:3006/health', type: 'internal'},
    {name: 'stripe-webhooks', url: 'http://localhost:3010/health', type: 'internal'}
  ];

  // Check each service (in production, this would call the admin API)
  const healthResults = await Promise.all(
    services.map(async service => {
      try {
        // In production, call the admin API endpoint instead
        const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';
        const response = await fetch(`${apiBaseUrl}/api/admin/services/health`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${locals.session?.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          return data.services || [];
        }
        return services.map(s => ({...s, status: 'unknown', latency: null}));
      } catch (err) {
        return services.map(s => ({...s, status: 'unknown', latency: null, error: err.message}));
      }
    })
  );

  // Flatten results
  const flatResults = healthResults.flat();

  return {
    services: flatResults.length > 0 ? flatResults : services.map(s => ({...s, status: 'unknown'}))
  };
};
