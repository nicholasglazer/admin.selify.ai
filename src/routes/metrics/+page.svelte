<script>
  let {data} = $props();
  const {services, stats, dashboard} = data;

  // Calculate uptime percentage
  const uptimePercent = $derived(
    stats.totalServices > 0 ? Math.round((stats.healthyServices / stats.totalServices) * 100) : 0
  );

  // Response time status
  function rtStatus(ms) {
    if (ms < 100) return 'fast';
    if (ms < 500) return 'good';
    if (ms < 1000) return 'slow';
    return 'critical';
  }
</script>

<svelte:head>
  <title>Metrics | Selify Admin</title>
</svelte:head>

<div class="metrics-page">
  <!-- Header -->
  <header class="header">
    <h1>Metrics</h1>
    <p>System performance</p>
  </header>

  <!-- Summary Strip -->
  <div class="summary-strip">
    <div class="metric">
      <span class="m-val">{uptimePercent}<span class="m-dim">%</span></span>
      <span class="m-lbl">Uptime</span>
      <div class="m-bar">
        <div class="m-bar-fill" class:ok={uptimePercent >= 99} class:warn={uptimePercent < 99} style="width: {uptimePercent}%"></div>
      </div>
    </div>
    <div class="metric">
      <span class="m-val">{stats.avgResponseTime}<span class="m-dim">ms</span></span>
      <span class="m-lbl">Avg Response</span>
      <span class="m-tag" class:fast={stats.avgResponseTime < 100} class:good={stats.avgResponseTime >= 100 && stats.avgResponseTime < 500} class:slow={stats.avgResponseTime >= 500}>
        {rtStatus(stats.avgResponseTime)}
      </span>
    </div>
    <div class="metric" class:alert={stats.errorCount > 0}>
      <span class="m-val">{stats.errorCount}</span>
      <span class="m-lbl">Active Errors</span>
      <a href="/errors" class="m-link">View →</a>
    </div>
    <div class="metric">
      <span class="m-val">{stats.openTasks}</span>
      <span class="m-lbl">Open Tasks</span>
      <a href="/pm" class="m-link">View →</a>
    </div>
  </div>

  <!-- Service Status -->
  <section class="services-section">
    <h2>Services <span class="count">({stats.healthyServices}/{stats.totalServices})</span></h2>

    <div class="services-table">
      <div class="table-header">
        <span class="col-name">Service</span>
        <span class="col-status">Status</span>
        <span class="col-bar">Response Time</span>
        <span class="col-time">Time</span>
      </div>
      {#each services.filter((s) => s.response_time_ms !== null) as service}
        <div class="service-row">
          <span class="col-name">
            <span class="status-dot" class:healthy={service.status === 'healthy'} class:unhealthy={service.status !== 'healthy'}></span>
            {service.display_name}
          </span>
          <span class="col-status">{service.status}</span>
          <span class="col-bar">
            <div class="rt-bar">
              <div
                class="rt-fill"
                style="width: {Math.min((service.response_time_ms / 1000) * 100, 100)}%"
                class:fast={service.response_time_ms < 100}
                class:good={service.response_time_ms >= 100 && service.response_time_ms < 500}
                class:slow={service.response_time_ms >= 500}
              ></div>
            </div>
          </span>
          <span class="col-time">{service.response_time_ms}ms</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- External Link -->
  <section class="external-section">
    <h2>Detailed Metrics</h2>
    <p>For traces, logs, and advanced metrics</p>
    <a href="https://metrics.selify.ai" target="_blank" rel="noopener" class="ext-link">
      Open SigNoz →
    </a>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .metrics-page {
    @apply max-w-5xl mx-auto;
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

  /* Summary Strip */
  .summary-strip {
    @apply grid grid-cols-4 gap-6 mb-12 py-5 px-6;
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

  .m-dim {
    @apply text-base text-base04 font-normal;
  }

  .m-lbl {
    @apply text-xs text-base04 uppercase tracking-wider mt-0.5;
  }

  .m-bar {
    @apply h-1 bg-base02 rounded-full mt-2 overflow-hidden;
  }

  .m-bar-fill {
    @apply h-full rounded-full transition-all;
  }

  .m-bar-fill.ok { @apply bg-base0B; }
  .m-bar-fill.warn { @apply bg-base09; }

  .m-tag {
    @apply text-xs mt-2 px-2 py-0.5 rounded w-fit;
    @apply bg-base02 text-base04;
  }

  .m-tag.fast { @apply bg-base0B/15 text-base0B; }
  .m-tag.good { @apply bg-base0D/15 text-base0D; }
  .m-tag.slow { @apply bg-base09/15 text-base09; }

  .m-link {
    @apply text-xs text-base0D mt-2 no-underline hover:underline;
  }

  /* Services Section */
  .services-section {
    @apply mb-12;
  }

  .services-section h2 {
    @apply text-xs font-medium text-base04 uppercase tracking-wider mb-4;
    @apply flex items-center gap-2;
  }

  .count {
    @apply text-base04 font-normal;
  }

  .services-table {
    @apply bg-base01 border border-base02 rounded-lg overflow-hidden;
  }

  .table-header {
    @apply flex items-center px-4 py-3 border-b border-base02;
    @apply text-xs text-base04 uppercase tracking-wide;
  }

  .service-row {
    @apply flex items-center px-4 py-3 border-b border-base02;
    @apply text-sm transition-colors;
  }

  .service-row:last-child {
    @apply border-b-0;
  }

  .service-row:hover {
    @apply bg-base02/50;
  }

  .col-name {
    @apply flex items-center gap-2 flex-1;
    @apply text-base05;
  }

  .col-status {
    @apply w-24 text-xs text-base04;
  }

  .col-bar {
    @apply flex-1;
  }

  .col-time {
    @apply w-20 text-right font-mono text-xs text-base04;
  }

  .status-dot {
    @apply w-2 h-2 rounded-full;
  }

  .status-dot.healthy { @apply bg-base0B; }
  .status-dot.unhealthy { @apply bg-base08; }

  .rt-bar {
    @apply h-1.5 bg-base02 rounded-full overflow-hidden;
  }

  .rt-fill {
    @apply h-full rounded-full transition-all;
  }

  .rt-fill.fast { @apply bg-base0B; }
  .rt-fill.good { @apply bg-base0D; }
  .rt-fill.slow { @apply bg-base09; }

  /* External Section */
  .external-section {
    @apply py-8 px-6 bg-base01 border border-base02 rounded-lg text-center;
  }

  .external-section h2 {
    @apply text-sm font-medium text-base05 m-0;
  }

  .external-section p {
    @apply text-xs text-base04 mt-1 mb-4;
  }

  .ext-link {
    @apply inline-flex text-sm text-base0D no-underline;
    @apply hover:underline;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .summary-strip {
      @apply grid-cols-2 gap-4;
    }

    .col-bar {
      @apply hidden;
    }

    .col-status {
      @apply hidden;
    }
  }
</style>
