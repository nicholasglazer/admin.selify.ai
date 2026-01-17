<script>
  import {getContext} from 'svelte';

  let {data} = $props();
  const {services} = data;

  // Get admin state from context for capability checking
  const adminState = getContext('adminState');

  // Status colors
  const statusColors = {
    healthy: 'bg-base0B/20 text-base0B border-base0B/30',
    degraded: 'bg-base09/20 text-base09 border-base09/30',
    unhealthy: 'bg-base08/20 text-base08 border-base08/30',
    unknown: 'bg-base3/50 text-base5 border-base3'
  };

  const statusLabels = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    unhealthy: 'Unhealthy',
    unknown: 'Unknown'
  };

  // Count by status
  const statusCounts = $derived(
    services.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {})
  );
</script>

<svelte:head>
  <title>Services | Selify Admin</title>
</svelte:head>

<div class="services-page">
  <header class="page-header">
    <div>
      <h1 class="page-title">Service Health</h1>
      <p class="page-subtitle">{services.length} services monitored</p>
    </div>
    <button class="btn-secondary" onclick={() => location.reload()}>
      Refresh
    </button>
  </header>

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
    <div class="summary-card unknown">
      <div class="summary-count">{statusCounts.unknown || 0}</div>
      <div class="summary-label">Unknown</div>
    </div>
  </div>

  <div class="services-grid">
    {#each services as service}
      <div class="service-card {service.status}">
        <div class="service-header">
          <div class="service-name">{service.name}</div>
          <span class="status-badge {statusColors[service.status]}">
            {statusLabels[service.status]}
          </span>
        </div>

        <div class="service-details">
          {#if service.latency !== null && service.latency !== undefined}
            <div class="detail-row">
              <span class="detail-label">Latency</span>
              <span class="detail-value">{service.latency}ms</span>
            </div>
          {/if}
          <div class="detail-row">
            <span class="detail-label">Type</span>
            <span class="detail-value">{service.type || 'internal'}</span>
          </div>
          {#if service.error}
            <div class="error-message">{service.error}</div>
          {/if}
        </div>

        {#if adminState.hasCap('ops.services.restart') && service.status !== 'healthy'}
          <div class="service-actions">
            <button class="btn-restart">Restart</button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <section class="external-links">
    <h2 class="section-title">External Monitoring</h2>
    <div class="links-grid">
      <a href="https://temporal.selify.ai" target="_blank" rel="noopener" class="link-card">
        <div class="link-name">Temporal UI</div>
        <div class="link-desc">Workflow monitoring</div>
      </a>
      <a href="https://metrics.selify.ai" target="_blank" rel="noopener" class="link-card">
        <div class="link-name">SigNoz</div>
        <div class="link-desc">Metrics & tracing</div>
      </a>
      <a href="https://ops.selify.ai" target="_blank" rel="noopener" class="link-card">
        <div class="link-name">Uptime Kuma</div>
        <div class="link-desc">Uptime monitoring</div>
      </a>
      <a href="https://err.selify.ai" target="_blank" rel="noopener" class="link-card">
        <div class="link-name">GlitchTip</div>
        <div class="link-desc">Error tracking</div>
      </a>
    </div>
  </section>
</div>

<style>
  .services-page {
    max-width: 1200px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-base7);
    margin: 0;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--color-base5);
    margin-top: 0.25rem;
  }

  .btn-secondary {
    padding: 0.625rem 1.25rem;
    background: var(--color-base1);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-base6);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-secondary:hover {
    background: var(--color-base2);
    color: var(--color-base7);
  }

  .status-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .summary-card {
    background: var(--color-base1);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1.25rem;
    text-align: center;
  }

  .summary-card.healthy {
    border-color: var(--color-base0B)/30;
  }

  .summary-card.degraded {
    border-color: var(--color-base09)/30;
  }

  .summary-card.unhealthy {
    border-color: var(--color-base08)/30;
  }

  .summary-count {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-base7);
  }

  .summary-card.healthy .summary-count {
    color: var(--color-base0B);
  }

  .summary-card.degraded .summary-count {
    color: var(--color-base09);
  }

  .summary-card.unhealthy .summary-count {
    color: var(--color-base08);
  }

  .summary-label {
    font-size: 0.75rem;
    color: var(--color-base5);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    margin-top: 0.25rem;
  }

  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .service-card {
    background: var(--color-base1);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .service-card.healthy {
    border-left: 3px solid var(--color-base0B);
  }

  .service-card.degraded {
    border-left: 3px solid var(--color-base09);
  }

  .service-card.unhealthy {
    border-left: 3px solid var(--color-base08);
  }

  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .service-name {
    font-weight: 600;
    color: var(--color-base7);
    font-size: 0.9375rem;
  }

  .status-badge {
    display: inline-flex;
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 9999px;
    border: 1px solid;
  }

  .service-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.8125rem;
  }

  .detail-label {
    color: var(--color-base5);
  }

  .detail-value {
    color: var(--color-base6);
    font-family: monospace;
  }

  .error-message {
    font-size: 0.75rem;
    color: var(--color-base08);
    background: var(--color-base08)/10;
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin-top: 0.5rem;
  }

  .service-actions {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }

  .btn-restart {
    width: 100%;
    padding: 0.5rem;
    background: var(--color-base08)/10;
    border: 1px solid var(--color-base08)/30;
    border-radius: 0.375rem;
    color: var(--color-base08);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-restart:hover {
    background: var(--color-base08)/20;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-base6);
    margin-bottom: 1rem;
  }

  .links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .link-card {
    background: var(--color-base1);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    text-decoration: none;
    transition: all 0.15s;
  }

  .link-card:hover {
    border-color: var(--color-base0D);
    transform: translateY(-2px);
  }

  .link-name {
    font-weight: 600;
    color: var(--color-base7);
    margin-bottom: 0.25rem;
  }

  .link-desc {
    font-size: 0.75rem;
    color: var(--color-base5);
  }

  .external-links {
    margin-top: 2rem;
  }
</style>
