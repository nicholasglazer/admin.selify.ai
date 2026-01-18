import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, fetch}) => {
  const {capabilities} = await parent();
  const supabase = locals.supabase;
  const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';
  const headers = {
    Authorization: `Bearer ${locals.session?.access_token}`,
    'Content-Type': 'application/json'
  };

  // Fetch dashboard data in parallel
  const [dashboardResponse, databaseHealthResult, teamCountResult, workspaceCountResult] = await Promise.all([
    // Ops dashboard (services health, errors)
    capabilities?.includes('ops.services.view') || capabilities?.includes('*')
      ? fetch(`${apiBaseUrl}/api/ops/dashboard`, {headers}).catch(() => null)
      : Promise.resolve(null),

    // Database health
    capabilities?.includes('ops.metrics.view') || capabilities?.includes('*')
      ? supabase.schema('internal').rpc('get_database_health').catch(() => ({data: null}))
      : Promise.resolve({data: null}),

    // Team count
    capabilities?.includes('team.view') || capabilities?.includes('*')
      ? supabase.schema('internal').from('team_members').select('id', {count: 'exact', head: true})
      : Promise.resolve({count: null}),

    // Workspace count
    capabilities?.includes('admin.workspaces.view') || capabilities?.includes('*')
      ? supabase.from('workspaces').select('id', {count: 'exact', head: true})
      : Promise.resolve({count: null})
  ]);

  let dashboard = null;
  if (dashboardResponse?.ok) {
    dashboard = await dashboardResponse.json();
  }

  return {
    dashboard,
    databaseHealth: databaseHealthResult?.data || null,
    teamCount: teamCountResult?.count || 0,
    workspaceCount: workspaceCountResult?.count || 0
  };
};
