<script>
  import {getContext} from 'svelte';
  import PMColumn from './PMColumn.svelte';

  const pmState = getContext('pmState');

  // Derived values
  let columns = $derived(pmState.columns);
  let issuesByColumn = $derived(pmState.getFilteredIssuesByColumn());
  let searchQuery = $state('');

  // Handle search
  function handleSearch(e) {
    searchQuery = e.target.value;
    pmState.setFilter('search', searchQuery);
  }

  // Clear search
  function clearSearch() {
    searchQuery = '';
    pmState.setFilter('search', '');
  }
</script>

<div class="pm-board">
  <!-- Search and filters bar -->
  <div class="board-toolbar">
    <div class="search-box">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input type="text" placeholder="Search issues..." value={searchQuery} oninput={handleSearch} />
      {#if searchQuery}
        <button class="clear-search" onclick={clearSearch}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>

    <div class="filter-chips">
      <button
        class="filter-chip"
        class:active={pmState.filters.priority === 'critical'}
        onclick={() => pmState.setFilter('priority', pmState.filters.priority === 'critical' ? null : 'critical')}
      >
        Critical
      </button>
      <button
        class="filter-chip"
        class:active={pmState.filters.priority === 'high'}
        onclick={() => pmState.setFilter('priority', pmState.filters.priority === 'high' ? null : 'high')}
      >
        High Priority
      </button>
      <button
        class="filter-chip"
        class:active={pmState.filters.assignee === 'ai-agent'}
        onclick={() => pmState.setFilter('assignee', pmState.filters.assignee === 'ai-agent' ? null : 'ai-agent')}
      >
        AI Assigned
      </button>
    </div>
  </div>

  <!-- Kanban columns -->
  <div class="board-columns">
    {#each columns as column (column.id)}
      <PMColumn {column} issues={issuesByColumn[column.id] || []} />
    {/each}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .pm-board {
    @apply flex flex-col flex-1 overflow-hidden;
  }

  .board-toolbar {
    @apply flex items-center gap-4 py-4 px-2;
    @apply border-b border-border;
  }

  .search-box {
    @apply flex items-center gap-2 px-3 py-2;
    @apply bg-base01 border border-border rounded-lg;
    @apply w-64;
  }

  .search-box svg {
    @apply text-base04 flex-shrink-0;
  }

  .search-box input {
    @apply flex-1 bg-transparent border-none outline-none;
    @apply text-sm text-base06;
    @apply placeholder:text-base04;
  }

  .clear-search {
    @apply p-0.5 rounded hover:bg-base02;
    @apply text-base04 hover:text-base06;
    @apply transition-colors;
  }

  .filter-chips {
    @apply flex items-center gap-2;
  }

  .filter-chip {
    @apply px-3 py-1.5 rounded-full;
    @apply text-xs font-medium;
    @apply bg-base01 text-base04 border border-border;
    @apply transition-all duration-150;
    @apply hover:bg-base02 hover:text-base05;
  }

  .filter-chip.active {
    @apply bg-base0D/15 text-base0D border-base0D/30;
  }

  .board-columns {
    @apply flex gap-4 flex-1 overflow-x-auto p-4;
    @apply min-h-0;
  }

  /* Global dragging styles */
  :global(body.pm-dragging) {
    cursor: grabbing !important;
    user-select: none;
  }
</style>
