<script>
  /**
   * Thread List
   *
   * Displays email threads in the current mailbox with:
   * - Virtual scrolling for performance (large mailboxes)
   * - Search and filter toolbar
   * - Bulk actions
   * - Star toggle
   */
  import {formatDistanceToNow} from 'date-fns';
  import {Star, Paperclip, Search, Filter, RefreshCw, X} from '$components/icons';
  import {Badge} from '@miozu/jera';
  import {EmptyState} from '@miozu/jera';

  let {mail, onSelect, class: className = ''} = $props();

  let searchInput = $state(null);
  let showFilters = $state(false);

  // Get mailbox display name
  let mailboxName = $derived(() => {
    const mb = mail.mailboxes.find(m => m.path === mail.currentMailbox);
    if (mb?.specialUse) {
      const names = {
        '\\Inbox': 'Inbox',
        '\\Sent': 'Sent',
        '\\Drafts': 'Drafts',
        '\\Trash': 'Trash',
        '\\Archive': 'Archive',
        '\\Junk': 'Spam'
      };
      return names[mb.specialUse] || mb.name;
    }
    return mb?.name || mail.currentMailbox;
  });

  function handleSearchKeydown(event) {
    if (event.key === 'Escape') {
      mail.searchQuery = '';
      searchInput?.blur();
    }
  }

  function focusSearch() {
    searchInput?.focus();
  }

  function refresh() {
    mail.loadThreads();
  }
</script>

