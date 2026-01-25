/**
 * Reactive States - Centralized state management for admin.selify.ai
 *
 * All state classes use Svelte 5 runes ($state, $derived) and follow
 * the singleton pattern for global state.
 */

// Theme: Re-export from @miozu/jera (unified across all Miozu apps)
export {ThemeState as ThemeReactiveState, getTheme as getThemeState, resetTheme as resetThemeState} from '@miozu/jera';
export {ToastReactiveState, getToastState, resetToastState} from './toast.svelte.js';
export {AdminReactiveState, getAdminState, resetAdminState} from './admin.svelte.js';
export {PMBoardReactiveState, getPMBoardState, resetPMBoardState} from './pm.svelte.js';
export {QAReactiveState, getQAState, resetQAState} from './qa.svelte.js';
export {TemporalReactiveState, getTemporalState, resetTemporalState} from './temporal.svelte.js';
export {EnvironmentReactiveState, getEnvironmentState, resetEnvironmentState} from './environment.svelte.js';

// Optimized admin navigation (2026 performance-first)
export {
  AdminNavigationState,
  getAdminNavigationState,
  resetAdminNavigationState
} from './adminNavigationSimple.svelte.js';
