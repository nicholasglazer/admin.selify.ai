/**
 * Client-side Supabase client for admin.selify.ai
 *
 * Creates a browser client that uses the session from the shared SSO cookies.
 */

import {createBrowserClient} from '@supabase/ssr';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY} from '$env/static/public';

let supabaseClient = null;

/**
 * Get or create the browser Supabase client
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  return supabaseClient;
}
