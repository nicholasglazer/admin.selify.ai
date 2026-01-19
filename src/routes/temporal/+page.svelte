<script>
  /**
   * Temporal Dashboard - Full-featured workflow monitoring and management
   *
   * Features:
   * - Workflow list with filters
   * - AI-powered natural language search
   * - Anomaly detection and insights
   * - Real-time progress updates
   * - Workflow actions (cancel, terminate)
   */

  import {getContext, onMount, onDestroy} from 'svelte';
  import {Search, RefreshCw, Activity, AlertTriangle, Check, X, Clock, Filter, Zap} from '@lucide/svelte';
  import WorkflowList from './WorkflowList.svelte';
  import WorkflowTimeline from './WorkflowTimeline.svelte';
  import AIInsightsPanel from './AIInsightsPanel.svelte';

  let {data} = $props();

  const temporalState = getContext('temporalState');
  const toastState = getContext('toastState');

  // Initialize state with server data
  onMount(() => {
    if (temporalState) {
      // Update state with server data
      temporalState.workflows = data.workflows || [];
      temporalState.workflowsTotal = data.workflowsTotal || 0;
      temporalState.insights = data.insights || {anomalies: [], suggestions: [], stats: {}};
      temporalState.health = data.health || {status: 'unknown', temporal_connected: false};

      // Connect to SSE for real-time updates
      temporalState.connectToActiveStream();

      // Hide the floating tracker since we're on the dashboard
      temporalState.trackerVisible = false;
    }
  });

  onDestroy(() => {
    // Show tracker again when leaving the page (if there are active processes)
    if (temporalState?.hasActive) {
      temporalState.trackerVisible = true;
    }
  });

  // Search handling
  let searchInput = $state('');
  let searchDebounce = null;

  function handleSearch(e) {
    const query = e.target.value;
    searchInput = query;

    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      if (query.trim()) {
        temporalState?.searchWorkflows(query);
      } else {
        temporalState.searchResults = [];
        temporalState.searchQuery = '';
      }
    }, 300);
  }

  function clearSearch() {
    searchInput = '';
    temporalState.searchResults = [];
    temporalState.searchQuery = '';
  }

  // Refresh data
  async function refreshData() {
    await Promise.all([
      temporalState?.fetchWorkflows(),
      temporalState?.fetchInsights(),
      temporalState?.fetchHealth()
    ]);

    if (toastState) {
      toastState.show({
        title: 'Refreshed',
        message: 'Dashboard data updated',
        type: 'success',
        duration: 2000
      });
    }
  }

  // Computed stats
  let stats = $derived({
    running: temporalState?.workflows?.filter((w) => w.status === 'RUNNING').length || 0,
    completed24h: temporalState?.insights?.stats?.completed || 0,
    failed24h: temporalState?.insights?.stats?.failed || 0,
    avgDuration: formatAvgDuration(temporalState?.insights?.stats?.avg_duration_ms)
  });

  function formatAvgDuration(avgMs) {
    if (!avgMs) return '-';
    const avg = Object.values(avgMs)[0];
    if (!avg) return '-';
    if (avg < 1000) return `${avg}ms`;
    if (avg < 60000) return `${(avg / 1000).toFixed(1)}s`;
    return `${Math.floor(avg / 60000)}m`;
  }

  // Filter state
  let showFilters = $state(false);
</script>

