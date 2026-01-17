import {createBrowserClient, isBrowser} from '@supabase/ssr';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY} from '$env/static/public';

export const load = async ({fetch, data, depends}) => {
  depends('supabase:auth');

  let supabase = null;

  if (isBrowser()) {
    // Create browser client for client-side operations
    supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      global: {fetch},
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });

    // Set realtime auth if we have a session
    if (data?.session?.access_token) {
      supabase.realtime.setAuth(data.session.access_token);
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        supabase.realtime.setAuth(null);
      }
    });
  }

  return {
    ...data,
    supabase
  };
};
