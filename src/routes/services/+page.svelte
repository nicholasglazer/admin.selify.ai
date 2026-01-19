<script>
  import {getContext} from 'svelte';
  import {ServiceHealthCard} from '$lib/components/ops';
  import {Tabs} from '@miozu/jera';

  let {data} = $props();

  // Get context safely
  let adminState;
  try {
    adminState = getContext('adminState');
  } catch (e) {
    adminState = null;
  }

  // Derived from data to handle updates
  let services = $derived(data?.services ?? []);
  let historyByService = $derived(data?.historyByService ?? {});
  let dashboard = $derived(data?.dashboard ?? null);
  let databaseHealth = $derived(data?.databaseHealth ?? null);

  let expandedService = $state(null);
  let activeTab = $state('overview');

  const tabs = [
    {id: 'overview', label: 'Overview'},
    {id: 'services', label: 'Services'},
    {id: 'database', label: 'Database'},
    {id: 'external', label: 'External'}
  ];

  function toggleExpand(serviceName) {
    expandedService = expandedService === serviceName ? null : serviceName;
  }

  // Computed stats
  const statusCounts = $derived(
    services.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {})
  );

  const healthStats = $derived({
    healthy: dashboard?.health?.services_healthy || 0,
    total: dashboard?.health?.services_total || 0,
    uptime: dashboard?.health?.avg_uptime_24h || 0
  });

  const dbSummary = $derived(databaseHealth?.summary || {});
  const dbLockStats = $derived(databaseHealth?.lock_stats || {});
  const dbConnectionStates = $derived(databaseHealth?.connection_states || {});
  const errorCount = $derived(dashboard?.errors?.unresolved_count || 0);

  const allHealthy = $derived(statusCounts.healthy === services.length && services.length > 0);
</script>

<svelte:head>
  <title>Ops Hub | Selify Admin</title>
</svelte:head>

