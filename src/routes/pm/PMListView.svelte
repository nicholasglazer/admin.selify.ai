<script>
  import {getContext} from 'svelte';
  import {
    ChevronUp,
    ChevronDown,
    Bot,
    CornerDownRight,
    ListTodo,
    MessageCircle
  } from '@lucide/svelte';
  import {Badge, Avatar} from '@miozu/jera';

  const pmState = getContext('pmState');

  // Derived values
  let issues = $derived(pmState?.getSortedIssues?.() ?? []);
  let columns = $derived(pmState?.columns ?? []);
  let sortColumn = $derived(pmState?.sortColumn ?? 'updated_at');
  let sortDirection = $derived(pmState?.sortDirection ?? 'desc');
  let teamMembers = $derived(pmState?.teamMembers ?? []);

  // Column definitions for the table
  const tableColumns = [
    {id: 'title', label: 'Title', sortable: true, width: 'flex-1'},
    {id: 'status', label: 'Status', sortable: true, width: 'w-28'},
    {id: 'priority', label: 'Priority', sortable: true, width: 'w-24'},
    {id: 'assignee', label: 'Assignee', sortable: true, width: 'w-36'},
    {id: 'issue_type', label: 'Type', sortable: true, width: 'w-24'},
    {id: 'updated_at', label: 'Updated', sortable: true, width: 'w-28'}
  ];

  // Priority badge variants
  const priorityVariants = {
    critical: 'error',
    high: 'warning',
    medium: 'secondary',
    low: 'default'
  };

  // Status badge variants
  const statusVariants = {
    backlog: 'default',
    ai_queue: 'primary',
    in_progress: 'primary',
    review: 'warning',
    done: 'success'
  };

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  }

  // Get column name by id
  function getColumnName(statusId) {
    const col = columns.find((c) => c.id === statusId);
    return col?.name || statusId;
  }

  // Handle sort click
  function handleSort(columnId) {
    pmState?.setSort?.(columnId);
  }

  // Handle row click - open issue modal
  function handleRowClick(issue) {
    pmState?.selectIssue?.(issue);
  }

  // Handle keyboard navigation
  function handleKeyDown(e, issue) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(issue);
    }
  }
</script>

