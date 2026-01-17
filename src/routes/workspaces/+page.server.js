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

  // Build query - fetch workspaces
  let query = supabase
    .from('workspaces')
    .select(
      `
      id,
      name,
      slug,
      type,
      owner_id,
      created_at,
      updated_at
    `,
      {count: 'exact'}
    )
    .is('deleted_at', null)
    .order('created_at', {ascending: false})
    .range(offset, offset + limit - 1);

  // Add search if provided
  if (search) {
    query = query.ilike('name', `%${search}%`);
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
