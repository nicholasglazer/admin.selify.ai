<script>
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {AlertTriangle, Bug, CheckCircle, XCircle, Clock, Users, Filter, RefreshCw, Eye, EyeOff, Calendar, Hash, Activity} from '@lucide/svelte';

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
  <!-- Modern Header -->
  <header class="page-header">
    <div class="header-content">
      <div class="header-info">
        <h1 class="page-title">Error Tracking</h1>
        <p class="page-subtitle">
          Monitor and resolve application errors across all services.
          {#if stats.total_errors}
            {stats.total_errors.toLocaleString()} errors tracked with {stats.unresolved || 0} requiring attention.
          {:else}
            All systems running smoothly.
          {/if}
        </p>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" title="Refresh error data">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    </div>
    <div class="filters-bar">
      <div class="filter-group">
        <Filter size={14} class="filter-icon" />
        <span class="filter-label">Filter by:</span>
      </div>
      <select
        class="filter-select"
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
        class="filter-select"
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
        class="filter-select time-filter"
        value={filters.hours}
        onchange={(e) => updateFilter('hours', e.target.value)}
        aria-label="Filter by time period"
      >
        <option value="1">Last hour</option>
        <option value="24">Last 24 hours</option>
        <option value="168">Last 7 days</option>
        <option value="720">Last 30 days</option>
      </select>
    </div>
  </header>

  <!-- Error Statistics Overview -->
  <div class="stats-overview">
    <div class="stat-card" class:stat-alert={stats.unresolved > 0}>
      <div class="stat-header">
        <XCircle size={16} class="stat-icon" />
        <span class="stat-label">Unresolved</span>
      </div>
      <div class="stat-value">{(stats.unresolved || 0).toLocaleString()}</div>
      {#if stats.unresolved > 0}
        <div class="stat-trend error">
          Requires immediate attention
        </div>
      {:else}
        <div class="stat-trend success">
          All errors resolved
        </div>
      {/if}
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <Activity size={16} class="stat-icon" />
        <span class="stat-label">Total Occurrences</span>
      </div>
      <div class="stat-value">{(stats.total_occurrences || 0).toLocaleString()}</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <CheckCircle size={16} class="stat-icon" />
        <span class="stat-label">Resolved</span>
      </div>
      <div class="stat-value">{(stats.resolved || 0).toLocaleString()}</div>
      {#if stats.resolved > 0}
        <div class="stat-trend success">
          Recently fixed
        </div>
      {/if}
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <Bug size={16} class="stat-icon" />
        <span class="stat-label">Open Tasks</span>
      </div>
      <div class="stat-value">{(dashboard?.tasks?.error_tasks_open || 0).toLocaleString()}</div>
    </div>
  </div>

  <!-- Service Breakdown -->
  {#if Object.keys(stats.by_service || {}).length > 0}
    <section class="service-breakdown">
      <div class="section-header">
        <h2 class="section-title">Errors by Service</h2>
        <span class="service-count">{Object.keys(stats.by_service).length} services affected</span>
      </div>
      <div class="service-grid">
        {#each Object.entries(stats.by_service) as [service, count]}
          <button
            class="service-card"
            class:active={filters.service === service}
            onclick={() => updateFilter('service', filters.service === service ? null : service)}
          >
            <div class="service-header">
              <div class="service-indicator" class:has-errors={count > 0}></div>
              <span class="service-name">{service}</span>
            </div>
            <div class="service-metrics">
              <span class="error-count">{count}</span>
              <span class="error-label">{count === 1 ? 'error' : 'errors'}</span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Errors List -->
  <section class="errors-section">
    <h2>Errors <span class="count">({errors.length})</span></h2>

    {#if errors.length === 0}
      <div class="empty-state">
        <div class="empty-illustration">
          <div class="empty-icon-container">
            <CheckCircle size={48} class="empty-icon success" />
            <div class="empty-sparkles">
              <div class="sparkle sparkle-1"></div>
              <div class="sparkle sparkle-2"></div>
              <div class="sparkle sparkle-3"></div>
            </div>
          </div>
        </div>
        <div class="empty-content">
          <h3 class="empty-title">
            {#if filters.service || filters.status || filters.search}
              No errors match your filters
            {:else}
              All clear! No errors detected
            {/if}
          </h3>
          <p class="empty-description">
            {#if filters.service || filters.status || filters.search}
              No errors were found with the current filter criteria.
              Try adjusting your filters or expanding the time range.
            {:else}
              Your applications are running smoothly. Error tracking is active
              and will capture issues as they occur across all monitored services.
            {/if}
          </p>
          <div class="empty-actions">
            {#if filters.service || filters.status || filters.search}
              <button class="clear-filters-btn" onclick={() => {
                updateFilter('service', null);
                updateFilter('status', null);
                updateFilter('search', null);
              }}>
                Clear all filters
              </button>
            {/if}
            <button class="refresh-errors-btn" onclick={() => window.location.reload()}>
              <RefreshCw size={14} />
              Refresh errors
            </button>
          </div>
        </div>
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
    @apply w-full min-h-full;
  }

  /* Modern Page Header */
  .page-header {
    @apply mb-8 pb-6 border-b border-base02/50;
  }

  .header-content {
    @apply flex justify-between items-start mb-6;
  }

  .header-info {
    @apply flex-1;
  }

  .page-title {
    @apply text-3xl font-semibold text-base07 mb-2;
    letter-spacing: -0.03em;
  }

  .page-subtitle {
    @apply text-base04 text-base leading-relaxed max-w-2xl;
  }

  .header-actions {
    @apply flex gap-3;
  }

  .refresh-btn {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-base01 border border-base02;
    @apply rounded-lg text-sm font-medium text-base05 hover:bg-base02 hover:border-base03;
    @apply transition-all duration-200 cursor-pointer;
  }

  .filters-bar {
    @apply flex items-center gap-4 flex-wrap;
  }

  .filter-group {
    @apply flex items-center gap-2 text-sm text-base04;
  }

  .filter-icon {
    @apply text-base04;
  }

  .filter-label {
    @apply font-medium;
  }

  .filter-select {
    @apply px-3 py-2 bg-base01 border border-base02 rounded-lg text-sm text-base05;
    @apply hover:border-base03 focus:outline-none focus:border-base0D focus:ring-1 focus:ring-base0D/20;
    @apply transition-all duration-200 cursor-pointer;
  }

  .time-filter {
    @apply bg-base0D/5 border-base0D/30 text-base0D;
  }

  /* Modern Stats Overview */
  .stats-overview {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8;
  }

  .stat-card {
    @apply bg-base01 border border-base02 rounded-xl p-6;
    @apply hover:border-base03 transition-all duration-200;
    @apply relative overflow-hidden;
  }

  .stat-card::before {
    content: '';
    @apply absolute inset-0 bg-gradient-to-br from-base02/20 to-transparent opacity-0;
    @apply transition-opacity duration-200;
  }

  .stat-card:hover::before {
    @apply opacity-100;
  }

  .stat-card.stat-alert {
    @apply border-base08/30 bg-base08/5;
  }

  .stat-card.stat-alert .stat-icon {
    @apply text-base08;
  }

  .stat-header {
    @apply flex items-center gap-3 mb-3;
  }

  .stat-icon {
    @apply text-base04;
  }

  .stat-label {
    @apply text-sm font-medium text-base04;
  }

  .stat-value {
    @apply text-2xl font-semibold text-base06 mb-2;
    letter-spacing: -0.02em;
  }

  .stat-alert .stat-value {
    @apply text-base08;
  }

  .stat-trend {
    @apply text-xs px-2 py-1 rounded-full font-medium;
  }

  .stat-trend.error {
    @apply bg-base08/15 text-base08;
  }

  .stat-trend.success {
    @apply bg-base0B/15 text-base0B;
  }

  /* Modern Service Breakdown */
  .service-breakdown {
    @apply mb-8;
  }

  .section-header {
    @apply flex justify-between items-center mb-6;
  }

  .section-title {
    @apply text-lg font-semibold text-base06;
  }

  .service-count {
    @apply text-sm text-base04 bg-base02 px-3 py-1 rounded-full;
  }

  .service-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .service-card {
    @apply bg-base01 border border-base02 rounded-xl p-4;
    @apply hover:border-base03 hover:bg-base01/80 cursor-pointer;
    @apply transition-all duration-200;
  }

  .service-card.active {
    @apply border-base0D bg-base0D/5 ring-1 ring-base0D/20;
  }

  .service-header {
    @apply flex items-center gap-3 mb-3;
  }

  .service-indicator {
    @apply w-3 h-3 rounded-full bg-base0B;
  }

  .service-indicator.has-errors {
    @apply bg-base08 ring-2 ring-base08/20;
  }

  .service-name {
    @apply text-sm font-medium text-base05;
  }

  .service-metrics {
    @apply flex items-baseline gap-2;
  }

  .error-count {
    @apply text-xl font-semibold text-base06;
  }

  .service-card.active .error-count {
    @apply text-base0D;
  }

  .error-label {
    @apply text-xs text-base04;
  }

  /* Errors Section */
  .errors-section h2 {
    @apply text-sm font-semibold text-base05 mb-6;
    @apply flex items-center gap-3;
  }

  .count {
    @apply text-base04 font-normal bg-base02 px-2 py-1 rounded-md text-xs;
  }

  /* Sophisticated Empty State */
  .empty-state {
    @apply flex flex-col items-center justify-center py-16 px-6 text-center;
  }

  .empty-illustration {
    @apply relative mb-8;
  }

  .empty-icon-container {
    @apply relative;
  }

  .empty-icon.success {
    @apply text-base0B;
  }

  .empty-sparkles {
    @apply absolute inset-0;
  }

  .sparkle {
    @apply absolute w-1 h-1 bg-base0B rounded-full animate-ping;
  }

  .sparkle-1 {
    @apply top-2 left-8;
    animation-delay: 0s;
  }

  .sparkle-2 {
    @apply top-6 right-4;
    animation-delay: 0.5s;
  }

  .sparkle-3 {
    @apply bottom-4 left-6;
    animation-delay: 1s;
  }

  .empty-content {
    @apply max-w-md;
  }

  .empty-title {
    @apply text-xl font-semibold text-base06 mb-3;
  }

  .empty-description {
    @apply text-base04 leading-relaxed mb-6;
  }

  .empty-actions {
    @apply flex flex-col sm:flex-row gap-3 justify-center;
  }

  .clear-filters-btn {
    @apply px-4 py-2 bg-base0D text-white rounded-lg font-medium;
    @apply hover:bg-base0D/90 transition-colors duration-200;
  }

  .refresh-errors-btn {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-base01 border border-base02;
    @apply rounded-lg font-medium text-base05 hover:bg-base02 hover:border-base03;
    @apply transition-all duration-200;
  }

  /* Modern Error List */
  .errors-list {
    @apply space-y-2;
  }

  .error-row {
    @apply bg-base01 border border-base02 rounded-xl overflow-hidden;
    @apply transition-all duration-200 hover:shadow-sm;
  }

  .error-row:hover {
    @apply border-base03 bg-base01/80;
  }

  .error-row.expanded {
    @apply border-base03 shadow-sm ring-1 ring-base03/20;
  }

  .error-main {
    @apply w-full flex justify-between items-center px-6 py-4;
    @apply cursor-pointer text-left bg-transparent border-none;
    @apply transition-colors duration-200;
  }

  .error-left {
    @apply flex items-center gap-4 flex-1 min-w-0;
  }

  .status-dot {
    @apply w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-transparent;
    @apply bg-base04 transition-all duration-200;
  }

  .status-dot.new {
    @apply bg-base08 ring-base08/20;
  }

  .status-dot.unresolved {
    @apply bg-base09 ring-base09/20;
  }

  .status-dot.resolved {
    @apply bg-base0B ring-base0B/20;
  }

  .status-dot.ignored {
    @apply bg-base03;
  }

  .error-type {
    @apply text-xs font-mono text-base0E bg-base0E/10 px-2 py-1 rounded-md;
  }

  .error-title {
    @apply text-sm text-base05 truncate flex-1 font-medium;
  }

  .error-right {
    @apply flex items-center gap-4 text-xs text-base04;
  }

  .error-svc {
    @apply px-3 py-1 bg-base02 rounded-full text-base05 font-medium;
  }

  .error-occ {
    @apply font-medium text-base09 bg-base09/10 px-2 py-1 rounded-md;
  }

  .error-users {
    @apply text-base04 bg-base02 px-2 py-1 rounded-md;
  }

  .error-time {
    @apply text-base04 font-mono bg-base02 px-2 py-1 rounded-md;
  }

  .chevron {
    @apply text-base04 transition-transform duration-200 text-lg leading-none;
  }

  .error-row.expanded .chevron {
    @apply rotate-90 text-base05;
  }

  /* Modern Error Details */
  .error-details {
    @apply px-6 pb-6 pt-4 bg-base01/50 border-t border-base02;
  }

  .detail-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4;
  }

  .detail {
    @apply flex flex-col gap-2;
  }

  .d-label {
    @apply text-xs text-base04 uppercase tracking-wider font-medium;
  }

  .d-value {
    @apply text-sm text-base05 bg-base02/30 px-3 py-2 rounded-lg;
  }

  code.d-value {
    @apply font-mono text-xs bg-base02/50 px-3 py-2 rounded-lg;
  }

  .task-link {
    @apply inline-flex items-center gap-2 text-sm text-base0D no-underline;
    @apply hover:underline mb-4 font-medium;
  }

  .actions {
    @apply flex gap-3 pt-4 border-t border-base02/50;
  }

  .action-btn {
    @apply px-4 py-2 text-sm rounded-lg cursor-pointer font-medium;
    @apply bg-base02 border border-base03 text-base05 hover:bg-base03 hover:border-base04;
    @apply transition-all duration-200;
  }

  .action-btn.resolve {
    @apply bg-base0B/10 border-base0B/30 text-base0B hover:bg-base0B/20;
  }

  .action-btn.create {
    @apply bg-base0D/10 border-base0D/30 text-base0D hover:bg-base0D/20;
  }

  .action-btn:disabled {
    @apply opacity-40 cursor-not-allowed hover:bg-base02 hover:border-base03;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .stats-overview {
      @apply grid-cols-2;
    }

    .service-grid {
      @apply grid-cols-2;
    }
  }

  @media (max-width: 768px) {
    .page-title {
      @apply text-2xl;
    }

    .header-content {
      @apply flex-col gap-4;
    }

    .filters-bar {
      @apply flex-col items-start gap-3;
    }

    .stats-overview {
      @apply grid-cols-1;
    }

    .service-grid {
      @apply grid-cols-1;
    }

    .error-main {
      @apply px-4 py-3;
    }

    .error-left {
      @apply gap-3;
    }

    .error-right {
      @apply hidden;
    }

    .error-details {
      @apply px-4;
    }

    .detail-grid {
      @apply grid-cols-1;
    }

    .empty-actions {
      @apply flex-col;
    }

    .actions {
      @apply flex-col;
    }
  }

  @media (max-width: 480px) {
    .error-left {
      @apply gap-2;
    }

    .error-type {
      @apply hidden;
    }

    .stat-card {
      @apply p-4;
    }

    .service-card {
      @apply p-3;
    }
  }
</style>
