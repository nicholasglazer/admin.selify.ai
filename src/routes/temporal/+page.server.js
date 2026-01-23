import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities} = await parent();
  const {session} = locals;

  // Check for temporal viewing capability
  // For now, allow any authenticated team member (ops.temporal.view or ops.* or *)
  const hasAccess =
    capabilities?.includes('*') ||
    capabilities?.includes('ops.*') ||
    capabilities?.includes('ops.temporal.view') ||
    capabilities?.includes('ops.tasks.view'); // Fallback to ops tasks permission

  if (!hasAccess) {
    throw error(403, {message: 'Access denied. You need ops.temporal.view capability.'});
  }

  // Use environment-aware API base URL from hooks
  const apiBaseUrl = locals.apiBaseUrl;
  const headers = {
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Fetch initial data in parallel
  const [workflowsRes, insightsRes, healthRes] = await Promise.all([
    fetch(`${apiBaseUrl}/api/temporal/workflows?limit=50`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/temporal/insights`, {headers}).catch(() => null),
    fetch(`${apiBaseUrl}/api/temporal/health`, {headers}).catch(() => null)
  ]);

  let workflows = [];
  let workflowsTotal = 0;
  let insights = {anomalies: [], suggestions: [], stats: {}};
  let health = {status: 'unknown', temporal_connected: false, namespace: 'default', task_queues: []};

  if (workflowsRes?.ok) {
    const data = await workflowsRes.json();
    workflows = data.workflows || [];
    workflowsTotal = data.total || 0;
  }

  if (insightsRes?.ok) {
    insights = await insightsRes.json();
  }

  if (healthRes?.ok) {
    health = await healthRes.json();
  }

  return {
    workflows,
    workflowsTotal,
    insights,
    health,
    apiBaseUrl
  };
};
