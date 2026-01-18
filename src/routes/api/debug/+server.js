import {json} from '@sveltejs/kit';
import {env as publicEnv} from '$env/dynamic/public';
import {env} from '$env/dynamic/private';

export const GET = async ({locals}) => {
  const {session, user, supabase} = locals;

  let teamMemberResult = null;
  let capabilitiesResult = null;
  let testError = null;

  if (user && supabase) {
    try {
      const {data, error} = await supabase
        .schema('internal')
        .from('team_members')
        .select('id, email, full_name, role_name, status')
        .eq('user_id', user.id)
        .single();
      teamMemberResult = {data, error: error?.message};
    } catch (e) {
      testError = e.message;
    }

    try {
      const {data, error} = await supabase.rpc('get_team_member_capabilities', {
        p_user_id: user.id
      });
      capabilitiesResult = {data, error: error?.message};
    } catch (e) {
      capabilitiesResult = {error: e.message};
    }
  }

  return json({
    env: {
      PUBLIC_SUPABASE_URL: publicEnv.PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      PUBLIC_SUPABASE_ANON_KEY: publicEnv.PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + publicEnv.PUBLIC_SUPABASE_ANON_KEY?.length + ')' : 'MISSING',
      API_BASE_URL: env.API_BASE_URL || 'NOT SET'
    },
    session: session ? 'EXISTS' : 'MISSING',
    user: user ? {id: user.id, email: user.email} : null,
    supabase: supabase ? 'EXISTS' : 'MISSING',
    teamMemberResult,
    capabilitiesResult,
    testError
  });
};
