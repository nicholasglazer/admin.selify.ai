/**
 * Mail Feature Module
 *
 * Self-hosted webmail client with multi-account support.
 * Works with MXroute and other IMAP/SMTP providers.
 *
 * Usage:
 *   import {createMailState} from '$features/mail';
 *   import {AccountSwitcher, ThreadList} from '$features/mail/components';
 */

// State management
export {createMailState} from './state/mailState.svelte.js';
export {useKeyboardNav, KEYBOARD_SHORTCUTS} from './state/useKeyboardNav.svelte.js';

// Types (for TypeScript)
export * from './types';
