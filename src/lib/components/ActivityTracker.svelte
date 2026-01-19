<script>
  /**
   * ActivityTracker - Floating card showing active Temporal processes
   *
   * Stripe-style floating card that appears when there are active processes.
   * Shows real-time progress updates via SSE/polling.
   *
   * Behavior:
   * - Appears in bottom-right when leaving /temporal with active processes
   * - Minimizes to small pill when collapsed
   * - Auto-expands on new process or completion
   * - Persists across navigation until all complete
   */

  import {getContext, onMount, onDestroy} from 'svelte';
  import {page} from '$app/stores';
  import {Activity, X, Minus, ChevronRight, Check, AlertCircle, Clock, Loader2} from '@lucide/svelte';

  // Get temporal state from context
  const temporalState = getContext('temporalState');

  // Check if we should show the tracker
  // Show when: not on /temporal page AND (has active OR has recently completed)
  let shouldShow = $derived(
    !$page.url.pathname.startsWith('/temporal') &&
      (temporalState?.hasActive || temporalState?.completedRecently?.length > 0)
  );

  // Format duration from start time
  function formatDuration(startTime) {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const seconds = Math.floor((now - start) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  // Format workflow name for display
  function formatWorkflowName(process) {
    return process.friendly_name || process.type?.replace('Workflow', '') || 'Process';
  }

  // Get status icon
  function getStatusIcon(status) {
    switch (status) {
      case 'COMPLETED':
        return Check;
      case 'FAILED':
      case 'TERMINATED':
      case 'TIMED_OUT':
        return AlertCircle;
      case 'RUNNING':
        return Loader2;
      default:
        return Clock;
    }
  }

  // Track time for duration updates
  let tickInterval = null;
  let tick = $state(0);

  // Track if we initiated the stream connection (to clean it up properly)
  let initiatedStream = false;

  onMount(() => {
    // Connect to SSE stream when mounted
    if (temporalState) {
      temporalState.fetchActiveProcesses();
      temporalState.connectToActiveStream();
      initiatedStream = true;
    }

    // Update durations every second
    tickInterval = setInterval(() => {
      tick++;
    }, 1000);
  });

  onDestroy(() => {
    // Clear the tick interval
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }

    // Only disconnect the SSE stream if there are no active processes
    // If there are active processes and we're navigating to /temporal,
    // the temporal page will manage the connection
    // If there are no active processes, we should clean up
    if (initiatedStream && temporalState && !temporalState.hasActive) {
      temporalState.disconnectStream();
    }
  });
</script>

{#if temporalState && shouldShow}
  <div class="activity-tracker" class:collapsed={!temporalState.trackerExpanded}>
    {#if temporalState.trackerExpanded}
      <!-- Expanded view -->
      <header class="tracker-header">
        <div class="header-left">
          <Activity size={14} class="text-base0D" />
          <span class="header-title">{temporalState.activeCount} Active Process{temporalState.activeCount !== 1 ? 'es' : ''}</span>
        </div>
        <div class="header-actions">
          <button class="action-btn" onclick={() => temporalState.toggleTracker()} title="Minimize">
            <Minus size={14} />
          </button>
          <button class="action-btn" onclick={() => temporalState.hideTracker()} title="Close">
            <X size={14} />
          </button>
        </div>
      </header>

      <div class="tracker-list">
        {#each temporalState.activeProcesses as process (process.id)}
          {@const isCompleted = process.status === 'COMPLETED'}
          {@const isFailed = ['FAILED', 'TERMINATED', 'TIMED_OUT'].includes(process.status)}
          {@const isRunning = process.status === 'RUNNING'}
          {@const StatusIcon = getStatusIcon(process.status)}

          <div
            class="tracker-item"
            class:completed={isCompleted}
            class:failed={isFailed}
            class:running={isRunning}
          >
            <div class="item-status">
              {#if isRunning}
                <span class="status-dot running"></span>
              {:else if isCompleted}
                <Check size={12} class="text-base0B" />
              {:else if isFailed}
                <AlertCircle size={12} class="text-base08" />
              {:else}
                <span class="status-dot queued"></span>
              {/if}
            </div>

            <div class="item-content">
              <span class="item-name" class:strikethrough={isCompleted}>
                {formatWorkflowName(process)}
              </span>
              {#if process.current_step && isRunning}
                <span class="item-step">{process.current_step}</span>
              {/if}
            </div>

            <div class="item-meta">
              {#if process.progress > 0 && isRunning}
                <span class="item-progress">{process.progress}%</span>
              {/if}
              <span class="item-duration" class:muted={!isRunning}>
                {formatDuration(process.start_time)}
              </span>
            </div>
          </div>
        {/each}

        {#if temporalState.activeProcesses.length === 0}
          <div class="tracker-empty">
            <Check size={16} class="text-base0B" />
            <span>All processes complete</span>
          </div>
        {/if}
      </div>

      <a href="/temporal" class="tracker-link">
        View all processes
        <ChevronRight size={14} />
      </a>
    {:else}
      <!-- Collapsed pill -->
      <button class="tracker-pill" onclick={() => temporalState.toggleTracker()}>
        <span class="pulse-dot"></span>
        <span class="pill-text">{temporalState.activeCount} process{temporalState.activeCount !== 1 ? 'es' : ''}</span>
      </button>
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .activity-tracker {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    background: var(--color-base01);
    border: 1px solid var(--color-base02);
    border-radius: var(--radius-lg, 12px);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.05);
    z-index: 1000;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .activity-tracker.collapsed {
    width: auto;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* Header */
  .tracker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-base02);
    background: var(--color-base00);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-base06);
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    color: var(--color-base04);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--color-base02);
    color: var(--color-base06);
  }

  /* List */
  .tracker-list {
    padding: 8px 0;
    max-height: 240px;
    overflow-y: auto;
  }

  .tracker-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    transition: all 0.15s ease;
  }

  .tracker-item.completed {
    opacity: 0.6;
  }

  .tracker-item.failed {
    background: rgba(var(--color-base08-rgb), 0.05);
  }

  .item-status {
    flex-shrink: 0;
    width: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-base04);
  }

  .status-dot.running {
    background: var(--color-base0D);
    animation: pulse 2s infinite;
  }

  .status-dot.queued {
    background: var(--color-base03);
    border: 1px solid var(--color-base04);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.9);
    }
  }

  .item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-name {
    font-size: 13px;
    color: var(--color-base06);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-name.strikethrough {
    text-decoration: line-through;
    color: var(--color-base04);
  }

  .item-step {
    font-size: 11px;
    color: var(--color-base04);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-meta {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--color-base04);
  }

  .item-progress {
    font-weight: 500;
    color: var(--color-base0D);
  }

  .item-duration {
    font-variant-numeric: tabular-nums;
  }

  .item-duration.muted {
    color: var(--color-base03);
  }

  /* Empty state */
  .tracker-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    font-size: 13px;
    color: var(--color-base04);
  }

  /* Link */
  .tracker-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px;
    font-size: 12px;
    color: var(--color-base0D);
    text-decoration: none;
    border-top: 1px solid var(--color-base02);
    transition: all 0.15s ease;
  }

  .tracker-link:hover {
    background: var(--color-base02);
    color: var(--color-base07);
  }

  /* Collapsed pill */
  .tracker-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--color-base01);
    border: 1px solid var(--color-base02);
    border-radius: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tracker-pill:hover {
    background: var(--color-base02);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-base0D);
    animation: pulse 2s infinite;
  }

  .pill-text {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-base06);
  }
</style>