<div class="list-view">
  <table class="data-table">
    <thead>
      <tr>
        {#each tableColumns as col}
          <th
            class={col.width}
            class:sortable={col.sortable}
            class:sorted={sortColumn === col.id}
            onclick={() => col.sortable && handleSort(col.id)}
            role={col.sortable ? 'button' : undefined}
            tabindex={col.sortable ? 0 : undefined}
            onkeydown={(e) => e.key === 'Enter' && col.sortable && handleSort(col.id)}
          >
            <div class="th-content">
              <span>{col.label}</span>
              {#if col.sortable}
                <span class="sort-icon">
                  {#if sortColumn === col.id}
                    {#if sortDirection === 'asc'}
                      <ChevronUp size={14} />
                    {:else}
                      <ChevronDown size={14} />
                    {/if}
                  {:else}
                    <ChevronDown size={14} class="opacity-30" />
                  {/if}
                </span>
              {/if}
            </div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each issues as issue (issue.id)}
        <tr
          class="task-row"
          onclick={() => handleRowClick(issue)}
          onkeydown={(e) => handleKeyDown(e, issue)}
          role="button"
          tabindex="0"
        >
          <!-- Title -->
          <td class="title-cell">
            <div class="title-wrapper">
              {#if issue.parent_id && issue.parent_title}
                <span class="parent-indicator" title="Subtask of #{issue.parent_issue_number}">
                  <CornerDownRight size={12} />
                </span>
              {/if}
              <span class="task-number">#{issue.task_number || issue.issue_number}</span>
              <span class="task-title">{issue.title}</span>
              {#if issue.children_count > 0}
                <span class="subtask-badge" title="{issue.children_count} subtask{issue.children_count > 1 ? 's' : ''}">
                  <ListTodo size={12} />
                  <span>{issue.children_count}</span>
                </span>
              {/if}
              {#if issue.ai_automatable}
                <span class="ai-badge" title="AI automatable">
                  <Bot size={12} />
                </span>
              {/if}
              {#if issue.source === 'feedback'}
                <span class="feedback-badge" title="From user feedback">
                  <MessageCircle size={12} />
                </span>
              {/if}
            </div>
          </td>

          <!-- Status -->
          <td>
            <Badge variant={statusVariants[issue.status] || 'default'} size="sm">
              {getColumnName(issue.status)}
            </Badge>
          </td>

          <!-- Priority -->
          <td>
            <Badge variant={priorityVariants[issue.priority] || 'default'} size="sm">
              {issue.priority || 'medium'}
            </Badge>
          </td>

          <!-- Assignee -->
          <td>
            {#if issue.assignee}
              <div class="assignee-cell">
                {#if issue.assignee === 'ai-agent'}
                  <span class="ai-assignee">
                    <Bot size={14} />
                    <span>AI Agent</span>
                  </span>
                {:else}
                  <Avatar
                    name={issue.assignee}
                    src={issue.assignee_avatar}
                    size="xs"
                  />
                  <span class="assignee-name">{issue.assignee}</span>
                {/if}
              </div>
            {:else}
              <span class="unassigned">Unassigned</span>
            {/if}
          </td>

          <!-- Type -->
          <td>
            <span class="type-label">{issue.issue_type || 'task'}</span>
          </td>

          <!-- Updated -->
          <td>
            <span class="date-label">{formatDate(issue.updated_at)}</span>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="6" class="empty-state">
            No tasks found
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="postcss">
  @reference '$theme';

  .list-view {
    @apply flex-1 overflow-auto p-4;
  }

  .data-table {
    @apply w-full border-collapse;
  }

  .data-table thead {
    @apply sticky top-0 z-10;
  }

  .data-table th {
    @apply bg-base01 text-left text-xs font-semibold text-base04 uppercase tracking-wide;
    @apply px-4 py-3 border-b border-border;
  }

  .data-table th.sortable {
    @apply cursor-pointer select-none;
    @apply hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .data-table th.sorted {
    @apply text-base0D;
  }

  .th-content {
    @apply flex items-center gap-1;
  }

  .sort-icon {
    @apply flex items-center;
  }

  .data-table td {
    @apply px-4 py-3 border-b border-border;
    @apply text-sm text-base05;
  }

  .task-row {
    @apply cursor-pointer;
    @apply hover:bg-base01;
    @apply transition-colors;
  }

  .task-row:focus-visible {
    @apply outline-none bg-base01;
    @apply ring-2 ring-base0D ring-inset;
  }

  .title-cell {
    @apply max-w-0;
  }

  .title-wrapper {
    @apply flex items-center gap-2;
    @apply overflow-hidden;
  }

  .parent-indicator {
    @apply flex-shrink-0 text-base04;
  }

  .task-number {
    @apply flex-shrink-0 text-base04 font-mono text-xs;
  }

  .task-title {
    @apply truncate text-base06 font-medium;
  }

  .subtask-badge {
    @apply flex items-center gap-0.5 flex-shrink-0;
    @apply text-base0E text-xs;
  }

  .ai-badge {
    @apply flex-shrink-0 text-base0E;
  }

  .feedback-badge {
    @apply flex-shrink-0 text-base04;
  }

  .assignee-cell {
    @apply flex items-center gap-2;
  }

  .ai-assignee {
    @apply flex items-center gap-1 text-base0E;
  }

  .assignee-name {
    @apply truncate text-base05;
  }

  .unassigned {
    @apply text-base04 italic;
  }

  .type-label {
    @apply text-base04 capitalize;
  }

  .date-label {
    @apply text-base04;
  }

  .empty-state {
    @apply text-center text-base04 py-12;
  }

  /* Make flex-1 work on th */
  .data-table th.flex-1,
  .data-table td:first-child {
    width: 100%;
  }
</style>
