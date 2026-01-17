<script>
  import {getContext} from 'svelte';
  import {Card} from '$components';
  import {Badge} from '@miozu/jera';

  const qaState = getContext('qaState');

  let dashboardSummary = $derived(qaState.dashboardSummary);
  let specsByTarget = $derived(qaState.getSpecsByTarget());
  let flakySpecs = $derived(qaState.flakySpecs);
  let autoHealedToday = $derived(qaState.autoHealedToday);
  let recentRuns = $derived(qaState.recentRuns);

  const targetApps = qaState.targetApps;

  // Status colors
  const statusColors = {
    passed: 'success',
    failed: 'error',
    running: 'warning',
    queued: 'default',
    healed: 'primary',
    cancelled: 'default',
    error: 'error'
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
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
</script>

<div class="dashboard-grid">
  <!-- Coverage by Target App -->
  <Card class="coverage-card">
    <h3 class="card-title">Coverage by Target</h3>
    <div class="target-list">
      {#each targetApps as app}
        {@const specs = specsByTarget[app] || []}
        <div class="target-row">
          <div class="target-info">
            <span class="target-name">{app}</span>
            <span class="target-count">{specs.length} specs</span>
          </div>
          <div class="coverage-bar">
            <div
              class="coverage-fill"
              style="width: {Math.min(100, specs.length * 10)}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </Card>

  <!-- Auto-Heal Stats -->
  <Card class="heal-card">
    <h3 class="card-title">Auto-Healing</h3>
    <div class="heal-stats">
      <div class="heal-stat">
        <span class="heal-value">{autoHealedToday}</span>
        <span class="heal-label">Healed Today</span>
      </div>
      <div class="heal-description">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="heal-icon"
        >
          <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" />
          <path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
        <p>Playwright Healer agent automatically fixes broken selectors and timeouts</p>
      </div>
    </div>
  </Card>

  <!-- Flaky Tests -->
  <Card class="flaky-card">
    <h3 class="card-title">Flaky Tests</h3>
    {#if flakySpecs?.length > 0}
      <div class="flaky-list">
        {#each flakySpecs as spec}
          <div class="flaky-item">
            <span class="flaky-name">{spec.name}</span>
            <Badge variant="warning" size="sm">{spec.flaky_score}%</Badge>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <p>No flaky tests detected</p>
      </div>
    {/if}
  </Card>

  <!-- Recent Runs -->
  <Card class="runs-card">
    <h3 class="card-title">Recent Runs</h3>
    {#if recentRuns?.length > 0}
      <div class="runs-list">
        {#each recentRuns.slice(0, 5) as run}
          <button
            class="run-item"
            onclick={() => qaState.selectRun(run)}
          >
            <div class="run-header">
              <span class="run-number">#{run.run_number}</span>
              <Badge variant={statusColors[run.status]} size="sm">{run.status}</Badge>
            </div>
            <div class="run-stats">
              <span class="run-passed">{run.passed_count || 0} passed</span>
              {#if run.failed_count > 0}
                <span class="run-failed">{run.failed_count} failed</span>
              {/if}
              {#if run.healed_count > 0}
                <span class="run-healed">{run.healed_count} healed</span>
              {/if}
            </div>
            <div class="run-meta">
              <span>{formatDate(run.created_at)}</span>
              <span>{formatDuration(run.duration_ms)}</span>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <p>No test runs yet</p>
      </div>
    {/if}
  </Card>
</div>

<style lang="postcss">
  @reference '$theme';

  .dashboard-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .card-title {
    @apply text-base font-semibold text-base06 mb-4;
  }

  /* Coverage Card */
  .target-list {
    @apply flex flex-col gap-3;
  }

  .target-row {
    @apply flex flex-col gap-1;
  }

  .target-info {
    @apply flex justify-between items-center;
  }

  .target-name {
    @apply text-sm text-base05;
  }

  .target-count {
    @apply text-xs text-base04;
  }

  .coverage-bar {
    @apply h-2 bg-base02 rounded-full overflow-hidden;
  }

  .coverage-fill {
    @apply h-full bg-base0D rounded-full transition-all duration-300;
  }

  /* Heal Card */
  .heal-stats {
    @apply flex flex-col gap-4;
  }

  .heal-stat {
    @apply flex flex-col items-center py-4;
  }

  .heal-value {
    @apply text-4xl font-bold text-base0E;
  }

  .heal-label {
    @apply text-sm text-base04 mt-1;
  }

  .heal-description {
    @apply flex items-start gap-3 p-3 bg-base02/50 rounded-lg;
  }

  .heal-icon {
    @apply text-base0E flex-shrink-0 mt-0.5;
  }

  .heal-description p {
    @apply text-sm text-base04;
  }

  /* Flaky Card */
  .flaky-list {
    @apply flex flex-col gap-2;
  }

  .flaky-item {
    @apply flex justify-between items-center p-2 rounded-lg;
    @apply bg-base02/50 hover:bg-base02 transition-colors;
  }

  .flaky-name {
    @apply text-sm text-base05 truncate;
  }

  /* Runs Card */
  .runs-list {
    @apply flex flex-col gap-2;
  }

  .run-item {
    @apply w-full text-left p-3 rounded-lg;
    @apply bg-base02/50 hover:bg-base02 transition-colors;
    @apply cursor-pointer;
  }

  .run-header {
    @apply flex justify-between items-center mb-2;
  }

  .run-number {
    @apply text-sm font-medium text-base06;
  }

  .run-stats {
    @apply flex gap-3 text-xs mb-1;
  }

  .run-passed {
    @apply text-base0B;
  }

  .run-failed {
    @apply text-base08;
  }

  .run-healed {
    @apply text-base0E;
  }

  .run-meta {
    @apply flex gap-3 text-xs text-base04;
  }

  /* Empty State */
  .empty-state {
    @apply flex flex-col items-center justify-center py-8 text-base04;
  }

  .empty-state svg {
    @apply mb-2 opacity-50;
  }

  .empty-state p {
    @apply text-sm;
  }

  /* Global card styling override */
  :global(.coverage-card),
  :global(.heal-card),
  :global(.flaky-card),
  :global(.runs-card) {
    @apply p-5;
  }
</style>
