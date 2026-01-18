<script>
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';

  let {data} = $props();
  const {errors, stats, dashboard, services, filters} = data;

  // Track expanded error
  let expandedError = $state(null);

  function toggleExpand(errorId) {
    expandedError = expandedError === errorId ? null : errorId;
  }

  function updateFilter(key, value) {
    const params = new URLSearchParams($page.url.searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    goto(`?${params.toString()}`);
  }

  function timeAgo(date) {
    if (!date) return '—';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }
</script>

<svelte:head>
  <title>Errors | Selify Admin</title>
</svelte:head>

<div class="err-page">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <h1>Errors</h1>
      <p>{stats.total_errors || 0} tracked</p>
    </div>
    <div class="filters">
      <select
        class="filter"
        value={filters.service || ''}
        onchange={(e) => updateFilter('service', e.target.value)}
        aria-label="Filter by service"
      >
        <option value="">All services</option>
        {#each services as service}
          <option value={service}>{service}</option>
        {/each}
      </select>
      <select
        class="filter"
        value={filters.status || ''}
        onchange={(e) => updateFilter('status', e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="unresolved">Unresolved</option>
        <option value="resolved">Resolved</option>
        <option value="ignored">Ignored</option>
      </select>
      <select
        class="filter"
        value={filters.hours}
        onchange={(e) => updateFilter('hours', e.target.value)}
        aria-label="Filter by time period"
      >
        <option value="1">1h</option>
        <option value="24">24h</option>
        <option value="168">7d</option>
        <option value="720">30d</option>
      </select>
    </div>
  </header>

  <!-- Metric Strip -->
  <div class="metric-strip">
    <div class="metric" class:alert={stats.unresolved > 0}>
      <span class="m-val">{stats.unresolved || 0}</span>
      <span class="m-lbl">Unresolved</span>
    </div>
    <div class="metric">
      <span class="m-val">{stats.total_occurrences || 0}</span>
      <span class="m-lbl">Occurrences</span>
    </div>
    <div class="metric">
      <span class="m-val">{stats.resolved || 0}</span>
      <span class="m-lbl">Resolved</span>
    </div>
    <div class="metric">
      <span class="m-val">{dashboard?.tasks?.error_tasks_open || 0}</span>
      <span class="m-lbl">Open Tasks</span>
    </div>
  </div>

  <!-- Service Breakdown -->
  {#if Object.keys(stats.by_service || {}).length > 0}
    <section class="breakdown">
      <h2>By Service</h2>
      <div class="service-tags">
        {#each Object.entries(stats.by_service) as [service, count]}
          <button
            class="service-tag"
            class:active={filters.service === service}
            onclick={() => updateFilter('service', filters.service === service ? null : service)}
          >
            <span class="svc-name">{service}</span>
            <span class="svc-count">{count}</span>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Errors List -->
  <section class="errors-section">
    <h2>Errors <span class="count">({errors.length})</span></h2>

    {#if errors.length === 0}
      <div class="empty">
        <span class="empty-dot"></span>
        <p>No errors in this period</p>
      </div>
    {:else}
      <div class="errors-list">
        {#each errors as error}
          <div class="error-row" class:expanded={expandedError === error.id}>
            <button class="error-main" onclick={() => toggleExpand(error.id)}>
              <div class="error-left">
                <span class="status-dot" class:new={error.status === 'new'} class:unresolved={error.status === 'unresolved'} class:resolved={error.status === 'resolved'} class:ignored={error.status === 'ignored'}></span>
                <span class="error-type">{error.error_type}</span>
                <span class="error-title">{error.title}</span>
              </div>
              <div class="error-right">
                <span class="error-svc">{error.service}</span>
                <span class="error-occ">{error.occurrence_count}×</span>
                <span class="error-users">{error.user_count} users</span>
                <span class="error-time">{timeAgo(error.last_seen)}</span>
                <span class="chevron">›</span>
              </div>
            </button>

            {#if expandedError === error.id}
              <div class="error-details">
                <div class="detail-grid">
                  <div class="detail">
                    <span class="d-label">Fingerprint</span>
                    <code class="d-value">{error.fingerprint}</code>
                  </div>
                  <div class="detail">
                    <span class="d-label">Environment</span>
                    <span class="d-value">{error.environment}</span>
                  </div>
                  <div class="detail">
                    <span class="d-label">First seen</span>
                    <span class="d-value">{new Date(error.first_seen).toLocaleString()}</span>
                  </div>
                  <div class="detail">
                    <span class="d-label">Last seen</span>
                    <span class="d-value">{new Date(error.last_seen).toLocaleString()}</span>
                  </div>
                </div>

                {#if error.task_id}
                  <a href="/pm?task={error.task_id}" class="task-link">
                    View in PM Board →
                  </a>
                {/if}

                <div class="actions">
                  {#if error.status !== 'resolved'}
                    <button class="action-btn resolve" disabled>Resolve</button>
                  {/if}
                  {#if !error.task_id}
                    <button class="action-btn create" disabled>Create Task</button>
                  {/if}
                  <button class="action-btn" disabled>Details</button>
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

  .err-page {
    @apply max-w-5xl mx-auto;
  }

  /* Header */
  .header {
    @apply flex justify-between items-start mb-10 flex-wrap gap-4;
  }

  .header h1 {
    @apply text-2xl font-semibold text-base06 m-0;
    letter-spacing: -0.02em;
  }

  .header p {
    @apply text-sm text-base04 mt-1;
  }

  .filters {
    @apply flex gap-2;
  }

  .filter {
    @apply px-3 py-1.5 bg-base01 border border-base02 rounded-md;
    @apply text-sm text-base05 cursor-pointer;
    @apply focus:outline-none focus:border-base03;
  }

  /* Metric Strip */
  .metric-strip {
    @apply flex gap-8 mb-10 py-4 px-5;
    @apply bg-base01/50 rounded-lg;
  }

  .metric {
    @apply flex flex-col;
  }

  .metric.alert .m-val {
    @apply text-base08;
  }

  .m-val {
    @apply text-2xl font-semibold text-base06;
    letter-spacing: -0.02em;
  }

  .m-lbl {
    @apply text-xs text-base04 uppercase tracking-wider mt-0.5;
  }

  /* Breakdown */
  .breakdown {
    @apply mb-10;
  }

  .breakdown h2, .errors-section h2 {
    @apply text-xs font-medium text-base04 uppercase tracking-wider mb-4;
  }

  .service-tags {
    @apply flex flex-wrap gap-2;
  }

  .service-tag {
    @apply flex items-center gap-2 px-3 py-1.5;
    @apply bg-base01 border border-base02 rounded-md;
    @apply text-sm cursor-pointer transition-all;
  }

  .service-tag:hover {
    @apply border-base03;
  }

  .service-tag.active {
    @apply border-base0D bg-base0D/10;
  }

  .svc-name {
    @apply text-base05;
  }

  .svc-count {
    @apply text-xs text-base04 bg-base02 px-1.5 py-0.5 rounded;
  }

  /* Errors Section */
  .errors-section h2 {
    @apply flex items-center gap-2;
  }

  .count {
    @apply text-base04 font-normal;
  }

  .errors-list {
    @apply space-y-2;
  }

  .error-row {
    @apply bg-base01 border border-base02 rounded-lg overflow-hidden;
    @apply transition-all duration-150;
  }

  .error-row:hover {
    @apply border-base03;
  }

  .error-row.expanded {
    @apply border-base03;
  }

  .error-main {
    @apply w-full flex justify-between items-center px-4 py-3;
    @apply cursor-pointer text-left bg-transparent border-none;
  }

  .error-left {
    @apply flex items-center gap-3 flex-1 min-w-0;
  }

  .status-dot {
    @apply w-2 h-2 rounded-full flex-shrink-0;
    @apply bg-base04;
  }

  .status-dot.new { @apply bg-base08; }
  .status-dot.unresolved { @apply bg-base09; }
  .status-dot.resolved { @apply bg-base0B; }
  .status-dot.ignored { @apply bg-base03; }

  .error-type {
    @apply text-xs font-mono text-base0E;
  }

  .error-title {
    @apply text-sm text-base05 truncate;
  }

  .error-right {
    @apply flex items-center gap-4 text-xs text-base04;
  }

  .error-svc {
    @apply px-2 py-0.5 bg-base02 rounded text-base05;
  }

  .error-occ {
    @apply font-medium text-base09;
  }

  .error-users {
    @apply text-base04;
  }

  .error-time {
    @apply text-base04 w-8;
  }

  .chevron {
    @apply text-base04 transition-transform text-lg leading-none;
  }

  .error-row.expanded .chevron {
    @apply rotate-90;
  }

  /* Error Details */
  .error-details {
    @apply px-4 pb-4 pt-0 border-t border-base02;
  }

  .detail-grid {
    @apply grid grid-cols-2 gap-x-8 gap-y-3 py-4;
  }

  .detail {
    @apply flex flex-col gap-1;
  }

  .d-label {
    @apply text-xs text-base04 uppercase tracking-wide;
  }

  .d-value {
    @apply text-sm text-base05;
  }

  code.d-value {
    @apply font-mono text-xs bg-base02 px-2 py-1 rounded w-fit;
  }

  .task-link {
    @apply inline-flex text-sm text-base0D no-underline;
    @apply hover:underline mb-4;
  }

  .actions {
    @apply flex gap-2 pt-3 border-t border-base02;
  }

  .action-btn {
    @apply px-3 py-1.5 text-xs rounded-md cursor-pointer;
    @apply bg-base02 border border-base03 text-base05;
    @apply transition-all;
  }

  .action-btn:hover:not(:disabled) {
    @apply bg-base03;
  }

  .action-btn.resolve {
    @apply bg-base0B/10 border-base0B/30 text-base0B;
  }

  .action-btn.create {
    @apply bg-base0D/10 border-base0D/30 text-base0D;
  }

  .action-btn:disabled {
    @apply opacity-40 cursor-not-allowed;
  }

  /* Empty State */
  .empty {
    @apply flex items-center gap-3 py-12 px-4;
    @apply text-base04 justify-center;
  }

  .empty-dot {
    @apply w-2 h-2 rounded-full bg-base0B;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .metric-strip {
      @apply grid grid-cols-2 gap-4;
    }

    .error-right {
      @apply hidden;
    }

    .filters {
      @apply flex-wrap;
    }

    .detail-grid {
      @apply grid-cols-1;
    }
  }
</style>