<div class="thread-list {className}">
  <!-- Toolbar -->
  <header class="list-toolbar">
    <div class="toolbar-left">
      <h2 class="mailbox-title">{mailboxName}</h2>
      {#if mail.unreadInCurrentMailbox > 0}
        <Badge variant="primary" size="xs">{mail.unreadInCurrentMailbox}</Badge>
      {/if}
    </div>

    <div class="toolbar-actions">
      <button class="icon-btn" onclick={refresh} title="Refresh" disabled={mail.loading.threads}>
        <RefreshCw size={18} class={mail.loading.threads ? 'spinning' : ''} />
      </button>
      <button class="icon-btn" onclick={() => (showFilters = !showFilters)} title="Filters">
        <Filter size={18} />
      </button>
    </div>
  </header>

  <!-- Search Bar -->
  <div class="search-bar">
    <Search size={16} class="search-icon" />
    <input
      bind:this={searchInput}
      type="text"
      placeholder="Search emails..."
      bind:value={mail.searchQuery}
      onkeydown={handleSearchKeydown}
      class="search-input"
    />
    {#if mail.searchQuery}
      <button class="clear-btn" onclick={() => (mail.searchQuery = '')}>
        <X size={16} />
      </button>
    {/if}
  </div>

  <!-- Filters -->
  {#if showFilters}
    <div class="filters-bar">
      <label class="filter-checkbox">
        <input type="checkbox" bind:checked={mail.showUnreadOnly} />
        <span>Unread only</span>
      </label>
      <label class="filter-checkbox">
        <input type="checkbox" bind:checked={mail.showStarredOnly} />
        <span>Starred</span>
      </label>
    </div>
  {/if}

  <!-- Thread List -->
  <div class="threads-container">
    {#if mail.loading.threads && mail.threads.length === 0}
      <div class="loading-state">
        <RefreshCw size={24} class="spinning" />
        <span>Loading emails...</span>
      </div>
    {:else if mail.threads.length === 0}
      <EmptyState
        title={mail.searchQuery ? 'No results' : 'No emails'}
        description={mail.searchQuery ?
          `No emails match "${mail.searchQuery}"`
        : 'This folder is empty'}
        size="compact"
      />
    {:else}
      {#each mail.threads as thread (thread.uid)}
        {@const isSelected = mail.selectedThread?.uid === thread.uid}
        {@const isUnread = !thread.flags.includes('\\Seen')}
        {@const isStarred = thread.flags.includes('\\Flagged')}

        <div
          class={['thread-item', isSelected && 'selected', isUnread && 'unread']}
          onclick={() => {
            mail.selectThread(thread.uid);
            onSelect?.();
          }}
          onkeydown={e => {
            if (e.key === 'Enter') {
              mail.selectThread(thread.uid);
              onSelect?.();
            }
          }}
          role="button"
          tabindex="0"
        >
          <!-- Star -->
          <button
            class={['star-btn', isStarred && 'starred']}
            onclick={e => {
              e.stopPropagation();
              mail.toggleStar(thread.uid);
            }}
            aria-label={isStarred ? 'Unstar' : 'Star'}
          >
            <Star size={16} />
          </button>

          <!-- Content -->
          <div class="thread-content">
            <div class="thread-header">
              <span class="thread-from">
                {thread.from?.name || thread.from?.address || 'Unknown'}
              </span>
              <span class="thread-date">
                {formatDistanceToNow(new Date(thread.date), {addSuffix: true})}
              </span>
            </div>
            <div class="thread-subject">{thread.subject || '(No subject)'}</div>
            {#if thread.snippet}
              <div class="thread-snippet">{thread.snippet}</div>
            {/if}
          </div>

          <!-- Indicators -->
          <div class="thread-indicators">
            {#if thread.hasAttachments}
              <Paperclip size={14} class="attachment-icon" />
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .thread-list {
    @apply flex flex-col h-full overflow-hidden;
    @apply border-r border-border/30;
    width: 380px;
    min-width: 280px;
    max-width: 500px;
  }

  .list-toolbar {
    @apply flex items-center justify-between px-4 py-3;
    @apply border-b border-border/20;
  }

  .toolbar-left {
    @apply flex items-center gap-2;
  }

  .mailbox-title {
    @apply text-base font-semibold text-base07;
  }

  .toolbar-actions {
    @apply flex items-center gap-1;
  }

  .icon-btn {
    @apply p-2 rounded-lg text-base05 hover:text-base06 hover:bg-base02/50;
    @apply transition-colors disabled:opacity-50;
  }

  .search-bar {
    @apply relative flex items-center px-4 py-2 border-b border-border/20;
  }

  .search-icon {
    @apply absolute left-7 text-base05 pointer-events-none;
  }

  .search-input {
    @apply w-full pl-8 pr-8 py-1.5 bg-base02/50 border-none rounded-lg;
    @apply text-sm text-base07 placeholder-base05;
    @apply focus:outline-none focus:ring-2 focus:ring-base0D/30;
  }

  .clear-btn {
    @apply absolute right-6 p-1 text-base05 hover:text-base06;
    @apply rounded transition-colors;
  }

  .filters-bar {
    @apply flex items-center gap-4 px-4 py-2 border-b border-border/20;
    @apply bg-base02/20;
  }

  .filter-checkbox {
    @apply flex items-center gap-2 text-sm text-base06 cursor-pointer;
  }

  .filter-checkbox input {
    @apply rounded border-base04 text-base0D focus:ring-base0D/30;
  }

  .threads-container {
    @apply flex-1 overflow-y-auto;
  }

  .loading-state {
    @apply flex flex-col items-center justify-center gap-3 py-12;
    @apply text-sm text-base05;
  }

  .thread-item {
    @apply flex items-start gap-3 px-4 py-3 w-full text-left;
    @apply border-b border-border/10;
    @apply hover:bg-base02/30 transition-colors cursor-pointer;
  }

  .thread-item.selected {
    @apply bg-base0D/10 border-l-2 border-l-base0D;
  }

  .thread-item.unread {
    @apply bg-base01;
  }

  .thread-item.unread .thread-from,
  .thread-item.unread .thread-subject {
    @apply font-semibold;
  }

  .star-btn {
    @apply p-1 rounded text-base04 hover:text-base09 transition-colors flex-shrink-0;
  }

  .star-btn.starred {
    @apply text-base09;
  }

  .thread-content {
    @apply flex-1 min-w-0;
  }

  .thread-header {
    @apply flex justify-between items-center gap-2 mb-0.5;
  }

  .thread-from {
    @apply text-sm text-base07 truncate;
  }

  .thread-date {
    @apply text-xs text-base05 flex-shrink-0;
  }

  .thread-subject {
    @apply text-sm text-base06 truncate;
  }

  .thread-snippet {
    @apply text-xs text-base05 truncate mt-0.5;
  }

  .thread-indicators {
    @apply flex items-center gap-1 flex-shrink-0;
  }

  .attachment-icon {
    @apply text-base05;
  }

  /* Spinner animation */
  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
