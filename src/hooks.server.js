import {createServerClient} from '@supabase/ssr';
import {env as publicEnv} from '$env/dynamic/public';
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
  // ==========================================================================
  // Subdomain Routing
  // webmail.selify.ai -> /webmail routes (internal rewrite, URL stays clean)
  // ==========================================================================
  const host = event.request.headers.get('host') || '';
  const isWebmailSubdomain = host.startsWith('webmail.');

  if (isWebmailSubdomain) {
    // Mark this as webmail subdomain for templates
    event.locals.isWebmailSubdomain = true;

    // Rewrite URL to /webmail/* if not already there
    const url = new URL(event.request.url);
    if (!url.pathname.startsWith('/webmail')) {
      // Root of webmail subdomain -> /webmail
      const newPath = url.pathname === '/' ? '/webmail' : `/webmail${url.pathname}`;
      url.pathname = newPath;

      // Create new request with rewritten URL
      event.request = new Request(url.toString(), event.request);
    }
  }

  // Attach API configuration
  event.locals.apiBaseUrl = env.API_BASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
  event.locals.supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;

  // Create Supabase client with READ-ONLY cookie configuration
  // CRITICAL: Admin must NEVER write/clear cookies on .selify.ai domain
  // Only dash.selify.ai should manage auth cookies to prevent SSO invalidation
  try {
    event.locals.supabase = createServerClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => {
          // Handle duplicate auth cookies by preferring the one with latest expiry
          const allCookies = event.cookies.getAll();
          const authCookies = new Map(); // name -> {cookie, expiresAt}
          const otherCookies = [];

          for (const cookie of allCookies) {
            if (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')) {
              // Parse the token to get expiry
              let expiresAt = 0;
              try {
                if (cookie.value.startsWith('base64-')) {
                  const jsonStr = Buffer.from(cookie.value.slice(7), 'base64').toString('utf-8');
                  const parsed = JSON.parse(jsonStr);
                  expiresAt = parsed.expires_at || 0;
                }
              } catch {
                // If parsing fails, use 0 (will be replaced by any valid token)
              }

              const existing = authCookies.get(cookie.name);
              if (!existing || expiresAt > existing.expiresAt) {
                authCookies.set(cookie.name, {cookie, expiresAt});
              }
            } else {
              otherCookies.push(cookie);
            }
          }

          // Return other cookies + best auth cookie for each name
          const result = [...otherCookies];
          for (const {cookie} of authCookies.values()) {
            result.push(cookie);
          }
          return result;
        },
        setAll: () => {
          // INTENTIONALLY EMPTY - Admin is READ-ONLY for cookies
          // dash.selify.ai is the auth source and manages all cookie writes
          // If we write here, we risk invalidating the user's session everywhere
          console.log('[Admin] Cookie write requested but blocked (read-only mode)');
        }
      }
    });
  } catch (e) {
    console.error('[Admin] Failed to create Supabase client:', e?.message);
    event.locals.supabase = null;
  }

  /**
   * Get session - simplified to avoid triggering session invalidation
   */
  event.locals.safeGetSession = async () => {
    if (!event.locals.supabase) {
      return {session: null, user: null};
    }

    try {
      const {
        data: {session}
      } = await event.locals.supabase.auth.getSession();

      if (!session) {
        return {session: null, user: null};
      }

      return {session, user: session.user};
    } catch (e) {
      console.error('[Admin] Failed to get session:', e?.message);
      return {session: null, user: null};
    }
  };

  // Get session
  const {session, user} = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  // Auth protection for all routes except /auth/*, /api/*, and /docs/*
  const pathname = event.url.pathname;
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isDocsRoute = pathname.startsWith('/docs');

  if (!isAuthRoute && !isApiRoute && !isDocsRoute && !user) {
    // Redirect to dash.selify.ai auth page with proper return_to
    const returnTo = isWebmailSubdomain
      ? 'https://webmail.selify.ai/'
      : 'https://admin.selify.ai/';
    throw redirect(302, `https://dash.selify.ai/auth?return_to=${encodeURIComponent(returnTo)}`);
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
