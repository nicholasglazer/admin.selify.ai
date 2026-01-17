<script>
  import {setContext, getContext, onDestroy} from 'svelte';
  import {PageHeader} from '$components';
  import {Badge} from '@miozu/jera';
  import {getQAState} from '$lib/reactiveStates';
  import QADashboard from './QADashboard.svelte';
  import QASpecList from './QASpecList.svelte';
  import QARunList from './QARunList.svelte';
  import NLTestCreator from './NLTestCreator.svelte';
  import SpecDetailModal from './SpecDetailModal.svelte';
  import RunDetailModal from './RunDetailModal.svelte';

  let {data} = $props();

  const toastState = getContext('toastState');
  const supabase = getContext('supabase');

  // Initialize QA state
  const qaState = getQAState({
    specs: data.specs,
    runs: data.runs,
    dashboardSummary: data.dashboardSummary,
    showToast: (msg) => toastState?.show(msg),
    supabase,
    apiBaseUrl: data.apiBaseUrl
  });

  setContext('qaState', qaState);

  // Derived values
  let viewMode = $derived(qaState.viewMode);
  let totalSpecs = $derived(qaState.totalSpecs);
  let passRate = $derived(qaState.passRate);
  let healRate = $derived(qaState.healRate);
  let selectedSpec = $derived(qaState.selectedSpec);
  let selectedRun = $derived(qaState.selectedRun);
  let nlCreatorOpen = $derived(qaState.nlCreator.isOpen);

  // View mode tabs
  const tabs = [
    {id: 'specs', label: 'Test Specs', icon: 'file-code'},
    {id: 'runs', label: 'Test Runs', icon: 'play-circle'},
    {id: 'coverage', label: 'Coverage', icon: 'grid'}
  ];

  function handleNewSpec() {
    qaState.openNLCreator();
  }

  function handleRunAll() {
    qaState.startRun({environment: 'staging'});
  }

  onDestroy(() => {
    qaState.cleanup();
  });
</script>

<svelte:head>
  <title>QA Dashboard - Selify Admin</title>
</svelte:head>

<div class="qa-page">
  <PageHeader title="QA Dashboard" subtitle="AI-first test automation with Playwright agents">
    {#snippet actions()}
      <div class="header-stats">
        <div class="stat">
          <span class="stat-value">{totalSpecs}</span>
          <span class="stat-label">Specs</span>
        </div>
        <div class="stat">
          <span class="stat-value pass">{passRate}%</span>
          <span class="stat-label">Pass Rate</span>
        </div>
        <div class="stat">
          <span class="stat-value heal">{healRate}%</span>
          <span class="stat-label">Auto-Healed</span>
        </div>
      </div>
      <button class="btn-secondary" onclick={handleRunAll}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Run All
      </button>
      <button class="btn-primary" onclick={handleNewSpec}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Spec
      </button>
    {/snippet}
  </PageHeader>

  <!-- View Mode Tabs -->
  <div class="view-tabs">
    {#each tabs as tab}
      <button
        class="tab"
        class:active={viewMode === tab.id}
        onclick={() => qaState.setViewMode(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="qa-content">
    {#if viewMode === 'specs'}
      <QASpecList />
    {:else if viewMode === 'runs'}
      <QARunList />
    {:else if viewMode === 'coverage'}
      <QADashboard />
    {/if}
  </div>

  <!-- Modals -->
  {#if nlCreatorOpen}
    <NLTestCreator />
  {/if}

  {#if selectedSpec}
    <SpecDetailModal spec={selectedSpec} onClose={() => qaState.closeSpec()} />
  {/if}

  {#if selectedRun}
    <RunDetailModal run={selectedRun} onClose={() => qaState.closeRun()} />
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .qa-page {
    @apply flex flex-col h-full;
  }

  .header-stats {
    @apply flex items-center gap-6 mr-4;
  }

  .stat {
    @apply flex flex-col items-center;
  }

  .stat-value {
    @apply text-lg font-semibold text-base06;
  }

  .stat-value.pass {
    @apply text-base0B;
  }

  .stat-value.heal {
    @apply text-base0E;
  }

  .stat-label {
    @apply text-xs text-base04;
  }

  .btn-primary {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base0D text-white rounded-lg;
    @apply text-sm font-medium;
    @apply transition-all duration-150;
    @apply hover:bg-base0D/90;
  }

  .btn-secondary {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base02 text-base06 rounded-lg;
    @apply text-sm font-medium;
    @apply transition-all duration-150;
    @apply hover:bg-base03;
  }

  .view-tabs {
    @apply flex gap-1 px-6 py-3 border-b border-base02;
    @apply bg-base01/50;
  }

  .tab {
    @apply px-4 py-2 rounded-lg text-sm font-medium;
    @apply text-base04 transition-all duration-150;
    @apply hover:text-base06 hover:bg-base02;
  }

  .tab.active {
    @apply bg-base02 text-base06;
  }

  .qa-content {
    @apply flex-1 overflow-auto p-6;
  }
</style>
