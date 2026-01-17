<script>
  import '../app.css';
  import {setContext, onMount} from 'svelte';
  import {Sidebar, Toaster, ThemeToggle} from '$components';
  import {getThemeState, getAdminState, getToastState} from '$lib/reactiveStates';

  let {data, children} = $props();

  // Initialize reactive states from server data
  const themeState = getThemeState(data.theme);
  const adminState = getAdminState({
    teamMember: data.teamMember,
    capabilities: data.capabilities
  });
  const toastState = getToastState();

  // Provide states via context for child components
  setContext('themeState', themeState);
  setContext('adminState', adminState);
  setContext('toastState', toastState);

  // Apply theme on mount (client-side)
  onMount(() => {
    themeState.apply();
  });

  // Derived values
  let isDark = $derived(themeState.isDark);
  let teamMember = $derived(data.teamMember);
  let capabilities = $derived(data.capabilities);
</script>

<div class="admin-layout">
  {#if teamMember}
    <Sidebar {teamMember} {capabilities} />
  {/if}

  <main class="main-content">
    <!-- Top bar with theme toggle -->
    <header class="top-bar">
      <div class="top-bar-content">
        <div class="top-bar-left">
          <!-- Breadcrumb or page title could go here -->
        </div>
        <div class="top-bar-right">
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="content-container">
      {@render children()}
    </div>
  </main>
</div>

<!-- Toast notifications -->
<Toaster position="bottom-right" />

<style lang="postcss">
  @reference '$theme';

  .admin-layout {
    @apply flex min-h-screen bg-base00;
    @apply transition-colors duration-200;
  }

  .main-content {
    @apply flex-1 flex flex-col overflow-y-auto;
  }

  .top-bar {
    @apply sticky top-0 z-10;
    @apply bg-base00/80 backdrop-blur-sm;
    @apply border-b border-border;
  }

  .top-bar-content {
    @apply flex items-center justify-between;
    @apply max-w-6xl mx-auto px-6 py-3;
  }

  .top-bar-left {
    @apply flex items-center gap-4;
  }

  .top-bar-right {
    @apply flex items-center gap-3;
  }

  .content-container {
    @apply flex-1 max-w-6xl mx-auto p-6 w-full;
  }
</style>