<div class="page">
  <!-- Header -->
  <header class="page-header">
    <h1 class="page-title">Operations</h1>
    <div class="status-line">
      <span class="status-dot" class:status-dot-ok={allHealthy} class:status-dot-warn={!allHealthy}></span>
      <span class="status-text">
        {#if allHealthy}All systems operational{:else}{healthStats.healthy}/{healthStats.total} healthy{/if}
      </span>
      {#if healthStats.uptime}
        <span class="status-sep">·</span>
        <span class="status-uptime">{healthStats.uptime}% uptime</span>
      {/if}
    </div>
  </header>

  <!-- Metric Strip -->
  <div class="metric-strip-bordered">
    <div class="metric">
      <span class="metric-value">{healthStats.healthy}<span class="metric-dim">/{healthStats.total}</span></span>
      <span class="metric-label">Services</span>
    </div>
    <div class="metric">
      <span class="metric-value">{dbSummary.cache_hit_ratio || 0}<span class="metric-dim">%</span></span>
      <span class="metric-label">Cache</span>
    </div>
    <div class="metric">
      <span class="metric-value">{dbSummary.connections?.current || 0}<span class="metric-dim">/{dbSummary.connections?.max || 100}</span></span>
      <span class="metric-label">Connections</span>
    </div>
    <div class="metric" class:alert={errorCount > 0}>
      <span class="metric-value">{errorCount}</span>
      <span class="metric-label">Errors</span>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tab-nav" role="tablist" aria-label="Service views">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab.id}
        onclick={() => activeTab = tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls="tabpanel-{tab.id}"
        id="tab-{tab.id}"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Content -->
  <div class="content">
    {#if activeTab === 'overview'}
      <div class="overview" role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
        <!-- Quick numbers -->
        <div class="metric-strip">
          <div class="metric">
            <span class="metric-value">{dbSummary.database_size || '—'}</span>
            <span class="metric-label">Database</span>
          </div>
          <div class="metric">
            <span class="metric-value">{dbSummary.total_tables || 0}</span>
            <span class="metric-label">Tables</span>
          </div>
          <div class="metric">
            <span class="metric-value">{dbSummary.total_rls_policies || 0}</span>
            <span class="metric-label">Policies</span>
          </div>
          <div class="metric">
            <span class="metric-value">{dbLockStats.total_locks || 0}</span>
            <span class="metric-label">Locks</span>
          </div>
          <div class="metric" class:alert={dbLockStats.waiting > 0}>
            <span class="metric-value">{dbLockStats.waiting || 0}</span>
            <span class="metric-label">Waiting</span>
          </div>
        </div>

        <!-- Services preview -->
        <section class="section">
          <h2 class="section-header">Services</h2>
          <div class="service-table">
            {#each services.slice(0, 8) as service}
              <div class="service-row">
                <span class="svc-status" class:ok={service.status === 'healthy'} class:err={service.status === 'unhealthy'}></span>
                <span class="svc-name">{service.display_name || service.name}</span>
                <span class="svc-time">{service.response_time_ms ?? '—'}ms</span>
                <span class="svc-uptime">{service.uptime_24h ?? '—'}%</span>
              </div>
            {/each}
          </div>
          {#if services.length > 8}
            <button class="more-btn" onclick={() => activeTab = 'services'}>
              View all {services.length} →
            </button>
          {/if}
        </section>

        <!-- Connection states -->
        <section class="section">
          <h2 class="section-header">Connections</h2>
          <div class="conn-row">
            {#each Object.entries(dbConnectionStates) as [state, count]}
              <div class="conn-item">
                <span class="conn-state">{state || 'unknown'}</span>
                <span class="conn-count">{count}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Quick links -->
        <section class="section">
          <h2 class="section-header">Navigate</h2>
          <div class="link-row">
            <a href="/database" class="quick-link">Database Health →</a>
            <a href="/errors" class="quick-link">Error Tracking →</a>
            <a href="/metrics" class="quick-link">Metrics →</a>
            <a href="/logs" class="quick-link">Logs →</a>
          </div>
        </section>
      </div>

    {:else if activeTab === 'services'}
      <div class="services-view" role="tabpanel" id="tabpanel-services" aria-labelledby="tab-services">
        <!-- Status counts -->
        <div class="status-counts">
          <div class="metric status-ok">
            <span class="metric-value">{statusCounts.healthy || 0}</span>
            <span class="metric-label">Healthy</span>
          </div>
          <div class="metric status-warn">
            <span class="metric-value">{statusCounts.degraded || 0}</span>
            <span class="metric-label">Degraded</span>
          </div>
          <div class="metric status-err">
            <span class="metric-value">{statusCounts.unhealthy || 0}</span>
            <span class="metric-label">Unhealthy</span>
          </div>
        </div>

        <!-- Services list -->
        <div class="services-list">
          {#each services as service}
            <ServiceHealthCard
              {service}
              history={historyByService[service.name] || []}
              expanded={expandedService === service.name}
              onexpand={() => toggleExpand(service.name)}
            />
          {/each}
        </div>
      </div>

    {:else if activeTab === 'database'}
      <div class="db-view" role="tabpanel" id="tabpanel-database" aria-labelledby="tab-database">
        <div class="db-grid">
          <div class="card flex flex-col">
            <span class="metric-value">{dbSummary.database_size || '—'}</span>
            <span class="metric-label">Size</span>
          </div>
          <div class="card flex flex-col">
            <span class="metric-value">{dbSummary.cache_hit_ratio || 0}%</span>
            <span class="metric-label">Cache Hit</span>
            <span class="tag mt-2" class:tag-ok={dbSummary.cache_status === 'good'}>{dbSummary.cache_status || 'unknown'}</span>
          </div>
          <div class="card flex flex-col">
            <span class="metric-value">{dbSummary.connections?.current || 0}/{dbSummary.connections?.max || 100}</span>
            <span class="metric-label">Connections</span>
            <div class="metric-bar">
              <div class="metric-bar-fill bg-base0D" style="width: {dbSummary.connections?.usage_percent || 0}%"></div>
            </div>
          </div>
          <div class="card flex flex-col">
            <span class="metric-value">{dbLockStats.waiting || 0}</span>
            <span class="metric-label">Waiting Locks</span>
            <span class="tag mt-2" class:tag-ok={dbLockStats.waiting === 0} class:tag-warn={dbLockStats.waiting > 0}>
              {dbLockStats.waiting > 0 ? 'contention' : 'clear'}
            </span>
          </div>
        </div>

        <a href="/database" class="db-link card-interactive">
          <span>Full Database Dashboard</span>
          <span>→</span>
        </a>
      </div>

    {:else if activeTab === 'external'}
      <div class="ext-view" role="tabpanel" id="tabpanel-external" aria-labelledby="tab-external">
        <p class="page-subtitle">External monitoring for deep analysis.</p>

        <div class="ext-grid">
          <a href="https://metrics.selify.ai" target="_blank" rel="noopener" class="card card-interactive ext-card">
            <div class="ext-icon">S</div>
            <div class="ext-info">
              <span class="ext-name">SigNoz</span>
              <span class="ext-desc">APM, traces, logs</span>
            </div>
          </a>
          <a href="https://temporal.selify.ai" target="_blank" rel="noopener" class="card card-interactive ext-card">
            <div class="ext-icon">T</div>
            <div class="ext-info">
              <span class="ext-name">Temporal</span>
              <span class="ext-desc">Workflows</span>
            </div>
          </a>
          <a href="https://modal.com/apps" target="_blank" rel="noopener" class="card card-interactive ext-card">
            <div class="ext-icon">M</div>
            <div class="ext-info">
              <span class="ext-name">Modal</span>
              <span class="ext-desc">GPU inference</span>
            </div>
          </a>
          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener" class="card card-interactive ext-card">
            <div class="ext-icon">C</div>
            <div class="ext-info">
              <span class="ext-name">Cloudflare</span>
              <span class="ext-desc">CDN, edge</span>
            </div>
          </a>
        </div>

        <section class="section">
          <h2 class="section-header">Telemetry Coverage</h2>
          <div class="telem-list">
            <div class="telem-group">
              <span class="telem-label">Node.js</span>
              <span class="telem-services">api-tryon, api-billing, sync-shopify, sync-amazon</span>
            </div>
            <div class="telem-group">
              <span class="telem-label">Python</span>
              <span class="telem-services">api-workflow, worker-workflow, worker-internal, bot-commerce</span>
            </div>
            <div class="telem-group">
              <span class="telem-label">Gateway</span>
              <span class="telem-services">kong-gateway</span>
            </div>
          </div>
        </section>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  /* Page Header Status Line */
  .status-line {
    @apply flex items-center gap-2 mt-2;
  }

  .status-text {
    @apply text-sm text-base05;
  }

  .status-sep {
    @apply text-base03;
  }

  .status-uptime {
    @apply text-sm text-base04;
  }

  /* Content */
  .content {
    @apply min-h-[400px];
  }

  /* Overview tab */
  .overview {
    @apply space-y-8;
  }

  .section {
    @apply space-y-3;
  }

  /* Services mini table */
  .service-table {
    @apply space-y-1;
  }

  .service-row {
    @apply flex items-center gap-4 py-2 px-3;
    @apply bg-base01 rounded-lg;
  }

  .svc-status {
    @apply w-1.5 h-1.5 rounded-full bg-base04;
  }

  .svc-status.ok { @apply bg-base0B; }
  .svc-status.err { @apply bg-base08; }

  .svc-name {
    @apply flex-1 text-sm text-base05;
  }

  .svc-time {
    @apply text-xs font-mono text-base04 w-16 text-right;
  }

  .svc-uptime {
    @apply text-xs font-mono text-base04 w-12 text-right;
  }

  .more-btn {
    @apply text-sm text-base04 hover:text-base05;
    @apply bg-transparent border-none cursor-pointer p-0 mt-2;
  }

  /* Connection row */
  .conn-row {
    @apply flex flex-wrap gap-3;
  }

  .conn-item {
    @apply flex items-center gap-2 py-2 px-3;
    @apply bg-base01 rounded-lg;
  }

  .conn-state {
    @apply text-xs text-base04;
  }

  .conn-count {
    @apply text-sm font-semibold text-base05;
  }

  /* Quick links */
  .link-row {
    @apply flex flex-wrap gap-3;
  }

  .quick-link {
    @apply text-sm text-base04 no-underline;
    @apply py-2 px-3 rounded-lg bg-base01;
    @apply transition-colors;
  }

  .quick-link:hover {
    @apply text-base05 bg-base02;
  }

  /* Services tab - status counts with colors */
  .services-view {
    @apply space-y-6;
  }

  .status-counts {
    @apply flex gap-6 mb-6 pb-6 border-b border-base02;
  }

  .status-ok .metric-value { @apply text-base0B; }
  .status-warn .metric-value { @apply text-base09; }
  .status-err .metric-value { @apply text-base08; }

  .services-list {
    @apply space-y-2;
  }

  /* Database tab */
  .db-view {
    @apply space-y-6;
  }

  .db-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .db-link {
    @apply flex items-center justify-between;
    @apply py-3 px-4 rounded-lg;
    @apply bg-base01 border border-base02;
    @apply text-sm text-base05 no-underline;
    @apply transition-colors;
  }

  .db-link:hover {
    @apply border-base03 text-base06;
  }

  /* External tab */
  .ext-view {
    @apply space-y-6;
  }

  .ext-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-3;
  }

  .ext-card {
    @apply flex items-center gap-3;
  }

  .ext-icon {
    @apply w-9 h-9 rounded-lg flex-shrink-0;
    @apply flex items-center justify-center;
    @apply bg-base02 text-base05 font-semibold text-sm;
  }

  .ext-info {
    @apply flex flex-col;
  }

  .ext-name {
    @apply text-sm font-medium text-base05;
  }

  .ext-desc {
    @apply text-xs text-base04;
  }

  /* Telemetry */
  .telem-list {
    @apply space-y-2;
  }

  .telem-group {
    @apply flex items-baseline gap-3 py-2 px-3;
    @apply bg-base01 rounded-lg;
  }

  .telem-label {
    @apply text-xs font-medium text-base04 uppercase w-16;
  }

  .telem-services {
    @apply text-sm text-base05;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .status-counts {
      @apply flex-wrap gap-4;
    }

    .db-grid {
      @apply grid-cols-2;
    }

    .ext-grid {
      @apply grid-cols-2;
    }
  }
</style>
