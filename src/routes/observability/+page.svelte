<script>
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {onMount} from 'svelte';
  import {
    Activity,
    Database,
    BarChart,
    Search,
    RefreshCw,
    ExternalLink,
    Clock,
    AlertCircle,
    CheckCircle,
    Server,
    Filter
  } from '@lucide/svelte';

  let {data} = $props();

  let activeTab = $state(data.activeTab || 'logs');
  let isLoading = $state(false);

  // Logs state
  let serviceLogs = $state(data.initialData?.serviceLogs?.logs || []);
  let selectedLogSource = $state('all');
  let logHours = $state(1);

  // Traces state
  let traces = $state(data.initialData?.traces?.traces?.traces || []);
  let traceServices = $state(data.initialData?.traces?.services?.data || []);
  let selectedTraceService = $state('');

  // Metrics state
  let metricsPresets = $state(data.initialData?.metrics?.presets?.presets || []);
  let metricsHealth = $state(data.initialData?.metrics?.health?.results || []);
  let metricsTargets = $state(data.initialData?.metrics?.targets?.data?.activeTargets || []);
  let selectedMetricPreset = $state('service_health');
  let metricResults = $state([]);

  function switchTab(tab) {
    activeTab = tab;
    goto(`?tab=${tab}`, {replaceState: true});
  }

  async function fetchLogs() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      params.set('hours', logHours.toString());
      params.set('limit', '200');

      const res = await fetch(`${data.apiBaseUrl}/api/ops/logs?${params}`, {
        headers: {'Content-Type': 'application/json'}
      });

      if (res.ok) {
        const result = await res.json();
        serviceLogs = result.logs || [];
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      isLoading = false;
    }
  }

  async function fetchTraces() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      params.set('endpoint', 'traces');
      params.set('limit', '50');
      if (selectedTraceService) params.set('serviceName', selectedTraceService);

      const res = await fetch(`/api/observability/traces?${params}`);
      if (res.ok) {
        const result = await res.json();
        traces = result.traces || [];
      }

      // Also fetch services
      const servicesRes = await fetch('/api/observability/traces?endpoint=services');
      if (servicesRes.ok) {
        const servicesResult = await servicesRes.json();
        traceServices = servicesResult.data || [];
      }
    } catch (err) {
      console.error('Failed to fetch traces:', err);
    } finally {
      isLoading = false;
    }
  }

  async function fetchMetrics(preset = selectedMetricPreset) {
    isLoading = true;
    try {
      const res = await fetch(`/api/observability/metrics?preset=${preset}`);
      if (res.ok) {
        const result = await res.json();
        metricResults = result.results || [];
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      isLoading = false;
    }
  }

  function formatTimestamp(ts) {
    if (!ts) return '—';
    // Zipkin timestamps are in microseconds
    const date = new Date(ts / 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  function formatDuration(microseconds) {
    if (!microseconds) return '—';
    if (microseconds < 1000) return `${microseconds}µs`;
    if (microseconds < 1000000) return `${(microseconds / 1000).toFixed(1)}ms`;
    return `${(microseconds / 1000000).toFixed(2)}s`;
  }

  function getSeverityClass(severity) {
    const s = (severity || '').toLowerCase();
    if (s === 'error' || s === 'fatal') return 'error';
    if (s === 'warn' || s === 'warning') return 'warn';
    return 'info';
  }

  function getHealthStatus(value) {
    return parseFloat(value) === 1 ? 'healthy' : 'unhealthy';
  }
</script>

<svelte:head>
  <title>Observability | Selify Admin</title>
</svelte:head>

<div class="observability-page">
  <!-- Header -->
  <header class="page-header">
    <div class="header-content">
      <div class="header-info">
        <h1 class="page-title">Observability</h1>
        <p class="page-subtitle">Unified logs, traces, and metrics for the entire platform</p>
      </div>
      <div class="header-actions">
        <a href={data.zipkinUrl} target="_blank" rel="noopener" class="external-link" title="Open Zipkin UI">
          <span>Zipkin</span>
          <ExternalLink size={12} />
        </a>
        <a href={data.prometheusUrl} target="_blank" rel="noopener" class="external-link" title="Open Prometheus UI">
          <span>Prometheus</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>

    <!-- Tab Navigation -->
    <nav class="tab-nav">
      <button
        class="tab-btn"
        class:active={activeTab === 'logs'}
        onclick={() => switchTab('logs')}
      >
        <Database size={16} />
        <span>Service Logs</span>
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'traces'}
        onclick={() => switchTab('traces')}
      >
        <Activity size={16} />
        <span>Distributed Traces</span>
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'metrics'}
        onclick={() => switchTab('metrics')}
      >
        <BarChart size={16} />
        <span>Metrics</span>
      </button>
    </nav>
  </header>

  <!-- Tab Content -->
  <div class="tab-content">
    <!-- Logs Tab -->
    {#if activeTab === 'logs'}
      <div class="logs-tab">
        <div class="controls">
          <select bind:value={logHours} onchange={fetchLogs}>
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
          </select>
          <button class="icon-btn" onclick={fetchLogs} disabled={isLoading} title="Refresh">
            <RefreshCw size={14} class={isLoading ? 'spinning' : ''} />
          </button>
        </div>

        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">{serviceLogs.length}</span>
            <span class="stat-label">Total Logs</span>
          </div>
          <div class="stat">
            <span class="stat-value error">{serviceLogs.filter(l => l.severity_text?.toLowerCase() === 'error').length}</span>
            <span class="stat-label">Errors</span>
          </div>
          <div class="stat">
            <span class="stat-value warn">{serviceLogs.filter(l => l.severity_text?.toLowerCase().includes('warn')).length}</span>
            <span class="stat-label">Warnings</span>
          </div>
        </div>

        <div class="log-list">
          {#each serviceLogs.slice(0, 100) as log, i}
            <div class="log-entry {getSeverityClass(log.severity_text)}">
              <div class="log-meta">
                <span class="log-time">{formatTimestamp(log.timestamp ? new Date(log.timestamp).getTime() * 1000 : null)}</span>
                <span class="log-service">{log.service_name || 'unknown'}</span>
                <span class="log-severity {getSeverityClass(log.severity_text)}">{log.severity_text || 'INFO'}</span>
              </div>
              <div class="log-body">{log.body || log.message || '—'}</div>
            </div>
          {/each}
          {#if serviceLogs.length === 0}
            <div class="empty-state">
              <Database size={32} />
              <p>No logs found in the selected time range</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Traces Tab -->
    {#if activeTab === 'traces'}
      <div class="traces-tab">
        <div class="controls">
          <select bind:value={selectedTraceService} onchange={fetchTraces}>
            <option value="">All Services</option>
            {#each traceServices as service}
              <option value={service}>{service}</option>
            {/each}
          </select>
          <button class="icon-btn" onclick={fetchTraces} disabled={isLoading} title="Refresh">
            <RefreshCw size={14} class={isLoading ? 'spinning' : ''} />
          </button>
        </div>

        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">{traces.length}</span>
            <span class="stat-label">Traces</span>
          </div>
          <div class="stat">
            <span class="stat-value">{traceServices.length}</span>
            <span class="stat-label">Services</span>
          </div>
          <div class="stat">
            <span class="stat-value error">{traces.filter(t => t.hasError).length}</span>
            <span class="stat-label">Errors</span>
          </div>
        </div>

        <div class="trace-list">
          {#each traces as trace}
            <div class="trace-entry" class:has-error={trace.hasError}>
              <div class="trace-header">
                <span class="trace-name">{trace.name || 'unknown'}</span>
                <span class="trace-service">{trace.serviceName || '—'}</span>
              </div>
              <div class="trace-meta">
                <span class="trace-time">
                  <Clock size={12} />
                  {formatTimestamp(trace.timestamp)}
                </span>
                <span class="trace-duration">{formatDuration(trace.duration)}</span>
                <span class="trace-spans">{trace.spanCount} spans</span>
                {#if trace.hasError}
                  <span class="trace-error">
                    <AlertCircle size={12} />
                    Error
                  </span>
                {/if}
              </div>
              <div class="trace-services">
                {#each trace.services || [] as svc}
                  <span class="service-tag">{svc}</span>
                {/each}
              </div>
              <a
                href="{data.zipkinUrl}/zipkin/traces/{trace.traceId}"
                target="_blank"
                rel="noopener"
                class="trace-link"
              >
                View in Zipkin
                <ExternalLink size={10} />
              </a>
            </div>
          {/each}
          {#if traces.length === 0}
            <div class="empty-state">
              <Activity size={32} />
              <p>No traces found. Traces are stored in memory and cleared on Zipkin restart.</p>
              <p class="hint">Make some API requests to generate traces.</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Metrics Tab -->
    {#if activeTab === 'metrics'}
      <div class="metrics-tab">
        <div class="controls">
          <select bind:value={selectedMetricPreset} onchange={() => fetchMetrics(selectedMetricPreset)}>
            {#each metricsPresets as preset}
              <option value={preset.name}>{preset.description || preset.name}</option>
            {/each}
          </select>
          <button class="icon-btn" onclick={() => fetchMetrics()} disabled={isLoading} title="Refresh">
            <RefreshCw size={14} class={isLoading ? 'spinning' : ''} />
          </button>
        </div>

        <!-- Service Health Cards -->
        <div class="health-grid">
          {#each metricsHealth as result}
            <div class="health-card {getHealthStatus(result.value)}">
              <div class="health-icon">
                {#if getHealthStatus(result.value) === 'healthy'}
                  <CheckCircle size={20} />
                {:else}
                  <AlertCircle size={20} />
                {/if}
              </div>
              <div class="health-info">
                <span class="health-name">{result.metric?.job || result.metric?.instance || 'Unknown'}</span>
                <span class="health-status">{getHealthStatus(result.value)}</span>
              </div>
            </div>
          {/each}
          {#if metricsHealth.length === 0}
            <div class="empty-state full-width">
              <BarChart size={32} />
              <p>No metrics available. Prometheus may still be starting up.</p>
            </div>
          {/if}
        </div>

        <!-- Prometheus Targets -->
        <section class="targets-section">
          <h3 class="section-header">Scrape Targets</h3>
          <div class="targets-list">
            {#each metricsTargets as target}
              <div class="target-item {target.health}">
                <Server size={14} />
                <span class="target-job">{target.labels?.job || 'unknown'}</span>
                <span class="target-url">{target.scrapeUrl}</span>
                <span class="target-health">{target.health}</span>
              </div>
            {/each}
            {#if metricsTargets.length === 0}
              <p class="muted">No targets configured</p>
            {/if}
          </div>
        </section>

        <!-- Metric Results -->
        {#if metricResults.length > 0}
          <section class="results-section">
            <h3 class="section-header">Query Results: {selectedMetricPreset}</h3>
            <div class="results-table">
              {#each metricResults as result}
                <div class="result-row">
                  <span class="result-metric">{JSON.stringify(result.metric)}</span>
                  <span class="result-value">{result.value}</span>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <div class="prometheus-link">
          <a href="{data.prometheusUrl}/graph" target="_blank" rel="noopener">
            Open Prometheus Query UI
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .observability-page {
    @apply w-full h-full;
  }

  .page-header {
    @apply mb-6;
  }

  .header-content {
    @apply flex items-start justify-between mb-4;
  }

  .page-title {
    @apply text-2xl font-semibold text-base06 mb-1;
  }

  .page-subtitle {
    @apply text-sm text-base04;
  }

  .header-actions {
    @apply flex gap-2;
  }

  .external-link {
    @apply flex items-center gap-1 px-3 py-1.5 rounded text-xs;
    @apply bg-base02 text-base05 hover:bg-base03 hover:text-base06;
    @apply transition-colors;
  }

  .tab-nav {
    @apply flex gap-1 border-b border-base02 pb-0;
  }

  .tab-btn {
    @apply flex items-center gap-2 px-4 py-2 rounded-t-lg;
    @apply text-sm text-base04 hover:text-base06 hover:bg-base02;
    @apply transition-colors cursor-pointer border-b-2 border-transparent;
    @apply -mb-px;
  }

  .tab-btn.active {
    @apply text-base0D bg-base01 border-base0D;
  }

  .tab-content {
    @apply mt-4;
  }

  .controls {
    @apply flex items-center gap-3 mb-4;
  }

  .controls select {
    @apply px-3 py-1.5 rounded bg-base02 text-base05 text-sm;
    @apply border border-base03 focus:border-base0D focus:outline-none;
  }

  .icon-btn {
    @apply p-2 rounded bg-base02 text-base05 hover:bg-base03 hover:text-base06;
    @apply transition-colors cursor-pointer;
  }

  .icon-btn:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .stats-bar {
    @apply flex gap-6 mb-4 p-3 rounded-lg bg-base01;
  }

  .stat {
    @apply flex flex-col;
  }

  .stat-value {
    @apply text-xl font-semibold text-base06;
  }

  .stat-value.error {
    @apply text-base08;
  }

  .stat-value.warn {
    @apply text-base0A;
  }

  .stat-label {
    @apply text-xs text-base04;
  }

  /* Logs Tab */
  .log-list {
    @apply space-y-1 max-h-[60vh] overflow-y-auto;
  }

  .log-entry {
    @apply p-2 rounded bg-base01 border-l-2 border-base03;
    @apply text-xs font-mono;
  }

  .log-entry.error {
    @apply border-base08 bg-base08/10;
  }

  .log-entry.warn {
    @apply border-base0A bg-base0A/10;
  }

  .log-meta {
    @apply flex items-center gap-3 mb-1;
  }

  .log-time {
    @apply text-base04;
  }

  .log-service {
    @apply text-base0D;
  }

  .log-severity {
    @apply px-1.5 py-0.5 rounded text-xs uppercase;
  }

  .log-severity.error {
    @apply bg-base08/20 text-base08;
  }

  .log-severity.warn {
    @apply bg-base0A/20 text-base0A;
  }

  .log-severity.info {
    @apply bg-base0D/20 text-base0D;
  }

  .log-body {
    @apply text-base05 break-all;
  }

  /* Traces Tab */
  .trace-list {
    @apply space-y-2;
  }

  .trace-entry {
    @apply p-3 rounded-lg bg-base01 border border-base02;
  }

  .trace-entry.has-error {
    @apply border-base08/50;
  }

  .trace-header {
    @apply flex items-center gap-3 mb-2;
  }

  .trace-name {
    @apply font-medium text-base06;
  }

  .trace-service {
    @apply text-sm text-base0D;
  }

  .trace-meta {
    @apply flex items-center gap-4 text-xs text-base04 mb-2;
  }

  .trace-time {
    @apply flex items-center gap-1;
  }

  .trace-duration {
    @apply text-base0B;
  }

  .trace-error {
    @apply flex items-center gap-1 text-base08;
  }

  .trace-services {
    @apply flex flex-wrap gap-1 mb-2;
  }

  .service-tag {
    @apply px-2 py-0.5 rounded bg-base02 text-xs text-base05;
  }

  .trace-link {
    @apply inline-flex items-center gap-1 text-xs text-base0D hover:underline;
  }

  /* Metrics Tab */
  .health-grid {
    @apply grid grid-cols-2 md:grid-cols-4 gap-3 mb-6;
  }

  .health-card {
    @apply flex items-center gap-3 p-3 rounded-lg bg-base01 border border-base02;
  }

  .health-card.healthy {
    @apply border-base0B/50;
  }

  .health-card.healthy .health-icon {
    @apply text-base0B;
  }

  .health-card.unhealthy {
    @apply border-base08/50;
  }

  .health-card.unhealthy .health-icon {
    @apply text-base08;
  }

  .health-info {
    @apply flex flex-col;
  }

  .health-name {
    @apply text-sm font-medium text-base06;
  }

  .health-status {
    @apply text-xs text-base04 capitalize;
  }

  .targets-section {
    @apply mb-6;
  }

  .section-header {
    @apply text-xs uppercase text-base04 tracking-wide mb-2;
  }

  .targets-list {
    @apply space-y-1;
  }

  .target-item {
    @apply flex items-center gap-3 p-2 rounded bg-base01 text-xs;
  }

  .target-item.up {
    @apply text-base0B;
  }

  .target-item.down {
    @apply text-base08;
  }

  .target-job {
    @apply font-medium text-base06 min-w-24;
  }

  .target-url {
    @apply text-base04 flex-1 truncate;
  }

  .target-health {
    @apply px-2 py-0.5 rounded uppercase text-xs;
  }

  .results-section {
    @apply mb-4;
  }

  .results-table {
    @apply space-y-1;
  }

  .result-row {
    @apply flex items-center justify-between p-2 rounded bg-base01 text-xs font-mono;
  }

  .result-metric {
    @apply text-base04 truncate max-w-md;
  }

  .result-value {
    @apply text-base0B font-semibold;
  }

  .prometheus-link {
    @apply mt-4 text-center;
  }

  .prometheus-link a {
    @apply inline-flex items-center gap-1 text-sm text-base0D hover:underline;
  }

  /* Empty State */
  .empty-state {
    @apply flex flex-col items-center justify-center py-12 text-base04;
  }

  .empty-state.full-width {
    @apply col-span-full;
  }

  .empty-state p {
    @apply mt-2 text-sm;
  }

  .empty-state .hint {
    @apply text-xs mt-1;
  }

  .muted {
    @apply text-sm text-base04;
  }
</style>
