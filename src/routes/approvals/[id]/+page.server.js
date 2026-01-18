import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({parent, params, locals}) => {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capability
  const hasAccess =
    capabilities?.includes('*') ||
    capabilities?.includes('approvals.view') ||
    capabilities?.includes('ops.approvals.view');

  if (!hasAccess) {
    throw error(403, {message: 'Access denied. Missing approvals.view capability.'});
  }

  // Fetch approval details
  const {data: approval, error: fetchError} = await supabase.rpc('get_approval_details', {
    p_approval_id: params.id
  });

  if (fetchError) {
    console.error('[Approvals] Failed to fetch approval:', fetchError);
    throw error(500, {message: 'Failed to fetch approval details'});
  }

  if (!approval || approval.error) {
    throw error(404, {message: approval?.error || 'Approval not found'});
  }

  return {
    approval,
    approvalId: params.id
  };
};
