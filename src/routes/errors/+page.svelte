<script>
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {Badge} from '$components';

  let {data} = $props();
  const {errors, stats, dashboard, services, filters} = data;

  // Track expanded error cards
  let expandedError = $state(null);

  function toggleExpand(errorId) {
    expandedError = expandedError === errorId ? null : errorId;
  }

  // Filter change handlers
  function updateFilter(key, value) {
    const params = new URLSearchParams($page.url.searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    goto(`?${params.toString()}`);
  }

  // Time ago formatter
  function timeAgo(date) {
    if (!date) return 'never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  // Status colors
  function statusColor(status) {
    switch (status) {
      case 'new':
        return 'error';
      case 'unresolved':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'ignored':
        return 'muted';
      default:
        return 'default';
    }
  }
</script>

<svelte:head>
  <title>Error Tracking | Selify Admin</title>
</svelte:head>

<div class="errors-page">
  <header class="page-header">
    <div>
      <h1 class="page-title">Error Tracking</h1>
      <p class="page-subtitle">
        {stats.total_errors} errors tracked
        {#if stats.unresolved > 0}
          <span class="unresolved-badge">
            {stats.unresolved} unresolved
          </span>
        {/if}
      </p>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select
        class="filter-select"
        value={filters.service || ''}
        onchange={(e) => updateFilter('service', e.target.value)}
      >
        <option value="">All Services</option>
        {#each services as service}
          <option value={service}>{service}</option>
        {/each}
      </select>

      <select
        class="filter-select"
        value={filters.status || ''}
        onchange={(e) => updateFilter('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="new">New</option>
        <option value="unresolved">Unresolved</option>
        <option value="resolved">Resolved</option>
        <option value="ignored">Ignored</option>
      </select>

      <select
        class="filter-select"
        value={filters.hours}
        onchange={(e) => updateFilter('hours', e.target.value)}
      >
        <option value="1">Last hour</option>
        <option value="24">Last 24 hours</option>
        <option value="168">Last 7 days</option>
        <option value="720">Last 30 days</option>
      </select>
    </div>
  </header>

  <!-- Stats Summary -->
  <div class="stats-summary">
    <div class="stat-card new">
      <div class="stat-count">{stats.unresolved || 0}</div>
      <div class="stat-label">Unresolved</div>
    </div>
    <div class="stat-card occurrences">
      <div class="stat-count">{stats.total_occurrences || 0}</div>
      <div class="stat-label">Occurrences</div>
    </div>
    <div class="stat-card resolved">
      <div class="stat-count">{stats.resolved || 0}</div>
      <div class="stat-label">Resolved</div>
    </div>
    <div class="stat-card tasks">
      <div class="stat-count">{dashboard?.tasks?.error_tasks_open || 0}</div>
      <div class="stat-label">Open Tasks</div>
    </div>
  </div>

  <!-- By Service Breakdown -->
  {#if Object.keys(stats.by_service || {}).length > 0}
    <section class="breakdown-section">
      <h2 class="section-title">By Service</h2>
      <div class="breakdown-grid">
        {#each Object.entries(stats.by_service) as [service, count]}
          <button
            class="breakdown-item"
            class:active={filters.service === service}
            onclick={() => updateFilter('service', filters.service === service ? null : service)}
          >
            <span class="breakdown-name">{service}</span>
            <span class="breakdown-count">{count}</span>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Errors List -->
  <section class="errors-section">
    <h2 class="section-title">Errors ({errors.length})</h2>

    {#if errors.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p>No errors found in this time period</p>
      </div>
    {:else}
      <div class="errors-list">
        {#each errors as error}
          <div class="error-card" class:expanded={expandedError === error.id}>
            <button class="error-header" onclick={() => toggleExpand(error.id)}>
              <div class="error-main">
                <Badge variant={statusColor(error.status)}>{error.status}</Badge>
                <span class="error-type">{error.error_type}</span>
                <span class="error-title">{error.title}</span>
              </div>
              <div class="error-meta">
                <span class="error-service">{error.service}</span>
                <span class="error-count">{error.occurrence_count}x</span>
                <span class="error-users">{error.user_count} users</span>
                <span class="error-time">{timeAgo(error.last_seen)}</span>
                <svg class="expand-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </button>

            {#if expandedError === error.id}
              <div class="error-details">
                <div class="detail-row">
                  <span class="detail-label">Fingerprint</span>
                  <code class="detail-value">{error.fingerprint}</code>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Environment</span>
                  <span class="detail-value">{error.environment}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">First seen</span>
                  <span class="detail-value">{new Date(error.first_seen).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Last seen</span>
                  <span class="detail-value">{new Date(error.last_seen).toLocaleString()}</span>
                </div>

                {#if error.task_id}
                  <div class="detail-row">
                    <span class="detail-label">Linked Task</span>
                    <a href="/pm?task={error.task_id}" class="task-link">
                      View in PM Board
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M3.5 8.5l5-5m0 0H4m4.5 0v4.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                {/if}

                <div class="error-actions">
                  {#if error.status !== 'resolved'}
                    <button class="btn-resolve" disabled>Mark Resolved</button>
                  {/if}
                  {#if !error.task_id}
                    <button class="btn-create-task" disabled>Create Task</button>
                  {/if}
                  <button class="btn-view-details" disabled>View Full Details</button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .errors-page {
    @apply max-w-5xl;
  }

  .page-header {
    @apply flex justify-between items-start mb-8 flex-wrap gap-4;
  }

  .page-title {
    @apply text-2xl font-bold text-base07 m-0;
  }

  .page-subtitle {
    @apply text-sm text-base05 mt-1 flex items-center gap-3;
  }

  .unresolved-badge {
    @apply text-xs bg-base08/15 text-base08 px-2 py-0.5 rounded-full;
  }

  /* Filters */
  .filters {
    @apply flex gap-3;
  }

  .filter-select {
    @apply px-3 py-2 bg-base01 border border-border rounded-lg;
    @apply text-sm text-base06 cursor-pointer;
    @apply focus:outline-none focus:border-base0D;
  }

  /* Stats Summary */
  .stats-summary {
    @apply grid grid-cols-4 gap-4 mb-8;
  }

  .stat-card {
    @apply bg-base01 border border-border rounded-xl p-5 text-center;
  }

  .stat-card.new {
    @apply border-l-4 border-l-base08;
  }

  .stat-card.occurrences {
    @apply border-l-4 border-l-base09;
  }

  .stat-card.resolved {
    @apply border-l-4 border-l-base0B;
  }

  .stat-card.tasks {
    @apply border-l-4 border-l-base0D;
  }

  .stat-count {
    @apply text-3xl font-bold text-base07;
  }

  .stat-card.new .stat-count {
    @apply text-base08;
  }

  .stat-card.occurrences .stat-count {
    @apply text-base09;
  }

  .stat-card.resolved .stat-count {
    @apply text-base0B;
  }

  .stat-card.tasks .stat-count {
    @apply text-base0D;
  }

  .stat-label {
    @apply text-xs text-base04 uppercase tracking-wide mt-1;
  }

  /* Breakdown Section */
  .breakdown-section {
    @apply mb-8;
  }

  .section-title {
    @apply text-sm font-semibold text-base05 uppercase tracking-wide mb-4;
  }

  .breakdown-grid {
    @apply flex flex-wrap gap-2;
  }

  .breakdown-item {
    @apply flex items-center gap-2 px-3 py-1.5;
    @apply bg-base01 border border-border rounded-lg;
    @apply text-sm cursor-pointer transition-all;
  }

  .breakdown-item:hover {
    @apply border-base03 bg-base02;
  }

  .breakdown-item.active {
    @apply border-base0D bg-base0D/10;
  }

  .breakdown-name {
    @apply text-base06;
  }

  .breakdown-count {
    @apply text-base04 text-xs bg-base02 px-1.5 py-0.5 rounded;
  }

  /* Errors Section */
  .errors-section {
    @apply mb-8;
  }

  .errors-list {
    @apply space-y-3;
  }

  .error-card {
    @apply bg-base01 border border-border rounded-xl overflow-hidden;
    @apply transition-all duration-150;
  }

  .error-card:hover {
    @apply border-base03;
  }

  .error-card.expanded {
    @apply border-base0D;
  }

  .error-header {
    @apply w-full flex justify-between items-center p-4;
    @apply cursor-pointer text-left;
    @apply bg-transparent border-none;
  }

  .error-main {
    @apply flex items-center gap-3 flex-1 min-w-0;
  }

  .error-type {
    @apply text-xs font-mono text-base0E;
  }

  .error-title {
    @apply text-sm text-base06 truncate;
  }

  .error-meta {
    @apply flex items-center gap-4 text-xs text-base04;
  }

  .error-service {
    @apply px-2 py-0.5 bg-base02 rounded;
  }

  .error-count {
    @apply font-medium text-base09;
  }

  .error-users {
    @apply text-base05;
  }

  .error-time {
    @apply text-base04;
  }

  .expand-icon {
    @apply text-base04 transition-transform;
  }

  .error-card.expanded .expand-icon {
    @apply rotate-180;
  }

  .error-details {
    @apply px-4 pb-4 pt-0 border-t border-border;
  }

  .detail-row {
    @apply flex items-center py-2 border-b border-border/50;
  }

  .detail-row:last-of-type {
    @apply border-b-0;
  }

  .detail-label {
    @apply w-32 text-xs text-base04 uppercase tracking-wide;
  }

  .detail-value {
    @apply text-sm text-base06;
  }

  code.detail-value {
    @apply font-mono text-xs bg-base02 px-2 py-1 rounded;
  }

  .task-link {
    @apply inline-flex items-center gap-1 text-base0D hover:underline;
  }

  .error-actions {
    @apply flex gap-3 mt-4 pt-4 border-t border-border;
  }

  .btn-resolve,
  .btn-create-task,
  .btn-view-details {
    @apply px-3 py-1.5 text-sm rounded-lg cursor-pointer;
    @apply border transition-all;
  }

  .btn-resolve {
    @apply bg-base0B/10 border-base0B/30 text-base0B;
  }

  .btn-resolve:hover:not(:disabled) {
    @apply bg-base0B/20;
  }

  .btn-create-task {
    @apply bg-base0D/10 border-base0D/30 text-base0D;
  }

  .btn-create-task:hover:not(:disabled) {
    @apply bg-base0D/20;
  }

  .btn-view-details {
    @apply bg-base02 border-border text-base06;
  }

  .btn-view-details:hover:not(:disabled) {
    @apply bg-base03;
  }

  .btn-resolve:disabled,
  .btn-create-task:disabled,
  .btn-view-details:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  /* Empty State */
  .empty-state {
    @apply flex flex-col items-center justify-center py-16;
    @apply text-base04;
  }

  .empty-icon {
    @apply w-16 h-16 mb-4 text-base0B;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .stats-summary {
      @apply grid-cols-2;
    }

    .error-meta {
      @apply hidden;
    }

    .filters {
      @apply flex-wrap;
    }
  }
</style>
