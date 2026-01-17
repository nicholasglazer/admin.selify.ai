import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('team.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing team.view capability.'});
  }

  const {supabase} = locals;

  // Fetch all team members
  const {data: members, error: fetchError} = await supabase
    .from('team_members')
    .select(
      `
      id,
      user_id,
      email,
      personal_email,
      full_name,
      role_name,
      status,
      avatar_url,
      last_login_at,
      created_at
    `
    )
    .order('created_at', {ascending: false});

  if (fetchError) {
    console.error('[Team] Fetch error:', fetchError);
    throw error(500, {message: 'Failed to fetch team members'});
  }

  // Fetch roles for reference
  const {data: roles} = await supabase.from('team_roles').select('name, display_name, description').order('name');

  return {
    members: members || [],
    roles: roles || []
  };
};
