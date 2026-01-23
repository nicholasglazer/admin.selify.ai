import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, params}) => {
  const {capabilities} = await parent();
  const {session} = locals;
  const {id: workflowId} = params;

  // Check for temporal viewing capability
  const hasAccess =
    capabilities?.includes('*') ||
    capabilities?.includes('ops.*') ||
    capabilities?.includes('ops.temporal.view') ||
    capabilities?.includes('ops.tasks.view');

  if (!hasAccess) {
    throw error(403, {message: 'Access denied. You need ops.temporal.view capability.'});
  }

  // Use environment-aware API base URL from hooks
  const apiBaseUrl = locals.apiBaseUrl;
  const headers = {
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Fetch workflow details and history in parallel
  const [detailsRes, historyRes] = await Promise.all([
    fetch(`${apiBaseUrl}/api/temporal/workflows/${workflowId}`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/temporal/workflows/${workflowId}/history?limit=100`, {headers}).catch(
      () => null
    )
  ]);

  if (!detailsRes?.ok) {
    throw error(404, {message: 'Workflow not found'});
  }

  const workflow = await detailsRes.json();
  const historyData = historyRes?.ok ? await historyRes.json() : {events: []};

  return {
    workflow,
    history: historyData.events || [],
    apiBaseUrl
  };
};
