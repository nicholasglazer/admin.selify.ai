import {error} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

// Prevent prerendering - all routes require authentication
export const prerender = false;

/** @type {import('./$types').LayoutServerLoad} */
export const load = async ({locals, cookies}) => {
  const {session, user, supabase} = locals;
  const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';

  // Get theme from cookie (set by inline script in app.html)
  const theme = cookies.get('admin-theme') || 'miozu-dark';

  if (!user || !supabase) {
    return {
      session: null,
      user: null,
      teamMember: null,
      capabilities: [],
      theme,
      apiBaseUrl
    };
  }

  try {
    // Fetch team member data from internal schema
    const {data: teamMember, error: memberError} = await supabase
      .schema('internal')
      .from('team_members')
      .select(
        `
        id,
        user_id,
        email,
        personal_email,
        full_name,
        display_name,
        role_id,
        role_name,
        status,
        custom_capabilities,
        avatar_url,
        notes,
        last_login_at,
        created_at
      `
      )
      .eq('user_id', user.id)
      .single();

    if (memberError || !teamMember) {
      console.error('[Admin Layout] Team member not found:', memberError?.message);
      throw error(403, {
        message: 'Access denied. You are not a registered team member.',
        hint: 'Contact a super admin to get onboarded.'
      });
    }

    if (teamMember.status !== 'active') {
      throw error(403, {
        message: `Account ${teamMember.status}. Contact admin for assistance.`
      });
    }

    // Get capabilities from RPC
    const {data: capabilities} = await supabase.rpc('get_team_member_capabilities', {
      p_user_id: user.id
    });

    // Update last login in internal schema (don't await, fire and forget)
    supabase
      .schema('internal')
      .from('team_members')
      .update({last_login_at: new Date().toISOString()})
      .eq('id', teamMember.id)
      .then(() => {})
      .catch((e) => console.error('[Admin Layout] Failed to update last login:', e?.message));

    return {
      session,
      user,
      teamMember,
      capabilities: capabilities || [],
      theme,
      apiBaseUrl
    };
  } catch (e) {
    // Re-throw SvelteKit errors (like our 403s)
    if (e?.status) {
      throw e;
    }
    // Log unexpected errors and return safe defaults
    console.error('[Admin Layout] Unexpected error:', e?.message);
    throw error(500, {
      message: 'Failed to load admin data. Please try again.'
    });
  }
};
