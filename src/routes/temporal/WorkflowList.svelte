<script>
  /**
   * WorkflowList - Displays list of workflows with status indicators
   *
   * Features:
   * - Status-based coloring
   * - Click to select
   * - Loading state
   * - Empty state
   */

  import {Play, Check, X, Clock, AlertCircle, Loader2, Package, UserPlus, HeartPulse, Database, Upload} from '@lucide/svelte';

  let {workflows = [], selectedId = null, onSelect = () => {}, isLoading = false} = $props();

  // Get icon for workflow type
  function getWorkflowIcon(type) {
    const icons = {
      ProductGenerationWorkflow: Package,
      TeamOnboardingWorkflow: UserPlus,
      HealthCheckWorkflow: HeartPulse,
      CatalogIngestionWorkflow: Database,
      BulkImportWorkflow: Upload
    };
    return icons[type] || Play;
  }

  // Get status icon
  function getStatusIcon(status) {
    const icons = {
      RUNNING: Loader2,
      COMPLETED: Check,
      FAILED: AlertCircle,
      CANCELLED: X,
      TERMINATED: X,
      TIMED_OUT: Clock
    };
    return icons[status] || Clock;
  }

  // Get status color class
  function getStatusClass(status) {
    const classes = {
      RUNNING: 'status-running',
      COMPLETED: 'status-completed',
      FAILED: 'status-failed',
      CANCELLED: 'status-cancelled',
      TERMINATED: 'status-failed',
      TIMED_OUT: 'status-failed'
    };
    return classes[status] || '';
  }

  // Format duration
  function formatDuration(ms) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  // Format time ago
  function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
</script>

<div class="workflow-list">
  <div class="list-header">
    <h2 class="list-title">Workflows</h2>
    <span class="list-count">{workflows?.length || 0}</span>
  </div>

  <div class="list-content">
    {#if isLoading}
      <div class="list-loading">
        <Loader2 size={24} class="animate-spin text-base04" />
        <span>Loading workflows...</span>
      </div>
    {:else if !workflows?.length}
      <div class="list-empty">
        <Play size={24} class="text-base03" />
        <span>No workflows found</span>
      </div>
    {:else}
      {#each workflows as workflow (workflow.workflow_id)}
        {@const WorkflowIcon = getWorkflowIcon(workflow.workflow_type)}
        {@const StatusIcon = getStatusIcon(workflow.status)}
        {@const isSelected = selectedId === workflow.workflow_id}
        {@const isRunning = workflow.status === 'RUNNING'}

        <button
          class="workflow-item"
          class:selected={isSelected}
          class:running={isRunning}
          onclick={() => onSelect(workflow)}
        >
          <div class="workflow-icon">
            <WorkflowIcon size={16} />
          </div>

          <div class="workflow-info">
            <div class="workflow-name">
              {workflow.friendly_name || workflow.workflow_type?.replace('Workflow', '')}
            </div>
            <div class="workflow-id">{workflow.workflow_id.slice(-12)}</div>
          </div>

          <div class="workflow-meta">
            <div class="workflow-status {getStatusClass(workflow.status)}">
              <StatusIcon size={12} class={isRunning ? 'animate-spin' : ''} />
              <span>{workflow.status}</span>
            </div>
            <div class="workflow-time">
              {formatTimeAgo(workflow.start_time)}
            </div>
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .workflow-list {
    @apply flex flex-col h-full;
  }

  .list-header {
    @apply flex items-center justify-between px-4 py-3 border-b;
    border-color: var(--color-base02);
  }

  .list-title {
    @apply text-sm font-medium;
    color: var(--color-base06);
  }

  .list-count {
    @apply px-2 py-0.5 rounded text-xs font-medium;
    background: var(--color-base02);
    color: var(--color-base04);
  }

  .list-content {
    @apply flex-1 overflow-y-auto;
  }

  .list-loading,
  .list-empty {
    @apply flex flex-col items-center justify-center gap-3 py-12;
    color: var(--color-base04);
  }

  .list-loading span,
  .list-empty span {
    @apply text-sm;
  }

  /* Workflow Item */
  .workflow-item {
    @apply flex items-center gap-3 w-full px-4 py-3 text-left transition-colors border-b;
    border-color: var(--color-base02);
    background: transparent;
  }

  .workflow-item:hover {
    background: var(--color-base02);
  }

  .workflow-item.selected {
    background: rgba(var(--color-base0D-rgb, 100, 150, 255), 0.1);
    border-left: 2px solid var(--color-base0D);
  }

  .workflow-item.running {
    border-left: 2px solid var(--color-base0D);
  }

  .workflow-icon {
    @apply flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0;
    background: var(--color-base02);
    color: var(--color-base05);
  }

  .workflow-info {
    @apply flex-1 min-w-0;
  }

  .workflow-name {
    @apply text-sm font-medium truncate;
    color: var(--color-base06);
  }

  .workflow-id {
    @apply text-xs truncate;
    color: var(--color-base04);
    font-family: 'JetBrains Mono', monospace;
  }

  .workflow-meta {
    @apply flex flex-col items-end gap-1 flex-shrink-0;
  }

  .workflow-status {
    @apply flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium;
    background: var(--color-base02);
    color: var(--color-base05);
  }

  .workflow-status.status-running {
    background: rgba(var(--color-base0D-rgb, 100, 150, 255), 0.1);
    color: var(--color-base0D);
  }

  .workflow-status.status-completed {
    background: rgba(var(--color-base0B-rgb, 0, 200, 100), 0.1);
    color: var(--color-base0B);
  }

  .workflow-status.status-failed {
    background: rgba(var(--color-base08-rgb, 255, 100, 100), 0.1);
    color: var(--color-base08);
  }

  .workflow-status.status-cancelled {
    background: var(--color-base02);
    color: var(--color-base04);
  }

  .workflow-time {
    @apply text-xs;
    color: var(--color-base04);
  }
</style>
