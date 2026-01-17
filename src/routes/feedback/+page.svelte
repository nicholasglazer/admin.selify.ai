<script>
  import {getContext} from 'svelte';
  import {PageHeader, Badge} from '$components';

  let {data} = $props();

  const toastState = getContext('toastState');
  const supabase = getContext('supabase');

  // State
  let feedback = $state(data.feedback);
  let selectedFeedback = $state(null);
  let isPromoting = $state(false);
  let filter = $state('all'); // all, new, reviewing, resolved

  // Filtered feedback
  let filteredFeedback = $derived(filter === 'all' ? feedback : feedback.filter((f) => f.status === filter));

  // Status counts
  let statusCounts = $derived({
    all: feedback.length,
    new: feedback.filter((f) => f.status === 'new').length,
    reviewing: feedback.filter((f) => f.status === 'reviewing').length,
    resolved: feedback.filter((f) => f.status === 'resolved' || f.status === 'closed').length
  });

  // Category labels
  const categoryLabels = {
    bug: '🐛',
    feature: '💡',
    question: '❓',
    other: '💬'
  };

  // Status colors
  const statusColors = {
    new: 'warning',
    reviewing: 'info',
    in_progress: 'info',
    resolved: 'success',
    closed: 'neutral',
    spam: 'error'
  };

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  // Promote feedback to task
  async function promoteToTask(feedbackItem) {
    isPromoting = true;

    try {
      // Call the RPC function to create task from feedback (internal schema)
      const {data: taskId, error: rpcError} = await supabase
        .schema('internal')
        .rpc('create_task_from_feedback', {p_feedback_id: feedbackItem.id});

      if (rpcError) {
        throw rpcError;
      }

      // Update local state
      const idx = feedback.findIndex((f) => f.id === feedbackItem.id);
      if (idx !== -1) {
        feedback[idx] = {...feedback[idx], status: 'reviewing', task_id: taskId};
        feedback = [...feedback];
      }

      toastState?.show({
        title: 'Task Created',
        message: `"${feedbackItem.title}" promoted to PM board`,
        type: 'success',
        duration: 3000
      });

      selectedFeedback = null;
    } catch (err) {
      console.error('Failed to promote feedback:', err);
      toastState?.show({
        title: 'Error',
        message: err.message || 'Failed to create task',
        type: 'error',
        duration: 5000
      });
    } finally {
      isPromoting = false;
    }
  }

  // Mark as spam/closed
  async function updateStatus(feedbackItem, newStatus) {
    try {
      const {error: updateError} = await supabase
        .from('user_feedback')
        .update({status: newStatus})
        .eq('id', feedbackItem.id);

      if (updateError) throw updateError;

      // Update local state
      const idx = feedback.findIndex((f) => f.id === feedbackItem.id);
      if (idx !== -1) {
        feedback[idx] = {...feedback[idx], status: newStatus};
        feedback = [...feedback];
      }

      toastState?.show({
        title: 'Status Updated',
        message: `Marked as ${newStatus}`,
        type: 'info',
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }
</script>

<svelte:head>
  <title>Feedback Triage - Selify Admin</title>
</svelte:head>

<div class="feedback-page">
  <PageHeader title="Feedback Triage" subtitle="Review and promote user feedback to tasks">
    {#snippet actions()}
      <div class="filter-tabs">
        <button class="filter-tab" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          All ({statusCounts.all})
        </button>
        <button class="filter-tab" class:active={filter === 'new'} onclick={() => (filter = 'new')}>
          New ({statusCounts.new})
        </button>
        <button class="filter-tab" class:active={filter === 'reviewing'} onclick={() => (filter = 'reviewing')}>
          Reviewing ({statusCounts.reviewing})
        </button>
        <button class="filter-tab" class:active={filter === 'resolved'} onclick={() => (filter = 'resolved')}>
          Resolved ({statusCounts.resolved})
        </button>
      </div>
    {/snippet}
  </PageHeader>

  <div class="feedback-list">
    {#if filteredFeedback.length === 0}
      <div class="empty-state">
        <span class="empty-icon">💬</span>
        <p>No feedback to show</p>
      </div>
    {:else}
      {#each filteredFeedback as item (item.id)}
        <div
          class="feedback-card"
          class:selected={selectedFeedback?.id === item.id}
          onclick={() => (selectedFeedback = selectedFeedback?.id === item.id ? null : item)}
        >
          <div class="card-header">
            <div class="category-icon">
              {categoryLabels[item.category] || '💬'}
            </div>
            <div class="card-meta">
              <span class="user-email">{item.user_email || 'Anonymous'}</span>
              <span class="dot">•</span>
              <span class="date">{formatDate(item.created_at)}</span>
            </div>
            <Badge variant={statusColors[item.status] || 'neutral'} size="sm">
              {item.status}
            </Badge>
            {#if item.task_id}
              <Badge variant="info" size="sm">Has Task</Badge>
            {/if}
          </div>

          <h3 class="card-title">{item.title}</h3>

          <p class="card-description">{item.description?.slice(0, 200)}{item.description?.length > 200 ? '...' : ''}</p>

          {#if item.affected_area}
            <div class="affected-area">
              <span class="label">Area:</span>
              <span class="value">{item.affected_area}</span>
            </div>
          {/if}

          {#if selectedFeedback?.id === item.id}
            <div class="card-actions">
              {#if !item.task_id && item.status !== 'spam' && item.status !== 'closed'}
                <button
                  class="action-btn primary"
                  onclick={(e) => {
                    e.stopPropagation();
                    promoteToTask(item);
                  }}
                  disabled={isPromoting}
                >
                  {#if isPromoting}
                    ⏳
                  {:else}
                    →
                  {/if}
                  Promote to Task
                </button>
              {/if}

              {#if item.status === 'new'}
                <button
                  class="action-btn"
                  onclick={(e) => {
                    e.stopPropagation();
                    updateStatus(item, 'reviewing');
                  }}
                >
                  ✓ Mark Reviewing
                </button>
              {/if}

              {#if item.status !== 'spam'}
                <button
                  class="action-btn danger"
                  onclick={(e) => {
                    e.stopPropagation();
                    updateStatus(item, 'spam');
                  }}
                >
                  ✕ Spam
                </button>
              {/if}
            </div>

            {#if item.steps_to_reproduce}
              <div class="detail-section">
                <h4>Steps to Reproduce</h4>
                <pre>{item.steps_to_reproduce}</pre>
              </div>
            {/if}

            {#if item.metadata?.console_errors?.length > 0}
              <div class="detail-section">
                <h4>Console Errors ({item.metadata.console_errors.length})</h4>
                <pre class="errors">{item.metadata.console_errors.join('\n')}</pre>
              </div>
            {/if}
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .feedback-page {
    @apply flex flex-col h-full;
  }

  .filter-tabs {
    @apply flex gap-1 bg-base01 rounded-lg p-1;
  }

  .filter-tab {
    @apply px-3 py-1.5 rounded-md text-sm;
    @apply bg-transparent text-base05 cursor-pointer;
    @apply transition-all duration-150;
  }

  .filter-tab:hover {
    @apply text-base06;
  }

  .filter-tab.active {
    @apply bg-base02 text-base07;
  }

  .feedback-list {
    @apply space-y-3 mt-4;
  }

  .empty-state {
    @apply flex flex-col items-center justify-center py-16;
    @apply text-base04;
  }

  .empty-icon {
    @apply text-5xl;
  }

  .empty-state p {
    @apply mt-4 text-base05;
  }

  .feedback-card {
    @apply bg-base01 border border-base03/40 rounded-xl p-4;
    @apply cursor-pointer transition-all duration-150;
  }

  .feedback-card:hover {
    @apply border-base03/60;
  }

  .feedback-card.selected {
    @apply border-base0D/50 ring-1 ring-base0D/20;
  }

  .card-header {
    @apply flex items-center gap-2 mb-2;
  }

  .category-icon {
    @apply w-8 h-8 rounded-lg flex items-center justify-center;
    @apply bg-base02 text-base05;
  }

  .card-meta {
    @apply flex items-center gap-1.5 flex-1;
    @apply text-sm text-base05;
  }

  .user-email {
    @apply font-medium text-base06;
  }

  .dot {
    @apply text-base04;
  }

  .card-title {
    @apply text-base font-medium text-base07 mb-1;
  }

  .card-description {
    @apply text-sm text-base05 mb-2;
  }

  .affected-area {
    @apply flex items-center gap-2 text-sm;
  }

  .affected-area .label {
    @apply text-base04;
  }

  .affected-area .value {
    @apply text-base06;
  }

  .card-actions {
    @apply flex gap-2 mt-4 pt-4 border-t border-base03/30;
  }

  .action-btn {
    @apply flex items-center gap-1.5 px-3 py-1.5;
    @apply rounded-lg text-sm font-medium;
    @apply bg-base02 text-base06 cursor-pointer;
    @apply transition-all duration-150;
  }

  .action-btn:hover:not(:disabled) {
    @apply bg-base03;
  }

  .action-btn:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .action-btn.primary {
    @apply bg-base0D text-white;
  }

  .action-btn.primary:hover:not(:disabled) {
    @apply bg-base0D/90;
  }

  .action-btn.danger {
    @apply text-base08;
  }

  .action-btn.danger:hover:not(:disabled) {
    @apply bg-base08/10;
  }

  .detail-section {
    @apply mt-4 pt-4 border-t border-base03/30;
  }

  .detail-section h4 {
    @apply text-sm font-medium text-base05 mb-2;
  }

  .detail-section pre {
    @apply text-xs bg-base00 p-3 rounded-lg;
    @apply text-base06 whitespace-pre-wrap;
    @apply max-h-32 overflow-auto;
  }

  .detail-section pre.errors {
    @apply text-base08;
  }
</style>
