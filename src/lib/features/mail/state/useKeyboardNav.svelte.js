/**
 * Keyboard Navigation for Webmail
 *
 * Gmail/Vim-style keyboard shortcuts for efficient email management.
 *
 * Shortcuts:
 * - j/k: Next/previous thread
 * - o/Enter: Open thread
 * - u/Escape: Back to list
 * - s: Toggle star
 * - e: Archive
 * - #/Delete: Delete
 * - r: Reply
 * - a: Reply all
 * - f: Forward
 * - c: Compose new
 * - /: Focus search
 * - ?: Show shortcuts help
 * - x: Select/deselect thread
 * - Shift+i: Mark as read
 * - Shift+u: Mark as unread
 *
 * @param {ReturnType<import('./mailState.svelte.js').createMailState>} mailState
 * @param {Object} callbacks
 * @param {() => void} [callbacks.onCompose]
 * @param {() => void} [callbacks.onSearch]
 * @param {() => void} [callbacks.onShowHelp]
 * @param {(type: 'reply' | 'replyAll' | 'forward') => void} [callbacks.onReply]
 */
export function useKeyboardNav(mailState, callbacks = {}) {
  let enabled = $state(true);

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (!enabled) return;

    // Ignore when typing in inputs (unless Escape)
    const target = event.target;
    const isInput =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.getAttribute?.('contenteditable') === 'true';

    if (isInput) {
      if (event.key === 'Escape') {
        target.blur();
        event.preventDefault();
      }
      return;
    }

    // Ignore if compose modal is open (has its own shortcuts)
    if (mailState.composeOpen) return;

    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
    const threads = mailState.threads;
    const selected = mailState.selectedThread;

    // Single key shortcuts (no modifier)
    if (!hasModifier) {
      switch (event.key) {
        // Navigation
        case 'j': // Next thread
          event.preventDefault();
          mailState.selectNextThread();
          break;

        case 'k': // Previous thread
          event.preventDefault();
          mailState.selectPrevThread();
          break;

        case 'o': // Open thread
        case 'Enter':
          if (!selected && threads.length > 0) {
            event.preventDefault();
            mailState.selectThread(threads[0].uid);
          }
          break;

        case 'u': // Back to list
        case 'Escape':
          event.preventDefault();
          mailState.clearSelection();
          break;

        // Actions on selected thread
        case 's': // Star/unstar
          if (selected) {
            event.preventDefault();
            mailState.toggleStar(selected.uid);
          }
          break;

        case 'e': // Archive
          if (selected) {
            event.preventDefault();
            mailState.archiveThreads([selected.uid]);
          }
          break;

        case '#': // Delete
        case 'Delete':
          if (selected) {
            event.preventDefault();
            mailState.deleteThreads([selected.uid]);
          }
          break;

        // Reply/Forward
        case 'r': // Reply
          if (selected) {
            event.preventDefault();
            callbacks.onReply?.('reply');
          }
          break;

        case 'a': // Reply all
          if (selected) {
            event.preventDefault();
            callbacks.onReply?.('replyAll');
          }
          break;

        case 'f': // Forward
          if (selected) {
            event.preventDefault();
            callbacks.onReply?.('forward');
          }
          break;

        // Compose
        case 'c': // Compose new
          event.preventDefault();
          callbacks.onCompose?.();
          break;

        // Search
        case '/': // Focus search
          event.preventDefault();
          callbacks.onSearch?.();
          break;

        // Help
        case '?': // Show shortcuts
          event.preventDefault();
          callbacks.onShowHelp?.();
          break;

        // Go to shortcuts (g + letter)
        case 'g':
          // Wait for next key
          waitForGoKey();
          event.preventDefault();
          break;
      }
    }

    // Shift + key shortcuts
    if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      switch (event.key) {
        case 'I': // Mark as read
          if (selected) {
            event.preventDefault();
            mailState.markAsRead([selected.uid], true);
          }
          break;

        case 'U': // Mark as unread
          if (selected) {
            event.preventDefault();
            mailState.markAsRead([selected.uid], false);
          }
          break;
      }
    }
  }

  /**
   * Handle "g" prefix shortcuts (go to)
   */
  function waitForGoKey() {
    const timeout = setTimeout(() => {
      window.removeEventListener('keydown', handleGoKey);
    }, 1000);

    /**
     * @param {KeyboardEvent} event
     */
    function handleGoKey(event) {
      clearTimeout(timeout);
      window.removeEventListener('keydown', handleGoKey);

      switch (event.key) {
        case 'i': // Go to inbox
          event.preventDefault();
          mailState.selectMailbox('INBOX');
          break;

        case 's': // Go to sent
          event.preventDefault();
          const sent = mailState.mailboxes.find(m => m.specialUse === '\\Sent');
          if (sent) mailState.selectMailbox(sent.path);
          break;

        case 'd': // Go to drafts
          event.preventDefault();
          const drafts = mailState.mailboxes.find(m => m.specialUse === '\\Drafts');
          if (drafts) mailState.selectMailbox(drafts.path);
          break;

        case 't': // Go to trash
          event.preventDefault();
          const trash = mailState.mailboxes.find(m => m.specialUse === '\\Trash');
          if (trash) mailState.selectMailbox(trash.path);
          break;

        case 'a': // Go to archive
          event.preventDefault();
          const archive = mailState.mailboxes.find(m => m.specialUse === '\\Archive');
          if (archive) mailState.selectMailbox(archive.path);
          break;
      }
    }

    window.addEventListener('keydown', handleGoKey);
  }

  // Attach the event listener
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown);
  }

  // Return cleanup function
  return function cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
  };
}

/**
 * Keyboard shortcuts reference for help modal
 */
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      {keys: ['j'], description: 'Next thread'},
      {keys: ['k'], description: 'Previous thread'},
      {keys: ['o', 'Enter'], description: 'Open thread'},
      {keys: ['u', 'Esc'], description: 'Back to list'},
      {keys: ['/'], description: 'Search'}
    ]
  },
  {
    category: 'Actions',
    shortcuts: [
      {keys: ['s'], description: 'Star/Unstar'},
      {keys: ['e'], description: 'Archive'},
      {keys: ['#', 'Del'], description: 'Delete'},
      {keys: ['Shift', 'I'], description: 'Mark as read'},
      {keys: ['Shift', 'U'], description: 'Mark as unread'}
    ]
  },
  {
    category: 'Compose',
    shortcuts: [
      {keys: ['c'], description: 'New email'},
      {keys: ['r'], description: 'Reply'},
      {keys: ['a'], description: 'Reply all'},
      {keys: ['f'], description: 'Forward'}
    ]
  },
  {
    category: 'Go to',
    shortcuts: [
      {keys: ['g', 'i'], description: 'Inbox'},
      {keys: ['g', 's'], description: 'Sent'},
      {keys: ['g', 'd'], description: 'Drafts'},
      {keys: ['g', 't'], description: 'Trash'},
      {keys: ['g', 'a'], description: 'Archive'}
    ]
  }
];
