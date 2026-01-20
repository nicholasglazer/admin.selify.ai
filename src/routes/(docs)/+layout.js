/**
 * Documentation route group - 100% SSG
 *
 * This route group is prerendered at build time.
 * Docs are served as static HTML with no runtime auth required.
 *
 * Note: The parentheses in (docs) create a route group without
 * affecting the URL structure. Docs are served at /docs/...
 */

export const prerender = true;
