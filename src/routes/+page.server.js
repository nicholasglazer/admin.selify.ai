import {env} from '$env/dynamic/private';

// Prevent prerendering - this route requires authentication
export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch}) => {
  const {capabilities} = await parent();
  const supabase = locals.supabase;

  // If no supabase client, return safe defaults
  if (!supabase) {
    return {
      dashboard: null,
      databaseHealth: null,
      teamCount: 0,
      workspaceCount: 0
    };
  }

  const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Helper to safely execute supabase queries
  const safeQuery = async (queryFn) => {
    try {
      return await queryFn();
    } catch (e) {
      console.error('[Dashboard] Query failed:', e?.message);
      return {data: null, count: null, error: e};
    }
  };

  // Fetch dashboard data in parallel
  const [dashboardResponse, databaseHealthResult, teamCountResult, workspaceCountResult] = await Promise.all([
    // Ops dashboard (services health, errors)
    capabilities?.includes('ops.services.view') || capabilities?.includes('*')
      ? fetch(`${apiBaseUrl}/api/ops/dashboard`, {headers}).catch(() => null)
      : Promise.resolve(null),

    // Database health
    capabilities?.includes('ops.metrics.view') || capabilities?.includes('*')
      ? safeQuery(() => supabase.schema('internal').rpc('get_database_health'))
      : Promise.resolve({data: null}),

    // Team count
    capabilities?.includes('team.view') || capabilities?.includes('*')
      ? safeQuery(() => supabase.schema('internal').from('team_members').select('id', {count: 'exact', head: true}))
      : Promise.resolve({count: null}),

    // Workspace count
    capabilities?.includes('admin.workspaces.view') || capabilities?.includes('*')
      ? safeQuery(() => supabase.from('workspaces').select('id', {count: 'exact', head: true}))
      : Promise.resolve({count: null})
  ]);

  let dashboard = null;
  if (dashboardResponse?.ok) {
    try {
      dashboard = await dashboardResponse.json();
    } catch (e) {
      console.error('[Dashboard] Failed to parse response:', e?.message);
    }
  }

  return {
    dashboard,
    databaseHealth: databaseHealthResult?.data || null,
    teamCount: teamCountResult?.count || 0,
    workspaceCount: workspaceCountResult?.count || 0
  };
};
