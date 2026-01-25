<script>
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {Search, FileText, AlertTriangle, Info, Bug, Copy, Check, Filter, RefreshCw, Calendar, X} from '@lucide/svelte';
  import LogHistogram from './LogHistogram.svelte';

  let {data} = $props();
  const {logs, services, stats, filters, hasMore, histogram} = data;

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
  <header class="page-header">
    <div class="header-content">
      <div class="header-info">
        <h1 class="page-title">Application Logs</h1>
        <p class="page-subtitle">Real-time system events and application logs across all services</p>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" title="Refresh logs">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    </div>
    <div class="filters-bar">
      <div class="filter-group">
        <Filter size={14} class="filter-icon" />
        <span class="filter-label">Filter by:</span>
      </div>
      <select
        class="filter-select service-select"
        value={filters.service || ''}
        onchange={(e) => updateFilter('service', e.target.value)}
        aria-label="Filter by service"
      >
        <option value="">All services ({services.reduce((sum, s) => sum + (s.log_count || 0), 0).toLocaleString()})</option>
        {#each services.sort((a, b) => (b.log_count || 0) - (a.log_count || 0)) as service}
          <option value={service.name}>{service.name} ({(service.log_count || 0).toLocaleString()})</option>
        {/each}
      </select>
      <select
        class="filter-select time-filter"
        value={filters.hours}
        onchange={(e) => updateFilter('hours', e.target.value)}
        aria-label="Filter by time period"
      >
        <option value="1">Last hour</option>
        <option value="6">Last 6 hours</option>
        <option value="24">Last 24 hours</option>
        <option value="168">Last 7 days</option>
      </select>
    </div>
  </header>

  <!-- Search Section -->
  <div class="search-section">
    <div class="search-container">
      <div class="search-input-wrapper">
        <Search size={16} class="search-icon" />
        <input
          type="text"
          class="search-input"
          placeholder="Search across all log messages, services, and trace IDs..."
          bind:value={searchInput}
          onkeydown={handleSearch}
        />
        {#if searchInput}
          <button class="clear-search-btn" onclick={clearSearch} title="Clear search">
            <span>&times;</span>
          </button>
        {/if}
      </div>
      {#if filters.search}
        <div class="search-active-indicator">
          <span class="search-badge">Searching: "{filters.search}"</span>
          <button class="clear-filter-btn" onclick={clearSearch} title="Clear filter">
            <span>&times;</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Log Histogram -->
  <LogHistogram data={histogram} />

  <!-- Severity Toggles (Quick Filters) -->
  <div class="severity-toggles">
    <button
      class="severity-toggle"
      class:active={!filters.level}
      onclick={() => updateFilter('level', null)}
    >
      All <span class="toggle-count">{stats.total.toLocaleString()}</span>
    </button>
    <button
      class="severity-toggle error"
      class:active={filters.level === 'error'}
      onclick={() => updateFilter('level', filters.level === 'error' ? null : 'error')}
    >
      <span class="toggle-dot"></span>
      Errors <span class="toggle-count">{stats.errors.toLocaleString()}</span>
    </button>
    <button
      class="severity-toggle warn"
      class:active={filters.level === 'warn'}
      onclick={() => updateFilter('level', filters.level === 'warn' ? null : 'warn')}
    >
      <span class="toggle-dot"></span>
      Warnings <span class="toggle-count">{stats.warnings.toLocaleString()}</span>
    </button>
    <button
      class="severity-toggle info"
      class:active={filters.level === 'info'}
      onclick={() => updateFilter('level', filters.level === 'info' ? null : 'info')}
    >
      <span class="toggle-dot"></span>
      Info <span class="toggle-count">{stats.info.toLocaleString()}</span>
    </button>
  </div>

  <!-- Logs List -->
  <section class="logs-section">
    <h2>Log Entries <span class="count">({logs.length}{hasMore ? '+' : ''})</span></h2>

    {#if logs.length === 0}
      <div class="empty-state">
        <div class="empty-illustration">
          <div class="empty-icon-container">
            <FileText size={48} class="empty-icon" />
            <div class="empty-sparkles">
              <div class="sparkle sparkle-1"></div>
              <div class="sparkle sparkle-2"></div>
              <div class="sparkle sparkle-3"></div>
            </div>
          </div>
        </div>
        <div class="empty-content">
          <h3 class="empty-title">No logs found</h3>
          <p class="empty-description">
            {#if filters.search}
              No logs match your search criteria for <strong>"{filters.search}"</strong>.
              Try adjusting your filters or search terms.
            {:else if filters.service || filters.level}
              No logs found with the current filters applied.
              Try broadening your search or checking a different time range.
            {:else}
              Your applications are running quietly right now.
              Logs will appear here as your services generate events.
            {/if}
          </p>
          <div class="empty-actions">
            {#if filters.search || filters.service || filters.level}
              <button class="clear-filters-btn" onclick={() => {
                searchInput = '';
                updateFilter('search', null);
                updateFilter('service', null);
                updateFilter('level', null);
              }}>
                Clear all filters
              </button>
            {/if}
            <button class="refresh-logs-btn" onclick={() => window.location.reload()}>
              <RefreshCw size={14} />
              Refresh logs
            </button>
          </div>
        </div>
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
                    <button class="action-btn trace" onclick={() => copyToClipboard(log.trace_id, `full-trace-${i}`)}>
                      {#if copiedId === `full-trace-${i}`}
                        <Check size={12} />
                        Copied
                      {:else}
                        <Copy size={12} />
                        Copy Trace ID
                      {/if}
                    </button>
                  {/if}
                  <button class="action-btn" onclick={() => copyToClipboard(JSON.stringify(log, null, 2), `full-log-${i}`)}>
                    {#if copiedId === `full-log-${i}`}
                      <Check size={12} />
                      Copied
                    {:else}
                      <Copy size={12} />
                      Copy Full Log
                    {/if}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      {#if hasMore}
        <div class="load-more">
          <div class="load-more-content">
            <p class="load-more-text">
              Showing the first {logs.length} logs from this time period.
            </p>
            <p class="load-more-hint">
              Use filters above to narrow down results or expand the time range for more data.
            </p>
          </div>
        </div>
      {/if}
    {/if}
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .logs-page {
    @apply w-full min-h-full;
  }

  /* Modern Page Header */
  .page-header {
    @apply mb-8 pb-6 border-b border-base02/50;
  }

  .header-content {
    @apply flex justify-between items-start mb-6;
  }

  .header-info {
    @apply flex-1;
  }

  .page-title {
    @apply text-3xl font-semibold text-base07 mb-2;
    letter-spacing: -0.03em;
  }

  .page-subtitle {
    @apply text-base04 text-base leading-relaxed max-w-2xl;
  }

  .header-actions {
    @apply flex gap-3;
  }

  .refresh-btn {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-base01 border border-base02;
    @apply rounded-lg text-sm font-medium text-base05 hover:bg-base02 hover:border-base03;
    @apply transition-all duration-200 cursor-pointer;
  }

  .filters-bar {
    @apply flex items-center gap-4 flex-wrap;
  }

  .filter-group {
    @apply flex items-center gap-2 text-sm text-base04;
  }

  .filter-icon {
    @apply text-base04;
  }

  .filter-label {
    @apply font-medium;
  }

  .filter-select {
    @apply px-3 py-2 bg-base01 border border-base02 rounded-lg text-sm text-base05;
    @apply hover:border-base03 focus:outline-none focus:border-base0D focus:ring-1 focus:ring-base0D/20;
    @apply transition-all duration-200 cursor-pointer;
  }

  .time-filter {
    @apply bg-base0D/5 border-base0D/30 text-base0D;
  }

  .service-select {
    @apply min-w-[180px];
  }

  /* Severity Toggle Filters */
  .severity-toggles {
    @apply flex flex-wrap gap-2 mb-6;
  }

  .severity-toggle {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-base01 border border-base02;
    @apply rounded-lg text-sm font-medium text-base04 cursor-pointer;
    @apply hover:bg-base02 hover:border-base03 transition-all duration-200;
  }

  .severity-toggle.active {
    @apply bg-base02 border-base03 text-base05;
  }

  .severity-toggle .toggle-dot {
    @apply w-2 h-2 rounded-full bg-current;
  }

  .severity-toggle.error .toggle-dot {
    @apply bg-base08;
  }

  .severity-toggle.warn .toggle-dot {
    @apply bg-base09;
  }

  .severity-toggle.info .toggle-dot {
    @apply bg-base0B;
  }

  .severity-toggle.error.active {
    @apply bg-base08/10 border-base08/30 text-base08;
  }

  .severity-toggle.warn.active {
    @apply bg-base09/10 border-base09/30 text-base09;
  }

  .severity-toggle.info.active {
    @apply bg-base0B/10 border-base0B/30 text-base0B;
  }

  .toggle-count {
    @apply text-xs opacity-70 font-mono;
  }

  /* Modern Search Section */
  .search-section {
    @apply mb-8;
  }

  .search-container {
    @apply space-y-3;
  }

  .search-input-wrapper {
    @apply relative flex items-center max-w-2xl;
    @apply bg-base01 border border-base02 rounded-xl px-4 py-3;
    @apply hover:border-base03 focus-within:border-base0D focus-within:ring-1 focus-within:ring-base0D/20;
    @apply transition-all duration-200;
  }

  .search-input-wrapper :global(.search-icon) {
    @apply text-base04 flex-shrink-0 mr-3;
  }

  .search-input {
    @apply flex-1 bg-transparent border-none text-base05 placeholder:text-base04;
    @apply text-sm leading-relaxed focus:outline-none;
  }

  .clear-search-btn {
    @apply ml-2 p-1 text-base04 hover:text-base05 hover:bg-base02 rounded-md;
    @apply transition-colors duration-200 cursor-pointer flex-shrink-0;
  }

  .clear-search-btn span {
    @apply text-lg leading-none;
  }

  .search-active-indicator {
    @apply flex items-center gap-2;
  }

  .search-badge {
    @apply inline-flex items-center px-3 py-1.5 bg-base0D/10 border border-base0D/30;
    @apply rounded-full text-sm text-base0D;
  }

  .clear-filter-btn {
    @apply ml-2 p-1 text-base0D/70 hover:text-base0D hover:bg-base0D/10 rounded-full;
    @apply transition-colors duration-200 cursor-pointer;
  }

  /* Modern Stats Overview */
  .stats-overview {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8;
  }

  .stat-card {
    @apply bg-base01 border border-base02 rounded-xl p-6;
    @apply hover:border-base03 transition-all duration-200;
    @apply relative overflow-hidden;
  }

  .stat-card::before {
    content: '';
    @apply absolute inset-0 bg-gradient-to-br from-base02/20 to-transparent opacity-0;
    @apply transition-opacity duration-200;
  }

  .stat-card:hover::before {
    @apply opacity-100;
  }

  .stat-card.stat-alert {
    @apply border-base08/30 bg-base08/5;
  }

  .stat-card.stat-alert .stat-icon {
    @apply text-base08;
  }

  .stat-card.stat-warning {
    @apply border-base09/30 bg-base09/5;
  }

  .stat-card.stat-warning .stat-icon {
    @apply text-base09;
  }

  .stat-header {
    @apply flex items-center gap-3 mb-3;
  }

  .stat-icon {
    @apply text-base04;
  }

  .stat-label {
    @apply text-sm font-medium text-base04;
  }

  .stat-value {
    @apply text-2xl font-semibold text-base06 mb-2;
    letter-spacing: -0.02em;
  }

  .stat-alert .stat-value {
    @apply text-base08;
  }

  .stat-warning .stat-value {
    @apply text-base09;
  }

  .stat-trend {
    @apply text-xs px-2 py-1 rounded-full font-medium;
  }

  .stat-trend.error {
    @apply bg-base08/15 text-base08;
  }

  .stat-trend.warning {
    @apply bg-base09/15 text-base09;
  }

  /* Logs Section */
  .logs-section h2 {
    @apply text-sm font-semibold text-base05 mb-6;
    @apply flex items-center gap-3;
  }

  .count {
    @apply text-base04 font-normal bg-base02 px-2 py-1 rounded-md text-xs;
  }

  /* Sophisticated Empty State */
  .empty-state {
    @apply flex flex-col items-center justify-center py-16 px-6 text-center;
  }

  .empty-illustration {
    @apply relative mb-8;
  }

  .empty-icon-container {
    @apply relative;
  }

  .empty-icon {
    @apply text-base03;
  }

  .empty-sparkles {
    @apply absolute inset-0;
  }

  .sparkle {
    @apply absolute w-1 h-1 bg-base0B rounded-full animate-ping;
  }

  .sparkle-1 {
    @apply top-2 left-8;
    animation-delay: 0s;
  }

  .sparkle-2 {
    @apply top-6 right-4;
    animation-delay: 0.5s;
  }

  .sparkle-3 {
    @apply bottom-4 left-6;
    animation-delay: 1s;
  }

  .empty-content {
    @apply max-w-md;
  }

  .empty-title {
    @apply text-xl font-semibold text-base06 mb-3;
  }

  .empty-description {
    @apply text-base04 leading-relaxed mb-6;
  }

  .empty-actions {
    @apply flex flex-col sm:flex-row gap-3 justify-center;
  }

  .clear-filters-btn {
    @apply px-4 py-2 bg-base0D text-white rounded-lg font-medium;
    @apply hover:bg-base0D/90 transition-colors duration-200;
  }

  .refresh-logs-btn {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-base01 border border-base02;
    @apply rounded-lg font-medium text-base05 hover:bg-base02 hover:border-base03;
    @apply transition-all duration-200;
  }

  .logs-list {
    @apply space-y-2;
  }

  .log-row {
    @apply bg-base01 border border-base02 rounded-xl overflow-hidden;
    @apply transition-all duration-200 hover:shadow-sm;
  }

  .log-row:hover {
    @apply border-base03 bg-base01/80;
  }

  .log-row.expanded {
    @apply border-base03 shadow-sm ring-1 ring-base03/20;
  }

  .log-main {
    @apply w-full flex justify-between items-center px-6 py-4;
    @apply cursor-pointer text-left bg-transparent border-none;
    @apply transition-colors duration-200;
  }

  .log-left {
    @apply flex items-center gap-4 flex-1 min-w-0;
  }

  .severity-dot {
    @apply w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-transparent;
    @apply bg-base04 transition-all duration-200;
  }

  .severity-dot.error {
    @apply bg-base08 ring-base08/20;
  }

  .severity-dot.warn {
    @apply bg-base09 ring-base09/20;
  }

  .severity-dot.info {
    @apply bg-base0B ring-base0B/20;
  }

  .severity-dot.debug {
    @apply bg-base03;
  }

  .log-time {
    @apply text-xs font-mono text-base04 flex-shrink-0 bg-base02 px-2 py-1 rounded-md;
  }

  .log-svc {
    @apply text-xs px-3 py-1 bg-base02 rounded-full text-base05 flex-shrink-0 font-medium;
  }

  .log-body {
    @apply text-sm text-base05 truncate flex-1;
  }

  .log-right {
    @apply flex items-center gap-3 text-xs flex-shrink-0;
  }

  .log-level {
    @apply px-3 py-1 rounded-full font-medium uppercase text-[11px] tracking-wide;
    @apply bg-base02 text-base04 transition-colors duration-200;
  }

  .log-level.error { @apply bg-base08/15 text-base08 border border-base08/30; }
  .log-level.warn { @apply bg-base09/15 text-base09 border border-base09/30; }
  .log-level.info { @apply bg-base0B/15 text-base0B border border-base0B/30; }
  .log-level.debug { @apply bg-base03/20 text-base04 border border-base03/30; }

  .chevron {
    @apply text-base04 transition-transform duration-200 text-lg leading-none;
  }

  .log-row.expanded .chevron {
    @apply rotate-90 text-base05;
  }

  /* Modern Log Details */
  .log-details {
    @apply px-6 pb-6 pt-4 bg-base01/50 border-t border-base02;
  }

  .detail-section {
    @apply py-4 border-b border-base02/50;
  }

  .detail-section:last-child {
    @apply border-b-0 pb-0;
  }

  .log-body-full {
    @apply text-sm text-base05 mt-3 p-4 bg-base02/30 rounded-lg border border-base02;
    @apply whitespace-pre-wrap break-words font-mono leading-relaxed;
    @apply max-h-64 overflow-auto;
  }

  .detail-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4;
  }

  .detail {
    @apply flex flex-col gap-2;
  }

  .d-label {
    @apply text-xs text-base04 uppercase tracking-wider font-medium;
  }

  .d-value {
    @apply text-sm text-base05 bg-base02/30 px-3 py-2 rounded-lg;
  }

  .d-value.mono {
    @apply font-mono text-xs;
  }

  .d-value-copy {
    @apply flex items-center gap-2 bg-base02/30 px-3 py-2 rounded-lg;
  }

  .trace-id {
    @apply font-mono text-xs bg-base02/50 px-2 py-1 rounded-md;
  }

  .copy-btn {
    @apply p-1.5 bg-base02 hover:bg-base03 border border-base02 hover:border-base03;
    @apply rounded-md cursor-pointer text-base04 hover:text-base05;
    @apply transition-all duration-200;
  }

  /* Attributes Grid */
  .attrs-grid {
    @apply grid grid-cols-1 gap-3 mt-3;
  }

  .attr {
    @apply flex items-start gap-3 text-sm p-3 bg-base02/20 rounded-lg;
  }

  .attr-key {
    @apply text-base04 font-mono text-xs flex-shrink-0 font-medium min-w-24;
  }

  .attr-val {
    @apply text-base05 break-all flex-1;
  }

  /* Modern Actions */
  .actions {
    @apply flex gap-3 pt-4;
  }

  .action-btn {
    @apply inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium;
    @apply bg-base02 border border-base03 text-base05 hover:bg-base03 hover:border-base04;
    @apply transition-all duration-200 cursor-pointer;
  }

  .action-btn.trace {
    @apply bg-base0D/10 border-base0D/30 text-base0D hover:bg-base0D/20;
  }

  /* Modern Load More */
  .load-more {
    @apply mt-8 p-6 bg-base01 border border-base02 rounded-xl text-center;
  }

  .load-more-content {
    @apply max-w-md mx-auto;
  }

  .load-more-text {
    @apply text-sm text-base05 mb-2;
  }

  .load-more-hint {
    @apply text-xs text-base04 leading-relaxed;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .stats-overview {
      @apply grid-cols-2;
    }
  }

  @media (max-width: 768px) {
    .page-title {
      @apply text-2xl;
    }

    .header-content {
      @apply flex-col gap-4;
    }

    .filters-bar {
      @apply flex-col items-start gap-3;
    }

    .stats-overview {
      @apply grid-cols-1;
    }

    .log-main {
      @apply px-4 py-3;
    }

    .log-left {
      @apply gap-3;
    }

    .log-right {
      @apply hidden;
    }

    .log-details {
      @apply px-4;
    }

    .detail-grid {
      @apply grid-cols-1;
    }

    .search-input-wrapper {
      @apply max-w-full;
    }

    .empty-actions {
      @apply flex-col;
    }

    .actions {
      @apply flex-col;
    }
  }

  @media (max-width: 480px) {
    .log-left {
      @apply gap-2;
    }

    .log-svc {
      @apply hidden;
    }

    .log-time {
      @apply hidden;
    }

    .stat-card {
      @apply p-4;
    }
  }
</style>
