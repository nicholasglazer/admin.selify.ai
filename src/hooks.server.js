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

  // Create Supabase client with SSO cookie configuration
  event.locals.supabase = createServerClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({name, value, options}) => {
          // CRITICAL: Do NOT clear cookies on .selify.ai domain from admin
          // This prevents admin from invalidating dash sessions when token refresh fails
          if (!value || value === '' || options?.maxAge === 0) {
            console.log(`[Admin] SKIPPING cookie clear for: ${name} (would invalidate SSO)`);
            return; // Skip - don't propagate cookie clearing to shared domain
          }

          // Only SET cookies with actual values
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
   * Get session - simplified to avoid triggering session invalidation
   *
   * IMPORTANT: We don't call getUser() here because it can trigger token
   * refresh which may clear cookies across subdomains. For admin panel,
   * we trust the session from getSession() which is sufficient for auth checks.
   * Actual Supabase API calls will validate the JWT anyway.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: {session}
    } = await event.locals.supabase.auth.getSession();

    if (!session) {
      return {session: null, user: null};
    }

    // Use user from session instead of calling getUser()
    // This prevents potential token refresh issues that could clear cookies
    return {session, user: session.user};
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
