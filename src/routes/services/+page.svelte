<script>
  import {getContext} from 'svelte';
  import {ServiceHealthCard} from '$lib/components/ops';
  import Badge from '$lib/components/Badge.svelte';

  let {data} = $props();
  const {services, historyByService, dashboard} = data;

  // Get admin state from context for capability checking
  const adminState = getContext('adminState');

  // Track expanded cards
  let expandedService = $state(null);

  function toggleExpand(serviceName) {
    expandedService = expandedService === serviceName ? null : serviceName;
  }

  // Count by status
  const statusCounts = $derived(
    services.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {})
  );

  // Dashboard stats
  const errorStats = $derived(dashboard?.errors || {unresolved_count: 0, last_24h_count: 0});
  const healthStats = $derived(dashboard?.health || {});

  // Refresh handler
  async function handleRefresh() {
    // Trigger SvelteKit to refetch data
    location.reload();
  }
</script>

<svelte:head>
  <title>Service Health | Selify Admin</title>
</svelte:head>

<div class="services-page">
  <header class="page-header">
    <div>
      <h1 class="page-title">Service Health</h1>
      <p class="page-subtitle">
        {services.length} services monitored
        {#if healthStats.avg_uptime_24h}
          <span class="uptime-badge">
            {healthStats.avg_uptime_24h}% avg uptime
          </span>
        {/if}
      </p>
    </div>
    <button class="btn-secondary" onclick={handleRefresh}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="mr-2">
        <path d="M14 8A6 6 0 1 1 8 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M8 2V5L11 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Refresh
    </button>
  </header>

  <!-- Status Summary -->
  <div class="status-summary">
    <div class="summary-card healthy">
      <div class="summary-count">{statusCounts.healthy || 0}</div>
      <div class="summary-label">Healthy</div>
    </div>
    <div class="summary-card degraded">
      <div class="summary-count">{statusCounts.degraded || 0}</div>
      <div class="summary-label">Degraded</div>
    </div>
    <div class="summary-card unhealthy">
      <div class="summary-count">{statusCounts.unhealthy || 0}</div>
      <div class="summary-label">Unhealthy</div>
    </div>
    <div class="summary-card errors">
      <div class="summary-count">{errorStats.unresolved_count || 0}</div>
      <div class="summary-label">Errors (24h)</div>
    </div>
  </div>

  <!-- Services List -->
  <section class="services-section">
    <h2 class="section-title">Services</h2>
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
  </section>

  <!-- Quick Actions -->
  {#if adminState.hasCap('ops.services.restart')}
    <section class="actions-section">
      <h2 class="section-title">Quick Actions</h2>
      <div class="actions-grid">
        <button class="action-card" disabled>
          <div class="action-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2v4m0 8v4M2 10h4m8 0h4M4.93 4.93l2.83 2.83m4.48 4.48l2.83 2.83M4.93 15.07l2.83-2.83m4.48-4.48l2.83-2.83"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div class="action-label">Run All Health Checks</div>
        </button>
        <button class="action-card" disabled>
          <div class="action-icon warning">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v8m0 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <div class="action-label">Restart Unhealthy Services</div>
        </button>
      </div>
    </section>
  {/if}

  <!-- External Monitoring Links -->
  <section class="external-links">
    <h2 class="section-title">External Monitoring</h2>
    <div class="links-grid">
      <a href="https://temporal.selify.ai" target="_blank" rel="noopener" class="link-card">
        <div class="link-icon temporal">T</div>
        <div class="link-content">
          <div class="link-name">Temporal UI</div>
          <div class="link-desc">Workflow monitoring</div>
        </div>
      </a>
      <a href="https://metrics.selify.ai" target="_blank" rel="noopener" class="link-card">
        <div class="link-icon signoz">S</div>
        <div class="link-content">
          <div class="link-name">SigNoz</div>
          <div class="link-desc">Metrics, traces & logs</div>
        </div>
      </a>
    </div>
    <p class="deprecation-note">GlitchTip and Uptime Kuma have been replaced with the built-in monitoring above.</p>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .services-page {
    @apply max-w-5xl;
  }

  .page-header {
    @apply flex justify-between items-start mb-8;
  }

  .page-title {
    @apply text-2xl font-bold text-base07 m-0;
  }

  .page-subtitle {
    @apply text-sm text-base05 mt-1 flex items-center gap-3;
  }

  .uptime-badge {
    @apply text-xs bg-base0B/15 text-base0B px-2 py-0.5 rounded-full;
  }

  .btn-secondary {
    @apply flex items-center px-4 py-2.5;
    @apply bg-base01 border border-border rounded-lg;
    @apply text-sm font-medium text-base06;
    @apply cursor-pointer transition-all duration-150;
  }

  .btn-secondary:hover {
    @apply bg-base02 text-base07 border-base03;
  }

  .mr-2 {
    @apply mr-2;
  }

  /* Status Summary */
  .status-summary {
    @apply grid grid-cols-4 gap-4 mb-8;
  }

  .summary-card {
    @apply bg-base01 border border-border rounded-xl p-5 text-center;
    @apply transition-all duration-150;
  }

  .summary-card:hover {
    @apply border-base03;
  }

  .summary-card.healthy {
    @apply border-l-4 border-l-base0B;
  }

  .summary-card.degraded {
    @apply border-l-4 border-l-base09;
  }

  .summary-card.unhealthy {
    @apply border-l-4 border-l-base08;
  }

  .summary-card.errors {
    @apply border-l-4 border-l-base0D;
  }

  .summary-count {
    @apply text-3xl font-bold text-base07;
  }

  .summary-card.healthy .summary-count {
    @apply text-base0B;
  }

  .summary-card.degraded .summary-count {
    @apply text-base09;
  }

  .summary-card.unhealthy .summary-count {
    @apply text-base08;
  }

  .summary-card.errors .summary-count {
    @apply text-base0D;
  }

  .summary-label {
    @apply text-xs text-base04 uppercase tracking-wide mt-1;
  }

  /* Section */
  .section-title {
    @apply text-sm font-semibold text-base05 uppercase tracking-wide mb-4;
  }

  .services-section {
    @apply mb-8;
  }

  .services-list {
    @apply space-y-3;
  }

  /* Actions */
  .actions-section {
    @apply mb-8;
  }

  .actions-grid {
    @apply grid grid-cols-2 gap-4;
  }

  .action-card {
    @apply flex items-center gap-4 p-4;
    @apply bg-base01 border border-border rounded-xl;
    @apply cursor-pointer transition-all duration-150;
    @apply text-left;
  }

  .action-card:hover:not(:disabled) {
    @apply border-base03 bg-base02;
  }

  .action-card:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .action-icon {
    @apply w-10 h-10 rounded-lg bg-base02 flex items-center justify-center;
    @apply text-base0D;
  }

  .action-icon.warning {
    @apply text-base09;
  }

  .action-label {
    @apply text-sm font-medium text-base06;
  }

  /* External Links */
  .external-links {
    @apply mt-8;
  }

  .links-grid {
    @apply grid grid-cols-2 gap-4;
  }

  .link-card {
    @apply flex items-center gap-4 p-4;
    @apply bg-base01 border border-border rounded-xl;
    @apply no-underline transition-all duration-150;
  }

  .link-card:hover {
    @apply border-base0D bg-base02 transform -translate-y-0.5;
  }

  .link-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center;
    @apply text-sm font-bold;
  }

  .link-icon.temporal {
    @apply bg-base0E/20 text-base0E;
  }

  .link-icon.signoz {
    @apply bg-base0C/20 text-base0C;
  }

  .link-content {
    @apply flex flex-col;
  }

  .link-name {
    @apply font-semibold text-base07;
  }

  .link-desc {
    @apply text-xs text-base04;
  }

  .deprecation-note {
    @apply text-xs text-base04 mt-4 text-center italic;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .status-summary {
      @apply grid-cols-2;
    }

    .links-grid,
    .actions-grid {
      @apply grid-cols-1;
    }
  }
</style>
