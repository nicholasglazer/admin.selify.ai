<script>
  import {Badge, Card, EmptyState} from '@miozu/jera';

  let {data} = $props();
  const {services} = data;
</script>

<svelte:head>
  <title>Logs | Selify Admin</title>
</svelte:head>

<div class="logs-page">
  <header class="page-header">
    <div>
      <h1 class="page-title">Service Logs</h1>
      <p class="page-subtitle">Centralized log aggregation</p>
    </div>

    <Badge variant="warning" size="sm">Coming Soon</Badge>
  </header>

  <Card class="coming-soon-main">
    <div class="coming-soon-content">
      <div class="coming-soon-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          <path d="M8 7h6"/>
          <path d="M8 11h8"/>
        </svg>
      </div>
      <h3>SigNoz Integration In Progress</h3>
      <p>Full log aggregation with SigNoz is being integrated. Once complete, this page will provide:</p>
      <ul class="feature-list">
        <li>Real-time logs from all {services.length} monitored services</li>
        <li>Full-text search and filtering</li>
        <li>Log level filtering (error, warn, info, debug)</li>
        <li>Correlation with traces and errors</li>
      </ul>
      <a href="http://localhost:3301" target="_blank" rel="noopener noreferrer" class="external-btn">
        Open SigNoz Dashboard (Local)
      </a>
    </div>
  </Card>

  <section class="services-preview">
    <h2 class="section-title">Monitored Services</h2>
    <Card>
      <div class="services-grid">
        {#each services as service}
          <div class="service-chip">
            <Badge variant="secondary" size="sm">{service}</Badge>
          </div>
        {/each}
        {#if services.length === 0}
          <EmptyState
            title="No services configured"
            description="Service health monitoring will populate this list."
          />
        {/if}
      </div>
    </Card>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .logs-page {
    @apply max-w-4xl;
  }

  .page-header {
    @apply flex justify-between items-center mb-8;
  }

  .page-title {
    @apply text-2xl font-bold text-base07 m-0;
  }

  .page-subtitle {
    @apply text-sm text-base05 mt-1;
  }

  .coming-soon-main {
    @apply mb-8;
  }

  .coming-soon-content {
    @apply py-8 text-center;
  }

  .coming-soon-icon {
    @apply w-16 h-16 mx-auto mb-4 rounded-full;
    @apply bg-base02 flex items-center justify-center;
    @apply text-base04;
  }

  .coming-soon-content h3 {
    @apply text-lg font-semibold text-base06 mb-3;
  }

  .coming-soon-content p {
    @apply text-sm text-base04 mb-4;
  }

  .feature-list {
    @apply text-left max-w-md mx-auto mb-6;
    @apply text-sm text-base05 space-y-2;
  }

  .feature-list li {
    @apply pl-4 relative;
  }

  .feature-list li::before {
    content: '→';
    @apply absolute left-0 text-base0D;
  }

  .external-btn {
    @apply inline-flex items-center gap-2 px-4 py-2;
    @apply bg-base0D text-white rounded-lg;
    @apply hover:bg-base0D/80 transition-colors;
    @apply text-sm font-medium;
  }

  .services-preview {
    @apply mb-8;
  }

  .section-title {
    @apply text-sm font-semibold text-base05 uppercase tracking-wide mb-4;
  }

  .services-grid {
    @apply flex flex-wrap gap-2;
  }

  .service-chip {
    @apply inline-block;
  }
</style>
