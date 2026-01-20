/**
 * Client-side Supabase client for admin.selify.ai
 *
 * Creates a browser client that uses the session from the shared SSO cookies.
 * Uses custom fetch to add Accept-Profile header for internal schema operations.
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

/**
 * Create a Supabase client configured for internal schema
 * This wraps the main client and adds the Accept-Profile header
 * @param {import('@supabase/supabase-js').SupabaseClient} mainClient - The main authenticated client
 * @returns {object} Proxy that adds Accept-Profile header for internal schema
 */
export function createInternalSchemaProxy(mainClient) {
  // Use the schema() method which should add the Accept-Profile header
  // But wrap it in a way that preserves the auth session
  return mainClient.schema('internal');
}
