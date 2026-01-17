<script>
  import {getContext} from 'svelte';
  import IssueCard from './IssueCard.svelte';

  let {column, issues = []} = $props();

  const pmState = getContext('pmState');

  // Check if this column is being hovered during drag
  let isHovered = $derived(pmState.hoveredColumn === column.id && pmState.isDragging);

  // Column color classes
  const colorClasses = {
    base05: 'column-gray',
    base0E: 'column-purple',
    base0D: 'column-blue',
    base0A: 'column-yellow',
    base0B: 'column-green'
  };
</script>

<div class="pm-column {colorClasses[column.color] || ''}" class:hovered={isHovered} data-column-id={column.id}>
  <div class="column-header">
    <div class="column-title">
      <span class="column-name">{column.name}</span>
      <span class="column-count">{issues.length}</span>
    </div>
    <button class="column-menu">
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
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>
  </div>

  <div class="column-body">
    {#if issues.length === 0}
      <div class="empty-column">
        <p>No issues</p>
      </div>
    {:else}
      {#each issues as issue (issue.id)}
        <IssueCard {issue} />
      {/each}
    {/if}

    <!-- Drop zone indicator -->
    {#if isHovered}
      <div class="drop-indicator">
        <span>Drop here</span>
      </div>
    {/if}
  </div>

  <button class="add-issue-btn" onclick={() => pmState.addIssue({status: column.id})}>
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
      <path d="M12 5v14M5 12h14" />
    </svg>
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

  .column-header {
    @apply flex items-center justify-between p-3;
    @apply border-b border-border;
  }

  .column-title {
    @apply flex items-center gap-2;
  }

  .column-name {
    @apply text-sm font-semibold text-base06;
  }

  .column-count {
    @apply text-xs font-medium px-1.5 py-0.5 rounded-full;
    @apply bg-base02 text-base04;
  }

  /* Color variants for count badge */
  .column-gray .column-count {
    @apply bg-base03/20 text-base05;
  }

  .column-purple .column-count {
    @apply bg-base0E/15 text-base0E;
  }

  .column-blue .column-count {
    @apply bg-base0D/15 text-base0D;
  }

  .column-yellow .column-count {
    @apply bg-base0A/15 text-base0A;
  }

  .column-green .column-count {
    @apply bg-base0B/15 text-base0B;
  }

  .column-menu {
    @apply p-1 rounded hover:bg-base02;
    @apply text-base04 hover:text-base05;
    @apply transition-colors;
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
    @apply flex items-center justify-center py-4;
    @apply border-2 border-dashed border-base0D rounded-lg;
    @apply bg-base0D/5 text-base0D text-sm font-medium;
    @apply animate-pulse;
  }

  .add-issue-btn {
    @apply flex items-center justify-center gap-2 m-2 p-2;
    @apply text-sm text-base04 hover:text-base05;
    @apply bg-transparent hover:bg-base02 rounded-lg;
    @apply border border-transparent hover:border-border;
    @apply transition-all duration-150;
  }
</style>
