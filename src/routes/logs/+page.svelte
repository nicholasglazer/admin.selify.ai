<script>
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {Search, ExternalLink, Copy, Check} from '@lucide/svelte';

  let {data} = $props();
  const {logs, services, stats, filters, hasMore} = data;

  // Track expanded log
  let expandedLog = $state(null);
  let searchInput = $state(filters.search || '');
  let copiedId = $state(null);

  function toggleExpand(index) {
    expandedLog = expandedLog === index ? null : index;
  }

  function updateFilter(key, value) {
    const params = new URLSearchParams($page.url.searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    goto(`?${params.toString()}`);
  }

  function handleSearch(e) {
    if (e.key === 'Enter') {
      updateFilter('search', searchInput || null);
    }
  }

  function clearSearch() {
    searchInput = '';
    updateFilter('search', null);
  }

  function formatTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  function getSeverityClass(severity) {
    const s = (severity || '').toLowerCase();
    if (s === 'error' || s === 'fatal') return 'error';
    if (s === 'warn' || s === 'warning') return 'warn';
    if (s === 'debug' || s === 'trace') return 'debug';
    return 'info';
  }

  function truncateBody(body, maxLen = 150) {
    if (!body) return '—';
    if (body.length <= maxLen) return body;
    return body.substring(0, maxLen) + '...';
  }

  async function copyToClipboard(text, id) {
    await navigator.clipboard.writeText(text);
    copiedId = id;
    setTimeout(() => {
      copiedId = null;
    }, 2000);
  }
</script>

<svelte:head>
  <title>Logs | Selify Admin</title>
</svelte:head>

<div class="logs-page">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <h1>Logs</h1>
      <p>Centralized log aggregation via SigNoz</p>
    </div>
    <div class="filters">
      <select
        class="filter"
        value={filters.service || ''}
        onchange={(e) => updateFilter('service', e.target.value)}
        aria-label="Filter by service"
      >
        <option value="">All services</option>
        {#each services as service}
          <option value={service}>{service}</option>
        {/each}
      </select>
      <select
        class="filter"
        value={filters.level || ''}
        onchange={(e) => updateFilter('level', e.target.value)}
        aria-label="Filter by level"
      >
        <option value="">All levels</option>
        <option value="error">Error</option>
        <option value="warn">Warning</option>
        <option value="info">Info</option>
        <option value="debug">Debug</option>
      </select>
      <select
        class="filter"
        value={filters.hours}
        onchange={(e) => updateFilter('hours', e.target.value)}
        aria-label="Filter by time period"
      >
        <option value="1">1h</option>
        <option value="6">6h</option>
        <option value="24">24h</option>
        <option value="168">7d</option>
      </select>
    </div>
  </header>

  <!-- Search Bar -->
  <div class="search-bar">
    <div class="search-input-wrap">
      <Search size={16} class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder="Search logs..."
        bind:value={searchInput}
        onkeydown={handleSearch}
      />
      {#if searchInput}
        <button class="clear-btn" onclick={clearSearch}>&times;</button>
      {/if}
    </div>
    {#if filters.search}
      <span class="search-active">Searching: "{filters.search}"</span>
    {/if}
  </div>

  <!-- Metric Strip -->
  <div class="metric-strip">
    <div class="metric">
      <span class="m-val">{stats.total}</span>
      <span class="m-lbl">Total</span>
    </div>
    <div class="metric" class:alert={stats.errors > 0}>
      <span class="m-val">{stats.errors}</span>
      <span class="m-lbl">Errors</span>
    </div>
    <div class="metric" class:warn={stats.warnings > 0}>
      <span class="m-val">{stats.warnings}</span>
      <span class="m-lbl">Warnings</span>
    </div>
    <div class="metric">
      <span class="m-val">{stats.info}</span>
      <span class="m-lbl">Info</span>
    </div>
  </div>

  <!-- Logs List -->
  <section class="logs-section">
    <h2>Log Entries <span class="count">({logs.length}{hasMore ? '+' : ''})</span></h2>

    {#if logs.length === 0}
      <div class="empty">
        <span class="empty-dot"></span>
        <p>No logs in this period</p>
      </div>
    {:else}
      <div class="logs-list">
        {#each logs as log, i}
          <div class="log-row" class:expanded={expandedLog === i}>
            <button class="log-main" onclick={() => toggleExpand(i)}>
              <div class="log-left">
                <span class="severity-dot {getSeverityClass(log.severity_text)}"></span>
                <span class="log-time">{formatTime(log.timestamp)}</span>
                <span class="log-svc">{log.service_name || 'unknown'}</span>
                <span class="log-body">{truncateBody(log.body)}</span>
              </div>
              <div class="log-right">
                <span class="log-level {getSeverityClass(log.severity_text)}">{log.severity_text || 'INFO'}</span>
                <span class="chevron">›</span>
              </div>
            </button>

            {#if expandedLog === i}
              <div class="log-details">
                <!-- Full body -->
                <div class="detail-section">
                  <span class="d-label">Message</span>
                  <pre class="log-body-full">{log.body || '—'}</pre>
                </div>

                <!-- Metadata grid -->
                <div class="detail-grid">
                  <div class="detail">
                    <span class="d-label">Timestamp</span>
                    <span class="d-value">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <div class="detail">
                    <span class="d-label">Service</span>
                    <span class="d-value">{log.service_name || 'unknown'}</span>
                  </div>
                  <div class="detail">
                    <span class="d-label">Severity</span>
                    <span class="d-value">{log.severity_text} ({log.severity_number || '—'})</span>
                  </div>
                  {#if log.trace_id}
                    <div class="detail">
                      <span class="d-label">Trace ID</span>
                      <div class="d-value-copy">
                        <code class="trace-id">{log.trace_id}</code>
                        <button
                          class="copy-btn"
                          onclick={() => copyToClipboard(log.trace_id, `trace-${i}`)}
                          title="Copy trace ID"
                        >
                          {#if copiedId === `trace-${i}`}
                            <Check size={12} />
                          {:else}
                            <Copy size={12} />
                          {/if}
                        </button>
                      </div>
                    </div>
                  {/if}
                  {#if log.span_id}
                    <div class="detail">
                      <span class="d-label">Span ID</span>
                      <code class="d-value mono">{log.span_id}</code>
                    </div>
                  {/if}
                </div>

                <!-- Attributes -->
                {#if log.attributes && Object.keys(log.attributes).length > 0}
                  <div class="detail-section">
                    <span class="d-label">Attributes</span>
                    <div class="attrs-grid">
                      {#each Object.entries(log.attributes) as [key, value]}
                        <div class="attr">
                          <span class="attr-key">{key}</span>
                          <span class="attr-val">{value}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Resources -->
                {#if log.resources && Object.keys(log.resources).length > 0}
                  <div class="detail-section">
                    <span class="d-label">Resources</span>
                    <div class="attrs-grid">
                      {#each Object.entries(log.resources) as [key, value]}
                        <div class="attr">
                          <span class="attr-key">{key}</span>
                          <span class="attr-val">{value}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Actions -->
                <div class="actions">
                  {#if log.trace_id}
                    <a
                      href="https://metrics.selify.ai/trace/{log.trace_id}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="action-btn trace"
                    >
                      <ExternalLink size={12} />
                      View Trace
                    </a>
                  {/if}
                  <a
                    href="https://metrics.selify.ai/logs"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="action-btn"
                  >
                    <ExternalLink size={12} />
                    Open SigNoz
                  </a>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      {#if hasMore}
        <div class="load-more">
          <p>Showing first {logs.length} logs. Open SigNoz for full results.</p>
        </div>
      {/if}
    {/if}
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .logs-page {
    @apply w-full;
  }

  /* Header */
  .header {
    @apply flex justify-between items-start mb-6 flex-wrap gap-4;
  }

  .header h1 {
    @apply text-2xl font-semibold text-base06 m-0;
    letter-spacing: -0.02em;
  }

  .header p {
    @apply text-sm text-base04 mt-1;
  }

  .filters {
    @apply flex gap-2;
  }

  .filter {
    @apply px-3 py-1.5 bg-base01 border border-base02 rounded-md;
    @apply text-sm text-base05 cursor-pointer;
    @apply focus:outline-none focus:border-base03;
  }

  /* Search Bar */
  .search-bar {
    @apply flex items-center gap-4 mb-6;
  }

  .search-input-wrap {
    @apply flex items-center flex-1 max-w-md;
    @apply bg-base01 border border-base02 rounded-md px-3;
    @apply focus-within:border-base03;
  }

  .search-input-wrap :global(.search-icon) {
    @apply text-base04 flex-shrink-0;
  }

  .search-input {
    @apply flex-1 py-2 px-2 bg-transparent border-none;
    @apply text-sm text-base05 placeholder:text-base04;
    @apply focus:outline-none;
  }

  .clear-btn {
    @apply text-base04 hover:text-base05 cursor-pointer;
    @apply bg-transparent border-none text-lg leading-none px-1;
  }

  .search-active {
    @apply text-xs text-base0D bg-base0D/10 px-2 py-1 rounded;
  }

  /* Metric Strip */
  .metric-strip {
    @apply flex gap-8 mb-8 py-4 px-5;
    @apply bg-base01/50 rounded-lg;
  }

  .metric {
    @apply flex flex-col;
  }

  .metric.alert .m-val {
    @apply text-base08;
  }

  .metric.warn .m-val {
    @apply text-base09;
  }

  .m-val {
    @apply text-2xl font-semibold text-base06;
    letter-spacing: -0.02em;
  }

  .m-lbl {
    @apply text-xs text-base04 uppercase tracking-wider mt-0.5;
  }

  /* Logs Section */
  .logs-section h2 {
    @apply text-xs font-medium text-base04 uppercase tracking-wider mb-4;
    @apply flex items-center gap-2;
  }

  .count {
    @apply text-base04 font-normal;
  }

  .logs-list {
    @apply space-y-1;
  }

  .log-row {
    @apply bg-base01 border border-base02 rounded-lg overflow-hidden;
    @apply transition-all duration-150;
  }

  .log-row:hover {
    @apply border-base03;
  }

  .log-row.expanded {
    @apply border-base03;
  }

  .log-main {
    @apply w-full flex justify-between items-center px-4 py-2.5;
    @apply cursor-pointer text-left bg-transparent border-none;
  }

  .log-left {
    @apply flex items-center gap-3 flex-1 min-w-0;
  }

  .severity-dot {
    @apply w-2 h-2 rounded-full flex-shrink-0;
    @apply bg-base04;
  }

  .severity-dot.error { @apply bg-base08; }
  .severity-dot.warn { @apply bg-base09; }
  .severity-dot.info { @apply bg-base0B; }
  .severity-dot.debug { @apply bg-base03; }

  .log-time {
    @apply text-xs font-mono text-base04 flex-shrink-0;
  }

  .log-svc {
    @apply text-xs px-2 py-0.5 bg-base02 rounded text-base05 flex-shrink-0;
  }

  .log-body {
    @apply text-sm text-base05 truncate;
  }

  .log-right {
    @apply flex items-center gap-3 text-xs flex-shrink-0;
  }

  .log-level {
    @apply px-2 py-0.5 rounded font-medium uppercase text-[10px];
    @apply bg-base02 text-base04;
  }

  .log-level.error { @apply bg-base08/15 text-base08; }
  .log-level.warn { @apply bg-base09/15 text-base09; }
  .log-level.info { @apply bg-base0B/15 text-base0B; }
  .log-level.debug { @apply bg-base03/20 text-base04; }

  .chevron {
    @apply text-base04 transition-transform text-lg leading-none;
  }

  .log-row.expanded .chevron {
    @apply rotate-90;
  }

  /* Log Details */
  .log-details {
    @apply px-4 pb-4 pt-0 border-t border-base02;
  }

  .detail-section {
    @apply py-3 border-b border-base02;
  }

  .detail-section:last-child {
    @apply border-b-0;
  }

  .log-body-full {
    @apply text-sm text-base05 mt-2 p-3 bg-base02/50 rounded;
    @apply whitespace-pre-wrap break-words font-mono;
    @apply max-h-48 overflow-auto;
  }

  .detail-grid {
    @apply grid grid-cols-2 gap-x-8 gap-y-3 py-4;
  }

  .detail {
    @apply flex flex-col gap-1;
  }

  .d-label {
    @apply text-xs text-base04 uppercase tracking-wide;
  }

  .d-value {
    @apply text-sm text-base05;
  }

  .d-value.mono {
    @apply font-mono text-xs;
  }

  .d-value-copy {
    @apply flex items-center gap-2;
  }

  .trace-id {
    @apply font-mono text-xs bg-base02 px-2 py-1 rounded;
  }

  .copy-btn {
    @apply p-1 bg-transparent border-none cursor-pointer;
    @apply text-base04 hover:text-base05 transition-colors;
  }

  /* Attributes Grid */
  .attrs-grid {
    @apply grid grid-cols-1 gap-2 mt-2;
  }

  .attr {
    @apply flex items-start gap-2 text-sm;
  }

  .attr-key {
    @apply text-base04 font-mono text-xs flex-shrink-0;
  }

  .attr-val {
    @apply text-base05 break-all;
  }

  /* Actions */
  .actions {
    @apply flex gap-2 pt-3;
  }

  .action-btn {
    @apply inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md;
    @apply bg-base02 border border-base03 text-base05;
    @apply no-underline cursor-pointer transition-all;
  }

  .action-btn:hover {
    @apply bg-base03;
  }

  .action-btn.trace {
    @apply bg-base0D/10 border-base0D/30 text-base0D;
  }

  /* Empty State */
  .empty {
    @apply flex items-center gap-3 py-12 px-4;
    @apply text-base04 justify-center;
  }

  .empty-dot {
    @apply w-2 h-2 rounded-full bg-base0B;
  }

  /* Load More */
  .load-more {
    @apply text-center py-4 text-sm text-base04;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .metric-strip {
      @apply grid grid-cols-2 gap-4;
    }

    .log-right {
      @apply hidden;
    }

    .filters {
      @apply flex-wrap;
    }

    .detail-grid {
      @apply grid-cols-1;
    }

    .search-input-wrap {
      @apply max-w-full;
    }
  }
</style>
