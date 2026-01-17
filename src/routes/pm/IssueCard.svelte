<script>
  import {getContext} from 'svelte';

  let {issue} = $props();

  const pmState = getContext('pmState');

  // Priority colors
  const priorityColors = {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  };

  // Label colors (simple rotation)
  const labelColors = ['label-blue', 'label-purple', 'label-green', 'label-yellow', 'label-red'];

  // Check if this card is being dragged
  let isDragging = $derived(pmState.draggedIssue?.id === issue.id);

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  }

  // Handle mouse down for drag
  function handleMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    pmState.startCustomDrag(e.currentTarget, issue, e);
  }

  // Handle click for detail view
  function handleClick(e) {
    // Don't open detail if we were dragging
    if (pmState.isDragging) return;
    pmState.selectIssue(issue);
  }
</script>

<div
  class="issue-card {priorityColors[issue.priority] || ''}"
  class:dragging={isDragging}
  data-issue-id={issue.id}
  onmousedown={handleMouseDown}
  onclick={handleClick}
  role="button"
  tabindex="0"
>
  <!-- Priority indicator -->
  <div class="priority-bar"></div>

  <div class="card-content">
    <!-- Title -->
    <h4 class="issue-title">{issue.title}</h4>

    <!-- Labels -->
    {#if issue.labels?.length > 0}
      <div class="labels">
        {#each issue.labels.slice(0, 3) as label, i}
          <span class="label {labelColors[i % labelColors.length]}">{label}</span>
        {/each}
        {#if issue.labels.length > 3}
          <span class="label label-more">+{issue.labels.length - 3}</span>
        {/if}
      </div>
    {/if}

    <!-- Footer -->
    <div class="card-footer">
      <div class="meta">
        {#if issue.assignee}
          <div class="assignee" title={issue.assignee}>
            {#if issue.assignee === 'ai-agent'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
              <span>AI</span>
            {:else}
              <span class="assignee-avatar">{issue.assignee.charAt(0).toUpperCase()}</span>
            {/if}
          </div>
        {/if}
        <span class="date">{formatDate(issue.updated_at)}</span>
      </div>

      {#if issue.source === 'feedback'}
        <div class="source-badge" title="From user feedback">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .issue-card {
    @apply relative bg-base00 rounded-lg border border-border;
    @apply cursor-grab select-none;
    @apply transition-all duration-150;
    @apply hover:border-base03 hover:shadow-md;
  }

  .issue-card:active {
    @apply cursor-grabbing;
  }

  .issue-card.dragging {
    @apply opacity-40 scale-[0.98];
  }

  .priority-bar {
    @apply absolute top-0 left-0 w-1 h-full rounded-l-lg;
    @apply bg-base04;
  }

  .priority-critical .priority-bar {
    @apply bg-base08;
  }

  .priority-high .priority-bar {
    @apply bg-base09;
  }

  .priority-medium .priority-bar {
    @apply bg-base0A;
  }

  .priority-low .priority-bar {
    @apply bg-base0B;
  }

  .card-content {
    @apply p-3 pl-4;
  }

  .issue-title {
    @apply text-sm font-medium text-base06 mb-2;
    @apply line-clamp-2;
  }

  .labels {
    @apply flex flex-wrap gap-1 mb-2;
  }

  .label {
    @apply text-xs px-1.5 py-0.5 rounded;
    @apply font-medium;
  }

  .label-blue {
    @apply bg-base0D/15 text-base0D;
  }

  .label-purple {
    @apply bg-base0E/15 text-base0E;
  }

  .label-green {
    @apply bg-base0B/15 text-base0B;
  }

  .label-yellow {
    @apply bg-base0A/15 text-base0A;
  }

  .label-red {
    @apply bg-base08/15 text-base08;
  }

  .label-more {
    @apply bg-base02 text-base04;
  }

  .card-footer {
    @apply flex items-center justify-between;
  }

  .meta {
    @apply flex items-center gap-2 text-xs text-base04;
  }

  .assignee {
    @apply flex items-center gap-1;
  }

  .assignee svg {
    @apply text-base0E;
  }

  .assignee-avatar {
    @apply w-4 h-4 rounded-full bg-base03 text-base05;
    @apply flex items-center justify-center text-[10px] font-semibold;
  }

  .date {
    @apply text-base04;
  }

  .source-badge {
    @apply text-base04;
  }
</style>
