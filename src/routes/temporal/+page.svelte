<script>
  /**
   * Temporal Dashboard - Modern workflow monitoring and management
   *
   * Features:
   * - Workflow list with smart grouping
   * - Quick actions for common workflows
   * - Real-time progress updates
   * - AI-powered search
   * - Workflow actions (cancel, terminate)
   */

  import {getContext, onMount, onDestroy} from 'svelte';
  import {
    Search,
    RefreshCw,
    Activity,
    X,
    Filter,
    Zap,
    Play,
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    MoreVertical,
    Pause
  } from '@lucide/svelte';
  import {Button} from '@miozu/jera';
  import WorkflowTimeline from './WorkflowTimeline.svelte';
  import AIInsightsPanel from './AIInsightsPanel.svelte';
  import QuickActions from './QuickActions.svelte';

  let {data} = $props();

  const temporalState = getContext('temporalState');
  const toastState = getContext('toastState');

  // Initialize state with server data
  onMount(() => {
    if (temporalState) {
      temporalState.workflows = data.workflows || [];
      temporalState.workflowsTotal = data.workflowsTotal || 0;
      temporalState.insights = data.insights || {anomalies: [], suggestions: [], stats: {}};
      temporalState.health = data.health || {status: 'unknown', temporal_connected: false};
      temporalState.connectToRealtimeWorkflows();
      temporalState.trackerVisible = false;
    }
  });

  onDestroy(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
      searchDebounce = null;
    }
    if (temporalState?.hasActive) {
      temporalState.trackerVisible = true;
    } else {
      temporalState?.disconnectStream();
    }
  });

  // Search
  let searchInput = $state('');
  let searchDebounce = null;

  function handleSearch(e) {
    const query = e.target.value;
    searchInput = query;
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      if (query.trim()) {
        temporalState?.searchWorkflows(query);
      } else if (temporalState) {
        temporalState.searchResults = [];
        temporalState.searchQuery = '';
      }
    }, 300);
  }

  function clearSearch() {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchInput = '';
    if (temporalState) {
      temporalState.searchResults = [];
      temporalState.searchQuery = '';
    }
  }

  // UI State
  let showQuickActions = $state(false);
  let showFilters = $state(false);
  let selectedWorkflowId = $state(null);

  // Refresh
  async function refreshData() {
    await Promise.all([
      temporalState?.fetchWorkflows(),
      temporalState?.fetchInsights(),
      temporalState?.fetchHealth()
    ]);
    toastState?.show({
      title: 'Refreshed',
      message: 'Dashboard data updated',
      type: 'success',
      duration: 2000
    });
  }

  // Grouped workflows
  let groupedWorkflows = $derived.by(() => {
    const workflows = temporalState?.searchQuery
      ? temporalState.searchResults
      : temporalState?.workflows || [];

    const running = [];
    const recent = [];
    const healthChecks = [];
    const failed = [];

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const wf of workflows) {
      if (wf.status === 'RUNNING') {
        running.push(wf);
      } else if (wf.status === 'FAILED' || wf.status === 'TERMINATED') {
        failed.push(wf);
      } else if (wf.workflow_type === 'HealthCheckWorkflow') {
        healthChecks.push(wf);
      } else {
        recent.push(wf);
      }
    }

    return {running, recent, healthChecks, failed};
  });

  // Stats
  let stats = $derived({
    running: groupedWorkflows.running.length,
    completed24h: temporalState?.insights?.stats?.completed || 0,
    failed24h: temporalState?.insights?.stats?.failed || 0,
    total: temporalState?.workflowsTotal || 0
  });

  // Status helpers
  const statusConfig = {
    RUNNING: {icon: Loader2, color: 'base0D', animate: true},
    COMPLETED: {icon: CheckCircle2, color: 'base0B', animate: false},
    FAILED: {icon: XCircle, color: 'base08', animate: false},
    TERMINATED: {icon: XCircle, color: 'base08', animate: false},
    CANCELLED: {icon: Pause, color: 'base04', animate: false},
    TIMED_OUT: {icon: Clock, color: 'base09', animate: false}
  };

  function getStatusConfig(status) {
    return statusConfig[status] || statusConfig.RUNNING;
  }

  function formatDuration(ms) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  function formatTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  }

  function selectWorkflow(wf) {
    selectedWorkflowId = wf.workflow_id;
    temporalState?.selectWorkflow(wf);
  }

  function closeDetail() {
    selectedWorkflowId = null;
    temporalState?.clearSelection();
  }
