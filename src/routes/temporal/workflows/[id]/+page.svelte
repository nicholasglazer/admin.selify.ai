<script>
  /**
   * Workflow Detail Page - Full-page view of a single workflow
   *
   * Direct link to view workflow details, useful for:
   * - Sharing workflow URLs
   * - Deep linking from notifications
   * - Detailed debugging
   */

  import {getContext, onMount, onDestroy} from 'svelte';
  import {goto} from '$app/navigation';
  import {
    ArrowLeft,
    Play,
    Check,
    AlertCircle,
    Clock,
    XCircle,
    Terminal,
    Activity,
    RefreshCw,
    ExternalLink,
    Copy
  } from '@lucide/svelte';

  let {data} = $props();

  const temporalState = getContext('temporalState');
  const toastState = getContext('toastState');

  // Local state for live updates
  let workflow = $state(data.workflow);
  let history = $state(data.history);
  let isRefreshing = $state(false);

  // SSE connection for live updates
  let eventSource = null;

  onMount(() => {
    // Connect to SSE for live updates if workflow is running
    if (workflow?.status === 'RUNNING') {
      connectToStream();
    }
  });

  onDestroy(() => {
    if (eventSource) {
      eventSource.close();
    }
  });

  function connectToStream() {
    if (typeof EventSource === 'undefined') return;

    eventSource = new EventSource(
      `${data.apiBaseUrl}/api/temporal/workflows/${workflow.workflow_id}/stream`,
      {withCredentials: true}
    );

    eventSource.addEventListener('progress', (e) => {
      const update = JSON.parse(e.data);
      workflow = {
        ...workflow,
        status: update.status,
        progress: update.progress,
        current_step: update.current_step
      };
    });

    eventSource.addEventListener('complete', (e) => {
      const update = JSON.parse(e.data);
      workflow = {...workflow, status: 'COMPLETED'};
      eventSource?.close();
    });

    eventSource.addEventListener('error', (e) => {
      try {
        const update = JSON.parse(e.data);
        workflow = {...workflow, status: update.status || 'FAILED'};
      } catch {
        // Connection error, not a workflow error
      }
      eventSource?.close();
    });
  }

  // Refresh data
  async function refresh() {
    isRefreshing = true;
    try {
      const [detailsRes, historyRes] = await Promise.all([
        fetch(`${data.apiBaseUrl}/api/temporal/workflows/${workflow.workflow_id}`, {
          credentials: 'include'
        }),
        fetch(`${data.apiBaseUrl}/api/temporal/workflows/${workflow.workflow_id}/history`, {
          credentials: 'include'
        })
      ]);

      if (detailsRes.ok) {
        workflow = await detailsRes.json();
      }
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        history = historyData.events || [];
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      isRefreshing = false;
    }
  }

  // Cancel workflow
  async function handleCancel() {
    if (!confirm('Cancel this workflow?')) return;

    try {
      await temporalState?.cancelWorkflow(workflow.workflow_id);
      workflow = {...workflow, status: 'CANCELLED'};
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  }

  // Terminate workflow
  async function handleTerminate() {
    const reason = prompt('Reason for termination (optional):');
    if (reason === null) return; // User cancelled prompt

    try {
      await temporalState?.terminateWorkflow(workflow.workflow_id, reason || undefined);
      workflow = {...workflow, status: 'TERMINATED'};
    } catch (err) {
      console.error('Failed to terminate:', err);
    }
  }

  // Copy workflow ID
  function copyWorkflowId() {
    navigator.clipboard.writeText(workflow.workflow_id);
    toastState?.show({
      title: 'Copied',
      message: 'Workflow ID copied to clipboard',
      type: 'success',
      duration: 2000
    });
  }

  // Helpers
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

  function formatDuration(ms) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  function formatDate(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString();
  }

  // Computed
  let isRunning = $derived(workflow?.status === 'RUNNING');
  let StatusIcon = $derived(getStatusIcon(workflow?.status));
</script>

<div class="page-flex">
  <!-- Header -->
  <header class="detail-header">
    <div class="header-nav">
      <button class="back-btn" onclick={() => goto('/temporal')}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>
    </div>

    <div class="header-main">
      <div class="header-info">
        <h1 class="workflow-title">
          {workflow.friendly_name || workflow.workflow_type?.replace('Workflow', '')}
        </h1>
        <div class="workflow-id-row">
          <code class="workflow-id">{workflow.workflow_id}</code>
          <button class="copy-btn" onclick={copyWorkflowId} title="Copy ID">
            <Copy size={12} />
          </button>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn-ghost" onclick={refresh} disabled={isRefreshing}>
          <RefreshCw size={16} class={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
        {#if isRunning}
          <button class="btn-warning" onclick={handleCancel}>
            <XCircle size={16} />
            Cancel
          </button>
          <button class="btn-danger" onclick={handleTerminate}>
            <Terminal size={16} />
            Terminate
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Status Banner -->
  <div class="status-banner" style="--status-color: var(--color-{getStatusColor(workflow.status)})">
    <div class="status-main">
      <svelte:component this={StatusIcon} size={20} class={isRunning ? 'animate-spin' : ''} />
      <span class="status-text">{workflow.status}</span>
    </div>

    {#if isRunning && workflow.progress > 0}
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {workflow.progress}%"></div>
        </div>
        <span class="progress-text">{workflow.progress}%</span>
      </div>
    {/if}

    {#if workflow.current_step && isRunning}
      <div class="current-step">
        <Activity size={14} />
        <span>{workflow.current_step}</span>
      </div>
    {/if}
  </div>

  <!-- Content Grid -->
  <div class="content-grid">
    <!-- Metadata Card -->
    <div class="card">
      <h2 class="card-title">Details</h2>
      <div class="metadata-list">
        <div class="meta-row">
          <span class="meta-label">Workflow Type</span>
          <span class="meta-value">{workflow.workflow_type}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Task Queue</span>
          <span class="meta-value">{workflow.task_queue || '-'}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Started</span>
          <span class="meta-value">{formatDate(workflow.start_time)}</span>
        </div>
        {#if workflow.close_time}
          <div class="meta-row">
            <span class="meta-label">Completed</span>
            <span class="meta-value">{formatDate(workflow.close_time)}</span>
          </div>
        {/if}
        <div class="meta-row">
          <span class="meta-label">Duration</span>
          <span class="meta-value">{formatDuration(workflow.execution_time_ms)}</span>
        </div>
        {#if workflow.total_steps}
          <div class="meta-row">
            <span class="meta-label">Total Steps</span>
            <span class="meta-value">{workflow.total_steps}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Steps Card -->
    {#if workflow.steps_completed?.length > 0}
      <div class="card">
        <h2 class="card-title">Completed Steps</h2>
        <div class="steps-list">
          {#each workflow.steps_completed as step, i}
            <div class="step-item">
              <span class="step-number">{i + 1}</span>
              <Check size={12} class="text-base0B" />
              <span class="step-name">{step}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- History Card -->
    <div class="card history-card">
      <h2 class="card-title">Event History</h2>
      {#if history?.length > 0}
        <div class="history-list">
          {#each history as event}
            <div class="history-item">
              <span class="event-id">#{event.event_id}</span>
              <span class="event-type">{event.event_type}</span>
              <span class="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-text">No events recorded yet</p>
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  /* Header */
  .detail-header {
    @apply mb-6;
  }

  .header-nav {
    @apply mb-4;
  }

  .back-btn {
    @apply flex items-center gap-2 text-sm transition-colors;
    color: var(--color-base04);
  }

  .back-btn:hover {
    color: var(--color-base06);
  }

  .header-main {
    @apply flex items-start justify-between gap-4;
  }

  .header-info {
    @apply flex flex-col gap-2;
  }

  .workflow-title {
    @apply text-2xl font-semibold;
    color: var(--color-base06);
  }

  .workflow-id-row {
    @apply flex items-center gap-2;
  }

  .workflow-id {
    @apply text-sm px-2 py-1 rounded;
    background: var(--color-base01);
    color: var(--color-base04);
    font-family: 'JetBrains Mono', monospace;
  }

  .copy-btn {
    @apply p-1 rounded transition-colors;
    color: var(--color-base04);
  }

  .copy-btn:hover {
    background: var(--color-base02);
    color: var(--color-base06);
  }

  .header-actions {
    @apply flex items-center gap-2;
  }

  /* Buttons */
  .btn-ghost,
  .btn-warning,
  .btn-danger {
    @apply flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors;
  }

  .btn-ghost {
    background: var(--color-base01);
    color: var(--color-base05);
  }

  .btn-ghost:hover {
    background: var(--color-base02);
    color: var(--color-base06);
  }

  .btn-ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  /* Status Banner */
  .status-banner {
    @apply flex items-center gap-6 p-4 rounded-lg mb-6;
    background: color-mix(in srgb, var(--status-color) 10%, var(--color-base01));
    border: 1px solid color-mix(in srgb, var(--status-color) 30%, var(--color-base02));
  }

  .status-main {
    @apply flex items-center gap-2;
    color: var(--status-color);
  }

  .status-text {
    @apply text-lg font-semibold;
  }

  .progress-section {
    @apply flex items-center gap-3 flex-1;
  }

  .progress-bar {
    @apply flex-1 h-2 rounded-full max-w-xs;
    background: var(--color-base02);
  }

  .progress-fill {
    @apply h-full rounded-full transition-all;
    background: var(--status-color);
  }

  .progress-text {
    @apply text-sm font-medium;
    color: var(--status-color);
  }

  .current-step {
    @apply flex items-center gap-2 text-sm;
    color: var(--color-base05);
  }

  /* Content Grid */
  .content-grid {
    @apply grid gap-5;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .card {
    @apply p-4 rounded-lg;
    background: var(--color-base01);
  }

  .card-title {
    @apply text-sm font-medium uppercase mb-4;
    color: var(--color-base04);
  }

  .history-card {
    grid-column: 1 / -1;
  }

  /* Metadata */
  .metadata-list {
    @apply flex flex-col gap-3;
  }

  .meta-row {
    @apply flex justify-between items-center;
  }

  .meta-label {
    @apply text-sm;
    color: var(--color-base04);
  }

  .meta-value {
    @apply text-sm font-medium;
    color: var(--color-base06);
  }

  /* Steps */
  .steps-list {
    @apply flex flex-col gap-2;
  }

  .step-item {
    @apply flex items-center gap-2 text-sm;
  }

  .step-number {
    @apply w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium;
    background: var(--color-base02);
    color: var(--color-base04);
  }

  .step-name {
    color: var(--color-base05);
  }

  /* History */
  .history-list {
    @apply flex flex-col gap-1 max-h-64 overflow-y-auto;
  }

  .history-item {
    @apply flex items-center gap-3 py-1.5 px-2 rounded text-sm;
  }

  .history-item:hover {
    background: var(--color-base02);
  }

  .event-id {
    @apply w-12 font-mono text-xs;
    color: var(--color-base04);
  }

  .event-type {
    @apply flex-1 truncate;
    color: var(--color-base05);
  }

  .event-time {
    @apply text-xs;
    color: var(--color-base04);
  }

  .empty-text {
    @apply text-sm text-center py-4;
    color: var(--color-base04);
  }
</style>
