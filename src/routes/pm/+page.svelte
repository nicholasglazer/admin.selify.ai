<script>
  import {setContext, getContext, onMount, onDestroy} from 'svelte';
  import {Plus} from '@lucide/svelte';
  import {Button} from '@miozu/jera';
  import {PageHeader} from '$components';
  import {getPMBoardState, resetPMBoardState} from '$lib/reactiveStates';
  import PMBoard from './PMBoard.svelte';
  import IssueModal from './IssueModal.svelte';

  let {data} = $props();

  // Get contexts from parent layout
  const toastState = getContext('toastState');
  const supabaseHolder = getContext('supabase');

  // Initialize PM board state
  const pmState = getPMBoardState({
    issues: data.issues || [],
    columns: data.columns,
    teamMembers: data.teamMembers || [],
    boardSummary: data.boardSummary || {},
    showToast: (msg) => toastState?.show(msg),
    supabase: null
  });

  // Provide PM state to child components
  setContext('pmState', pmState);

  // Set supabase client when it becomes available
  onMount(() => {
    // Poll for supabase client (it's set async in layout)
    const checkSupabase = setInterval(() => {
      if (supabaseHolder?.client) {
        pmState.supabase = supabaseHolder.client;
        clearInterval(checkSupabase);
      }
    }, 50);

    // Cleanup interval if component unmounts
    return () => clearInterval(checkSupabase);
  });

  // Derived values
  let totalIssues = $derived(pmState.totalIssues);
  let columnCounts = $derived(pmState.getColumnCounts());
  let selectedIssue = $derived(pmState.selectedIssue);

  // Cleanup on destroy - reset singleton to prevent memory leaks
  onDestroy(() => {
    resetPMBoardState();
  });

  // Track loading state for new issue creation
  let isCreatingTask = $state(false);

  // Handle new issue creation
  async function handleNewIssue() {
    if (isCreatingTask) return;
    isCreatingTask = true;

    try {
      await pmState.addIssue({
        title: 'New Task',
        description: '',
        status: 'backlog',
        priority: 'medium',
        issue_type: 'task'
      });
    } finally {
      isCreatingTask = false;
    }
  }
</script>

<svelte:head>
  <title>PM Board - Selify Admin</title>
</svelte:head>

<div class="pm-page">
  <PageHeader title="PM Board" subtitle="AI-first task management and issue tracking">
    {#snippet actions()}
      <div class="header-stats">
        <div class="stat">
          <span class="stat-value">{totalIssues}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat">
          <span class="stat-value">{columnCounts.in_progress || 0}</span>
          <span class="stat-label">In Progress</span>
        </div>
        <div class="stat">
          <span class="stat-value">{columnCounts.review || 0}</span>
          <span class="stat-label">Review</span>
        </div>
      </div>
      <Button variant="primary" onclick={handleNewIssue} disabled={isCreatingTask}>
        <Plus size={16} />
        {isCreatingTask ? 'Creating...' : 'New Task'}
      </Button>
    {/snippet}
  </PageHeader>

  <PMBoard />

  {#if selectedIssue}
    <IssueModal issue={selectedIssue} onClose={() => pmState.closeIssue()} />
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .pm-page {
    @apply flex flex-col h-full w-full;
  }

  .header-stats {
    @apply flex items-center gap-4 mr-4;
  }

  .stat {
    @apply flex flex-col items-center;
  }

  .stat-value {
    @apply text-lg font-semibold text-base06;
  }

  .stat-label {
    @apply text-xs text-base04;
  }
</style>