</script>

<div class="temporal-dashboard">
  <!-- AI Insights Banner -->
  {#if temporalState?.hasAnomalies}
    <AIInsightsPanel insights={temporalState.insights} />
  {/if}

  <!-- Header -->
  <header class="dashboard-header">
    <div class="header-top">
      <div class="header-title">
        <h1>Workflows</h1>
        <div class="health-indicator" class:healthy={temporalState?.health?.status === 'healthy'}>
          <span class="health-dot"></span>
          {temporalState?.health?.status || 'unknown'}
        </div>
      </div>

      <div class="header-actions">
        <Button
          variant={showQuickActions ? 'primary' : 'ghost'}
          size="sm"
          onclick={() => (showQuickActions = !showQuickActions)}
        >
          <Play size={14} />
          Quick Actions
          {#if showQuickActions}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
        </Button>
        <Button variant="ghost" size="sm" onclick={refreshData} disabled={temporalState?.isLoading}>
          <RefreshCw size={14} class={temporalState?.isLoading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Quick Actions Panel (collapsible) -->
    {#if showQuickActions}
      <div class="quick-actions-wrapper">
        <QuickActions />
      </div>
    {/if}

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat">
        <span class="stat-value running">{stats.running}</span>
        <span class="stat-label">Running</span>
      </div>
      <div class="stat">
        <span class="stat-value success">{stats.completed24h}</span>
        <span class="stat-label">Completed (24h)</span>
      </div>
      <div class="stat">
        <span class="stat-value error">{stats.failed24h}</span>
        <span class="stat-label">Failed (24h)</span>
      </div>
      <div class="stat">
        <span class="stat-value">{stats.total}</span>
        <span class="stat-label">Total</span>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="search-row">
      <div class="search-wrapper">
        <Search size={16} class="search-icon" />
        <input
          type="text"
          class="search-input"
          placeholder="Search workflows... (try: 'failed today')"
          bind:value={searchInput}
          oninput={handleSearch}
        />
        {#if searchInput}
          <button class="search-clear" onclick={clearSearch} aria-label="Clear search">
            <X size={14} />
          </button>
        {/if}
      </div>

      <button class="filter-btn" class:active={showFilters} onclick={() => (showFilters = !showFilters)}>
        <Filter size={14} />
        Filters
      </button>
    </div>

    {#if temporalState?.searchExplanation && temporalState?.searchQuery}
      <div class="search-explanation">
        <Zap size={12} />
        <span>{temporalState.searchExplanation}</span>
      </div>
    {/if}

    <!-- Filters Row -->
    {#if showFilters}
      <div class="filters-row">
        <select class="filter-select" onchange={(e) => temporalState?.setFilter('status', e.target.value || null)}>
          <option value="">All Statuses</option>
          <option value="RUNNING">Running</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select class="filter-select" onchange={(e) => temporalState?.setFilter('workflowType', e.target.value || null)}>
          <option value="">All Types</option>
          <option value="HealthCheckWorkflow">Health Check</option>
          <option value="PackageCascadeWorkflow">Package Cascade</option>
          <option value="DocumentationWorkflow">Documentation</option>
          <option value="QASchedulerWorkflow">QA Scheduler</option>
          <option value="QATestRunWorkflow">QA Test Run</option>
          <option value="GitPushWorkflow">Git Push</option>
          <option value="TeamOnboardingWorkflow">Team Onboarding</option>
          <option value="ProductGenerationWorkflow">Product Generation</option>
        </select>
        <button class="clear-filters" onclick={() => temporalState?.clearFilters()}>Clear</button>
      </div>
    {/if}
  </header>

  <!-- Main Content -->
  <div class="dashboard-content" class:has-detail={selectedWorkflowId}>
    <!-- Workflow List -->
    <div class="workflows-list">
      {#if temporalState?.isLoading || temporalState?.isSearching}
        <div class="loading-state">
          <Loader2 size={24} class="animate-spin" />
          <span>Loading workflows...</span>
        </div>
      {:else}
        <!-- Running Workflows -->
        {#if groupedWorkflows.running.length > 0}
          <section class="workflow-group">
            <h2 class="group-header">
              <Loader2 size={14} class="animate-spin" />
              Running ({groupedWorkflows.running.length})
            </h2>
            <div class="workflow-cards">
              {#each groupedWorkflows.running as wf}
                <button
                  class="workflow-card running"
                  class:selected={selectedWorkflowId === wf.workflow_id}
                  onclick={() => selectWorkflow(wf)}
                >
                  <div class="card-header">
                    <span class="workflow-type">{wf.workflow_type?.replace('Workflow', '')}</span>
                    <span class="workflow-duration">{formatDuration(wf.execution_time_ms)}</span>
                  </div>
                  <div class="card-id">{wf.workflow_id}</div>
                  <div class="card-meta">
                    <span class="started">Started {formatTime(wf.start_time)}</span>
                  </div>
                </button>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Failed Workflows -->
        {#if groupedWorkflows.failed.length > 0}
          <section class="workflow-group">
            <h2 class="group-header error">
              <XCircle size={14} />
              Failed / Terminated ({groupedWorkflows.failed.length})
            </h2>
            <div class="workflow-cards">
              {#each groupedWorkflows.failed.slice(0, 5) as wf}
                <button
                  class="workflow-card failed"
                  class:selected={selectedWorkflowId === wf.workflow_id}
                  onclick={() => selectWorkflow(wf)}
                >
                  <div class="card-header">
                    <span class="workflow-type">{wf.workflow_type?.replace('Workflow', '')}</span>
                    <span class="workflow-status">{wf.status}</span>
                  </div>
                  <div class="card-id">{wf.workflow_id}</div>
                  <div class="card-meta">
                    <span>{formatTime(wf.close_time || wf.start_time)}</span>
                    <span class="duration">{formatDuration(wf.execution_time_ms)}</span>
                  </div>
                </button>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Recent Workflows -->
        {#if groupedWorkflows.recent.length > 0}
          <section class="workflow-group">
            <h2 class="group-header">
              <Clock size={14} />
              Recent ({groupedWorkflows.recent.length})
            </h2>
            <div class="workflow-cards">
              {#each groupedWorkflows.recent.slice(0, 10) as wf}
                <button
                  class="workflow-card"
                  class:selected={selectedWorkflowId === wf.workflow_id}
                  onclick={() => selectWorkflow(wf)}
                >
                  <div class="card-header">
                    <span class="workflow-type">{wf.workflow_type?.replace('Workflow', '')}</span>
                    <span class="workflow-status success">{wf.status}</span>
                  </div>
                  <div class="card-id">{wf.workflow_id}</div>
                  <div class="card-meta">
                    <span>{formatTime(wf.close_time || wf.start_time)}</span>
                    <span class="duration">{formatDuration(wf.execution_time_ms)}</span>
                  </div>
                </button>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Health Checks (collapsed by default) -->
        {#if groupedWorkflows.healthChecks.length > 0}
          <section class="workflow-group collapsed">
            <details>
              <summary class="group-header collapsible">
                <CheckCircle2 size={14} />
                Health Checks ({groupedWorkflows.healthChecks.length})
                <ChevronDown size={14} class="chevron" />
              </summary>
              <div class="workflow-cards compact">
                {#each groupedWorkflows.healthChecks.slice(0, 20) as wf}
                  <button
                    class="workflow-card compact"
                    class:selected={selectedWorkflowId === wf.workflow_id}
                    onclick={() => selectWorkflow(wf)}
                  >
                    <span class="compact-time">{formatTime(wf.close_time || wf.start_time)}</span>
                    <span class="compact-status" class:success={wf.status === 'COMPLETED'}>{wf.status}</span>
                    <span class="compact-duration">{formatDuration(wf.execution_time_ms)}</span>
                  </button>
                {/each}
              </div>
            </details>
          </section>
        {/if}

        {#if !groupedWorkflows.running.length && !groupedWorkflows.recent.length && !groupedWorkflows.healthChecks.length && !groupedWorkflows.failed.length}
          <div class="empty-state">
            <Activity size={32} />
            <p>No workflows found</p>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Detail Panel (slide-out) -->
    {#if selectedWorkflowId && temporalState?.selectedWorkflow}
      <div class="detail-panel">
        <WorkflowTimeline
          workflow={temporalState.selectedWorkflow}
          history={temporalState.workflowHistory}
          onClose={closeDetail}
          onCancel={(id) => temporalState?.cancelWorkflow(id)}
          onTerminate={(id, reason) => temporalState?.terminateWorkflow(id, reason)}
        />
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .temporal-dashboard {
    @apply flex flex-col h-full;
  }

  /* Header */
  .dashboard-header {
    @apply flex flex-col gap-4 pb-4 border-b mb-4;
    border-color: var(--color-base02);
  }

  .header-top {
    @apply flex items-center justify-between;
  }

  .header-title {
    @apply flex items-center gap-3;
  }

  .header-title h1 {
    @apply text-xl font-semibold;
    color: var(--color-base06);
  }

  .health-indicator {
    @apply flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium;
    background: var(--color-base02);
    color: var(--color-base04);
  }

  .health-indicator.healthy {
    background: color-mix(in srgb, var(--color-base0B) 15%, transparent);
    color: var(--color-base0B);
  }

  .health-dot {
    @apply w-1.5 h-1.5 rounded-full;
    background: currentColor;
  }

  .header-actions {
    @apply flex items-center gap-2;
  }

  /* Quick Actions */
  .quick-actions-wrapper {
    @apply rounded-lg overflow-hidden;
    background: var(--color-base01);
  }

  /* Stats */
  .stats-row {
    @apply flex gap-6;
  }

  .stat {
    @apply flex flex-col;
  }

  .stat-value {
    @apply text-2xl font-bold tabular-nums;
    color: var(--color-base06);
  }

  .stat-value.running {
    color: var(--color-base0D);
  }

  .stat-value.success {
    color: var(--color-base0B);
  }

  .stat-value.error {
    color: var(--color-base08);
  }

  .stat-label {
    @apply text-xs;
    color: var(--color-base04);
  }

  /* Search */
  .search-row {
    @apply flex gap-3;
  }

  .search-wrapper {
    @apply flex-1 relative;
  }

  .search-icon {
    @apply absolute left-3 top-1/2 -translate-y-1/2;
    color: var(--color-base04);
  }

  .search-input {
    @apply w-full py-2 pl-9 pr-9 rounded-lg border text-sm;
    background: var(--color-base01);
    border-color: var(--color-base02);
    color: var(--color-base06);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-base0D);
  }

  .search-input::placeholder {
    color: var(--color-base04);
  }

  .search-clear {
    @apply absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded;
    color: var(--color-base04);
  }

  .search-clear:hover {
    color: var(--color-base06);
    background: var(--color-base02);
  }

  .filter-btn {
    @apply flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium;
    background: var(--color-base01);
    border: 1px solid var(--color-base02);
    color: var(--color-base05);
  }

  .filter-btn:hover,
  .filter-btn.active {
    background: var(--color-base02);
    color: var(--color-base06);
  }

  .search-explanation {
    @apply flex items-center gap-1.5 text-xs;
    color: var(--color-base04);
  }

  /* Filters */
  .filters-row {
    @apply flex items-center gap-3;
  }

  .filter-select {
    @apply px-3 py-1.5 rounded border text-sm;
    background: var(--color-base01);
    border-color: var(--color-base02);
    color: var(--color-base05);
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--color-base0D);
  }

  .clear-filters {
    @apply px-2 py-1 text-xs rounded;
    color: var(--color-base04);
  }

  .clear-filters:hover {
    color: var(--color-base06);
    background: var(--color-base02);
  }

  /* Main Content */
  .dashboard-content {
    @apply flex-1 overflow-hidden;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .dashboard-content.has-detail {
    grid-template-columns: 1fr 420px;
  }

  /* Workflow List */
  .workflows-list {
    @apply overflow-y-auto pr-2;
    max-height: calc(100vh - 340px);
  }

  .loading-state,
  .empty-state {
    @apply flex flex-col items-center justify-center gap-3 py-12;
    color: var(--color-base04);
  }

  /* Workflow Groups */
  .workflow-group {
    @apply mb-6;
  }

  .group-header {
    @apply flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-3;
    color: var(--color-base04);
  }

  .group-header.error {
    color: var(--color-base08);
  }

  .group-header.collapsible {
    @apply cursor-pointer select-none;
  }

  .group-header .chevron {
    @apply ml-auto transition-transform;
  }

  details[open] .group-header .chevron {
    transform: rotate(180deg);
  }

  /* Workflow Cards */
  .workflow-cards {
    @apply grid gap-2;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .workflow-cards.compact {
    grid-template-columns: 1fr;
  }

  .workflow-card {
    @apply flex flex-col gap-1 p-3 rounded-lg text-left transition-all;
    background: var(--color-base01);
    border: 1px solid var(--color-base02);
  }

  .workflow-card:hover {
    background: var(--color-base02);
    border-color: var(--color-base03);
  }

  .workflow-card.selected {
    border-color: var(--color-base0D);
    background: color-mix(in srgb, var(--color-base0D) 10%, var(--color-base01));
  }

  .workflow-card.running {
    border-left: 3px solid var(--color-base0D);
  }

  .workflow-card.failed {
    border-left: 3px solid var(--color-base08);
  }

  .card-header {
    @apply flex items-center justify-between;
  }

  .workflow-type {
    @apply text-sm font-medium;
    color: var(--color-base06);
  }

  .workflow-duration,
  .workflow-status {
    @apply text-xs font-medium px-1.5 py-0.5 rounded;
    background: var(--color-base02);
    color: var(--color-base05);
  }

  .workflow-status.success {
    background: color-mix(in srgb, var(--color-base0B) 15%, transparent);
    color: var(--color-base0B);
  }

  .card-id {
    @apply text-xs font-mono truncate;
    color: var(--color-base04);
  }

  .card-meta {
    @apply flex items-center justify-between text-xs;
    color: var(--color-base04);
  }

  .card-meta .duration {
    color: var(--color-base05);
  }

  /* Compact workflow cards (for health checks) */
  .workflow-card.compact {
    @apply flex-row items-center justify-between py-2 px-3;
  }

  .compact-time {
    @apply text-xs;
    color: var(--color-base04);
  }

  .compact-status {
    @apply text-xs font-medium;
    color: var(--color-base04);
  }

  .compact-status.success {
    color: var(--color-base0B);
  }

  .compact-duration {
    @apply text-xs font-mono;
    color: var(--color-base05);
  }

  /* Detail Panel */
  .detail-panel {
    @apply overflow-hidden rounded-lg;
    background: var(--color-base01);
    border: 1px solid var(--color-base02);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .dashboard-content.has-detail {
      grid-template-columns: 1fr;
    }

    .detail-panel {
      @apply fixed inset-y-0 right-0 w-full max-w-md z-50;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
    }

    .workflow-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
