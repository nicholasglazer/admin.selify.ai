import {env as publicEnv} from '$env/dynamic/public';
import {json} from '@sveltejs/kit';

export async function GET({locals, cookies}) {
  const allCookies = cookies.getAll();
  const sbCookies = allCookies.filter(c => c.name.includes('sb-'));

  let sessionResult;
  try {
    const {data, error} = await locals.supabase.auth.getSession();
    sessionResult = {
      hasSession: !!data?.session,
      error: error?.message || null
    };
  } catch (e) {
    sessionResult = {error: e.message};
  }

  return json({
    envVars: {
      PUBLIC_SUPABASE_URL: publicEnv.PUBLIC_SUPABASE_URL,
      hasAnonKey: !!publicEnv.PUBLIC_SUPABASE_ANON_KEY
    },
    cookies: sbCookies.map(c => ({name: c.name, valueLength: c.value?.length || 0})),
    session: sessionResult
  });
}
