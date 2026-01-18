<script>
  let {data} = $props();
  const {health, error: loadError} = data;

  const summary = $derived(health?.summary || {});
  const sequentialScans = $derived(health?.sequential_scans || []);
  const unusedIndexes = $derived(health?.unused_indexes || []);
  const largestTables = $derived(health?.largest_tables || []);
  const slowQueries = $derived(health?.slow_queries || []);
  const indexEfficiency = $derived(health?.index_efficiency || []);
  const tableBloat = $derived(health?.table_bloat || []);
  const activeQueries = $derived(health?.active_queries || []);
  const blockedQueries = $derived(health?.blocked_queries || []);
  const lockStats = $derived(health?.lock_stats || {});
  const authEvents = $derived(health?.auth_events || []);
  const connectionStates = $derived(health?.connection_states || {});
  const longTransactions = $derived(health?.long_transactions || []);

  function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  function formatTime(timestamp) {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString();
  }
</script>

<svelte:head>
  <title>Database | Selify Admin</title>
</svelte:head>

<div class="db-page">
  <header class="header">
    <h1>Database</h1>
    <p>PostgreSQL health and performance</p>
  </header>

  {#if loadError}
    <div class="error-box">
      <p>Failed to load: {loadError}</p>
    </div>
  {:else}
    <!-- Primary metrics -->
    <div class="metric-row">
      <div class="metric">
        <span class="m-val">{summary.database_size || '—'}</span>
        <span class="m-lbl">Size</span>
      </div>
      <div class="metric">
        <span class="m-val">{summary.cache_hit_ratio || 0}<span class="m-dim">%</span></span>
        <span class="m-lbl">Cache Hit</span>
        <span class="m-tag" class:ok={summary.cache_status === 'good'}>{summary.cache_status || '—'}</span>
      </div>
      <div class="metric">
        <span class="m-val">{summary.connections?.current || 0}<span class="m-dim">/{summary.connections?.max || 100}</span></span>
        <span class="m-lbl">Connections</span>
        <div class="m-bar">
          <div class="m-bar-fill" style="width: {summary.connections?.usage_percent || 0}%"></div>
        </div>
      </div>
      <div class="metric">
        <span class="m-val">{summary.total_tables || 0}</span>
        <span class="m-lbl">Tables</span>
      </div>
      <div class="metric">
        <span class="m-val">{summary.total_rls_policies || 0}</span>
        <span class="m-lbl">RLS Policies</span>
      </div>
    </div>

    <!-- Locks & Connections -->
    <div class="two-col">
      <section class="section">
        <h2>Locks</h2>
        <div class="lock-row">
          <div class="lock-item">
            <span class="lock-val">{lockStats.total_locks || 0}</span>
            <span class="lock-lbl">Total</span>
          </div>
          <div class="lock-item">
            <span class="lock-val ok">{lockStats.granted || 0}</span>
            <span class="lock-lbl">Granted</span>
          </div>
          <div class="lock-item">
            <span class="lock-val" class:warn={lockStats.waiting > 0}>{lockStats.waiting || 0}</span>
            <span class="lock-lbl">Waiting</span>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Connection States</h2>
        <div class="conn-row">
          {#each Object.entries(connectionStates) as [state, count]}
            <div class="conn-item">
              <span class="conn-state">{state || 'unknown'}</span>
              <span class="conn-count">{count}</span>
            </div>
          {/each}
        </div>
      </section>
    </div>

    <!-- Active Queries -->
    <section class="section">
      <h2>Active Queries</h2>
      {#if activeQueries.length === 0}
        <p class="empty">No active queries</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PID</th>
                <th>User</th>
                <th>State</th>
                <th>Duration</th>
                <th>Query</th>
              </tr>
            </thead>
            <tbody>
              {#each activeQueries as q}
                <tr>
                  <td class="mono">{q.pid}</td>
                  <td class="mono">{q.username || '—'}</td>
                  <td><span class="tag" class:active={q.state === 'active'}>{q.state}</span></td>
                  <td><span class="tag" class:warn={q.duration_seconds > 10}>{formatDuration(q.duration_seconds)}</span></td>
                  <td class="query">{q.query_preview}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <!-- Blocked Queries -->
    {#if blockedQueries.length > 0}
      <section class="section warn-section">
        <h2>Blocked Queries</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Blocked</th>
                <th>Query</th>
                <th>Waiting</th>
                <th>Blocking</th>
                <th>Blocking Query</th>
              </tr>
            </thead>
            <tbody>
              {#each blockedQueries as q}
                <tr>
                  <td class="mono err">{q.blocked_pid}</td>
                  <td class="query">{q.blocked_query}</td>
                  <td><span class="tag err">{formatDuration(q.waiting_seconds)}</span></td>
                  <td class="mono">{q.blocking_pid}</td>
                  <td class="query">{q.blocking_query}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}

    <!-- Long Transactions -->
    {#if longTransactions.length > 0}
      <section class="section warn-section">
        <h2>Long Transactions (&gt;30s)</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PID</th>
                <th>User</th>
                <th>Duration</th>
                <th>State</th>
                <th>Query</th>
              </tr>
            </thead>
            <tbody>
              {#each longTransactions as t}
                <tr>
                  <td class="mono">{t.pid}</td>
                  <td class="mono">{t.username}</td>
                  <td><span class="tag warn">{formatDuration(t.transaction_seconds)}</span></td>
                  <td>{t.state}</td>
                  <td class="query">{t.last_query}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}

    <!-- Auth Events -->
    <section class="section">
      <h2>Auth Events (24h)</h2>
      {#if authEvents.length === 0}
        <p class="empty">No auth events</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>User</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {#each authEvents.slice(0, 15) as e}
                <tr>
                  <td class="mono">{formatTime(e.created_at)}</td>
                  <td><span class="tag" class:ok={e.action === 'login'}>{e.action}</span></td>
                  <td class="mono">{e.actor_username || '—'}</td>
                  <td class="mono">{e.ip_address || '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <!-- Sequential Scans -->
    <section class="section">
      <h2>Sequential Scans</h2>
      {#if sequentialScans.length === 0}
        <p class="empty">No sequential scans detected</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Scans</th>
                <th>Rows Read</th>
                <th>Index Usage</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {#each sequentialScans as s}
                <tr>
                  <td class="tbl-name">{s.schemaname}.{s.table_name}</td>
                  <td class="mono">{s.seq_scan?.toLocaleString()}</td>
                  <td class="mono">{s.seq_tup_read?.toLocaleString()}</td>
                  <td>
                    <div class="pct-bar">
                      <div class="pct-fill" class:ok={s.index_usage_pct >= 80} class:warn={s.index_usage_pct < 80 && s.index_usage_pct >= 50} class:err={s.index_usage_pct < 50} style="width: {s.index_usage_pct || 0}%"></div>
                      <span class="pct-lbl">{s.index_usage_pct || 0}%</span>
                    </div>
                  </td>
                  <td class="mono">{s.total_size}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <!-- Slow Queries -->
    <section class="section">
      <h2>Slow Queries</h2>
      {#if slowQueries.length === 0}
        <p class="empty">No slow queries</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Query</th>
                <th>Calls</th>
                <th>Avg</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {#each slowQueries as q}
                <tr>
                  <td class="query">{q.query_preview}</td>
                  <td class="mono">{q.calls?.toLocaleString()}</td>
                  <td class="mono">{q.avg_ms}ms</td>
                  <td class="mono">{q.total_ms}ms</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <!-- Largest Tables -->
    <section class="section">
      <h2>Largest Tables</h2>
      {#if largestTables.length === 0}
        <p class="empty">No tables</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Total</th>
                <th>Data</th>
                <th>Index</th>
                <th>Rows</th>
              </tr>
            </thead>
            <tbody>
              {#each largestTables as t}
                <tr>
                  <td class="tbl-name">{t.schemaname}.{t.table_name}</td>
                  <td class="mono">{t.total_size}</td>
                  <td class="mono">{t.table_size}</td>
                  <td class="mono">{t.index_size}</td>
                  <td class="mono">{t.row_count?.toLocaleString()}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <!-- Unused Indexes -->
    {#if unusedIndexes.length > 0}
      <section class="section">
        <h2>Unused Indexes</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Index</th>
                <th>Table</th>
                <th>Scans</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {#each unusedIndexes as i}
                <tr>
                  <td class="idx-name">{i.index_name}</td>
                  <td class="tbl-name">{i.schemaname}.{i.table_name}</td>
                  <td class="mono">{i.idx_scan}</td>
                  <td class="mono">{i.size}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}

    <!-- Table Bloat -->
    {#if tableBloat.length > 0}
      <section class="section">
        <h2>Table Bloat</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Live</th>
                <th>Dead</th>
                <th>Dead %</th>
                <th>Vacuum</th>
              </tr>
            </thead>
            <tbody>
              {#each tableBloat as t}
                <tr>
                  <td class="tbl-name">{t.schemaname}.{t.table_name}</td>
                  <td class="mono">{t.live_rows?.toLocaleString()}</td>
                  <td class="mono">{t.dead_rows?.toLocaleString()}</td>
                  <td><span class="tag" class:err={t.dead_pct > 10} class:warn={t.dead_pct > 5 && t.dead_pct <= 10}>{t.dead_pct}%</span></td>
                  <td class="mono">{t.last_autovacuum ? formatTime(t.last_autovacuum) : 'Never'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}

    <p class="timestamp">Last checked: {summary.checked_at ? new Date(summary.checked_at).toLocaleString() : '—'}</p>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .db-page {
    @apply max-w-5xl mx-auto;
  }

  .header {
    @apply mb-8;
  }

  .header h1 {
    @apply text-2xl font-semibold text-base06 m-0;
    letter-spacing: -0.02em;
  }

  .header p {
    @apply text-sm text-base04 mt-1;
  }

  .error-box {
    @apply p-4 bg-base08/10 border border-base08/30 rounded-lg;
  }

  .error-box p {
    @apply text-sm text-base08 m-0;
  }

  /* Metrics */
  .metric-row {
    @apply flex gap-8 mb-10 pb-6 border-b border-base02;
  }

  .metric {
    @apply flex flex-col;
  }

  .m-val {
    @apply text-2xl font-semibold text-base06;
    letter-spacing: -0.02em;
  }

  .m-dim {
    @apply text-lg text-base04 font-normal;
  }

  .m-lbl {
    @apply text-xs text-base04 mt-0.5;
  }

  .m-tag {
    @apply text-[10px] uppercase tracking-wider text-base04 mt-1;
  }

  .m-tag.ok { @apply text-base0B; }

  .m-bar {
    @apply h-1 w-20 bg-base02 rounded-full mt-2 overflow-hidden;
  }

  .m-bar-fill {
    @apply h-full bg-base0D rounded-full;
  }

  /* Two columns */
  .two-col {
    @apply grid grid-cols-2 gap-8 mb-8;
  }

  /* Sections */
  .section {
    @apply mb-8;
  }

  .section h2 {
    @apply text-xs font-medium text-base04 uppercase tracking-wider mb-3 m-0;
  }

  .warn-section h2 {
    @apply text-base09;
  }

  /* Locks */
  .lock-row {
    @apply flex gap-6;
  }

  .lock-item {
    @apply flex flex-col;
  }

  .lock-val {
    @apply text-xl font-semibold text-base05;
  }

  .lock-val.ok { @apply text-base0B; }
  .lock-val.warn { @apply text-base09; }

  .lock-lbl {
    @apply text-xs text-base04;
  }

  /* Connections */
  .conn-row {
    @apply flex flex-wrap gap-3;
  }

  .conn-item {
    @apply flex items-center gap-2 py-1.5 px-2.5 bg-base01 rounded-md;
  }

  .conn-state {
    @apply text-xs text-base04;
  }

  .conn-count {
    @apply text-sm font-semibold text-base05;
  }

  /* Tables */
  .table-wrap {
    @apply overflow-x-auto bg-base01 rounded-lg;
  }

  table {
    @apply w-full text-sm;
  }

  th {
    @apply text-left text-xs font-medium text-base04 uppercase tracking-wider;
    @apply px-3 py-2.5 border-b border-base02;
  }

  td {
    @apply px-3 py-2.5 border-b border-base02 text-base05;
  }

  tr:last-child td {
    @apply border-b-0;
  }

  tr:hover td {
    @apply bg-base02/30;
  }

  .mono {
    @apply font-mono text-xs;
  }

  .tbl-name {
    @apply font-medium text-base06;
  }

  .idx-name {
    @apply font-mono text-xs text-base0D;
  }

  .query {
    @apply font-mono text-xs max-w-xs truncate;
  }

  .empty {
    @apply text-sm text-base04 py-6 text-center bg-base01 rounded-lg;
  }

  /* Tags */
  .tag {
    @apply inline-block text-[10px] uppercase tracking-wider py-0.5 px-1.5 rounded;
    @apply bg-base02 text-base04;
  }

  .tag.ok { @apply bg-base0B/15 text-base0B; }
  .tag.warn { @apply bg-base09/15 text-base09; }
  .tag.err { @apply bg-base08/15 text-base08; }
  .tag.active { @apply bg-base0B/15 text-base0B; }

  .mono.err { @apply text-base08; }

  /* Percentage bar */
  .pct-bar {
    @apply relative h-4 w-20 bg-base02 rounded overflow-hidden;
  }

  .pct-fill {
    @apply absolute left-0 top-0 h-full;
  }

  .pct-fill.ok { @apply bg-base0B; }
  .pct-fill.warn { @apply bg-base09; }
  .pct-fill.err { @apply bg-base08; }

  .pct-lbl {
    @apply absolute inset-0 flex items-center justify-center;
    @apply text-[10px] font-medium text-base06;
  }

  .timestamp {
    @apply text-xs text-base04 text-center mt-8;
  }

  @media (max-width: 768px) {
    .metric-row {
      @apply flex-wrap gap-4;
    }

    .two-col {
      @apply grid-cols-1;
    }
  }
</style>
