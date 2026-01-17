/**
 * Mail Components - Barrel Exports
 *
 * Central export point for all mail/webmail components.
 * Enables clean imports: `import {ThreadList, MessageView} from '$features/mail/components'`
 */

// =============================================================================
// Core Components
// =============================================================================

export {default as AccountSwitcher} from './AccountSwitcher.svelte';
export {default as MailboxSidebar} from './MailboxSidebar.svelte';
export {default as ThreadList} from './ThreadList.svelte';
export {default as MessageView} from './MessageView.svelte';
export {default as ComposeModal} from './ComposeModal.svelte';
export {default as KeyboardShortcutsModal} from './KeyboardShortcutsModal.svelte';
export {default as AddEmailAccountModal} from './AddEmailAccountModal.svelte';

// =============================================================================
// Future Components (To Be Created)
// =============================================================================

// export {default as MailHeader} from './MailHeader.svelte';
// export {default as ThreadItem} from './ThreadItem.svelte';
// export {default as AttachmentPreview} from './AttachmentPreview.svelte';
// export {default as EmailSignature} from './EmailSignature.svelte';
// export {default as LabelManager} from './LabelManager.svelte';
// export {default as FilterRules} from './FilterRules.svelte';
