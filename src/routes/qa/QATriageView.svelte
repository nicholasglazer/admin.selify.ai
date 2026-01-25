<script>
  import {getContext, onMount} from 'svelte';
  import {AlertTriangle, CheckCircle, XCircle, Clock, Shield, RefreshCw, Eye, MessageSquare} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  const qaState = getContext('qaState');

  // Derived values
  let triageSummary = $derived(qaState.triageSummary);
  let pendingRuns = $derived(triageSummary?.pending_runs || []);
  let quarantinedSpecs = $derived(triageSummary?.quarantined_specs || []);
  let flakySpecs = $derived(triageSummary?.flaky_specs || []);
  let recentHeals = $derived(triageSummary?.recent_heals || []);
  let stats = $derived(triageSummary?.stats || {});

  let selectedTab = $state('pending');
  let triageNotes = $state('');
  let selectedRunForTriage = $state(null);

  async function handleTriage(runId, status) {
    await qaState.triageRun(runId, status, triageNotes);
    triageNotes = '';
    selectedRunForTriage = null;
  }

  async function handleUnquarantine(specId) {
    await qaState.unquarantineSpec(specId);
  }

  function refresh() {
    qaState.loadTriageSummary();
  }

  function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'just now';
  }
</script>

<div class="triage-view">
  <div class="triage-header">
    <div class="header-left">
      <h2>Triage Dashboard</h2>
      <p class="subtitle">Review failures, manage quarantined tests</p>
    </div>
    <button class="btn-ghost" onclick={refresh}>
      <RefreshCw size={16} />
      Refresh
    </button>
  </div>

  <!-- Stats Row -->
  <div class="stats-row">
    <div class="stat-card pending">
      <AlertTriangle size={20} />
      <div class="stat-content">
        <span class="stat-value">{stats.pending_triage_count || 0}</span>
        <span class="stat-label">Pending Triage</span>
      </div>
    </div>
    <div class="stat-card quarantine">
      <Shield size={20} />
      <div class="stat-content">
        <span class="stat-value">{stats.quarantined_count || 0}</span>
        <span class="stat-label">Quarantined</span>
      </div>
    </div>
    <div class="stat-card monitoring">
      <Eye size={20} />
      <div class="stat-content">
        <span class="stat-value">{stats.monitoring_count || 0}</span>
        <span class="stat-label">Monitoring</span>
      </div>
    </div>
    <div class="stat-card healed">
      <RefreshCw size={20} />
      <div class="stat-content">
        <span class="stat-value">{stats.healed_24h || 0}</span>
        <span class="stat-label">Healed (24h)</span>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="triage-tabs">
    <button
      class="tab"
      class:active={selectedTab === 'pending'}
      onclick={() => selectedTab = 'pending'}
    >
      Pending Runs
      {#if pendingRuns.length > 0}
        <span class="tab-badge">{pendingRuns.length}</span>
      {/if}
    </button>
    <button
      class="tab"
      class:active={selectedTab === 'quarantine'}
      onclick={() => selectedTab = 'quarantine'}
    >
      Quarantined
      {#if quarantinedSpecs.length > 0}
        <span class="tab-badge">{quarantinedSpecs.length}</span>
      {/if}
    </button>
    <button
      class="tab"
      class:active={selectedTab === 'flaky'}
      onclick={() => selectedTab = 'flaky'}
    >
      Flaky Tests
    </button>
    <button
      class="tab"
      class:active={selectedTab === 'heals'}
      onclick={() => selectedTab = 'heals'}
    >
      Recent Heals
    </button>
  </div>

  <!-- Content -->
  <div class="triage-content">
    {#if selectedTab === 'pending'}
      <div class="section">
        {#if pendingRuns.length === 0}
          <div class="empty-state">
            <CheckCircle size={48} strokeWidth={1} />
            <h3>All Clear!</h3>
            <p>No failed runs need triage</p>
          </div>
        {:else}
          <div class="run-list">
            {#each pendingRuns as run}
              <div class="run-card failed">
                <div class="run-header">
                  <div class="run-info">
                    <h4>Run #{run.run_number}</h4>
                    <span class="run-time">{formatTimeAgo(run.created_at)}</span>
                  </div>
                  <Badge variant="error" size="sm">
                    {run.failed_count} failed
                  </Badge>
                </div>

                <div class="run-details">
                  <span class="detail">
                    <span class="label">Target:</span>
                    {run.target_app || 'All'}
                  </span>
                  {#if run.suite_name}
                    <span class="detail">
                      <span class="label">Suite:</span>
                      {run.suite_name}
                    </span>
                  {/if}
                  {#if run.git_branch}
                    <span class="detail">
                      <span class="label">Branch:</span>
                      {run.git_branch}
                    </span>
                  {/if}
                </div>

                <div class="run-actions">
                  <button
                    class="action-btn view"
                    onclick={() => qaState.selectRun(run)}
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  <button
                    class="action-btn complete"
                    onclick={() => handleTriage(run.id, 'completed')}
                  >
                    <CheckCircle size={14} />
                    Mark Triaged
                  </button>
                  <button
                    class="action-btn ignore"
                    onclick={() => handleTriage(run.id, 'ignored')}
                  >
                    <XCircle size={14} />
                    Ignore
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    {:else if selectedTab === 'quarantine'}
      <div class="section">
        {#if quarantinedSpecs.length === 0}
          <div class="empty-state">
            <Shield size={48} strokeWidth={1} />
            <h3>No Quarantined Tests</h3>
            <p>All tests are healthy and running</p>
          </div>
        {:else}
          <div class="spec-list">
            {#each quarantinedSpecs as spec}
              <div class="spec-card quarantined">
                <div class="spec-header">
                  <div class="spec-info">
                    <h4>{spec.name}</h4>
                    <Badge
                      variant={spec.quarantine_status === 'quarantined' ? 'error' : 'warning'}
                      size="sm"
                    >
                      {spec.quarantine_status}
                    </Badge>
                  </div>
                  <span class="flaky-score">
                    Flaky: {spec.flaky_score?.toFixed(0)}%
                  </span>
                </div>

                <p class="quarantine-reason">{spec.quarantine_reason}</p>

                <div class="quarantine-info">
                  <span class="info-item">
                    <Clock size={12} />
                    Quarantined {formatTimeAgo(spec.quarantined_at)}
                  </span>
                  {#if spec.quarantine_expires_at}
                    <span class="info-item">
                      Expires: {new Date(spec.quarantine_expires_at).toLocaleDateString()}
                    </span>
                  {/if}
                  <span class="info-item">
                    {spec.consecutive_passes || 0}/{spec.unquarantine_threshold || 3} passes to auto-unquarantine
                  </span>
                </div>

                <div class="spec-actions">
                  <button
                    class="action-btn release"
                    onclick={() => handleUnquarantine(spec.id)}
                  >
                    <RefreshCw size={14} />
                    Release from Quarantine
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    {:else if selectedTab === 'flaky'}
      <div class="section">
        {#if flakySpecs.length === 0}
          <div class="empty-state">
            <CheckCircle size={48} strokeWidth={1} />
            <h3>No Flaky Tests</h3>
            <p>All tests have stable pass rates</p>
          </div>
        {:else}
          <div class="spec-list">
            {#each flakySpecs as spec}
              <div class="spec-card flaky">
                <div class="spec-header">
                  <div class="spec-info">
                    <h4>{spec.name}</h4>
                    <span class="category">{spec.category || 'other'}</span>
                  </div>
                  <div class="flaky-indicator" style="--flaky: {spec.flaky_score}%">
                    <span>{spec.flaky_score?.toFixed(0)}%</span>
                    flaky
                  </div>
                </div>

                <div class="spec-stats">
                  <span class="stat">
                    <XCircle size={12} />
                    {spec.consecutive_fails || 0} consecutive fails
                  </span>
                  {#if spec.last_run_at}
                    <span class="stat">
                      <Clock size={12} />
                      Last run {formatTimeAgo(spec.last_run_at)}
                    </span>
                  {/if}
                </div>

                <div class="spec-actions">
                  <button
                    class="action-btn view"
                    onclick={() => qaState.selectSpec(spec)}
                  >
                    <Eye size={14} />
                    View Spec
                  </button>
                  <button
                    class="action-btn quarantine"
                    onclick={() => qaState.quarantineSpec(spec.id, 'Manually quarantined for investigation')}
                  >
                    <Shield size={14} />
                    Quarantine
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    {:else if selectedTab === 'heals'}
      <div class="section">
        {#if recentHeals.length === 0}
          <div class="empty-state">
            <RefreshCw size={48} strokeWidth={1} />
            <h3>No Recent Heals</h3>
            <p>No auto-healing activity in the last 24 hours</p>
          </div>
        {:else}
          <div class="heal-list">
            {#each recentHeals as heal}
              <div class="heal-card">
                <div class="heal-icon">
                  <RefreshCw size={16} />
                </div>
                <div class="heal-content">
                  <h4>{heal.spec_name}</h4>
                  <p class="heal-reason">{heal.heal_reason}</p>
                  <span class="heal-time">{formatTimeAgo(heal.created_at)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .triage-view {
    @apply p-4;
  }

  .triage-header {
    @apply flex items-center justify-between mb-6;
  }

  .header-left h2 {
    @apply text-lg font-semibold text-base06;
  }

  .subtitle {
    @apply text-sm text-base04;
  }

  .btn-ghost {
    @apply flex items-center gap-2 px-3 py-1.5;
    @apply text-sm text-base04 hover:text-base06;
    @apply hover:bg-base02 rounded transition-colors;
  }

  /* Stats Row */
  .stats-row {
    @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-6;
  }

  .stat-card {
    @apply flex items-center gap-3 p-4 rounded-lg border border-base02;
  }

  .stat-card.pending { @apply bg-base08/10 border-base08/30 text-base08; }
  .stat-card.quarantine { @apply bg-base0A/10 border-base0A/30 text-base0A; }
  .stat-card.monitoring { @apply bg-base0E/10 border-base0E/30 text-base0E; }
  .stat-card.healed { @apply bg-base0B/10 border-base0B/30 text-base0B; }

  .stat-content {
    @apply flex flex-col;
  }

  .stat-value {
    @apply text-2xl font-bold;
  }

  .stat-label {
    @apply text-xs opacity-80;
  }

  /* Tabs */
  .triage-tabs {
    @apply flex gap-1 mb-4 border-b border-base02 pb-2;
  }

  .tab {
    @apply flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium;
    @apply text-base04 transition-colors;
    @apply hover:text-base06 hover:bg-base02;
  }

  .tab.active {
    @apply bg-base02 text-base06;
  }

  .tab-badge {
    @apply px-1.5 py-0.5 text-xs rounded-full bg-base08 text-white;
  }

  /* Content */
  .triage-content {
    @apply bg-base01 border border-base02 rounded-lg;
  }

  .section {
    @apply p-4;
  }

  .empty-state {
    @apply flex flex-col items-center justify-center py-12 text-base04;
  }

  .empty-state h3 {
    @apply text-lg font-medium text-base06 mt-4 mb-2;
  }

  .empty-state p {
    @apply text-sm;
  }

  /* Run List */
  .run-list {
    @apply space-y-3;
  }

  .run-card {
    @apply p-4 rounded-lg border border-base02 bg-base00;
  }

  .run-card.failed {
    @apply border-base08/30;
  }

  .run-header {
    @apply flex items-center justify-between mb-2;
  }

  .run-info h4 {
    @apply text-base06 font-medium;
  }

  .run-time {
    @apply text-xs text-base04;
  }

  .run-details {
    @apply flex flex-wrap gap-4 mb-3 text-sm text-base04;
  }

  .detail .label {
    @apply text-base05;
  }

  .run-actions {
    @apply flex gap-2;
  }

  /* Spec List */
  .spec-list {
    @apply space-y-3;
  }

  .spec-card {
    @apply p-4 rounded-lg border border-base02 bg-base00;
  }

  .spec-card.quarantined {
    @apply border-base0A/30;
  }

  .spec-card.flaky {
    @apply border-base08/30;
  }

  .spec-header {
    @apply flex items-center justify-between mb-2;
  }

  .spec-info {
    @apply flex items-center gap-2;
  }

  .spec-info h4 {
    @apply text-base06 font-medium;
  }

  .category {
    @apply text-xs text-base04 px-2 py-0.5 bg-base02 rounded;
  }

  .flaky-score {
    @apply text-sm font-medium text-base08;
  }

  .flaky-indicator {
    @apply text-sm font-medium text-base08;
  }

  .quarantine-reason {
    @apply text-sm text-base04 mb-3;
  }

  .quarantine-info {
    @apply flex flex-wrap gap-4 mb-3 text-xs text-base04;
  }

  .info-item {
    @apply flex items-center gap-1;
  }

  .spec-stats {
    @apply flex gap-4 mb-3 text-sm text-base04;
  }

  .spec-stats .stat {
    @apply flex items-center gap-1;
  }

  .spec-actions {
    @apply flex gap-2;
  }

  /* Action Buttons */
  .action-btn {
    @apply flex items-center gap-1.5 px-3 py-1.5 rounded;
    @apply text-sm text-base04 bg-base02;
    @apply hover:bg-base03 hover:text-base06 transition-colors;
  }

  .action-btn.view { @apply bg-base0D/20 text-base0D hover:bg-base0D/30; }
  .action-btn.complete { @apply bg-base0B/20 text-base0B hover:bg-base0B/30; }
  .action-btn.ignore { @apply bg-base04/20 text-base04 hover:bg-base04/30; }
  .action-btn.release { @apply bg-base0B/20 text-base0B hover:bg-base0B/30; }
  .action-btn.quarantine { @apply bg-base0A/20 text-base0A hover:bg-base0A/30; }

  /* Heal List */
  .heal-list {
    @apply space-y-2;
  }

  .heal-card {
    @apply flex items-start gap-3 p-3 rounded-lg bg-base00;
  }

  .heal-icon {
    @apply w-8 h-8 rounded-full bg-base0B/20 text-base0B;
    @apply flex items-center justify-center flex-shrink-0;
  }

  .heal-content h4 {
    @apply text-sm font-medium text-base06;
  }

  .heal-reason {
    @apply text-sm text-base04 mt-0.5;
  }

  .heal-time {
    @apply text-xs text-base04;
  }
</style>
