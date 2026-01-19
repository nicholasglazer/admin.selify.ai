// Disable SSR for PM board - it uses browser-only APIs (document, window)
// for drag-and-drop functionality that cannot run during server-side rendering
export const ssr = false;
