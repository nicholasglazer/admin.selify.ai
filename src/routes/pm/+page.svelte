<script>
  import {setContext, getContext, onMount, onDestroy} from 'svelte';
  import {PageHeader} from '$components';
  import {getPMBoardState} from '$lib/reactiveStates';
  import PMBoard from './PMBoard.svelte';
  import IssueModal from './IssueModal.svelte';

  let {data} = $props();

  // Get toast state from parent context
  const toastState = getContext('toastState');

  // Initialize PM board state
  const pmState = getPMBoardState({
    issues: data.issues,
    columns: data.columns,
    showToast: msg => toastState?.show(msg)
  });

  // Provide PM state to child components
  setContext('pmState', pmState);

  // Derived values
  let totalIssues = $derived(pmState.totalIssues);
  let columnCounts = $derived(pmState.getColumnCounts());
  let selectedIssue = $derived(pmState.selectedIssue);

  // Cleanup on destroy
  onDestroy(() => {
    pmState.cleanup();
  });

  // Handle new issue creation
  function handleNewIssue() {
    pmState.addIssue({
      title: 'New Issue',
      description: '',
      status: 'backlog',
      priority: 'medium'
    });
  }
</script>

<svelte:head>
  <title>PM Board - Selify Admin</title>
</svelte:head>

<div class="pm-page">
  <PageHeader
    title="PM Board"
    subtitle="AI-first task management and issue tracking"
  >
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
      <button class="btn-new-issue" onclick={handleNewIssue}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        New Issue
      </button>
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
    @apply flex flex-col h-full;
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

  .btn-new-issue {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base0D text-white rounded-lg;
    @apply text-sm font-medium;
    @apply transition-all duration-150;
    @apply hover:bg-base0D/90;
  }
</style>
