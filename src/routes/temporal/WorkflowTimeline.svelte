<script>
  /**
   * WorkflowTimeline - Detailed view of a single workflow
   *
   * Features:
   * - Workflow metadata
   * - Progress visualization
   * - Event history timeline
   * - Action buttons (cancel, terminate)
   */

  import {X, Play, Check, AlertCircle, Clock, XCircle, Terminal, Activity, ChevronDown, ChevronUp} from '@lucide/svelte';

  let {
    workflow = null,
    history = [],
    onClose = () => {},
    onCancel = () => {},
    onTerminate = () => {}
  } = $props();

  // Confirmation state
  let confirmAction = $state(null); // 'cancel' | 'terminate'
  let terminateReason = $state('');
  let showHistory = $state(false);

  // Get status color
  function getStatusColor(status) {
    const colors = {
      RUNNING: 'base0D',
      COMPLETED: 'base0B',
      FAILED: 'base08',
      CANCELLED: 'base04',
      TERMINATED: 'base08',
      TIMED_OUT: 'base09'
    };
    return colors[status] || 'base04';
  }

  // Get status icon
  function getStatusIcon(status) {
    const icons = {
      RUNNING: Play,
      COMPLETED: Check,
      FAILED: AlertCircle,
      CANCELLED: XCircle,
      TERMINATED: XCircle,
      TIMED_OUT: Clock
    };
    return icons[status] || Clock;
  }

  // Format duration
  function formatDuration(ms) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  // Format date
  function formatDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  // Handle cancel
  function handleCancel() {
    if (confirmAction === 'cancel') {
      onCancel(workflow.workflow_id);
      confirmAction = null;
    } else {
      confirmAction = 'cancel';
    }
  }

  // Handle terminate
  function handleTerminate() {
    if (confirmAction === 'terminate') {
      onTerminate(workflow.workflow_id, terminateReason || 'Terminated via admin dashboard');
      confirmAction = null;
      terminateReason = '';
    } else {
      confirmAction = 'terminate';
    }
  }

  // Cancel confirmation
  function cancelConfirm() {
    confirmAction = null;
    terminateReason = '';
  }

  // Computed
  let isRunning = $derived(workflow?.status === 'RUNNING');
  let StatusIcon = $derived(getStatusIcon(workflow?.status));
</script>

