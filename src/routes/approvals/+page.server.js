import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({parent, locals}) => {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capability (super_admin has '*' which grants all)
  const hasAccess =
    capabilities?.includes('*') ||
    capabilities?.includes('approvals.view') ||
    capabilities?.includes('ops.approvals.view');

  if (!hasAccess) {
    throw error(403, {message: 'Access denied. Missing approvals.view capability.'});
  }

  // Fetch initial approvals
  const {data: approvals, error: fetchError} = await supabase.rpc('get_pending_approvals', {
    p_status: 'pending',
    p_limit: 50,
    p_offset: 0
  });

  if (fetchError) {
    console.error('[Approvals] Failed to fetch approvals:', fetchError);
  }

  // Fetch stats
  const {data: stats, error: statsError} = await supabase.rpc('get_approval_stats', {
    p_days: 30
  });

  if (statsError) {
    console.error('[Approvals] Failed to fetch stats:', statsError);
  }

  return {
    approvals: approvals || [],
    stats: stats || null
  };
};
