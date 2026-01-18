<script>
  import {getContext} from 'svelte';

  let {data} = $props();
  const {dashboard, databaseHealth, teamCount, workspaceCount} = data;

  const adminState = getContext('adminState');
  let teamMember = $derived(adminState.teamMember);

  // Derived data
  const dbSummary = $derived(databaseHealth?.summary || {});
  const errorStats = $derived(dashboard?.errors || {});
  const health = $derived({
    services: dashboard?.health?.services_healthy || 0,
    total: dashboard?.health?.services_total || 0,
    uptime: dashboard?.health?.avg_uptime_24h || 0
  });

  const allHealthy = $derived(health.services === health.total && health.total > 0);
  const hasErrors = $derived(errorStats.unresolved_count > 0);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
</script>

<svelte:head>
  <title>Dashboard | Selify Admin</title>
</svelte:head>

<div class="dash">
  <!-- Header -->
  <header class="header">
    <h1>{getGreeting()}, {teamMember?.full_name?.split(' ')[0] || 'Admin'}</h1>
    <p>Platform overview</p>
  </header>

  <!-- Status Bar -->
  <div class="status-bar">
    <div class="status-item" class:healthy={allHealthy} class:warning={!allHealthy}>
      <span class="status-dot"></span>
      <span class="status-text">
        {#if allHealthy}
          All systems operational
        {:else}
          {health.services}/{health.total} services healthy
        {/if}
      </span>
    </div>
    {#if health.uptime}
      <span class="status-divider"></span>
      <span class="status-uptime">{health.uptime}% uptime (24h)</span>
    {/if}
  </div>

  <!-- Primary Metrics -->
  <section class="metrics">
    {#if adminState.hasCap('ops.services.view')}
      <a href="/services" class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Services</span>
          <span class="metric-status" class:ok={allHealthy} class:warn={!allHealthy}></span>
        </div>
        <div class="metric-value">{health.services}<span class="metric-total">/{health.total}</span></div>
        <div class="metric-sub">healthy</div>
      </a>
    {/if}

    {#if adminState.hasCap('ops.metrics.view')}
      <a href="/database" class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Cache</span>
          <span class="metric-status" class:ok={dbSummary.cache_status === 'good'} class:warn={dbSummary.cache_status !== 'good'}></span>
        </div>
        <div class="metric-value">{dbSummary.cache_hit_ratio || 0}<span class="metric-unit">%</span></div>
        <div class="metric-sub">hit ratio</div>
      </a>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Connections</span>
        </div>
        <div class="metric-value">{dbSummary.connections?.current || 0}<span class="metric-total">/{dbSummary.connections?.max || 100}</span></div>
        <div class="metric-bar">
          <div class="metric-bar-fill" style="width: {dbSummary.connections?.usage_percent || 0}%"></div>
        </div>
      </div>
    {/if}

    {#if adminState.hasCap('ops.errors.view')}
      <a href="/errors" class="metric-card" class:has-errors={hasErrors}>
        <div class="metric-header">
          <span class="metric-label">Errors</span>
          {#if hasErrors}
            <span class="metric-status warn"></span>
          {/if}
        </div>
        <div class="metric-value" class:error={hasErrors}>{errorStats.unresolved_count || 0}</div>
        <div class="metric-sub">unresolved</div>
      </a>
    {/if}
  </section>

  <!-- Stats Grid -->
  <section class="stats">
    <h2>Overview</h2>
    <div class="stats-grid">
      {#if adminState.hasCap('team.view')}
        <a href="/team" class="stat">
          <span class="stat-value">{teamCount}</span>
          <span class="stat-label">Team</span>
        </a>
      {/if}

      {#if adminState.hasCap('admin.workspaces.view')}
        <a href="/workspaces" class="stat">
          <span class="stat-value">{workspaceCount}</span>
          <span class="stat-label">Workspaces</span>
        </a>
      {/if}

      {#if adminState.hasCap('ops.metrics.view')}
        <div class="stat">
          <span class="stat-value">{dbSummary.total_tables || 0}</span>
          <span class="stat-label">Tables</span>
        </div>

        <div class="stat">
          <span class="stat-value">{dbSummary.total_rls_policies || 0}</span>
          <span class="stat-label">Policies</span>
        </div>
      {/if}
    </div>
  </section>

  <!-- Quick Navigation -->
  <section class="nav-section">
    <h2>Navigate</h2>
    <div class="nav-grid">
      {#if adminState.hasCap('ops.services.view')}
        <a href="/services" class="nav-item">
          <span class="nav-title">Ops Hub</span>
          <span class="nav-arrow">→</span>
        </a>
      {/if}

      {#if adminState.hasCap('ops.tasks.view')}
        <a href="/pm" class="nav-item">
          <span class="nav-title">PM Board</span>
          <span class="nav-arrow">→</span>
        </a>
      {/if}

      {#if adminState.hasCap('ops.qa.view')}
        <a href="/qa" class="nav-item">
          <span class="nav-title">QA Dashboard</span>
          <span class="nav-arrow">→</span>
        </a>
      {/if}

      {#if adminState.hasCap('team.invite')}
        <a href="/team/onboard" class="nav-item">
          <span class="nav-title">Onboard Member</span>
          <span class="nav-arrow">→</span>
        </a>
      {/if}
    </div>
  </section>

  <!-- External Links -->
  {#if adminState.hasCap('ops.services.view')}
    <section class="external">
      <h2>External</h2>
      <div class="external-row">
        <a href="https://metrics.selify.ai" target="_blank" rel="noopener" class="ext-link">
          SigNoz
        </a>
        <a href="https://temporal.selify.ai" target="_blank" rel="noopener" class="ext-link">
          Temporal
        </a>
        <a href="https://modal.com/apps" target="_blank" rel="noopener" class="ext-link">
          Modal
        </a>
      </div>
    </section>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .dash {
    @apply max-w-4xl mx-auto;
  }

  /* Header */
  .header {
    @apply mb-10;
  }

  .header h1 {
    @apply text-2xl font-semibold text-base06 m-0;
    letter-spacing: -0.02em;
  }

  .header p {
    @apply text-sm text-base04 mt-1;
  }

  /* Status Bar */
  .status-bar {
    @apply flex items-center gap-4 mb-10 py-3 px-4;
    @apply bg-base01/50 rounded-lg;
  }

  .status-item {
    @apply flex items-center gap-2;
  }

  .status-dot {
    @apply w-2 h-2 rounded-full;
  }

  .status-item.healthy .status-dot { @apply bg-base0B; }
  .status-item.warning .status-dot { @apply bg-base09; }

  .status-text {
    @apply text-sm text-base05;
  }

  .status-divider {
    @apply w-px h-4 bg-base03;
  }

  .status-uptime {
    @apply text-sm text-base04;
  }

  /* Primary Metrics */
  .metrics {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12;
  }

  .metric-card {
    @apply p-5 rounded-xl;
    @apply bg-base01 border border-base02;
    @apply transition-all duration-200 no-underline;
  }

  .metric-card:hover {
    @apply border-base03;
  }

  .metric-card.has-errors {
    @apply border-base08/30;
  }

  .metric-header {
    @apply flex items-center justify-between mb-2;
  }

  .metric-label {
    @apply text-xs font-medium text-base04 uppercase tracking-wider;
  }

  .metric-status {
    @apply w-1.5 h-1.5 rounded-full;
  }

  .metric-status.ok { @apply bg-base0B; }
  .metric-status.warn { @apply bg-base09; }

  .metric-value {
    @apply text-3xl font-semibold text-base06;
    letter-spacing: -0.03em;
  }

  .metric-value.error {
    @apply text-base08;
  }

  .metric-total, .metric-unit {
    @apply text-lg text-base04 font-normal;
  }

  .metric-sub {
    @apply text-xs text-base04 mt-1;
  }

  .metric-bar {
    @apply h-1 bg-base02 rounded-full mt-3 overflow-hidden;
  }

  .metric-bar-fill {
    @apply h-full bg-base0D rounded-full transition-all;
  }

  /* Stats */
  .stats {
    @apply mb-12;
  }

  .stats h2, .nav-section h2, .external h2 {
    @apply text-xs font-medium text-base04 uppercase tracking-wider mb-4;
  }

  .stats-grid {
    @apply flex gap-8;
  }

  .stat {
    @apply flex flex-col no-underline;
  }

  .stat:hover .stat-value {
    @apply text-base07;
  }

  .stat-value {
    @apply text-2xl font-semibold text-base05 transition-colors;
    letter-spacing: -0.02em;
  }

  .stat-label {
    @apply text-xs text-base04 mt-0.5;
  }

  /* Navigation */
  .nav-section {
    @apply mb-12;
  }

  .nav-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-3;
  }

  .nav-item {
    @apply flex items-center justify-between;
    @apply py-3 px-4 rounded-lg;
    @apply bg-base01 border border-base02;
    @apply transition-all duration-200 no-underline;
  }

  .nav-item:hover {
    @apply border-base03 bg-base02;
  }

  .nav-title {
    @apply text-sm font-medium text-base05;
  }

  .nav-arrow {
    @apply text-base04 text-sm;
  }

  .nav-item:hover .nav-arrow {
    @apply text-base06;
  }

  /* External */
  .external {
    @apply mb-8;
  }

  .external-row {
    @apply flex gap-3;
  }

  .ext-link {
    @apply text-sm text-base04 no-underline;
    @apply py-2 px-3 rounded-md;
    @apply bg-base01 border border-base02;
    @apply transition-all duration-200;
  }

  .ext-link:hover {
    @apply text-base05 border-base03;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .metrics {
      @apply grid-cols-2;
    }

    .stats-grid {
      @apply grid grid-cols-4 gap-4;
    }

    .nav-grid {
      @apply grid-cols-2;
    }

    .external-row {
      @apply flex-wrap;
    }
  }
</style>
