<script>
  import {getContext} from 'svelte';
  import {GripVertical, Plus, Trash2, MoreVertical, X, ArrowDownToLine, ArrowLeftRight} from '@lucide/svelte';
  import {fly} from 'svelte/transition';
  import {cubicOut} from 'svelte/easing';
  import IssueCard from './IssueCard.svelte';
  import ColumnIconPicker from './ColumnIconPicker.svelte';
  import ColumnColorPicker from './ColumnColorPicker.svelte';

  let {column, issues = []} = $props();

  const pmState = getContext('pmState');

  // Check if this is the backlog column
  let isBacklog = $derived(column.id === 'backlog');

  // Check if this column is being hovered during drag (with null safety)
  let isHovered = $derived(pmState?.hoveredColumn === column.id && pmState?.isDragging && pmState?.dragType === 'issue');
  let isDragOver = $derived(pmState?.dragOverColumnId === column.id && pmState?.dragType === 'column');
  let isEditing = $derived(pmState?.isEditingColumns ?? false);
  let isEditingThis = $derived(pmState?.editingColumnId === column.id);
  let showIconPicker = $derived(pmState?.showingIconPicker === column.id);
  let showColorPicker = $derived(pmState?.showingColorPicker === column.id);
  let isBeingDragged = $derived(pmState?.draggedColumn === column.id);

  // Get the display data (from edit state if editing, otherwise from column)
  let displayName = $derived(isEditingThis ? pmState?.columnEditData?.name : column.name);
  let displayIcon = $derived(isEditingThis ? pmState?.columnEditData?.icon : column.icon);
  let displayColor = $derived(isEditingThis ? pmState?.columnEditData?.color : column.color);

  // Column color classes
  const colorClasses = {
    base05: 'column-gray',
    base08: 'column-red',
    base09: 'column-orange',
    base0A: 'column-yellow',
    base0B: 'column-green',
    base0C: 'column-cyan',
    base0D: 'column-blue',
    base0E: 'column-purple',
    base0F: 'column-brown'
  };

  // Handle name change
  function handleNameChange(e) {
    pmState.updateColumnField(column.id, 'name', e.target.value);
  }

  // Handle name blur - save changes
  function handleNameBlur() {
    if (isEditingThis) {
      pmState.saveColumnChanges(column.id);
      pmState.stopEditingColumn();
    }
  }

  // Handle enter key
  function handleNameKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameBlur();
    }
    if (e.key === 'Escape') {
      pmState.stopEditingColumn();
    }
  }

  // Start dragging column
  function handleDragStart(e) {
    if (!isEditing) return;
    const columnEl = e.currentTarget.closest('.pm-column');
    if (columnEl) {
      pmState.startColumnDrag(columnEl, column.id, e);
    }
  }
</script>

<div
  class="pm-column {colorClasses[displayColor] || 'column-blue'}"
  class:hovered={isHovered}
  class:drag-over={isDragOver}
  class:editing={isEditing}
  class:dragging={pmState.draggedColumn === column.id}
  data-column-id={column.id}
