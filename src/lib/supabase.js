/**
 * Client-side Supabase client for admin.selify.ai
 *
 * Creates a browser client that uses the session from the shared SSO cookies.
 * Supports production/staging environment switching via cookie.
 */

import {createBrowserClient} from '@supabase/ssr';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY} from '$env/static/public';

let supabaseClient = null;
let currentEnv = null;

/**
 * Get the current environment from cookie
 * @returns {'production' | 'staging'}
 */
function getCurrentEnvironment() {
  if (typeof document === 'undefined') return 'production';
  const match = document.cookie.match(/admin-environment=(\w+)/);
  return match?.[1] === 'staging' ? 'staging' : 'production';
}

/**
 * Get environment configuration
 * Note: For client-side, we use the production credentials since SSO is there.
 * The server-side handles the actual environment switching for data fetching.
 * @returns {{url: string, anonKey: string}}
 */
function getEnvConfig() {
  // Client-side always uses production Supabase for auth (SSO is on production)
  // Data fetching happens server-side with the correct environment
  return {
    url: PUBLIC_SUPABASE_URL,
    anonKey: PUBLIC_SUPABASE_ANON_KEY
  };
}

/**
 * Get or create the browser Supabase client
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
  const env = getCurrentEnvironment();

  // If environment changed, reset the client
  if (supabaseClient && currentEnv !== env) {
    supabaseClient = null;
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getEnvConfig();
  supabaseClient = createBrowserClient(config.url, config.anonKey);
  currentEnv = env;

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
