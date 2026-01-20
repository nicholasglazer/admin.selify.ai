/**
 * Mail Reactive State
 *
 * Centralized state management for the webmail feature using Svelte 5 runes.
 * Supports multiple email accounts (personal + shared team mailboxes).
 *
 * Pattern: Single source of truth with derived computations.
 *
 * @example
 * ```svelte
 * <script>
 *   import { setContext } from 'svelte';
 *   import { createMailState } from '$features/mail/state/mailState.svelte.js';
 *
 *   const mail = createMailState();
 *   setContext('mail', mail);
 * </script>
 * ```
 */

/**
 * @typedef {import('../types').EmailAccount} EmailAccount
 * @typedef {import('../types').Mailbox} Mailbox
 * @typedef {import('../types').EmailThread} EmailThread
 * @typedef {import('../types').EmailMessage} EmailMessage
 * @typedef {import('../types').ComposeDraft} ComposeDraft
 */

/**
 * Create the mail state manager
 * @param {EmailAccount[]} [initialAccounts]
 * @returns {ReturnType<typeof createMailStateInternal>}
 */
export function createMailState(initialAccounts = []) {
  return createMailStateInternal(initialAccounts);
}

/**
 * @param {EmailAccount[]} initialAccounts
 */
function createMailStateInternal(initialAccounts) {
  // ==========================================================================
  // Core State
  // ==========================================================================

  /** @type {EmailAccount[]} */
  let accounts = $state(initialAccounts);

  /** @type {string | null} */
  let activeAccountId = $state(initialAccounts.length > 0 ? initialAccounts[0].id : null);

  /** @type {Record<string, Mailbox[]>} */
  let mailboxesByAccount = $state({});

  /** @type {string} */
  let currentMailbox = $state('INBOX');

  /** @type {EmailThread[]} */
  let threads = $state([]);

  /** @type {EmailMessage | null} */
  let selectedMessage = $state(null);

  /** @type {number | null} */
  let selectedThreadUid = $state(null);

  // Loading states
  let loadingAccounts = $state(false);
  let loadingMailboxes = $state(false);
  let loadingThreads = $state(false);
  let loadingMessage = $state(false);
  let sending = $state(false);

  // Filters
  let searchQuery = $state('');
  let showUnreadOnly = $state(false);
  let showStarredOnly = $state(false);

  // Compose
  /** @type {ComposeDraft | null} */
  let composeDraft = $state(null);
  let composeOpen = $state(false);

  // UI state
  let sidebarCollapsed = $state(false);
  let threadListWidth = $state(380);

  // ==========================================================================
  // Derived State
  // ==========================================================================

  /** @type {EmailAccount | null} */
  let activeAccount = $derived(accounts.find(a => a.id === activeAccountId) || accounts[0] || null);

  /** @type {Mailbox[]} */
  let mailboxes = $derived(activeAccountId ? mailboxesByAccount[activeAccountId] || [] : []);

  /** @type {Mailbox[]} */
  let specialMailboxes = $derived.by(() => {
    const order = ['\\Inbox', '\\Drafts', '\\Sent', '\\Archive', '\\Junk', '\\Trash'];
    const seen = new Set();

    return mailboxes
      .filter(m => m.specialUse)
      .sort((a, b) => {
        const aIdx = a.specialUse ? order.indexOf(a.specialUse) : 99;
        const bIdx = b.specialUse ? order.indexOf(b.specialUse) : 99;
        return aIdx - bIdx;
      })
      // Deduplicate by specialUse (e.g., keep only one Junk folder)
      .filter(m => {
        if (seen.has(m.specialUse)) return false;
        seen.add(m.specialUse);
        return true;
      });
  });

  /** @type {Mailbox[]} */
  let customMailboxes = $derived(mailboxes.filter(m => !m.specialUse));

  /** @type {number} */
  let totalUnread = $derived(
    accounts.reduce((sum, acc) => {
      const inboxes = mailboxesByAccount[acc.id] || [];
      const inbox = inboxes.find(m => m.specialUse === '\\Inbox');
      return sum + (inbox?.unseenCount || 0);
    }, 0)
  );

  /** @type {EmailThread[]} */
  let filteredThreads = $derived.by(() => {
    let result = threads;

    // Filter by unread
    if (showUnreadOnly) {
      result = result.filter(t => !t.flags.includes('\\Seen'));
    }

    // Filter by starred
    if (showStarredOnly) {
      result = result.filter(t => t.flags.includes('\\Flagged'));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.subject?.toLowerCase().includes(q) ||
          t.from?.address?.toLowerCase().includes(q) ||
          t.from?.name?.toLowerCase().includes(q) ||
          t.snippet?.toLowerCase().includes(q)
      );
    }

    return result;
  });

  /** @type {number} */
  let unreadInCurrentMailbox = $derived(threads.filter(t => !t.flags.includes('\\Seen')).length);

  /** @type {boolean} */
  let isLoading = $derived(loadingAccounts || loadingMailboxes || loadingThreads || loadingMessage);

  /** @type {EmailThread | null} */
  let selectedThread = $derived(threads.find(t => t.uid === selectedThreadUid) || null);

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Initialize state with accounts from server
   * @param {EmailAccount[]} initialAccounts
   */
  function initAccounts(initialAccounts) {
    accounts = initialAccounts;
    if (initialAccounts.length > 0 && !activeAccountId) {
      activeAccountId = initialAccounts[0].id;
    }
  }

  /**
   * Switch to a different email account
   * @param {string} accountId
   */
  async function switchAccount(accountId) {
    if (accountId === activeAccountId) return;

    activeAccountId = accountId;
    currentMailbox = 'INBOX';
    selectedThreadUid = null;
    selectedMessage = null;
    threads = [];

    // Load mailboxes if not cached
    if (!mailboxesByAccount[accountId]) {
      await loadMailboxes();
    }

    // Load inbox threads
    await loadThreads();
  }

  /**
   * Load mailboxes for current account
   */
  async function loadMailboxes() {
    if (!activeAccountId) return;

    loadingMailboxes = true;
    try {
      const res = await fetch(`/webmail/api/mailboxes?accountId=${activeAccountId}`);
      const data = await res.json();

      if (data.success) {
        mailboxesByAccount = {
          ...mailboxesByAccount,
          [activeAccountId]: data.mailboxes
        };
      }
    } catch (error) {
      console.error('[Mail] Load mailboxes failed:', error);
    } finally {
      loadingMailboxes = false;
    }
  }

  /**
   * Switch to a different mailbox
   * @param {string} path
   */
  async function selectMailbox(path) {
    if (path === currentMailbox && threads.length > 0) return;

    currentMailbox = path;
    selectedThreadUid = null;
    selectedMessage = null;

    await loadThreads();
  }

  /**
   * Load threads for current mailbox
   * @param {Object} options
   * @param {number} [options.page=1]
   * @param {number} [options.limit=50]
   */
  async function loadThreads(options = {}) {
    if (!activeAccountId) return;

    const {page = 1, limit = 50} = options;

    loadingThreads = true;
    try {
      const params = new URLSearchParams({
        accountId: activeAccountId,
        mailbox: currentMailbox,
        page: String(page),
        limit: String(limit)
      });

      const res = await fetch(`/webmail/api/threads?${params}`);
      const data = await res.json();

      if (data.success) {
        threads = data.threads;
      }
    } catch (error) {
      console.error('[Mail] Load threads failed:', error);
    } finally {
      loadingThreads = false;
    }
  }

  /**
   * Select and load a specific thread/message
   * @param {number} uid
   */
  async function selectThread(uid) {
    if (uid === selectedThreadUid && selectedMessage) return;

    selectedThreadUid = uid;
    loadingMessage = true;

    try {
      const params = new URLSearchParams({
        accountId: activeAccountId || '',
        mailbox: currentMailbox
      });

      const res = await fetch(`/webmail/api/message/${uid}?${params}`);
      const data = await res.json();

      if (data.success) {
        selectedMessage = data.message;

        // Mark as read locally (optimistic update)
        threads = threads.map(t =>
          t.uid === uid && !t.flags.includes('\\Seen') ? {...t, flags: [...t.flags, '\\Seen']} : t
        );
      }
    } catch (error) {
      console.error('[Mail] Load message failed:', error);
    } finally {
      loadingMessage = false;
    }
  }

  /**
   * Clear current message selection
   */
  function clearSelection() {
    selectedThreadUid = null;
    selectedMessage = null;
  }

  /**
   * Toggle star on a thread
   * @param {number} uid
   */
  async function toggleStar(uid) {
    const thread = threads.find(t => t.uid === uid);
    if (!thread) return;

    const isStarred = thread.flags.includes('\\Flagged');
    const action = isStarred ? 'unstar' : 'star';

    // Optimistic update
    threads = threads.map(t =>
      t.uid === uid ?
        {
          ...t,
          flags: isStarred ? t.flags.filter(f => f !== '\\Flagged') : [...t.flags, '\\Flagged']
        }
      : t
    );

    try {
      await fetch('/webmail/api/actions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          accountId: activeAccountId,
          mailbox: currentMailbox,
          uids: [uid],
          action
        })
      });
    } catch (error) {
      console.error('[Mail] Toggle star failed:', error);
      // Revert on error
      threads = threads.map(t =>
        t.uid === uid ?
          {
            ...t,
            flags: isStarred ? [...t.flags, '\\Flagged'] : t.flags.filter(f => f !== '\\Flagged')
          }
        : t
      );
    }
  }

  /**
   * Mark threads as read/unread
   * @param {number[]} uids
   * @param {boolean} read
   */
  async function markAsRead(uids, read = true) {
    const action = read ? 'markRead' : 'markUnread';

    // Optimistic update
    threads = threads.map(t =>
      uids.includes(t.uid) ?
        {
          ...t,
          flags: read ? [...new Set([...t.flags, '\\Seen'])] : t.flags.filter(f => f !== '\\Seen')
        }
      : t
    );

    try {
      await fetch('/webmail/api/actions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          accountId: activeAccountId,
          mailbox: currentMailbox,
          uids,
          action
        })
      });
    } catch (error) {
      console.error('[Mail] Mark read failed:', error);
    }
  }

  /**
   * Move threads to trash or another folder
   * @param {number[]} uids
   * @param {string} destination
   */
  async function moveThreads(uids, destination) {
    // Remove from current view
    const removedThreads = threads.filter(t => uids.includes(t.uid));
    threads = threads.filter(t => !uids.includes(t.uid));

    // Clear selection if moved
    if (selectedThreadUid && uids.includes(selectedThreadUid)) {
      clearSelection();
    }

    try {
      await fetch('/webmail/api/actions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          accountId: activeAccountId,
          mailbox: currentMailbox,
          uids,
          action: 'move',
          targetMailbox: destination
        })
      });
    } catch (error) {
      console.error('[Mail] Move failed:', error);
      // Restore on error
      threads = [...threads, ...removedThreads].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  }

  /**
   * Delete threads (move to trash)
   * @param {number[]} uids
   */
  async function deleteThreads(uids) {
    const trash = mailboxes.find(m => m.specialUse === '\\Trash');
    if (trash) {
      await moveThreads(uids, trash.path);
    }
  }

  /**
   * Archive threads
   * @param {number[]} uids
   */
  async function archiveThreads(uids) {
    const archive = mailboxes.find(m => m.specialUse === '\\Archive');
    if (archive) {
      await moveThreads(uids, archive.path);
    }
  }

  // ==========================================================================
  // Compose Actions
  // ==========================================================================

  /**
   * Open compose modal
   * @param {ComposeDraft | null} draft
   */
  function openCompose(draft = null) {
    composeDraft = draft || {
      accountId: activeAccountId || '',
      to: [],
      subject: '',
      body: '',
      bodyType: 'html'
    };
    composeOpen = true;
  }

  /**
   * Close compose modal
   */
  function closeCompose() {
    composeOpen = false;
    composeDraft = null;
  }

  /**
   * Update compose draft
   * @param {Partial<ComposeDraft>} updates
   */
  function updateDraft(updates) {
    if (composeDraft) {
      composeDraft = {...composeDraft, ...updates};
    }
  }

  /**
   * Send the current draft
   */
  async function sendDraft() {
    if (!composeDraft) return {success: false, error: 'No draft'};

    sending = true;
    try {
      const res = await fetch('/webmail/api/send', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(composeDraft)
      });

      const data = await res.json();

      if (data.success) {
        closeCompose();
        // Refresh sent folder if we're viewing it
        if (
          currentMailbox === 'Sent' ||
          mailboxes.find(m => m.path === currentMailbox)?.specialUse === '\\Sent'
        ) {
          await loadThreads();
        }
      }

      return data;
    } catch (error) {
      console.error('[Mail] Send failed:', error);
      return {success: false, error: 'Failed to send'};
    } finally {
      sending = false;
    }
  }

  // ==========================================================================
  // Keyboard Navigation Helpers
  // ==========================================================================

  /**
   * Select next thread
   */
  function selectNextThread() {
    const currentIndex =
      selectedThreadUid ? filteredThreads.findIndex(t => t.uid === selectedThreadUid) : -1;

    if (currentIndex < filteredThreads.length - 1) {
      selectThread(filteredThreads[currentIndex + 1].uid);
    } else if (currentIndex === -1 && filteredThreads.length > 0) {
      selectThread(filteredThreads[0].uid);
    }
  }

  /**
   * Select previous thread
   */
  function selectPrevThread() {
    const currentIndex =
      selectedThreadUid ? filteredThreads.findIndex(t => t.uid === selectedThreadUid) : -1;

    if (currentIndex > 0) {
      selectThread(filteredThreads[currentIndex - 1].uid);
    }
  }

  // ==========================================================================
  // Return Public API
  // ==========================================================================

  return {
    // Read-only state
    get accounts() {
      return accounts;
    },
    get activeAccount() {
      return activeAccount;
    },
    get activeAccountId() {
      return activeAccountId;
    },
    get mailboxes() {
      return mailboxes;
    },
    get specialMailboxes() {
      return specialMailboxes;
    },
    get customMailboxes() {
      return customMailboxes;
    },
    get currentMailbox() {
      return currentMailbox;
    },
    get threads() {
      return filteredThreads;
    },
    get allThreads() {
      return threads;
    },
    get selectedThread() {
      return selectedThread;
    },
    get selectedMessage() {
      return selectedMessage;
    },
    get totalUnread() {
      return totalUnread;
    },
    get unreadInCurrentMailbox() {
      return unreadInCurrentMailbox;
    },

    // Loading states
    get loading() {
      return {
        accounts: loadingAccounts,
        mailboxes: loadingMailboxes,
        threads: loadingThreads,
        message: loadingMessage,
        sending
      };
    },
    get isLoading() {
      return isLoading;
    },

    // Filters
    get searchQuery() {
      return searchQuery;
    },
    set searchQuery(v) {
      searchQuery = v;
    },
    get showUnreadOnly() {
      return showUnreadOnly;
    },
    set showUnreadOnly(v) {
      showUnreadOnly = v;
    },
    get showStarredOnly() {
      return showStarredOnly;
    },
    set showStarredOnly(v) {
      showStarredOnly = v;
    },

    // Compose
    get composeDraft() {
      return composeDraft;
    },
    get composeOpen() {
      return composeOpen;
    },

    // UI state
    get sidebarCollapsed() {
      return sidebarCollapsed;
    },
    set sidebarCollapsed(v) {
      sidebarCollapsed = v;
    },

    // Account actions
    initAccounts,
    switchAccount,
    loadMailboxes,

    // Mailbox actions
    selectMailbox,
    loadThreads,

    // Thread actions
    selectThread,
    clearSelection,
    toggleStar,
    markAsRead,
    moveThreads,
    deleteThreads,
    archiveThreads,

    // Compose actions
    openCompose,
    closeCompose,
    updateDraft,
    sendDraft,

    // Navigation
    selectNextThread,
    selectPrevThread
  };
}
