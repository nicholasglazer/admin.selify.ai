<script>
  /**
   * ServiceHealthCard - Individual service status card with uptime bar and metrics
   *
   * @prop {Object} service - Service data with status, uptime, response time
   * @prop {Array} history - Health check history for the uptime bar
   * @prop {boolean} expanded - Whether to show detailed view
   */

  import {Badge} from '@miozu/jera';
  import UptimeBar from './UptimeBar.svelte';
  import ResponseTimeChart from './ResponseTimeChart.svelte';

  let {service = {}, history = [], expanded = false, onexpand = () => {}, class: className = ''} = $props();

  // Status config
  const statusConfig = {
    healthy: {label: 'Operational', variant: 'success', icon: '●'},
    degraded: {label: 'Degraded', variant: 'warning', icon: '●'},
    unhealthy: {label: 'Outage', variant: 'error', icon: '●'},
    unknown: {label: 'Unknown', variant: 'default', icon: '○'}
  };

  let status = $derived(statusConfig[service.status] || statusConfig.unknown);

  // Format response time
  function formatResponseTime(ms) {
    if (ms === null || ms === undefined) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  // Format uptime
  function formatUptime(percent) {
    if (percent === null || percent === undefined) return '—';
    return `${percent}%`;
  }
</script>

<div class="service-card {expanded ? 'expanded' : ''} {className}">
  <button class="card-header" onclick={() => onexpand()} type="button">
    <div class="service-info">
      <span class="status-indicator {service.status}">
        {status.icon}
      </span>
      <div class="service-details">
        <h3 class="service-name">{service.display_name || service.name}</h3>
        <Badge variant={status.variant} size="xs">
          {status.label}
        </Badge>
      </div>
    </div>

    <div class="service-metrics">
      <div class="metric">
        <span class="metric-label">Response</span>
        <span class="metric-value">{formatResponseTime(service.response_time_ms)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Uptime (24h)</span>
        <span class="metric-value uptime">{formatUptime(service.uptime_24h)}</span>
      </div>
      <div class="expand-icon" class:rotated={expanded}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </button>

  {#if expanded && history.length > 0}
    <div class="card-expanded">
      <div class="uptime-section">
        <h4 class="section-title">Uptime History (90 days)</h4>
        <UptimeBar data={history} buckets={90} height={28} />
      </div>

      <div class="chart-section">
        <h4 class="section-title">Response Time</h4>
        <ResponseTimeChart data={history} height={100} />
      </div>

      {#if service.error_message}
        <div class="error-section">
          <h4 class="section-title">Last Error</h4>
          <div class="error-message">{service.error_message}</div>
        </div>
      {/if}

      <div class="meta-section">
        <div class="meta-item">
          <span class="meta-label">Last checked</span>
          <span class="meta-value">
            {service.last_checked ? new Date(service.last_checked).toLocaleString() : 'Never'}
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .service-card {
    @apply bg-base01 border border-border rounded-xl;
    @apply transition-all duration-200;
  }

  .service-card:hover {
    @apply border-base03;
  }

  .service-card.expanded {
    @apply border-base0D/30;
  }

  .card-header {
    @apply w-full flex items-center justify-between;
    @apply px-4 py-3 cursor-pointer;
    @apply bg-transparent border-none text-left;
  }

  .service-info {
    @apply flex items-center gap-3;
  }

  .status-indicator {
    @apply text-lg;
  }

  .status-indicator.healthy {
    @apply text-base0B;
  }

  .status-indicator.degraded {
    @apply text-base09;
  }

  .status-indicator.unhealthy {
    @apply text-base08;
  }

  .status-indicator.unknown {
    @apply text-base04;
  }

  .service-details {
    @apply flex flex-col gap-1;
  }

  .service-name {
    @apply text-sm font-medium text-base06 m-0;
  }

  .service-metrics {
    @apply flex items-center gap-6;
  }

  .metric {
    @apply flex flex-col items-end;
  }

  .metric-label {
    @apply text-[10px] text-base04 uppercase tracking-wide;
  }

  .metric-value {
    @apply text-sm font-medium text-base05;
  }

  .metric-value.uptime {
    @apply text-base0B;
  }

  .expand-icon {
    @apply text-base04 transition-transform duration-200;
    @apply ml-4;
  }

  .expand-icon.rotated {
    @apply rotate-180;
  }

  .card-expanded {
    @apply px-4 pb-4 space-y-4;
    @apply border-t border-border mt-0 pt-4;
  }

  .section-title {
    @apply text-xs font-medium text-base04 uppercase tracking-wide;
    @apply mb-2 m-0;
  }

  .uptime-section,
  .chart-section {
    @apply py-2;
  }

  .error-section {
    @apply py-2;
  }

  .error-message {
    @apply text-sm text-base08 bg-base08/10;
    @apply px-3 py-2 rounded-lg font-mono;
  }

  .meta-section {
    @apply flex gap-6 pt-2 border-t border-border;
  }

  .meta-item {
    @apply flex flex-col;
  }

  .meta-label {
    @apply text-[10px] text-base04 uppercase tracking-wide;
  }

  .meta-value {
    @apply text-xs text-base05;
  }
</style>