>
  <div class="column-header">
    {#if isEditing}
      <!-- Edit mode header -->
      <div class="column-edit-row">
        <!-- Drag handle with animated icons -->
        <div class="drag-handle-container">
          {#if isBeingDragged}
            <div class="drag-icon-inner moving-mode" transition:fly={{y: -10, duration: 150, easing: cubicOut}}>
              <span class="drag-dots">⋮⋮</span>
            </div>
          {:else if isDragOver}
            <div class="drag-icon-inner switch-mode" transition:fly={{y: -10, duration: 150, easing: cubicOut}}>
              <ArrowLeftRight size={14} />
            </div>
          {:else}
            <button
              class="drag-handle"
              onmousedown={handleDragStart}
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </button>
          {/if}
        </div>

        <!-- Icon picker button -->
        <button
          class="icon-btn"
          onclick={() => pmState.toggleIconPicker(column.id)}
          title="Change icon"
        >
          <span class="icon-preview">{displayIcon || '📋'}</span>
        </button>

        <!-- Editable name -->
        {#if isEditingThis}
          <input
            type="text"
            class="column-name-input"
            value={displayName}
            oninput={handleNameChange}
            onblur={handleNameBlur}
            onkeydown={handleNameKeydown}
            autofocus
          />
        {:else}
          <button
            class="column-name-btn"
            onclick={() => pmState.startEditingColumn(column.id)}
          >
            {displayName}
          </button>
        {/if}

        <!-- Color picker button -->
        <button
          class="color-btn {colorClasses[displayColor]}"
          onclick={() => pmState.toggleColorPicker(column.id)}
          title="Change color"
        >
          <span class="color-dot"></span>
        </button>

        <!-- Delete button (only if no issues) -->
        {#if issues.length === 0}
          <button
            class="delete-btn"
            onclick={() => pmState.deleteColumn(column.id)}
            title="Delete column"
          >
            <Trash2 size={14} />
          </button>
        {/if}
      </div>

      <!-- Pickers dropdown -->
      {#if showIconPicker}
        <ColumnIconPicker {column} />
      {/if}
      {#if showColorPicker}
        <ColumnColorPicker {column} />
      {/if}
    {:else}
      <!-- Normal mode header -->
      <div class="column-title">
        {#if column.icon}
          <span class="column-icon">{column.icon}</span>
        {/if}
        <span class="column-name">{column.name}</span>
        <span class="column-count">{issues.length}</span>
      </div>
      <button class="column-menu">
        <MoreVertical size={16} />
      </button>
    {/if}
  </div>

  <div class="column-body" class:backlog-body={isBacklog}>
    {#if issues.length === 0}
      <div class="empty-column">
        <p>No issues</p>
      </div>
    {:else}
      {#each issues as issue, idx (issue.id)}
        <div class="issue-row" class:backlog-row={isBacklog}>
          {#if isBacklog}
            <div class="position-badge" title="Priority #{idx + 1}">
              {idx + 1}
            </div>
          {/if}
          <IssueCard {issue} />
        </div>
      {/each}
    {/if}

    <!-- Drop zone indicator -->
    {#if isHovered}
      <div class="drop-indicator" transition:fly={{y: 10, duration: 200, easing: cubicOut}}>
        <div class="drop-indicator-content">
          <ArrowDownToLine size={18} />
          <span>Drop here</span>
        </div>
      </div>
    {/if}
  </div>

  <button class="add-issue-btn" onclick={() => pmState.addIssue({status: column.id})}>
    <Plus size={14} />
    Add issue
  </button>
</div>

<style lang="postcss">
  @reference '$theme';

  .pm-column {
    @apply flex flex-col w-72 flex-shrink-0;
    @apply bg-base01 rounded-xl border border-border;
    @apply transition-all duration-200;
    max-height: calc(100vh - 240px);
  }

  .pm-column.hovered {
    @apply border-base0D bg-base0D/5;
    @apply ring-2 ring-base0D/20;
  }

  .pm-column.drag-over {
    @apply border-base0E bg-base0E/5;
    @apply ring-2 ring-base0E/30;
  }

  .pm-column.editing {
    @apply border-base0D/50;
  }

  .pm-column.dragging {
    @apply opacity-50;
  }

  .column-header {
    @apply flex flex-col p-3;
    @apply border-b border-border;
    @apply relative;
  }

  .column-title {
    @apply flex items-center gap-2;
  }

  .column-icon {
    @apply text-sm;
  }

  .column-name {
    @apply text-sm font-semibold text-base06;
  }

  .column-count {
    @apply text-xs font-medium px-1.5 py-0.5 rounded-full;
    @apply bg-base02 text-base04;
  }

  /* Edit mode row */
  .column-edit-row {
    @apply flex items-center gap-2;
  }

  .drag-handle-container {
    @apply relative w-6 h-6 flex items-center justify-center;
  }

  .drag-icon-inner {
    @apply flex items-center justify-center w-full h-full rounded;
  }

  .drag-icon-inner.moving-mode {
    @apply text-base0E bg-base0E/10;
  }

  .drag-icon-inner.switch-mode {
    @apply text-base0D bg-base0D/10;
    animation: pulse-glow 1s ease-in-out infinite;
  }

  .drag-dots {
    @apply text-xs font-bold tracking-tighter;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .drag-handle {
    @apply p-1 rounded cursor-grab;
    @apply text-base04 hover:text-base05 hover:bg-base02;
    @apply transition-colors;
  }

  .drag-handle:active {
    @apply cursor-grabbing;
  }

  .icon-btn {
    @apply p-1 rounded;
    @apply text-base04 hover:bg-base02;
    @apply transition-colors;
  }

  .icon-preview {
    @apply text-sm;
  }

  .column-name-input {
    @apply flex-1 px-2 py-1 rounded;
    @apply text-sm font-semibold text-base06;
    @apply bg-base02 border border-base0D/50;
    @apply outline-none;
  }

  .column-name-btn {
    @apply flex-1 px-2 py-1 text-left rounded;
    @apply text-sm font-semibold text-base06;
    @apply hover:bg-base02;
    @apply transition-colors;
  }

  .color-btn {
    @apply p-1.5 rounded;
    @apply hover:bg-base02;
    @apply transition-colors;
  }

  .color-dot {
    @apply block w-3 h-3 rounded-full;
    @apply bg-current;
  }

  .column-gray .color-dot { @apply bg-base05; }
  .column-red .color-dot { @apply bg-base08; }
  .column-orange .color-dot { @apply bg-base09; }
  .column-yellow .color-dot { @apply bg-base0A; }
  .column-green .color-dot { @apply bg-base0B; }
  .column-cyan .color-dot { @apply bg-base0C; }
  .column-blue .color-dot { @apply bg-base0D; }
  .column-purple .color-dot { @apply bg-base0E; }
  .column-brown .color-dot { @apply bg-base0F; }

  .delete-btn {
    @apply p-1 rounded;
    @apply text-base08/70 hover:text-base08 hover:bg-base08/10;
    @apply transition-colors;
  }

  /* Color variants for count badge */
  .column-gray .column-count { @apply bg-base03/20 text-base05; }
  .column-red .column-count { @apply bg-base08/15 text-base08; }
  .column-orange .column-count { @apply bg-base09/15 text-base09; }
  .column-yellow .column-count { @apply bg-base0A/15 text-base0A; }
  .column-green .column-count { @apply bg-base0B/15 text-base0B; }
  .column-cyan .column-count { @apply bg-base0C/15 text-base0C; }
  .column-blue .column-count { @apply bg-base0D/15 text-base0D; }
  .column-purple .column-count { @apply bg-base0E/15 text-base0E; }
  .column-brown .column-count { @apply bg-base0F/15 text-base0F; }

  .column-menu {
    @apply p-1 rounded hover:bg-base02;
    @apply text-base04 hover:text-base05;
    @apply transition-colors;
    @apply ml-auto;
  }

  .column-body {
    @apply flex-1 overflow-y-auto p-2 space-y-2;
    @apply min-h-[100px];
  }

  .empty-column {
    @apply flex items-center justify-center h-24;
    @apply text-sm text-base04;
    @apply border-2 border-dashed border-border rounded-lg;
  }

  .drop-indicator {
    @apply flex items-center justify-center py-6;
    @apply border-2 border-dashed border-base0D rounded-lg;
    @apply bg-base0D/5;
  }

  .drop-indicator-content {
    @apply flex flex-col items-center gap-2;
    @apply text-base0D;
  }

  .drop-indicator-content span {
    @apply text-sm font-medium;
  }

  .add-issue-btn {
    @apply flex items-center justify-center gap-2 m-2 p-2;
    @apply text-sm text-base04 hover:text-base05;
    @apply bg-transparent hover:bg-base02 rounded-lg;
    @apply border border-transparent hover:border-border;
    @apply transition-all duration-150;
  }

  /* Backlog specific styles */
  .issue-row {
    @apply flex items-stretch gap-0;
  }

  .backlog-row {
    @apply gap-2;
  }

  .backlog-row :global(.issue-card) {
    @apply flex-1;
  }

  .position-badge {
    @apply flex items-center justify-center;
    @apply w-7 flex-shrink-0;
    @apply text-xs font-bold text-base04;
    @apply bg-base02 rounded-lg;
    @apply border border-border;
  }

  .backlog-body {
    @apply pl-1;
  }
</style>
