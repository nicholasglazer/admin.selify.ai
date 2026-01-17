<script>
  import {Badge, Card, ProgressBar} from '@miozu/jera';

  let {data} = $props();
  const {services, stats, dashboard} = data;

  // Calculate uptime percentage
  const uptimePercent = $derived(
    stats.totalServices > 0 ? Math.round((stats.healthyServices / stats.totalServices) * 100) : 0
  );

  // Response time categories
  function responseTimeCategory(ms) {
    if (ms < 100) return {label: 'Fast', variant: 'success'};
    if (ms < 500) return {label: 'Good', variant: 'primary'};
    if (ms < 1000) return {label: 'Slow', variant: 'warning'};
    return {label: 'Critical', variant: 'error'};
  }
</script>

<svelte:head>
  <title>Metrics | Selify Admin</title>
</svelte:head>

<div class="metrics-page">
  <header class="page-header">
    <h1 class="page-title">System Metrics</h1>
    <p class="page-subtitle">Platform health and performance overview</p>
  </header>

  <!-- Summary Stats -->
  <div class="stats-grid">
    <Card class="stat-card">
      <div class="stat-content">
        <div class="stat-label">System Uptime</div>
        <div class="stat-value">{uptimePercent}%</div>
        <ProgressBar value={uptimePercent} variant={uptimePercent >= 99 ? 'success' : 'warning'} size="sm" />
        <div class="stat-detail">{stats.healthyServices}/{stats.totalServices} services healthy</div>
      </div>
    </Card>

    <Card class="stat-card">
      <div class="stat-content">
        <div class="stat-label">Avg Response Time</div>
        <div class="stat-value">{stats.avgResponseTime}ms</div>
        <Badge variant={responseTimeCategory(stats.avgResponseTime).variant}>
          {responseTimeCategory(stats.avgResponseTime).label}
        </Badge>
      </div>
    </Card>

    <Card class="stat-card">
      <div class="stat-content">
        <div class="stat-label">Active Errors</div>
        <div class="stat-value error">{stats.errorCount}</div>
        <a href="/errors" class="stat-link">View errors</a>
      </div>
    </Card>

    <Card class="stat-card">
      <div class="stat-content">
        <div class="stat-label">Open Tasks</div>
        <div class="stat-value">{stats.openTasks}</div>
        <a href="/pm" class="stat-link">View tasks</a>
      </div>
    </Card>
  </div>

  <!-- Service Response Times -->
  <section class="section">
    <h2 class="section-title">Service Response Times</h2>
    <Card>
      <div class="response-times">
        {#each services.filter((s) => s.response_time_ms !== null) as service}
          <div class="response-row">
            <div class="service-info">
              <span class="service-name">{service.display_name}</span>
              <Badge variant={service.status === 'healthy' ? 'success' : 'error'} size="sm">
                {service.status}
              </Badge>
            </div>
            <div class="response-bar">
              <div
                class="response-fill"
                style="width: {Math.min((service.response_time_ms / 1000) * 100, 100)}%"
                class:fast={service.response_time_ms < 100}
                class:good={service.response_time_ms >= 100 && service.response_time_ms < 500}
                class:slow={service.response_time_ms >= 500}
              ></div>
            </div>
            <span class="response-value">{service.response_time_ms}ms</span>
          </div>
        {/each}
      </div>
    </Card>
  </section>

  <!-- SigNoz Link -->
  <Card class="external-link">
    <div class="external-content">
      <h3>Detailed Metrics in SigNoz</h3>
      <p>For detailed traces, logs, and metrics, visit the SigNoz dashboard.</p>
      <a href="http://localhost:3301" target="_blank" rel="noopener noreferrer" class="external-btn">
        Open SigNoz Dashboard
      </a>
    </div>
  </Card>
</div>

<style lang="postcss">
  @reference '$theme';

  .metrics-page {
    @apply max-w-6xl;
  }

  .page-header {
    @apply mb-8;
  }

  .page-title {
    @apply text-2xl font-bold text-base07 m-0;
  }

  .page-subtitle {
    @apply text-sm text-base05 mt-1;
  }

  .stats-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8;
  }

  :global(.stat-card) {
    @apply p-0;
  }

  .stat-content {
    @apply p-5;
  }

  .stat-label {
    @apply text-xs font-medium text-base04 uppercase tracking-wide mb-2;
  }

  .stat-value {
    @apply text-3xl font-bold text-base07 mb-2;
  }

  .stat-value.error {
    @apply text-base08;
  }

  .stat-detail {
    @apply text-xs text-base04 mt-2;
  }

  .stat-link {
    @apply text-xs text-base0D hover:underline;
  }

  .section {
    @apply mb-8;
  }

  .section-title {
    @apply text-sm font-semibold text-base05 uppercase tracking-wide mb-4;
  }

  .response-times {
    @apply space-y-4;
  }

  .response-row {
    @apply flex items-center gap-4;
  }

  .service-info {
    @apply w-48 flex items-center gap-2;
  }

  .service-name {
    @apply text-sm text-base06 truncate;
  }

  .response-bar {
    @apply flex-1 h-2 bg-base02 rounded-full overflow-hidden;
  }

  .response-fill {
    @apply h-full rounded-full transition-all;
  }

  .response-fill.fast {
    @apply bg-base0B;
  }

  .response-fill.good {
    @apply bg-base0D;
  }

  .response-fill.slow {
    @apply bg-base09;
  }

  .response-value {
    @apply w-16 text-right text-sm font-mono text-base04;
  }

  .external-link {
    @apply text-center;
  }

  .external-content {
    @apply py-8;
  }

  .external-content h3 {
    @apply text-lg font-semibold text-base06 mb-2;
  }

  .external-content p {
    @apply text-sm text-base04 mb-4;
  }

  .external-btn {
    @apply inline-flex items-center gap-2 px-4 py-2;
    @apply bg-base0D text-white rounded-lg;
    @apply hover:bg-base0D/80 transition-colors;
  }

  @media (max-width: 768px) {
    .stats-grid {
      @apply grid-cols-2;
    }

    .service-info {
      @apply w-32;
    }
  }
</style>
