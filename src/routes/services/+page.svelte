<script>
  import {getContext} from 'svelte';
  import {ServiceHealthCard} from '$lib/components/ops';
  import {Tabs} from '@miozu/jera';

  let {data} = $props();

  const adminState = getContext('adminState');

  // Derived from data to handle updates
  let services = $derived(data.services || []);
  let historyByService = $derived(data.historyByService || {});
  let dashboard = $derived(data.dashboard);
  let databaseHealth = $derived(data.databaseHealth);

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

<div class="ops">
  <!-- Header -->
  <header class="header">
    <div>
      <h1>Operations</h1>
      <div class="status-line">
        <span class="status-dot" class:ok={allHealthy} class:warn={!allHealthy}></span>
        <span class="status-text">
          {#if allHealthy}All systems operational{:else}{healthStats.healthy}/{healthStats.total} healthy{/if}
        </span>
        {#if healthStats.uptime}
          <span class="status-sep">·</span>
          <span class="status-uptime">{healthStats.uptime}% uptime</span>
        {/if}
      </div>
    </div>
  </header>

  <!-- Metric Strip -->
  <div class="metric-strip">
    <div class="metric">
      <span class="metric-val">{healthStats.healthy}<span class="metric-dim">/{healthStats.total}</span></span>
      <span class="metric-lbl">Services</span>
    </div>
    <div class="metric">
      <span class="metric-val">{dbSummary.cache_hit_ratio || 0}<span class="metric-dim">%</span></span>
      <span class="metric-lbl">Cache</span>
    </div>
    <div class="metric">
      <span class="metric-val">{dbSummary.connections?.current || 0}<span class="metric-dim">/{dbSummary.connections?.max || 100}</span></span>
      <span class="metric-lbl">Connections</span>
    </div>
    <div class="metric" class:has-error={errorCount > 0}>
      <span class="metric-val">{errorCount}</span>
      <span class="metric-lbl">Errors</span>
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
        <div class="num-row">
          <div class="num-item">
            <span class="num-val">{dbSummary.database_size || '—'}</span>
            <span class="num-lbl">Database</span>
          </div>
          <div class="num-item">
            <span class="num-val">{dbSummary.total_tables || 0}</span>
            <span class="num-lbl">Tables</span>
          </div>
          <div class="num-item">
            <span class="num-val">{dbSummary.total_rls_policies || 0}</span>
            <span class="num-lbl">Policies</span>
          </div>
          <div class="num-item">
            <span class="num-val">{dbLockStats.total_locks || 0}</span>
            <span class="num-lbl">Locks</span>
          </div>
          <div class="num-item" class:warn={dbLockStats.waiting > 0}>
            <span class="num-val">{dbLockStats.waiting || 0}</span>
            <span class="num-lbl">Waiting</span>
          </div>
        </div>

        <!-- Services preview -->
        <section class="section">
          <h2>Services</h2>
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
          <h2>Connections</h2>
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
          <h2>Navigate</h2>
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
          <div class="count-item ok">
            <span class="count-val">{statusCounts.healthy || 0}</span>
            <span class="count-lbl">Healthy</span>
          </div>
          <div class="count-item warn">
            <span class="count-val">{statusCounts.degraded || 0}</span>
            <span class="count-lbl">Degraded</span>
          </div>
          <div class="count-item err">
            <span class="count-val">{statusCounts.unhealthy || 0}</span>
            <span class="count-lbl">Unhealthy</span>
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
          <div class="db-card">
            <span class="db-val">{dbSummary.database_size || '—'}</span>
            <span class="db-lbl">Size</span>
          </div>
          <div class="db-card">
            <span class="db-val">{dbSummary.cache_hit_ratio || 0}%</span>
            <span class="db-lbl">Cache Hit</span>
            <span class="db-tag" class:ok={dbSummary.cache_status === 'good'}>{dbSummary.cache_status || 'unknown'}</span>
          </div>
          <div class="db-card">
            <span class="db-val">{dbSummary.connections?.current || 0}/{dbSummary.connections?.max || 100}</span>
            <span class="db-lbl">Connections</span>
            <div class="db-bar">
              <div class="db-bar-fill" style="width: {dbSummary.connections?.usage_percent || 0}%"></div>
            </div>
          </div>
          <div class="db-card">
            <span class="db-val">{dbLockStats.waiting || 0}</span>
            <span class="db-lbl">Waiting Locks</span>
            <span class="db-tag" class:ok={dbLockStats.waiting === 0} class:warn={dbLockStats.waiting > 0}>
              {dbLockStats.waiting > 0 ? 'contention' : 'clear'}
            </span>
          </div>
        </div>

        <a href="/database" class="db-link">
          <span>Full Database Dashboard</span>
          <span>→</span>
        </a>
      </div>

    {:else if activeTab === 'external'}
      <div class="ext-view" role="tabpanel" id="tabpanel-external" aria-labelledby="tab-external">
        <p class="ext-intro">External monitoring for deep analysis.</p>

        <div class="ext-grid">
          <a href="https://metrics.selify.ai" target="_blank" rel="noopener" class="ext-card">
            <div class="ext-icon">S</div>
            <div class="ext-info">
              <span class="ext-name">SigNoz</span>
              <span class="ext-desc">APM, traces, logs</span>
            </div>
          </a>
          <a href="https://temporal.selify.ai" target="_blank" rel="noopener" class="ext-card">
            <div class="ext-icon">T</div>
            <div class="ext-info">
              <span class="ext-name">Temporal</span>
              <span class="ext-desc">Workflows</span>
            </div>
          </a>
          <a href="https://modal.com/apps" target="_blank" rel="noopener" class="ext-card">
            <div class="ext-icon">M</div>
            <div class="ext-info">
              <span class="ext-name">Modal</span>
              <span class="ext-desc">GPU inference</span>
            </div>
          </a>
          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener" class="ext-card">
            <div class="ext-icon">C</div>
            <div class="ext-info">
              <span class="ext-name">Cloudflare</span>
              <span class="ext-desc">CDN, edge</span>
            </div>
          </a>
        </div>

        <section class="section">
          <h2>Telemetry Coverage</h2>
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

  .ops {
    @apply max-w-5xl mx-auto;
  }

  /* Header */
  .header {
    @apply mb-8;
  }

  .header h1 {
    @apply text-2xl font-semibold text-base06 m-0;
    letter-spacing: -0.02em;
  }

  .status-line {
    @apply flex items-center gap-2 mt-2;
  }

  .status-dot {
    @apply w-2 h-2 rounded-full bg-base04;
  }

  .status-dot.ok { @apply bg-base0B; }
  .status-dot.warn { @apply bg-base09; }

  .status-text {
    @apply text-sm text-base05;
  }

  .status-sep {
    @apply text-base03;
  }

  .status-uptime {
    @apply text-sm text-base04;
  }

  /* Metric Strip */
  .metric-strip {
    @apply flex gap-8 mb-8 pb-6 border-b border-base02;
  }

  .metric {
    @apply flex flex-col;
  }

  .metric.has-error .metric-val {
    @apply text-base08;
  }

  .metric-val {
    @apply text-2xl font-semibold text-base06;
    letter-spacing: -0.02em;
  }

  .metric-dim {
    @apply text-base04 text-lg font-normal;
  }

  .metric-lbl {
    @apply text-xs text-base04 mt-0.5;
  }

  /* Tab Navigation */
  .tab-nav {
    @apply flex gap-1 mb-6;
  }

  .tab-btn {
    @apply px-4 py-2 text-sm font-medium;
    @apply bg-transparent border-none rounded-lg cursor-pointer;
    @apply text-base04 transition-colors;
  }

  .tab-btn:hover {
    @apply text-base05 bg-base01;
  }

  .tab-btn.active {
    @apply text-base06 bg-base02;
  }

  /* Content */
  .content {
    @apply min-h-[400px];
  }

  /* Overview */
  .overview {
    @apply space-y-8;
  }

  .num-row {
    @apply flex gap-8;
  }

  .num-item {
    @apply flex flex-col;
  }

  .num-item.warn .num-val {
    @apply text-base09;
  }

  .num-val {
    @apply text-xl font-semibold text-base05;
  }

  .num-lbl {
    @apply text-xs text-base04 mt-0.5;
  }

  .section {
    @apply space-y-3;
  }

  .section h2 {
    @apply text-xs font-medium text-base04 uppercase tracking-wider m-0;
  }

  /* Service table */
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
    @apply flex gap-4;
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
    @apply flex gap-3;
  }

  .quick-link {
    @apply text-sm text-base04 no-underline;
    @apply py-2 px-3 rounded-lg bg-base01;
    @apply transition-colors;
  }

  .quick-link:hover {
    @apply text-base05 bg-base02;
  }

  /* Services view */
  .services-view {
    @apply space-y-6;
  }

  .status-counts {
    @apply flex gap-6;
  }

  .count-item {
    @apply flex flex-col;
  }

  .count-val {
    @apply text-2xl font-semibold text-base05;
  }

  .count-item.ok .count-val { @apply text-base0B; }
  .count-item.warn .count-val { @apply text-base09; }
  .count-item.err .count-val { @apply text-base08; }

  .count-lbl {
    @apply text-xs text-base04 mt-0.5;
  }

  .services-list {
    @apply space-y-2;
  }

  /* Database view */
  .db-view {
    @apply space-y-6;
  }

  .db-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .db-card {
    @apply flex flex-col p-4 rounded-xl;
    @apply bg-base01 border border-base02;
  }

  .db-val {
    @apply text-2xl font-semibold text-base06;
  }

  .db-lbl {
    @apply text-xs text-base04 mt-1;
  }

  .db-tag {
    @apply text-[10px] uppercase tracking-wider mt-2;
    @apply text-base04;
  }

  .db-tag.ok { @apply text-base0B; }
  .db-tag.warn { @apply text-base09; }

  .db-bar {
    @apply h-1 bg-base02 rounded-full mt-3 overflow-hidden;
  }

  .db-bar-fill {
    @apply h-full bg-base0D rounded-full;
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

  /* External view */
  .ext-view {
    @apply space-y-6;
  }

  .ext-intro {
    @apply text-sm text-base04 m-0;
  }

  .ext-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-3;
  }

  .ext-card {
    @apply flex items-center gap-3 p-3;
    @apply bg-base01 border border-base02 rounded-lg;
    @apply no-underline transition-all;
  }

  .ext-card:hover {
    @apply border-base03;
  }

  .ext-icon {
    @apply w-9 h-9 rounded-lg;
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
    .metric-strip {
      @apply flex-wrap gap-4;
    }

    .num-row {
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
