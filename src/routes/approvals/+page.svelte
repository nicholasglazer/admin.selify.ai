<script>
  import {getContext, onMount, onDestroy} from 'svelte';
  import {goto} from '$app/navigation';
  import {PageHeader} from '$components';
  import {
    CheckCircle,
    CircleX,
    Clock,
    TriangleAlert,
    AlertCircle,
    Filter,
    RefreshCw
  } from '$components/icons';

  let {data} = $props();

  const supabaseHolder = getContext('supabase');
  const toastState = getContext('toastState');

  // Track supabase client
  let supabase = $state(null);

  // Track if component is mounted (for cleanup)
  let isMounted = true;

  onMount(() => {
    const checkSupabase = setInterval(() => {
      if (supabaseHolder?.client) {
        supabase = supabaseHolder.client;
        clearInterval(checkSupabase);
      }
    }, 50);
    return () => clearInterval(checkSupabase);
  });

  onDestroy(() => {
    isMounted = false;
  });

  let approvals = $state(data.approvals || []);
  let stats = $state(data.stats);
  let loading = $state(false);
  let selectedStatus = $state('pending');
  let selectedRiskLevel = $state(null);
  let votingInProgress = $state({});
  let batchMode = $state(false);
  let selectedIds = $state(new Set());

  async function fetchApprovals() {
    if (!isMounted || !supabase) return;

    loading = true;
    try {
      const {data: result, error} = await supabase.rpc('get_pending_approvals', {
        p_status: selectedStatus,
        p_risk_level: selectedRiskLevel,
        p_limit: 100,
        p_offset: 0
      });

      // Guard against setting state after unmount
      if (!isMounted) return;

      if (error) throw error;
      approvals = result || [];
    } catch (err) {
      console.error('Error fetching approvals:', err);
      if (isMounted) {
        toastState?.show(`Failed to fetch approvals: ${err.message}`);
      }
    } finally {
      if (isMounted) {
        loading = false;
      }
    }
  }

  async function fetchStats() {
    try {
      const {data: result, error} = await supabase.rpc('get_approval_stats', {
        p_days: 30
      });
      if (error) throw error;
      stats = result;
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  async function vote(approvalId, voteType, comment = null) {
    if (votingInProgress[approvalId]) return;
    votingInProgress[approvalId] = true;

    try {
      const {data: result, error} = await supabase.rpc('vote_on_approval', {
        p_request_id: approvalId,
        p_vote: voteType,
        p_comment: comment
      });

      if (error) throw error;

      if (result?.success) {
        toastState?.show(`Successfully ${voteType}d approval`);
        await fetchApprovals();
        await fetchStats();
      } else {
        throw new Error(result?.error || 'Vote failed');
      }
    } catch (err) {
      console.error('Error voting:', err);
      toastState?.show(`Vote failed: ${err.message}`);
    } finally {
      votingInProgress[approvalId] = false;
    }
  }

  async function batchVote(voteType) {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    try {
      const {data: result, error} = await supabase.rpc('batch_approve', {
        p_request_ids: ids,
        p_vote: voteType,
        p_comment: `Batch ${voteType}d`
      });

      if (error) throw error;

      if (result?.success) {
        toastState?.show(`Batch ${voteType}d ${result.success_count} items`);
        selectedIds = new Set();
        batchMode = false;
        await fetchApprovals();
        await fetchStats();
      } else {
        throw new Error(`${result?.error_count} items failed`);
      }
    } catch (err) {
      console.error('Batch vote error:', err);
      toastState?.show(`Batch vote failed: ${err.message}`);
    }
  }

  function toggleSelection(id) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedIds = newSet;
  }

  function selectAll() {
    selectedIds = new Set(approvals.filter((a) => a.status === 'pending').map((a) => a.id));
  }

  function clearSelection() {
    selectedIds = new Set();
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  function formatTimeRemaining(intervalString) {
    if (!intervalString) return '';
    const match = intervalString.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    return intervalString;
  }

  function getRiskColor(risk) {
    switch (risk) {
      case 'critical':
        return 'risk-critical';
      case 'high':
        return 'risk-high';
      case 'medium':
        return 'risk-medium';
      case 'low':
        return 'risk-low';
      default:
        return 'risk-medium';
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'pending':
        return {class: 'badge-warning', icon: Clock, text: 'Pending'};
      case 'auto_approved':
        return {class: 'badge-info', icon: CheckCircle, text: 'Auto-Approved'};
      case 'approved':
        return {class: 'badge-success', icon: CheckCircle, text: 'Approved'};
      case 'rejected':
        return {class: 'badge-danger', icon: CircleX, text: 'Rejected'};
      case 'expired':
        return {class: 'badge-secondary', icon: Clock, text: 'Expired'};
      default:
        return {class: 'badge-secondary', icon: Clock, text: status};
    }
  }

  function getTierLabel(tier) {
    switch (tier) {
      case 0:
        return 'Silent Auto';
      case 1:
        return 'Auto + Notify';
      case 2:
        return 'AI Recommends';
      case 3:
        return 'Human Required';
      case 4:
        return 'Multi-Reviewer';
      default:
        return `Tier ${tier}`;
    }
  }

  function getConfidenceColor(confidence) {
    if (confidence >= 0.95) return 'confidence-high';
    if (confidence >= 0.85) return 'confidence-medium';
    if (confidence >= 0.7) return 'confidence-low';
    return 'confidence-very-low';
  }

  // Use $effect with cleanup pattern for Svelte 5
  // The effect triggers when selectedStatus changes
  $effect(() => {
    // Capture current status for this effect run
    const currentStatus = selectedStatus;

    // Only fetch if we have a valid status and supabase client
    if (currentStatus !== undefined && supabase && isMounted) {
      fetchApprovals();
    }

    // Cleanup function - called when effect re-runs or component unmounts
    return () => {
      // Nothing specific to clean up here, but the pattern is important
      // The isMounted check in fetchApprovals handles stale requests
    };
  });
</script>

<svelte:head>
  <title>Approvals - Selify Admin</title>
</svelte:head>

<div class="approvals-page">
  <PageHeader title="Approval Queue" subtitle="AI-first approval system with confidence-driven routing">
    {#snippet actions()}
      <button class="btn btn-sm btn-outline" onclick={fetchApprovals} disabled={loading}>
        <RefreshCw size={16} class={loading ? 'spinning' : ''} />
        Refresh
      </button>
      <button
        class="btn btn-sm"
        class:btn-primary={batchMode}
        onclick={() => {
          batchMode = !batchMode;
          if (!batchMode) clearSelection();
        }}
      >
        <Filter size={16} />
        {batchMode ? 'Exit Batch' : 'Batch Mode'}
      </button>
    {/snippet}
  </PageHeader>

  <!-- Stats Cards -->
  {#if stats}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value urgent">{stats.pending || 0}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{stats.auto_approved || 0}</div>
        <div class="stat-label">Auto-Approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value success">{stats.approved || 0}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value danger">{stats.rejected || 0}</div>
        <div class="stat-label">Rejected</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{stats.override_count || 0}</div>
        <div class="stat-label">Overrides</div>
      </div>
    </div>
  {/if}

  <!-- Filters -->
  <div class="filters-bar">
    <div class="status-tabs">
      {#each [
        {value: 'pending', label: 'Pending'},
        {value: 'auto_approved', label: 'Auto-Approved'},
        {value: 'approved', label: 'Approved'},
        {value: 'rejected', label: 'Rejected'},
        {value: 'all', label: 'All'}
      ] as tab}
        <button class="tab" class:active={selectedStatus === tab.value} onclick={() => (selectedStatus = tab.value)}>
          {tab.label}
          {#if tab.value === 'pending' && stats?.pending > 0}
            <span class="tab-badge urgent">{stats.pending}</span>
          {/if}
        </button>
      {/each}
    </div>

    <select class="risk-select" bind:value={selectedRiskLevel} onchange={fetchApprovals}>
      <option value={null}>All Risk Levels</option>
      <option value="critical">Critical</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  </div>

  <!-- Batch Actions -->
  {#if batchMode && selectedIds.size > 0}
    <div class="batch-actions">
      <span class="batch-count">{selectedIds.size} selected</span>
      <button class="btn btn-sm" onclick={selectAll}>Select All Pending</button>
      <button class="btn btn-sm" onclick={clearSelection}>Clear</button>
      <button class="btn btn-sm btn-success" onclick={() => batchVote('approve')}>
        <CheckCircle size={16} />
        Approve Selected
      </button>
      <button class="btn btn-sm btn-danger" onclick={() => batchVote('reject')}>
        <CircleX size={16} />
        Reject Selected
      </button>
    </div>
  {/if}

  <!-- Approval List -->
  {#if loading}
    <div class="loading-state">Loading approvals...</div>
  {:else if approvals.length === 0}
    <div class="empty-state">
      <AlertCircle size={48} />
      <p>No approvals found for the selected filters.</p>
    </div>
  {:else}
    <div class="approvals-list">
      {#each approvals as approval}
        {@const statusBadge = getStatusBadge(approval.status)}
        <article
          class="approval-card"
          class:selected={selectedIds.has(approval.id)}
          onclick={() => {
            if (batchMode && approval.status === 'pending') {
              toggleSelection(approval.id);
            } else {
              goto(`/approvals/${approval.id}`);
            }
          }}
        >
          {#if batchMode && approval.status === 'pending'}
            <div class="batch-checkbox">
              <input
                type="checkbox"
                checked={selectedIds.has(approval.id)}
                onclick={(e) => {
                  e.stopPropagation();
                  toggleSelection(approval.id);
                }}
              />
            </div>
          {/if}

          <div class="card-header">
            <div class="risk-indicator {getRiskColor(approval.risk_level)}">
              {#if approval.risk_level === 'critical'}
                <TriangleAlert size={14} />
              {:else if approval.risk_level === 'high'}
                <AlertCircle size={14} />
              {/if}
              {approval.risk_level}
            </div>

            <div class="badge {statusBadge.class}">
              <svelte:component this={statusBadge.icon} size={12} />
              {statusBadge.text}
            </div>
          </div>

          <div class="card-body">
            <h3 class="approval-title">{approval.title}</h3>

            <div class="approval-meta">
              <span><strong>Type:</strong> {approval.request_type}</span>
              <span><strong>Source:</strong> {approval.source_system}</span>
              {#if approval.tier !== null}
                <span class="tier-badge">{getTierLabel(approval.tier)}</span>
              {/if}
            </div>

            {#if approval.ai_confidence !== null}
              <div class="ai-section">
                <div class="confidence-row">
                  <span>Confidence:</span>
                  <span class={getConfidenceColor(approval.ai_confidence)}>
                    {Math.round(approval.ai_confidence * 100)}%
                  </span>
                  <div class="confidence-bar">
                    <div
                      class="confidence-fill {getConfidenceColor(approval.ai_confidence)}"
                      style="width: {approval.ai_confidence * 100}%"
                    ></div>
                  </div>
                </div>

                {#if approval.ai_recommendation}
                  <div class="ai-recommendation">
                    AI: <span class="recommendation recommendation-{approval.ai_recommendation}">
                      {approval.ai_recommendation}
                    </span>
                  </div>
                {/if}
              </div>
            {/if}

            {#if approval.ai_reasoning}
              <p class="ai-reasoning">
                {approval.ai_reasoning.substring(0, 150)}{approval.ai_reasoning.length > 150 ? '...' : ''}
              </p>
            {/if}
          </div>

          <div class="card-footer">
            <div class="footer-meta">
              <span>{formatDate(approval.created_at)}</span>
              {#if approval.time_remaining && approval.status === 'pending'}
                <span class="expires">
                  <Clock size={12} />
                  {formatTimeRemaining(approval.time_remaining)}
                </span>
              {/if}
            </div>

            {#if approval.status === 'pending' && !batchMode}
              <div class="quick-actions">
                <button
                  class="btn btn-xs btn-success"
                  disabled={votingInProgress[approval.id]}
                  onclick={(e) => {
                    e.stopPropagation();
                    vote(approval.id, 'approve');
                  }}
                >
                  <CheckCircle size={12} />
                  Approve
                </button>
                <button
                  class="btn btn-xs btn-danger"
                  disabled={votingInProgress[approval.id]}
                  onclick={(e) => {
                    e.stopPropagation();
                    vote(approval.id, 'reject');
                  }}
                >
                  <CircleX size={12} />
                  Reject
                </button>
              </div>
            {/if}

            {#if approval.status === 'auto_approved' && approval.override_window_remaining}
              <div class="quick-actions">
                <button
                  class="btn btn-xs btn-danger"
                  disabled={votingInProgress[approval.id]}
                  onclick={(e) => {
                    e.stopPropagation();
                    vote(approval.id, 'reject');
                  }}
                >
                  <CircleX size={12} />
                  Override
                </button>
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .approvals-page {
    @apply flex flex-col h-full w-full;
  }

  /* Stats Grid */
  .stats-grid {
    @apply grid grid-cols-5 gap-4 mb-6;
  }

  .stat-card {
    @apply bg-base01 border border-border rounded-lg p-4 text-center;
  }

  .stat-value {
    @apply text-2xl font-bold text-base06;
  }

  .stat-value.urgent {
    @apply text-base09;
  }

  .stat-value.success {
    @apply text-base0B;
  }

  .stat-value.danger {
    @apply text-base08;
  }

  .stat-label {
    @apply text-sm text-base04 mt-1;
  }

  /* Filters */
  .filters-bar {
    @apply flex justify-between items-center mb-6 pb-4 border-b border-border;
  }

  .status-tabs {
    @apply flex gap-1;
  }

  .tab {
    @apply px-4 py-2 rounded-lg text-sm font-medium text-base04;
    @apply hover:bg-base02 transition-all cursor-pointer;
    @apply border-none bg-transparent;
  }

  .tab.active {
    @apply bg-base0D/10 text-base0D;
  }

  .tab-badge {
    @apply ml-1 px-1.5 py-0.5 rounded-full text-xs bg-base09/20 text-base09;
  }

  .risk-select {
    @apply px-3 py-2 rounded-lg border border-border bg-base01 text-base05 text-sm;
  }

  /* Batch Actions */
  .batch-actions {
    @apply flex items-center gap-3 p-4 mb-4 bg-base0D/10 rounded-lg;
  }

  .batch-count {
    @apply font-medium text-base0D;
  }

  /* Approvals List */
  .approvals-list {
    @apply flex flex-col gap-4 overflow-y-auto flex-1;
  }

  .approval-card {
    @apply bg-base01 border border-border rounded-xl p-5;
    @apply cursor-pointer transition-all duration-200;
    @apply hover:border-base0D/40 hover:shadow-lg;
  }

  .approval-card.selected {
    @apply border-base0D bg-base0D/5;
  }

  .batch-checkbox {
    @apply float-left mr-4;
  }

  .batch-checkbox input {
    @apply w-5 h-5 cursor-pointer;
  }

  .card-header {
    @apply flex justify-between items-center mb-4;
  }

  .risk-indicator {
    @apply inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase;
  }

  .risk-critical {
    @apply bg-base08/20 text-base08;
  }

  .risk-high {
    @apply bg-base09/20 text-base09;
  }

  .risk-medium {
    @apply bg-base0A/20 text-base0A;
  }

  .risk-low {
    @apply bg-base0B/20 text-base0B;
  }

  .badge {
    @apply inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium;
  }

  .badge-warning {
    @apply bg-base09/20 text-base09;
  }

  .badge-info {
    @apply bg-base0C/20 text-base0C;
  }

  .badge-success {
    @apply bg-base0B/20 text-base0B;
  }

  .badge-danger {
    @apply bg-base08/20 text-base08;
  }

  .badge-secondary {
    @apply bg-base02 text-base04;
  }

  .card-body {
    @apply mb-4;
  }

  .approval-title {
    @apply text-lg font-semibold text-base06 mb-3;
  }

  .approval-meta {
    @apply flex flex-wrap gap-4 text-sm text-base04 mb-3;
  }

  .approval-meta strong {
    @apply text-base05;
  }

  .tier-badge {
    @apply px-2 py-0.5 bg-base02 rounded text-xs;
  }

  .ai-section {
    @apply p-3 bg-base02 rounded-lg mb-3;
  }

  .confidence-row {
    @apply flex items-center gap-3 text-sm;
  }

  .confidence-bar {
    @apply flex-1 h-2 bg-base00 rounded-full overflow-hidden;
  }

  .confidence-fill {
    @apply h-full rounded-full transition-all;
  }

  .confidence-high {
    @apply text-base0B;
  }

  .confidence-fill.confidence-high {
    @apply bg-base0B;
  }

  .confidence-medium {
    @apply text-base0C;
  }

  .confidence-fill.confidence-medium {
    @apply bg-base0C;
  }

  .confidence-low {
    @apply text-base09;
  }

  .confidence-fill.confidence-low {
    @apply bg-base09;
  }

  .confidence-very-low {
    @apply text-base08;
  }

  .confidence-fill.confidence-very-low {
    @apply bg-base08;
  }

  .ai-recommendation {
    @apply text-sm mt-2;
  }

  .recommendation {
    @apply ml-1 px-2 py-0.5 rounded text-xs font-medium capitalize;
  }

  .recommendation-approve {
    @apply bg-base0B/20 text-base0B;
  }

  .recommendation-reject {
    @apply bg-base08/20 text-base08;
  }

  .recommendation-needs_review {
    @apply bg-base09/20 text-base09;
  }

  .ai-reasoning {
    @apply text-sm text-base04 leading-relaxed;
  }

  .card-footer {
    @apply flex justify-between items-center pt-4 border-t border-border;
  }

  .footer-meta {
    @apply flex items-center gap-4 text-sm text-base04;
  }

  .expires {
    @apply inline-flex items-center gap-1 text-base09;
  }

  .quick-actions {
    @apply flex gap-2;
  }

  /* Buttons */
  .btn {
    @apply inline-flex items-center justify-center gap-1.5 px-4 py-2;
    @apply rounded-lg font-medium text-sm;
    @apply border border-border bg-base01 text-base05;
    @apply transition-all duration-150 cursor-pointer;
    @apply hover:bg-base02;
  }

  .btn:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .btn-sm {
    @apply px-3 py-1.5 text-sm;
  }

  .btn-xs {
    @apply px-2 py-1 text-xs;
  }

  .btn-primary {
    @apply bg-base0D text-white border-base0D;
    @apply hover:bg-base0D/90;
  }

  .btn-success {
    @apply bg-base0B text-white border-base0B;
    @apply hover:bg-base0B/90;
  }

  .btn-danger {
    @apply bg-base08 text-white border-base08;
    @apply hover:bg-base08/90;
  }

  .btn-outline {
    @apply bg-transparent;
  }

  /* States */
  .loading-state,
  .empty-state {
    @apply flex flex-col items-center justify-center py-12 text-base04;
  }

  .empty-state :global(svg) {
    @apply mb-4 opacity-50;
  }

  /* Animations */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .stats-grid {
      @apply grid-cols-3;
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      @apply grid-cols-2;
    }

    .filters-bar {
      @apply flex-col gap-4;
    }

    .status-tabs {
      @apply flex-wrap;
    }
  }
</style>
