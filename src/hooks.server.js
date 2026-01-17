import {createServerClient} from '@supabase/ssr';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY} from '$env/static/public';
import {env} from '$env/dynamic/private';
import {redirect} from '@sveltejs/kit';

/**
 * Handle server-side errors
 */
export const handleError = async ({error, event, status, message}) => {
  console.error('[Admin SSR Error]', {
    status,
    message,
    url: event?.url?.pathname,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined
  });

  return {
    message: message || 'An internal error occurred',
    status
  };
};

export const handle = async ({event, resolve}) => {
  // Attach API configuration
  event.locals.apiBaseUrl = env.API_BASE_URL || PUBLIC_SUPABASE_URL;
  event.locals.supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

  // Create Supabase client with SSO cookie configuration
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({name, value, options}) => {
          // CRITICAL: Same domain as dash.selify.ai for shared SSO
          const cookieOptions = {
            ...options,
            path: '/',
            domain: '.selify.ai', // Share session across *.selify.ai
            sameSite: 'lax',
            secure: true
          };

          if (name.includes('sb-')) {
            console.log(`[Admin] Setting cookie: ${name.substring(0, 20)}... domain=${cookieOptions.domain}`);
          }

          event.cookies.set(name, value, cookieOptions);
        });
      }
    }
  });

  /**
   * Validate session by checking JWT
   */
  event.locals.safeGetSession = async () => {
    const {
      data: {session}
    } = await event.locals.supabase.auth.getSession();
    if (!session) {
      return {session: null, user: null};
    }

    const {
      data: {user},
      error
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      return {session: null, user: null};
    }

    return {session, user};
  };

  // Get session
  const {session, user} = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  // Auth protection for all routes except /auth/*
  const pathname = event.url.pathname;
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');

  if (!isAuthRoute && !isApiRoute && !user) {
    // Redirect to dash.selify.ai auth page
    throw redirect(302, 'https://dash.selify.ai/auth?redirect=admin');
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
