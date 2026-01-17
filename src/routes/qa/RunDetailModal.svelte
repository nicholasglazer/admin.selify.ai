<script>
  import {getContext} from 'svelte';
  import {Modal, Badge} from '@miozu/jera';

  let {run, onClose} = $props();

  const qaState = getContext('qaState');

  const statusVariants = {
    queued: 'default',
    running: 'warning',
    passed: 'success',
    failed: 'error',
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
    return new Date(dateStr).toLocaleString();
  }

  function getPassRate() {
    if (!run.total_specs || run.total_specs === 0) return 0;
    return Math.round((run.passed_count / run.total_specs) * 100);
  }
</script>

<Modal open={true} {onClose} size="lg">
  <div class="run-detail">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-info">
        <h2 class="run-title">Test Run #{run.run_number}</h2>
        <Badge variant={statusVariants[run.status]} size="md">{run.status}</Badge>
      </div>
      <div class="header-meta">
        <span>{run.target_app || 'All Apps'}</span>
        <span class="separator">|</span>
        <span>{run.environment || 'staging'}</span>
        <span class="separator">|</span>
        <span>{formatDate(run.created_at)}</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon passed">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{run.passed_count || 0}</span>
          <span class="stat-label">Passed</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon failed">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{run.failed_count || 0}</span>
          <span class="stat-label">Failed</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon healed">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{run.healed_count || 0}</span>
          <span class="stat-label">Auto-Healed</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon total">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{run.total_specs || 0}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>
    </div>

    <!-- Pass Rate Bar -->
    <div class="pass-rate-section">
      <div class="pass-rate-header">
        <span class="pass-rate-label">Pass Rate</span>
        <span class="pass-rate-value">{getPassRate()}%</span>
      </div>
      <div class="pass-rate-bar">
        <div
          class="pass-rate-fill"
          class:good={getPassRate() >= 80}
          class:warning={getPassRate() >= 50 && getPassRate() < 80}
          class:bad={getPassRate() < 50}
          style="width: {getPassRate()}%"
        ></div>
      </div>
    </div>

    <!-- Timing Info -->
    <div class="timing-section">
      <div class="timing-item">
        <span class="timing-label">Started</span>
        <span class="timing-value">{formatDate(run.started_at)}</span>
      </div>
      <div class="timing-item">
        <span class="timing-label">Completed</span>
        <span class="timing-value">{formatDate(run.completed_at)}</span>
      </div>
      <div class="timing-item">
        <span class="timing-label">Duration</span>
        <span class="timing-value">{formatDuration(run.duration_ms)}</span>
      </div>
    </div>

    <!-- Auto-Heal Details -->
    {#if run.healed_count > 0 && run.heal_details?.length > 0}
      <div class="heal-section">
        <h3 class="section-title">Auto-Heal Details</h3>
        <div class="heal-list">
          {#each run.heal_details as heal}
            <div class="heal-item">
              <span class="heal-spec">{heal.specId}</span>
              <span class="heal-reason">{heal.reason}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Git Context -->
    {#if run.git_branch || run.git_commit}
      <div class="git-section">
        <h3 class="section-title">Git Context</h3>
        <div class="git-info">
          {#if run.git_branch}
            <div class="git-item">
              <span class="git-label">Branch</span>
              <span class="git-value">{run.git_branch}</span>
            </div>
          {/if}
          {#if run.git_commit}
            <div class="git-item">
              <span class="git-label">Commit</span>
              <span class="git-value font-mono">{run.git_commit.slice(0, 8)}</span>
            </div>
          {/if}
          {#if run.git_message}
            <div class="git-item full">
              <span class="git-label">Message</span>
              <span class="git-value">{run.git_message}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Artifacts -->
    {#if run.report_url || run.trace_url || run.video_url}
      <div class="artifacts-section">
        <h3 class="section-title">Artifacts</h3>
        <div class="artifacts-list">
          {#if run.report_url}
            <a href={run.report_url} target="_blank" class="artifact-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              HTML Report
            </a>
          {/if}
          {#if run.trace_url}
            <a href={run.trace_url} target="_blank" class="artifact-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Trace Viewer
            </a>
          {/if}
          {#if run.video_url}
            <a href={run.video_url} target="_blank" class="artifact-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Video Recording
            </a>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Error Info -->
    {#if run.error_message}
      <div class="error-section">
        <h3 class="section-title">Error</h3>
        <div class="error-content">
          <p class="error-message">{run.error_message}</p>
          {#if run.error_stack}
            <pre class="error-stack">{run.error_stack}</pre>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Footer -->
    <div class="detail-footer">
      <button class="close-btn" onclick={onClose}>Close</button>
    </div>
  </div>
</Modal>

<style lang="postcss">
  @reference '$theme';

  .run-detail {
    @apply flex flex-col;
  }

  .detail-header {
    @apply p-6 border-b border-base02;
  }

  .header-info {
    @apply flex items-center gap-3 mb-2;
  }

  .run-title {
    @apply text-lg font-semibold text-base06;
  }

  .header-meta {
    @apply flex items-center gap-2 text-sm text-base04;
  }

  .separator {
    @apply text-base03;
  }

  /* Stats Grid */
  .stats-grid {
    @apply grid grid-cols-4 gap-4 p-6 border-b border-base02;
  }

  .stat-card {
    @apply flex items-center gap-3 p-4 bg-base02/50 rounded-lg;
  }

  .stat-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center;
  }

  .stat-icon.passed {
    @apply bg-base0B/20 text-base0B;
  }

  .stat-icon.failed {
    @apply bg-base08/20 text-base08;
  }

  .stat-icon.healed {
    @apply bg-base0E/20 text-base0E;
  }

  .stat-icon.total {
    @apply bg-base0D/20 text-base0D;
  }

  .stat-content {
    @apply flex flex-col;
  }

  .stat-value {
    @apply text-xl font-bold text-base06;
  }

  .stat-label {
    @apply text-xs text-base04;
  }

  /* Pass Rate */
  .pass-rate-section {
    @apply px-6 py-4 border-b border-base02;
  }

  .pass-rate-header {
    @apply flex justify-between items-center mb-2;
  }

  .pass-rate-label {
    @apply text-sm text-base05;
  }

  .pass-rate-value {
    @apply text-lg font-bold text-base06;
  }

  .pass-rate-bar {
    @apply h-3 bg-base02 rounded-full overflow-hidden;
  }

  .pass-rate-fill {
    @apply h-full rounded-full transition-all duration-300;
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

  /* Timing */
  .timing-section {
    @apply grid grid-cols-3 gap-4 px-6 py-4 border-b border-base02;
  }

  .timing-item {
    @apply flex flex-col gap-1;
  }

  .timing-label {
    @apply text-xs text-base04;
  }

  .timing-value {
    @apply text-sm text-base06;
  }

  /* Sections */
  .section-title {
    @apply text-sm font-medium text-base05 mb-3;
  }

  .heal-section,
  .git-section,
  .artifacts-section,
  .error-section {
    @apply px-6 py-4 border-b border-base02;
  }

  .heal-list {
    @apply flex flex-col gap-2;
  }

  .heal-item {
    @apply flex justify-between items-center p-2 bg-base02/50 rounded;
  }

  .heal-spec {
    @apply text-sm text-base05 font-mono;
  }

  .heal-reason {
    @apply text-xs text-base04;
  }

  .git-info {
    @apply grid grid-cols-2 gap-3;
  }

  .git-item {
    @apply flex flex-col gap-1;
  }

  .git-item.full {
    @apply col-span-2;
  }

  .git-label {
    @apply text-xs text-base04;
  }

  .git-value {
    @apply text-sm text-base05;
  }

  .artifacts-list {
    @apply flex flex-wrap gap-3;
  }

  .artifact-link {
    @apply flex items-center gap-2 px-3 py-2;
    @apply bg-base02 text-base0D rounded-lg text-sm;
    @apply hover:bg-base03 transition-colors;
  }

  .error-content {
    @apply p-3 bg-base08/10 border border-base08/30 rounded-lg;
  }

  .error-message {
    @apply text-sm text-base08 mb-2;
  }

  .error-stack {
    @apply text-xs text-base04 font-mono overflow-x-auto;
  }

  /* Footer */
  .detail-footer {
    @apply flex justify-end p-6;
  }

  .close-btn {
    @apply px-4 py-2 bg-base02 text-base06 rounded-lg text-sm;
    @apply hover:bg-base03 transition-colors;
  }
</style>
