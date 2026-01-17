<script>
  import {getContext} from 'svelte';
  import {Badge} from '@miozu/jera';

  const qaState = getContext('qaState');

  let runs = $derived(qaState.runs);
  let activeRun = $derived(qaState.activeRun);

  const statusVariants = {
    queued: 'default',
    running: 'warning',
    passed: 'success',
    failed: 'error',
    healed: 'primary',
    cancelled: 'default',
    error: 'error'
  };

  const statusIcons = {
    queued: 'clock',
    running: 'loader',
    passed: 'check-circle',
    failed: 'x-circle',
    healed: 'heart',
    cancelled: 'slash',
    error: 'alert-triangle'
  };

  function formatDuration(ms) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  function getPassRate(run) {
    if (!run.total_specs || run.total_specs === 0) return 0;
    return Math.round((run.passed_count / run.total_specs) * 100);
  }
</script>

<div class="run-list-container">
  <!-- Quick Actions -->
  <div class="quick-actions">
    <button
      class="action-btn primary"
      onclick={() => qaState.startRun({environment: 'staging'})}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      Run All (Staging)
    </button>
    <button
      class="action-btn"
      onclick={() => qaState.startRun({environment: 'production'})}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      Run All (Production)
    </button>
    <button class="action-btn" onclick={() => qaState.refreshRuns()}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
      Refresh
    </button>
  </div>

  <!-- Active Run Banner -->
  {#if activeRun && (activeRun.status === 'queued' || activeRun.status === 'running')}
    <div class="active-run-banner">
      <div class="active-run-info">
        <div class="pulse-dot"></div>
        <span class="active-run-label">Run #{activeRun.run_number} in progress</span>
        <Badge variant="warning" size="sm">{activeRun.status}</Badge>
      </div>
      <button class="cancel-btn" onclick={() => qaState.cancelRun(activeRun.id)}>
        Cancel
      </button>
    </div>
  {/if}

  <!-- Runs Table -->
  <div class="runs-table-container">
    <table class="runs-table">
      <thead>
        <tr>
          <th>Run</th>
          <th>Status</th>
          <th>Target</th>
          <th>Results</th>
          <th>Pass Rate</th>
          <th>Duration</th>
          <th>Started</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each runs as run (run.id)}
          {@const passRate = getPassRate(run)}
          <tr class="run-row" class:active={activeRun?.id === run.id}>
            <td>
              <span class="run-number">#{run.run_number}</span>
              {#if run.trigger_ref}
                <span class="run-ref">{run.trigger_ref}</span>
              {/if}
            </td>
            <td>
              <Badge variant={statusVariants[run.status]} size="sm">{run.status}</Badge>
            </td>
            <td>
              <span class="target-app">{run.target_app || 'All'}</span>
              <span class="environment">{run.environment}</span>
            </td>
            <td>
              <div class="results-row">
                <span class="result passed">{run.passed_count || 0}</span>
                <span class="result failed">{run.failed_count || 0}</span>
                {#if run.healed_count > 0}
                  <span class="result healed">{run.healed_count}</span>
                {/if}
                <span class="result total">/ {run.total_specs || 0}</span>
              </div>
            </td>
            <td>
              <div class="pass-rate-cell">
                <div class="pass-rate-bar">
                  <div
                    class="pass-rate-fill"
                    class:good={passRate >= 80}
                    class:warning={passRate >= 50 && passRate < 80}
                    class:bad={passRate < 50}
                    style="width: {passRate}%"
                  ></div>
                </div>
                <span class="pass-rate-value">{passRate}%</span>
              </div>
            </td>
            <td>
              <span class="duration">{formatDuration(run.duration_ms)}</span>
            </td>
            <td>
              <span class="date">{formatDate(run.created_at)}</span>
            </td>
            <td>
              <button class="view-btn" onclick={() => qaState.selectRun(run)}>
                View
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p>No test runs yet. Start your first run above.</p>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .run-list-container {
    @apply flex flex-col gap-4;
  }

  /* Quick Actions */
  .quick-actions {
    @apply flex flex-wrap gap-3;
  }

  .action-btn {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base02 text-base06 rounded-lg;
    @apply text-sm font-medium;
    @apply hover:bg-base03 transition-colors;
  }

  .action-btn.primary {
    @apply bg-base0D text-white hover:bg-base0D/90;
  }

  /* Active Run Banner */
  .active-run-banner {
    @apply flex items-center justify-between p-4;
    @apply bg-base0A/10 border border-base0A/30 rounded-xl;
  }

  .active-run-info {
    @apply flex items-center gap-3;
  }

  .pulse-dot {
    @apply w-3 h-3 bg-base0A rounded-full;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .active-run-label {
    @apply text-sm font-medium text-base06;
  }

  .cancel-btn {
    @apply px-3 py-1 text-sm text-base08 hover:text-base08/80;
    @apply transition-colors;
  }

  /* Runs Table */
  .runs-table-container {
    @apply bg-base01 rounded-xl border border-base02 overflow-hidden;
  }

  .runs-table {
    @apply w-full;
    border-collapse: collapse;
  }

  .runs-table th {
    @apply px-4 py-3 text-left text-xs font-medium text-base04 uppercase;
    @apply bg-base02/50 border-b border-base02;
  }

  .runs-table td {
    @apply px-4 py-3 text-sm border-b border-base02;
  }

  .run-row:hover {
    @apply bg-base02/30;
  }

  .run-row.active {
    @apply bg-base0A/5;
  }

  .run-number {
    @apply font-mono font-medium text-base06;
  }

  .run-ref {
    @apply ml-2 text-xs text-base04;
  }

  .target-app {
    @apply text-base05;
  }

  .environment {
    @apply ml-2 text-xs px-1.5 py-0.5 bg-base02 rounded text-base04;
  }

  .results-row {
    @apply flex items-center gap-2;
  }

  .result {
    @apply text-xs font-medium;
  }

  .result.passed {
    @apply text-base0B;
  }

  .result.failed {
    @apply text-base08;
  }

  .result.healed {
    @apply text-base0E;
  }

  .result.total {
    @apply text-base04;
  }

  .pass-rate-cell {
    @apply flex items-center gap-2;
  }

  .pass-rate-bar {
    @apply w-16 h-2 bg-base02 rounded-full overflow-hidden;
  }

  .pass-rate-fill {
    @apply h-full rounded-full transition-all;
  }

  .pass-rate-fill.good {
    @apply bg-base0B;
  }

  .pass-rate-fill.warning {
    @apply bg-base0A;
  }

  .pass-rate-fill.bad {
    @apply bg-base08;
  }

  .pass-rate-value {
    @apply text-xs text-base04 w-8;
  }

  .duration {
    @apply text-base04 font-mono text-xs;
  }

  .date {
    @apply text-xs text-base04;
  }

  .view-btn {
    @apply px-3 py-1 text-xs font-medium text-base0D;
    @apply hover:text-base0D/80 transition-colors;
  }

  /* Empty State */
  .empty-state {
    @apply flex flex-col items-center justify-center py-12 text-base04;
  }

  .empty-state svg {
    @apply mb-3 opacity-50;
  }

  .empty-state p {
    @apply text-sm;
  }
</style>
