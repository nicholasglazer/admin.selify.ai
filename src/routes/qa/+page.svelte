<script>
  import {setContext, getContext, onMount, onDestroy} from 'svelte';
  import {PageHeader} from '$components';
  import {Badge} from '@miozu/jera';
  import {Play, Plus, Layers, Calendar, AlertTriangle} from '@lucide/svelte';
  import {getQAState, resetQAState} from '$lib/reactiveStates';
  import QADashboard from './QADashboard.svelte';
  import QASpecList from './QASpecList.svelte';
  import QARunList from './QARunList.svelte';
  import QASuiteList from './QASuiteList.svelte';
  import QATriageView from './QATriageView.svelte';
  import QADocs from './QADocs.svelte';
  import NLTestCreator from './NLTestCreator.svelte';
  import SpecDetailModal from './SpecDetailModal.svelte';
  import RunDetailModal from './RunDetailModal.svelte';

  let {data} = $props();

  const toastState = getContext('toastState');
  const supabaseHolder = getContext('supabase');

  // Initialize QA state
  const qaState = getQAState({
    specs: data.specs,
    runs: data.runs,
    dashboardSummary: data.dashboardSummary,
    showToast: (msg) => toastState?.show(msg),
    supabase: null,
    apiBaseUrl: data.apiBaseUrl
  });

  setContext('qaState', qaState);


  // Derived values
  let viewMode = $derived(qaState.viewMode);
  let totalSpecs = $derived(qaState.totalSpecs);
  let totalSuites = $derived(qaState.totalSuites);
  let passRate = $derived(qaState.passRate);
  let healRate = $derived(qaState.healRate);
  let pendingTriage = $derived(qaState.pendingTriageCount);
  let selectedSpec = $derived(qaState.selectedSpec);
  let selectedRun = $derived(qaState.selectedRun);
  let selectedSuite = $derived(qaState.selectedSuite);
  let nlCreatorOpen = $derived(qaState.nlCreator.isOpen);

  // View mode tabs
  const tabs = [
    {id: 'specs', label: 'Test Specs', icon: 'file-code'},
    {id: 'suites', label: 'Suites', icon: 'layers'},
    {id: 'runs', label: 'Test Runs', icon: 'play-circle'},
    {id: 'triage', label: 'Triage', icon: 'alert', badge: true},
    {id: 'coverage', label: 'Coverage', icon: 'grid'},
    {id: 'docs', label: 'Architecture', icon: 'book'}
  ];

  // Load suites and triage on mount
  onMount(() => {
    const checkSupabase = setInterval(() => {
      if (supabaseHolder?.client) {
        qaState.supabase = supabaseHolder.client;
        qaState.loadSuites();
        qaState.loadTriageSummary();
        qaState.loadSchedules();
        clearInterval(checkSupabase);
      }
    }, 50);
    return () => clearInterval(checkSupabase);
  });

  function handleNewSpec() {
    qaState.openNLCreator();
  }

  function handleRunAll() {
    qaState.startRun({environment: 'staging'});
  }

  // Cleanup on destroy - reset singleton to prevent memory leaks
  onDestroy(() => {
    resetQAState();
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
        <Play size={16} />
        Run All
      </button>
      <button class="btn-primary" onclick={handleNewSpec}>
        <Plus size={16} />
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
        {#if tab.badge && pendingTriage > 0}
          <span class="tab-badge">{pendingTriage}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="qa-content">
    {#if viewMode === 'specs'}
      <QASpecList />
    {:else if viewMode === 'suites'}
      <QASuiteList />
    {:else if viewMode === 'runs'}
      <QARunList />
    {:else if viewMode === 'triage'}
      <QATriageView />
    {:else if viewMode === 'coverage'}
      <QADashboard />
    {:else if viewMode === 'docs'}
      <QADocs />
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
    @apply flex flex-col h-full w-full;
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
    @apply flex gap-1 py-3 border-b border-base02;
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

  .tab-badge {
    @apply ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-base08 text-white font-medium;
  }

  .qa-content {
    @apply flex-1 overflow-auto;
  }
</style>
