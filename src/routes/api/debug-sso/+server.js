import {json} from '@sveltejs/kit';
import {env as publicEnv} from '$env/dynamic/public';

/** @type {import('./$types').RequestHandler} */
export const GET = async ({cookies, locals, request}) => {
  // Get all cookies
  const allCookies = cookies.getAll();
  const sbCookies = allCookies.filter(c => c.name.startsWith('sb-'));

  // Get session info
  const {session, user} = await locals.safeGetSession();

  // Check cookie header directly
  const cookieHeader = request.headers.get('cookie') || 'NO COOKIE HEADER';

  // Derive expected cookie name from Supabase URL
  // Format: sb-<project-ref>-auth-token where project-ref is derived from URL
  const url = new URL(publicEnv.PUBLIC_SUPABASE_URL);
  const expectedCookiePrefix = `sb-${url.hostname.split('.')[0]}-auth-token`;

  return json({
    supabaseUrl: publicEnv.PUBLIC_SUPABASE_URL,
    expectedCookiePrefix,
    cookieHeaderPresent: cookieHeader !== 'NO COOKIE HEADER',
    cookieHeaderLength: cookieHeader.length,
    cookiesReceived: allCookies.map(c => ({name: c.name, valueLength: c.value?.length || 0})),
    sbCookies: sbCookies.map(c => ({name: c.name, valueLength: c.value?.length || 0})),
    hasSession: !!session,
    hasUser: !!user,
    userEmail: user?.email || null,
    // If no session, check if it's because cookie doesn't match expected prefix
    cookieNameMismatch: sbCookies.length > 0 && !sbCookies.some(c => c.name.startsWith(expectedCookiePrefix))
  });
};
