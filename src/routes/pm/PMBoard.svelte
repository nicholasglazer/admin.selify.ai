<script>
  import {getContext} from 'svelte';
  import {Search, X, Plus, Check, Pencil} from '@lucide/svelte';
  import PMColumn from './PMColumn.svelte';

  const pmState = getContext('pmState');

  // Derived values (with null safety for SSR)
  let columns = $derived(pmState?.columns ?? []);
  let issuesByColumn = $derived(pmState?.getFilteredIssuesByColumn?.() ?? {});
  let isEditingColumns = $derived(pmState?.isEditingColumns ?? false);
  let isDragging = $derived(pmState?.isDragging ?? false);
  let dragType = $derived(pmState?.dragType ?? null);
  let searchQuery = $state('');

  // Handle search
  function handleSearch(e) {
    searchQuery = e.target.value;
    pmState?.setFilter?.('search', searchQuery);
  }

  // Clear search
  function clearSearch() {
    searchQuery = '';
    pmState?.setFilter?.('search', '');
  }

  // Add column at start
  function addColumnAtStart() {
    pmState?.createNewColumn?.(-1);
  }

  // Add column at end
  function addColumnAtEnd() {
    pmState?.createNewColumn?.(columns.length - 1);
  }

  // Handle global mouse events for drag (Svelte native pattern)
  function handleDocumentMouseMove(event) {
    if (!isDragging || !pmState) return;
    if (dragType === 'issue') {
      pmState.handleDragMove(event);
    } else if (dragType === 'column') {
      pmState.handleColumnDragMove(event);
    }
  }

  function handleDocumentMouseUp(event) {
    if (!isDragging || !pmState) return;
    if (dragType === 'issue') {
      pmState.handleDragEnd(event);
    } else if (dragType === 'column') {
      pmState.handleColumnDragEnd(event);
    }
  }
</script>

<!-- Global event handlers using Svelte native directives -->
<svelte:document
  onmousemove={isDragging ? handleDocumentMouseMove : undefined}
  onmouseup={isDragging ? handleDocumentMouseUp : undefined}
/>

<!-- Body class for drag cursor -->
<svelte:body class:pm-dragging={isDragging} />

<div class="pm-board">
  <!-- Search and filters bar -->
  <div class="board-toolbar">
    <div class="search-box">
      <Search size={16} />
      <input type="text" placeholder="Search issues..." value={searchQuery} oninput={handleSearch} />
      {#if searchQuery}
        <button class="clear-search" onclick={clearSearch}>
          <X size={14} />
        </button>
      {/if}
    </div>

    <div class="filter-chips">
      <button
        class="filter-chip"
        class:active={pmState?.filters?.priority === 'critical'}
        onclick={() => pmState?.setFilter?.('priority', pmState?.filters?.priority === 'critical' ? null : 'critical')}
      >
        Critical
      </button>
      <button
        class="filter-chip"
        class:active={pmState?.filters?.priority === 'high'}
        onclick={() => pmState?.setFilter?.('priority', pmState?.filters?.priority === 'high' ? null : 'high')}
      >
        High Priority
      </button>
      <button
        class="filter-chip"
        class:active={pmState?.filters?.assignee === 'ai-agent'}
        onclick={() => pmState?.setFilter?.('assignee', pmState?.filters?.assignee === 'ai-agent' ? null : 'ai-agent')}
      >
        AI Assigned
      </button>
    </div>

    <div class="toolbar-actions">
      <!-- Edit columns toggle -->
      <button
        class="edit-columns-btn"
        class:active={isEditingColumns}
        onclick={() => pmState?.toggleColumnEditMode?.()}
        title={isEditingColumns ? 'Done editing' : 'Edit columns'}
      >
        {#if isEditingColumns}
          <Check size={16} />
          <span>Done</span>
        {:else}
          <Pencil size={16} />
          <span>Edit Columns</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Kanban columns -->
  <div class="board-columns">
    <!-- Add column button at start (only in edit mode) -->
    {#if isEditingColumns}
      <button class="add-column-btn" onclick={addColumnAtStart} title="Add column at start">
        <Plus size={20} />
      </button>
    {/if}

    {#each columns as column (column.id)}
      <PMColumn {column} issues={issuesByColumn[column.id] || []} />
    {/each}

    <!-- Add column button at end (only in edit mode) -->
    {#if isEditingColumns}
      <button class="add-column-btn" onclick={addColumnAtEnd} title="Add column at end">
        <Plus size={20} />
      </button>
    {/if}
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

  .search-box :global(svg) {
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

  .toolbar-actions {
    @apply flex items-center gap-2 ml-auto;
  }

  .edit-columns-btn {
    @apply flex items-center gap-2 px-3 py-1.5 rounded-lg;
    @apply text-sm font-medium;
    @apply bg-base02 text-base05 border border-border;
    @apply hover:bg-base03 hover:text-base06;
    @apply transition-all duration-150;
  }

  .edit-columns-btn.active {
    @apply bg-base0D/15 text-base0D border-base0D/30;
  }

  .add-column-btn {
    @apply flex items-center justify-center;
    @apply w-16 flex-shrink-0;
    @apply bg-base01/50 border-2 border-dashed border-border rounded-xl;
    @apply text-base04 hover:text-base0D hover:border-base0D/50 hover:bg-base0D/5;
    @apply transition-all duration-200;
    min-height: 200px;
  }

  /* Global dragging styles */
  :global(body.pm-dragging) {
    cursor: grabbing !important;
    user-select: none;
  }
</style>