<div class="page-flex">
  <!-- AI Insights Banner (if anomalies detected) -->
  {#if temporalState?.hasAnomalies}
    <AIInsightsPanel insights={temporalState.insights} />
  {/if}

  <!-- Header -->
  <header class="page-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="page-title">Temporal Workflows</h1>
        <div class="health-badge" class:healthy={temporalState?.health?.status === 'healthy'}>
          <span class="health-dot"></span>
          <span>{temporalState?.health?.status || 'unknown'}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn-ghost" onclick={() => (showFilters = !showFilters)}>
          <Filter size={16} />
          Filters
        </button>
        <button class="btn-ghost" onclick={refreshData} disabled={temporalState?.isLoading}>
          <RefreshCw size={16} class={temporalState?.isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <Search size={16} class="search-icon" />
        <input
          type="text"
          class="search-input"
          placeholder="Search workflows... (try: 'failed onboarding this week')"
          bind:value={searchInput}
          oninput={handleSearch}
        />
        {#if searchInput}
          <button class="search-clear" onclick={clearSearch}>
            <X size={14} />
          </button>
        {/if}
      </div>
      {#if temporalState?.searchExplanation && temporalState?.searchQuery}
        <div class="search-hint">
          <Zap size={12} />
          <span>{temporalState.searchExplanation}</span>
        </div>
      {/if}
    </div>

    <!-- Filters (collapsible) -->
    {#if showFilters}
      <div class="filters-row">
        <select
          class="filter-select"
          onchange={(e) => temporalState?.setFilter('status', e.target.value || null)}
        >
          <option value="">All Statuses</option>
          <option value="RUNNING">Running</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          class="filter-select"
          onchange={(e) => temporalState?.setFilter('workflowType', e.target.value || null)}
        >
          <option value="">All Types</option>
          <option value="ProductGenerationWorkflow">Product Generation</option>
          <option value="TeamOnboardingWorkflow">Team Onboarding</option>
          <option value="HealthCheckWorkflow">Health Check</option>
          <option value="CatalogIngestionWorkflow">Catalog Ingestion</option>
        </select>

        <select
          class="filter-select"
          onchange={(e) => temporalState?.setFilter('taskQueue', e.target.value || null)}
        >
          <option value="">All Queues</option>
          <option value="product-generation">product-generation</option>
          <option value="internal-ops-queue">internal-ops-queue</option>
          <option value="health-checks">health-checks</option>
        </select>

        <button class="btn-ghost small" onclick={() => temporalState?.clearFilters()}>
          Clear Filters
        </button>
      </div>
    {/if}
  </header>

  <!-- Stats Row -->
  <div class="metric-strip">
    <div class="metric">
      <span class="metric-value text-base0D">{stats.running}</span>
      <span class="metric-label">Running</span>
    </div>
    <div class="metric">
      <span class="metric-value text-base0B">{stats.completed24h}</span>
      <span class="metric-label">Completed (24h)</span>
    </div>
    <div class="metric">
      <span class="metric-value text-base08">{stats.failed24h}</span>
      <span class="metric-label">Failed (24h)</span>
    </div>
    <div class="metric">
      <span class="metric-value">{stats.avgDuration}</span>
      <span class="metric-label">Avg Duration</span>
    </div>
    <div class="metric">
      <span class="metric-value">{temporalState?.workflowsTotal || 0}</span>
      <span class="metric-label">Total</span>
    </div>
  </div>

  <!-- Main Content -->
  <div class="dashboard-grid">
    <!-- Workflow List -->
    <div class="workflows-panel">
      <WorkflowList
        workflows={temporalState?.searchQuery ? temporalState.searchResults : temporalState?.workflows}
        selectedId={temporalState?.selectedWorkflow?.workflow_id}
        onSelect={(w) => temporalState?.selectWorkflow(w)}
        isLoading={temporalState?.isLoading || temporalState?.isSearching}
      />
    </div>

    <!-- Timeline/Detail Panel -->
    <div class="detail-panel">
      {#if temporalState?.selectedWorkflow}
        <WorkflowTimeline
          workflow={temporalState.selectedWorkflow}
          history={temporalState.workflowHistory}
          onClose={() => temporalState?.clearSelection()}
          onCancel={(id) => temporalState?.cancelWorkflow(id)}
          onTerminate={(id, reason) => temporalState?.terminateWorkflow(id, reason)}
        />
      {:else}
        <div class="empty-detail">
          <Activity size={32} class="text-base03" />
          <p>Select a workflow to view details</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  /* Header */
  .page-header {
    @apply mb-6;
  }

  .header-content {
    @apply flex items-center justify-between mb-4;
  }

  .header-left {
    @apply flex items-center gap-4;
  }

  .health-badge {
    @apply flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium;
    background: var(--color-base02);
    color: var(--color-base04);
  }

  .health-badge.healthy {
    background: rgba(var(--color-base0B-rgb, 0, 200, 100), 0.1);
    color: var(--color-base0B);
  }

  .health-dot {
    @apply w-2 h-2 rounded-full;
    background: currentColor;
  }

  .header-actions {
    @apply flex items-center gap-2;
  }

  /* Search */
  .search-container {
    @apply mb-4;
  }

  .search-input-wrapper {
    @apply relative flex items-center;
  }

  .search-icon {
    @apply absolute left-3 text-base04;
  }

  .search-input {
    @apply w-full py-2.5 pl-10 pr-10 rounded-lg border text-sm;
    background: var(--color-base01);
    border-color: var(--color-base02);
    color: var(--color-base06);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-base0D);
    box-shadow: 0 0 0 2px rgba(var(--color-base0D-rgb, 100, 150, 255), 0.1);
  }

  .search-input::placeholder {
    color: var(--color-base04);
  }

  .search-clear {
    @apply absolute right-3 p-1 rounded text-base04 hover:text-base06 hover:bg-base02;
  }

  .search-hint {
    @apply flex items-center gap-1.5 mt-2 text-xs text-base04;
  }

  /* Filters */
  .filters-row {
    @apply flex items-center gap-3 p-3 rounded-lg;
    background: var(--color-base01);
  }

  .filter-select {
    @apply px-3 py-1.5 rounded border text-sm;
    background: var(--color-base00);
    border-color: var(--color-base02);
    color: var(--color-base05);
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--color-base0D);
  }

  /* Buttons */
  .btn-ghost {
    @apply flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors;
    color: var(--color-base05);
    background: transparent;
  }

  .btn-ghost:hover {
    background: var(--color-base02);
    color: var(--color-base06);
  }

  .btn-ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-ghost.small {
    @apply px-2 py-1 text-xs;
  }

  /* Stats */
  .metric-strip {
    @apply flex gap-6 p-4 mb-6 rounded-lg;
    background: var(--color-base01);
  }

  .metric {
    @apply flex flex-col gap-0.5;
  }

  .metric-value {
    @apply text-xl font-semibold;
    color: var(--color-base06);
  }

  .metric-label {
    @apply text-xs;
    color: var(--color-base04);
  }

  /* Grid Layout */
  .dashboard-grid {
    @apply flex-1 grid gap-5;
    grid-template-columns: 1fr 400px;
  }

  .workflows-panel {
    @apply min-h-0 overflow-hidden rounded-lg;
    background: var(--color-base01);
  }

  .detail-panel {
    @apply min-h-0 overflow-hidden rounded-lg;
    background: var(--color-base01);
  }

  .empty-detail {
    @apply flex flex-col items-center justify-center h-full gap-3 p-8 text-center;
    color: var(--color-base04);
  }

  .empty-detail p {
    @apply text-sm;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .detail-panel {
      @apply max-h-[400px];
    }
  }
</style>
