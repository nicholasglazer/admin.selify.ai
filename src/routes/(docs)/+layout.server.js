/**
 * Docs layout server - no auth required.
 *
 * This overrides the root layout's auth check for docs pages.
 * Docs are public and prerendered at build time.
 */

/** @type {import('./$types').LayoutServerLoad} */
export const load = async () => {
  // Return minimal data - no auth needed for docs
  return {
    session: null,
    user: null,
    teamMember: null,
    capabilities: [],
    theme: 'miozu-dark',
    apiBaseUrl: ''
  };
};
