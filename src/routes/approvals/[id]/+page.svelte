<script>
  import {getContext, onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import {PageHeader} from '$components';
  import {
    ArrowLeft,
    CheckCircle,
    CircleX,
    Clock,
    TriangleAlert,
    AlertCircle,
    ExternalLink,
    GitBranch,
    User,
    RefreshCw
  } from '$components/icons';

  let {data} = $props();

  const supabaseHolder = getContext('supabase');
  const toastState = getContext('toastState');

  // Track supabase client
  let supabase = $state(null);

  onMount(() => {
    const checkSupabase = setInterval(() => {
      if (supabaseHolder?.client) {
        supabase = supabaseHolder.client;
        clearInterval(checkSupabase);
      }
    }, 50);
    return () => clearInterval(checkSupabase);
  });

  let approval = $state(data.approval);
  let loading = $state(false);
  let votingInProgress = $state(false);
  let comment = $state('');
  let showDiff = $state(true);

  async function refreshApproval() {
    loading = true;
    try {
      const {data: result, error} = await supabase.rpc('get_approval_details', {
        p_approval_id: data.approvalId
      });
      if (error) throw error;
      approval = result;
    } catch (err) {
      console.error('Error refreshing:', err);
      toastState?.show(`Failed to refresh: ${err.message}`);
    } finally {
      loading = false;
    }
  }

  async function vote(voteType) {
    if (votingInProgress) return;
    votingInProgress = true;

    try {
      const {data: result, error} = await supabase.rpc('vote_on_approval', {
        p_request_id: data.approvalId,
        p_vote: voteType,
        p_comment: comment || null
      });

      if (error) throw error;

      if (result?.success) {
        toastState?.show(`Successfully ${voteType}d`);
        await refreshApproval();
        comment = '';
      } else {
        throw new Error(result?.error || 'Vote failed');
      }
    } catch (err) {
      console.error('Error voting:', err);
      toastState?.show(`Vote failed: ${err.message}`);
    } finally {
      votingInProgress = false;
    }
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

  function getStatusInfo(status) {
    switch (status) {
      case 'pending':
        return {class: 'badge-warning', icon: Clock, text: 'Pending Review'};
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

  function getTierInfo(tier) {
    switch (tier) {
      case 0:
        return {label: 'Tier 0 - Silent Auto-Approve', description: 'Confidence ≥98%, low risk'};
      case 1:
        return {label: 'Tier 1 - Auto-Approve + Notify', description: 'Confidence ≥95%, override window active'};
      case 2:
        return {label: 'Tier 2 - AI Recommends', description: 'Confidence ≥85%, human confirms'};
      case 3:
        return {label: 'Tier 3 - Human Required', description: 'Low confidence or high risk'};
      case 4:
        return {label: 'Tier 4 - Multi-Reviewer', description: 'Quorum required for critical actions'};
      default:
        return {label: `Tier ${tier}`, description: ''};
    }
  }

  function getConfidenceInfo(confidence) {
    if (confidence >= 0.95) return {class: 'confidence-high', label: 'High Confidence'};
    if (confidence >= 0.85) return {class: 'confidence-medium', label: 'Medium Confidence'};
    if (confidence >= 0.7) return {class: 'confidence-low', label: 'Low Confidence'};
    return {class: 'confidence-very-low', label: 'Very Low Confidence'};
  }

  let statusInfo = $derived(getStatusInfo(approval?.status));
  let tierInfo = $derived(getTierInfo(approval?.tier));
  let confidenceInfo = $derived(approval?.ai_confidence != null ? getConfidenceInfo(approval.ai_confidence) : null);

  let canVote = $derived(approval?.status === 'pending' || (approval?.status === 'auto_approved' && approval?.override_window_remaining));
  let isOverride = $derived(approval?.status === 'auto_approved');
</script>

<svelte:head>
  <title>{approval?.title || 'Approval'} - Selify Admin</title>
</svelte:head>

<div class="approval-detail">
  <header class="page-header">
    <button class="back-btn" onclick={() => goto('/approvals')}>
      <ArrowLeft size={20} />
      Back to Queue
    </button>

    {#if canVote}
      <div class="header-actions">
        <button
          class="btn btn-success"
          disabled={votingInProgress}
          onclick={() => vote('approve')}
        >
          <CheckCircle size={16} />
          {isOverride ? 'Keep Approved' : 'Approve'}
        </button>
        <button
          class="btn btn-danger"
          disabled={votingInProgress}
          onclick={() => vote('reject')}
        >
          <CircleX size={16} />
          {isOverride ? 'Override - Reject' : 'Reject'}
        </button>
      </div>
    {/if}
  </header>

  {#if !approval}
    <div class="loading-state">Loading approval details...</div>
  {:else}
    <div class="content-grid">
      <!-- Main Content -->
      <div class="main-content">
        <!-- Title & Meta -->
        <section class="title-section">
          <div class="title-row">
            <span class="risk-indicator {getRiskColor(approval.risk_level)}">
              {#if approval.risk_level === 'critical'}
                <TriangleAlert size={14} />
              {:else if approval.risk_level === 'high'}
                <AlertCircle size={14} />
              {/if}
              {approval.risk_level}
            </span>
            <div class="badge {statusInfo.class}">
              <svelte:component this={statusInfo.icon} size={14} />
              {statusInfo.text}
            </div>
          </div>

          <h1 class="title">{approval.title}</h1>

          <div class="meta-row">
            <span><strong>Type:</strong> {approval.request_type}</span>
            <span><strong>Source:</strong> {approval.source_system}</span>
            {#if approval.source_id}
              <span class="source-id"><strong>ID:</strong> {approval.source_id}</span>
            {/if}
            {#if approval.tier !== null}
              <span class="tier-badge" title={tierInfo.description}>{tierInfo.label}</span>
            {/if}
          </div>

          <div class="timestamps">
            <span>Created: {formatDate(approval.created_at)}</span>
            {#if approval.time_remaining && approval.status === 'pending'}
              <span class="expires-in">
                <Clock size={14} />
                Expires in {formatTimeRemaining(approval.time_remaining)}
              </span>
            {/if}
            {#if approval.override_window_remaining && approval.status === 'auto_approved'}
              <span class="override-window">
                <Clock size={14} />
                Override window: {formatTimeRemaining(approval.override_window_remaining)}
              </span>
            {/if}
          </div>
        </section>

        <!-- AI Analysis -->
        {#if approval.ai_confidence !== null}
          <section class="section ai-analysis-section">
            <h2 class="section-title">AI Analysis</h2>

            <div class="ai-grid">
              <div class="ai-card">
                <div class="ai-card-header">
                  <span class="ai-card-label">Recommendation</span>
                  {#if approval.ai_recommendation}
                    <span class="recommendation recommendation-{approval.ai_recommendation}">
                      {approval.ai_recommendation === 'approve' ? 'Approve' : approval.ai_recommendation === 'reject' ? 'Reject' : 'Needs Review'}
                    </span>
                  {/if}
                </div>

                <div class="confidence-display">
                  <div class="confidence-header">
                    <span>Confidence</span>
                    <span class={confidenceInfo?.class}>{Math.round(approval.ai_confidence * 100)}%</span>
                  </div>
                  <div class="confidence-bar">
                    <div
                      class="confidence-fill {confidenceInfo?.class}"
                      style="width: {approval.ai_confidence * 100}%"
                    ></div>
                  </div>
                  <span class="confidence-label">{confidenceInfo?.label}</span>
                </div>
              </div>

              {#if approval.ai_metadata?.confidence_breakdown}
                <div class="ai-card">
                  <div class="ai-card-header">
                    <span class="ai-card-label">Confidence Breakdown</span>
                  </div>
                  <div class="breakdown-list">
                    {#each Object.entries(approval.ai_metadata.confidence_breakdown) as [key, value]}
                      <div class="breakdown-item">
                        <span class="breakdown-label">{key.replace(/_/g, ' ')}</span>
                        <div class="breakdown-bar">
                          <div
                            class="breakdown-fill"
                            style="width: {value * 100}%"
                          ></div>
                        </div>
                        <span class="breakdown-value">{Math.round(value * 100)}%</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            {#if approval.ai_reasoning}
              <div class="ai-reasoning">
                <h3>AI Reasoning</h3>
                <p>{approval.ai_reasoning}</p>
              </div>
            {/if}
          </section>
        {/if}

        <!-- Context / Payload -->
        {#if approval.payload}
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                {#if approval.request_type === 'git_push'}
                  <GitBranch size={18} />
                  Changes
                {:else}
                  Request Details
                {/if}
              </h2>
              {#if approval.request_type === 'git_push'}
                <button class="toggle-btn" onclick={() => (showDiff = !showDiff)}>
                  {showDiff ? 'Hide' : 'Show'} Diff
                </button>
              {/if}
            </div>

            {#if approval.request_type === 'git_push' && approval.payload.files_changed}
              <div class="git-summary">
                <span class="git-stat">{approval.payload.files_changed?.length || 0} files</span>
                {#if approval.payload.additions !== undefined}
                  <span class="git-stat additions">+{approval.payload.additions}</span>
                {/if}
                {#if approval.payload.deletions !== undefined}
                  <span class="git-stat deletions">-{approval.payload.deletions}</span>
                {/if}
                {#if approval.payload.branch}
                  <span class="git-branch">
                    <GitBranch size={14} />
                    {approval.payload.branch}
                  </span>
                {/if}
              </div>

              {#if showDiff && approval.payload.files_changed}
                <div class="files-list">
                  {#each approval.payload.files_changed as file}
                    <div class="file-item">
                      <span class="file-path">{file.path || file}</span>
                      {#if file.additions !== undefined}
                        <span class="file-stats">
                          <span class="additions">+{file.additions}</span>
                          <span class="deletions">-{file.deletions}</span>
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              {#if showDiff && approval.payload.diff}
                <div class="diff-viewer">
                  <pre>{approval.payload.diff}</pre>
                </div>
              {/if}
            {:else}
              <div class="payload-display">
                <pre>{JSON.stringify(approval.payload, null, 2)}</pre>
              </div>
            {/if}
          </section>
        {/if}

        <!-- Decision Form -->
        {#if canVote}
          <section class="section decision-section">
            <h2 class="section-title">Your Decision</h2>

            <div class="comment-form">
              <label for="comment">Comment (optional)</label>
              <textarea
                id="comment"
                bind:value={comment}
                placeholder={isOverride ? 'Reason for override...' : 'Add a comment explaining your decision...'}
                rows="3"
              ></textarea>
            </div>

            <div class="decision-actions">
              <button
                class="btn btn-lg btn-success"
                disabled={votingInProgress}
                onclick={() => vote('approve')}
              >
                <CheckCircle size={20} />
                {isOverride ? 'Keep Approved' : 'Approve'}
              </button>
              <button
                class="btn btn-lg btn-danger"
                disabled={votingInProgress}
                onclick={() => vote('reject')}
              >
                <CircleX size={20} />
                {isOverride ? 'Override - Reject' : 'Reject'}
              </button>
              <button
                class="btn btn-lg"
                disabled={votingInProgress}
                onclick={() => vote('request_changes')}
              >
                Request Changes
              </button>
            </div>
          </section>
        {/if}

        <!-- Resolution Info (if already decided) -->
        {#if approval.status !== 'pending' && approval.resolved_at}
          <section class="section resolution-section">
            <h2 class="section-title">Resolution</h2>

            <div class="resolution-info">
              <div class="resolution-row">
                <span class="resolution-label">Decision:</span>
                <span class="badge {statusInfo.class}">
                  <svelte:component this={statusInfo.icon} size={14} />
                  {statusInfo.text}
                </span>
              </div>

              {#if approval.resolved_by_name}
                <div class="resolution-row">
                  <span class="resolution-label">Decided by:</span>
                  <span class="resolver">
                    <User size={14} />
                    {approval.resolved_by_name}
                  </span>
                </div>
              {/if}

              <div class="resolution-row">
                <span class="resolution-label">Decided at:</span>
                <span>{formatDate(approval.resolved_at)}</span>
              </div>

              {#if approval.resolution_comment}
                <div class="resolution-comment">
                  <span class="resolution-label">Comment:</span>
                  <p>{approval.resolution_comment}</p>
                </div>
              {/if}
            </div>
          </section>
        {/if}
      </div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Quick Info -->
        <div class="sidebar-card">
          <h3>Quick Info</h3>
          <dl class="info-list">
            <dt>Request ID</dt>
            <dd class="mono">{approval.id?.substring(0, 8)}...</dd>

            {#if approval.workspace_id}
              <dt>Workspace</dt>
              <dd class="mono">{approval.workspace_id?.substring(0, 8)}...</dd>
            {/if}

            {#if approval.temporal_workflow_id}
              <dt>Workflow</dt>
              <dd class="mono">{approval.temporal_workflow_id}</dd>
            {/if}

            <dt>Created</dt>
            <dd>{formatDate(approval.created_at)}</dd>

            {#if approval.expires_at}
              <dt>Expires</dt>
              <dd>{formatDate(approval.expires_at)}</dd>
            {/if}
          </dl>
        </div>

        <!-- Votes -->
        {#if approval.votes && approval.votes.length > 0}
          <div class="sidebar-card">
            <h3>Votes ({approval.votes.length})</h3>
            <ul class="votes-list">
              {#each approval.votes as v}
                <li class="vote-item vote-{v.vote}">
                  <div class="vote-header">
                    <span class="voter">
                      <User size={14} />
                      {v.voter_name || 'Unknown'}
                    </span>
                    <span class="vote-type">
                      {#if v.vote === 'approve'}
                        <CheckCircle size={14} />
                      {:else if v.vote === 'reject'}
                        <CircleX size={14} />
                      {:else}
                        <AlertCircle size={14} />
                      {/if}
                      {v.vote}
                    </span>
                  </div>
                  {#if v.comment}
                    <p class="vote-comment">{v.comment}</p>
                  {/if}
                  <span class="vote-time">{formatDate(v.created_at)}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Similar Past Approvals -->
        {#if approval.similar_approvals && approval.similar_approvals.length > 0}
          <div class="sidebar-card">
            <h3>Similar Past Approvals</h3>
            <ul class="similar-list">
              {#each approval.similar_approvals as similar}
                <li class="similar-item">
                  <a href="/approvals/{similar.id}">
                    <span class="similar-title">{similar.title}</span>
                    <span class="similar-meta">
                      <span class="badge badge-{similar.status === 'approved' ? 'success' : 'danger'} badge-sm">
                        {similar.status}
                      </span>
                      {formatDate(similar.resolved_at)}
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Actions -->
        <div class="sidebar-card">
          <h3>Actions</h3>
          <div class="sidebar-actions">
            <button class="btn btn-sm btn-outline" onclick={refreshApproval} disabled={loading}>
              <RefreshCw size={14} class={loading ? 'spinning' : ''} />
              Refresh
            </button>
            {#if approval.external_url}
              <a href={approval.external_url} target="_blank" rel="noopener" class="btn btn-sm btn-outline">
                <ExternalLink size={14} />
                View External
              </a>
            {/if}
          </div>
        </div>
      </aside>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .approval-detail {
    @apply flex flex-col h-full;
  }

  .page-header {
    @apply flex items-center justify-between px-6 py-4 border-b border-border bg-base01;
  }

  .back-btn {
    @apply inline-flex items-center gap-2 px-3 py-2 rounded-lg;
    @apply text-sm text-base04 hover:text-base05 hover:bg-base02;
    @apply transition-colors cursor-pointer bg-transparent border-none;
  }

  .header-actions {
    @apply flex gap-3;
  }

  .content-grid {
    @apply flex-1 grid grid-cols-[1fr_320px] gap-6 p-6 overflow-hidden;
  }

  .main-content {
    @apply flex flex-col gap-6 overflow-y-auto;
  }

  .sidebar {
    @apply flex flex-col gap-4 overflow-y-auto;
  }

  /* Title Section */
  .title-section {
    @apply bg-base01 border border-border rounded-xl p-6;
  }

  .title-row {
    @apply flex items-center gap-3 mb-4;
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

  .badge-sm {
    @apply px-2 py-0.5 text-xs;
  }

  .title {
    @apply text-2xl font-bold text-base06 mb-4;
  }

  .meta-row {
    @apply flex flex-wrap items-center gap-4 text-sm text-base04 mb-3;
  }

  .meta-row strong {
    @apply text-base05;
  }

  .tier-badge {
    @apply px-2 py-0.5 bg-base02 rounded text-xs cursor-help;
  }

  .timestamps {
    @apply flex flex-wrap gap-4 text-sm text-base04;
  }

  .expires-in,
  .override-window {
    @apply inline-flex items-center gap-1 text-base09;
  }

  /* Section */
  .section {
    @apply bg-base01 border border-border rounded-xl p-6;
  }

  .section-header {
    @apply flex items-center justify-between mb-4;
  }

  .section-title {
    @apply inline-flex items-center gap-2 text-lg font-semibold text-base06;
  }

  .toggle-btn {
    @apply px-3 py-1 text-sm rounded-lg;
    @apply bg-base02 text-base04 hover:text-base05;
    @apply transition-colors cursor-pointer border-none;
  }

  /* AI Analysis */
  .ai-analysis-section .section-title {
    @apply mb-4;
  }

  .ai-grid {
    @apply grid grid-cols-2 gap-4 mb-4;
  }

  .ai-card {
    @apply bg-base02 rounded-lg p-4;
  }

  .ai-card-header {
    @apply flex items-center justify-between mb-3;
  }

  .ai-card-label {
    @apply text-sm font-medium text-base04;
  }

  .recommendation {
    @apply px-3 py-1 rounded-full text-xs font-semibold capitalize;
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

  .confidence-display {
    @apply space-y-2;
  }

  .confidence-header {
    @apply flex justify-between text-sm;
  }

  .confidence-bar {
    @apply h-2 bg-base00 rounded-full overflow-hidden;
  }

  .confidence-fill {
    @apply h-full rounded-full transition-all;
  }

  .confidence-label {
    @apply text-xs text-base04;
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

  .breakdown-list {
    @apply space-y-2;
  }

  .breakdown-item {
    @apply flex items-center gap-2 text-sm;
  }

  .breakdown-label {
    @apply w-24 text-base04 capitalize truncate;
  }

  .breakdown-bar {
    @apply flex-1 h-1.5 bg-base00 rounded-full overflow-hidden;
  }

  .breakdown-fill {
    @apply h-full bg-base0D rounded-full;
  }

  .breakdown-value {
    @apply w-10 text-right text-base04;
  }

  .ai-reasoning {
    @apply mt-4 p-4 bg-base02 rounded-lg;
  }

  .ai-reasoning h3 {
    @apply text-sm font-medium text-base04 mb-2;
  }

  .ai-reasoning p {
    @apply text-sm text-base05 leading-relaxed;
  }

  /* Git Changes */
  .git-summary {
    @apply flex items-center gap-4 text-sm mb-4;
  }

  .git-stat {
    @apply font-mono;
  }

  .git-stat.additions {
    @apply text-base0B;
  }

  .git-stat.deletions {
    @apply text-base08;
  }

  .git-branch {
    @apply inline-flex items-center gap-1 text-base04;
  }

  .files-list {
    @apply border border-border rounded-lg divide-y divide-border mb-4;
  }

  .file-item {
    @apply flex items-center justify-between px-4 py-2 text-sm;
  }

  .file-path {
    @apply font-mono text-base05;
  }

  .file-stats {
    @apply flex gap-2 font-mono text-xs;
  }

  .file-stats .additions {
    @apply text-base0B;
  }

  .file-stats .deletions {
    @apply text-base08;
  }

  .diff-viewer {
    @apply bg-base00 border border-border rounded-lg p-4 overflow-x-auto;
  }

  .diff-viewer pre {
    @apply text-xs font-mono text-base05 whitespace-pre;
  }

  .payload-display {
    @apply bg-base00 border border-border rounded-lg p-4 overflow-x-auto;
  }

  .payload-display pre {
    @apply text-sm font-mono text-base05 whitespace-pre-wrap;
  }

  /* Decision Section */
  .decision-section {
    @apply border-base0D/30;
  }

  .comment-form {
    @apply mb-4;
  }

  .comment-form label {
    @apply block text-sm font-medium text-base04 mb-2;
  }

  .comment-form textarea {
    @apply w-full px-4 py-3 rounded-lg;
    @apply bg-base00 border border-border text-base05;
    @apply text-sm resize-none;
    @apply outline-none focus:border-base0D;
    @apply transition-colors;
  }

  .decision-actions {
    @apply flex gap-3;
  }

  /* Resolution Section */
  .resolution-section {
    @apply bg-base02;
  }

  .resolution-info {
    @apply space-y-3;
  }

  .resolution-row {
    @apply flex items-center gap-3 text-sm;
  }

  .resolution-label {
    @apply text-base04;
  }

  .resolver {
    @apply inline-flex items-center gap-1.5 text-base05;
  }

  .resolution-comment {
    @apply mt-4 pt-4 border-t border-border;
  }

  .resolution-comment p {
    @apply mt-2 text-sm text-base05;
  }

  /* Sidebar Cards */
  .sidebar-card {
    @apply bg-base01 border border-border rounded-xl p-4;
  }

  .sidebar-card h3 {
    @apply text-sm font-semibold text-base06 mb-3 pb-2 border-b border-border;
  }

  .info-list {
    @apply space-y-2 text-sm;
  }

  .info-list dt {
    @apply text-base04;
  }

  .info-list dd {
    @apply text-base05 mt-0.5;
  }

  .info-list dd.mono {
    @apply font-mono text-xs;
  }

  .votes-list {
    @apply space-y-3;
  }

  .vote-item {
    @apply p-3 rounded-lg bg-base02;
  }

  .vote-item.vote-approve {
    @apply border-l-2 border-base0B;
  }

  .vote-item.vote-reject {
    @apply border-l-2 border-base08;
  }

  .vote-header {
    @apply flex items-center justify-between mb-1;
  }

  .voter {
    @apply inline-flex items-center gap-1 text-sm font-medium text-base05;
  }

  .vote-type {
    @apply inline-flex items-center gap-1 text-xs capitalize;
  }

  .vote-item.vote-approve .vote-type {
    @apply text-base0B;
  }

  .vote-item.vote-reject .vote-type {
    @apply text-base08;
  }

  .vote-comment {
    @apply text-sm text-base04 mt-2;
  }

  .vote-time {
    @apply text-xs text-base04;
  }

  .similar-list {
    @apply space-y-2;
  }

  .similar-item a {
    @apply block p-2 rounded hover:bg-base02 transition-colors;
  }

  .similar-title {
    @apply block text-sm text-base05 truncate;
  }

  .similar-meta {
    @apply flex items-center gap-2 text-xs text-base04 mt-1;
  }

  .sidebar-actions {
    @apply flex flex-col gap-2;
  }

  .sidebar-actions .btn,
  .sidebar-actions a {
    @apply w-full justify-center;
  }

  /* Buttons */
  .btn {
    @apply inline-flex items-center justify-center gap-2 px-4 py-2;
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

  .btn-lg {
    @apply px-6 py-3 text-base;
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
  .loading-state {
    @apply flex items-center justify-center py-12 text-base04;
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
    .content-grid {
      @apply grid-cols-1;
    }

    .sidebar {
      @apply flex-row flex-wrap;
    }

    .sidebar-card {
      @apply flex-1 min-w-[280px];
    }
  }

  @media (max-width: 640px) {
    .ai-grid {
      @apply grid-cols-1;
    }

    .decision-actions {
      @apply flex-col;
    }

    .header-actions {
      @apply flex-col gap-2;
    }
  }
</style>