{#if workflow}
  <div class="workflow-timeline">
    <!-- Header -->
    <header class="timeline-header">
      <div class="header-info">
        <h2 class="workflow-name">
          {workflow.friendly_name || workflow.workflow_type?.replace('Workflow', '')}
        </h2>
        <code class="workflow-id">{workflow.workflow_id}</code>
      </div>
      <button class="close-btn" onclick={onClose}>
        <X size={16} />
      </button>
    </header>

    <!-- Status Badge -->
    <div class="status-section">
      <div class="status-badge" style="--status-color: var(--color-{getStatusColor(workflow.status)})">
        <svelte:component this={StatusIcon} size={14} class={isRunning ? 'animate-spin' : ''} />
        <span>{workflow.status}</span>
      </div>

      {#if workflow.progress > 0 && isRunning}
        <div class="progress-bar">
          <div class="progress-fill" style="width: {workflow.progress}%"></div>
        </div>
        <span class="progress-text">{workflow.progress}%</span>
      {/if}
    </div>

    <!-- Current Step -->
    {#if workflow.current_step && isRunning}
      <div class="current-step">
        <Activity size={14} />
        <span>{workflow.current_step}</span>
      </div>
    {/if}

    <!-- Metadata -->
    <div class="metadata-grid">
      <div class="meta-item">
        <span class="meta-label">Type</span>
        <span class="meta-value">{workflow.workflow_type}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Task Queue</span>
        <span class="meta-value">{workflow.task_queue || '-'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Started</span>
        <span class="meta-value">{formatDate(workflow.start_time)}</span>
      </div>
      {#if workflow.close_time}
        <div class="meta-item">
          <span class="meta-label">Completed</span>
          <span class="meta-value">{formatDate(workflow.close_time)}</span>
        </div>
      {/if}
      <div class="meta-item">
        <span class="meta-label">Duration</span>
        <span class="meta-value">{formatDuration(workflow.execution_time_ms)}</span>
      </div>
    </div>

    <!-- Steps Completed -->
    {#if workflow.steps_completed?.length > 0}
      <div class="steps-section">
        <h3 class="section-title">Steps Completed</h3>
        <div class="steps-list">
          {#each workflow.steps_completed as step, i}
            <div class="step-item">
              <Check size={12} class="text-base0B" />
              <span>{step}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Event History -->
    {#if history?.length > 0}
      <div class="history-section">
        <button class="section-toggle" onclick={() => (showHistory = !showHistory)}>
          <Terminal size={14} />
          <span>Event History ({history.length})</span>
          {#if showHistory}
            <ChevronUp size={14} />
          {:else}
            <ChevronDown size={14} />
          {/if}
        </button>

        {#if showHistory}
          <div class="history-list">
            {#each history.slice(0, 20) as event}
              <div class="history-item">
                <span class="event-id">#{event.event_id}</span>
                <span class="event-type">{event.event_type}</span>
                <span class="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            {/each}
            {#if history.length > 20}
              <div class="history-more">
                +{history.length - 20} more events
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Actions -->
    {#if isRunning}
      <div class="actions-section">
        {#if confirmAction === 'cancel'}
          <div class="confirm-box">
            <p>Cancel this workflow?</p>
            <div class="confirm-actions">
              <button class="btn-danger" onclick={handleCancel}>Confirm Cancel</button>
              <button class="btn-ghost" onclick={cancelConfirm}>No, go back</button>
            </div>
          </div>
        {:else if confirmAction === 'terminate'}
          <div class="confirm-box">
            <p>Terminate this workflow? (force stop)</p>
            <input
              type="text"
              class="terminate-input"
              placeholder="Reason (optional)"
              bind:value={terminateReason}
            />
            <div class="confirm-actions">
              <button class="btn-danger" onclick={handleTerminate}>Confirm Terminate</button>
              <button class="btn-ghost" onclick={cancelConfirm}>No, go back</button>
            </div>
          </div>
        {:else}
          <div class="action-buttons">
            <button class="btn-warning" onclick={handleCancel}>
              <XCircle size={14} />
              Cancel
            </button>
            <button class="btn-danger" onclick={handleTerminate}>
              <Terminal size={14} />
              Terminate
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .workflow-timeline {
    @apply flex flex-col h-full overflow-y-auto;
  }

  /* Header */
  .timeline-header {
    @apply flex items-start justify-between p-4 border-b;
    border-color: var(--color-base02);
  }

  .header-info {
    @apply flex flex-col gap-1;
  }

  .workflow-name {
    @apply text-base font-semibold;
    color: var(--color-base06);
  }

  .workflow-id {
    @apply text-xs px-2 py-0.5 rounded;
    background: var(--color-base02);
    color: var(--color-base04);
    font-family: 'JetBrains Mono', monospace;
  }

  .close-btn {
    @apply p-1.5 rounded transition-colors;
    color: var(--color-base04);
  }

  .close-btn:hover {
    background: var(--color-base02);
    color: var(--color-base06);
  }

  /* Status */
  .status-section {
    @apply flex items-center gap-3 px-4 py-3 border-b;
    border-color: var(--color-base02);
  }

  .status-badge {
    @apply flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium;
    background: color-mix(in srgb, var(--status-color) 15%, transparent);
    color: var(--status-color);
  }

  .progress-bar {
    @apply flex-1 h-1.5 rounded-full overflow-hidden;
    background: var(--color-base02);
  }

  .progress-fill {
    @apply h-full rounded-full transition-all;
    background: var(--color-base0D);
  }

  .progress-text {
    @apply text-xs font-medium;
    color: var(--color-base0D);
  }

  /* Current Step */
  .current-step {
    @apply flex items-center gap-2 px-4 py-2 text-xs;
    background: rgba(var(--color-base0D-rgb, 100, 150, 255), 0.1);
    color: var(--color-base0D);
  }

  /* Metadata */
  .metadata-grid {
    @apply grid grid-cols-2 gap-3 p-4 border-b;
    border-color: var(--color-base02);
  }

  .meta-item {
    @apply flex flex-col gap-0.5;
  }

  .meta-label {
    @apply text-xs;
    color: var(--color-base04);
  }

  .meta-value {
    @apply text-sm truncate;
    color: var(--color-base06);
  }

  /* Steps */
  .steps-section {
    @apply p-4 border-b;
    border-color: var(--color-base02);
  }

  .section-title {
    @apply text-xs font-medium uppercase mb-2;
    color: var(--color-base04);
  }

  .steps-list {
    @apply flex flex-col gap-1;
  }

  .step-item {
    @apply flex items-center gap-2 text-sm;
    color: var(--color-base05);
  }

  /* History */
  .history-section {
    @apply p-4 border-b;
    border-color: var(--color-base02);
  }

  .section-toggle {
    @apply flex items-center gap-2 w-full text-xs font-medium;
    color: var(--color-base05);
  }

  .section-toggle:hover {
    color: var(--color-base06);
  }

  .history-list {
    @apply mt-2 flex flex-col gap-1;
  }

  .history-item {
    @apply flex items-center gap-2 text-xs py-1;
  }

  .event-id {
    @apply font-mono;
    color: var(--color-base04);
  }

  .event-type {
    @apply flex-1 truncate;
    color: var(--color-base05);
  }

  .event-time {
    color: var(--color-base04);
  }

  .history-more {
    @apply text-xs py-2 text-center;
    color: var(--color-base04);
  }

  /* Actions */
  .actions-section {
    @apply p-4 mt-auto;
    border-top: 1px solid var(--color-base02);
  }

  .action-buttons {
    @apply flex gap-2;
  }

  .btn-warning,
  .btn-danger,
  .btn-ghost {
    @apply flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors;
  }

  .btn-warning {
    background: rgba(var(--color-base0A-rgb, 255, 200, 50), 0.1);
    color: var(--color-base0A);
  }

  .btn-warning:hover {
    background: rgba(var(--color-base0A-rgb, 255, 200, 50), 0.2);
  }

  .btn-danger {
    background: rgba(var(--color-base08-rgb, 255, 100, 100), 0.1);
    color: var(--color-base08);
  }

  .btn-danger:hover {
    background: rgba(var(--color-base08-rgb, 255, 100, 100), 0.2);
  }

  .btn-ghost {
    color: var(--color-base05);
  }

  .btn-ghost:hover {
    background: var(--color-base02);
  }

  /* Confirm Box */
  .confirm-box {
    @apply flex flex-col gap-2;
  }

  .confirm-box p {
    @apply text-sm;
    color: var(--color-base06);
  }

  .terminate-input {
    @apply w-full px-3 py-1.5 rounded border text-sm;
    background: var(--color-base00);
    border-color: var(--color-base02);
    color: var(--color-base06);
  }

  .terminate-input:focus {
    outline: none;
    border-color: var(--color-base08);
  }

  .confirm-actions {
    @apply flex gap-2 mt-1;
  }
</style>
