import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent, url}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('admin.workspaces.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing admin.workspaces.view capability.'});
  }

  const {supabase} = locals;
  const page = parseInt(url.searchParams.get('page') || '1');
  const search = url.searchParams.get('search') || '';
  const limit = 20;
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('workspaces')
    .select(
      `
      id,
      name,
      owner_user_id,
      subscription_plan,
      subscription_credits_remaining_micro,
      payg_balance_micro,
      created_at,
      users!workspaces_owner_user_id_fkey (
        id,
        email,
        raw_user_meta_data
      )
    `,
      {count: 'exact'}
    )
    .order('created_at', {ascending: false})
    .range(offset, offset + limit - 1);

  // Add search if provided
  if (search) {
    query = query.or(`name.ilike.%${search}%,users.email.ilike.%${search}%`);
  }

  const {data: workspaces, count, error: fetchError} = await query;

  if (fetchError) {
    console.error('[Workspaces] Fetch error:', fetchError);
    throw error(500, {message: 'Failed to fetch workspaces'});
  }

  return {
    workspaces: workspaces || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    },
    search
  };
};
