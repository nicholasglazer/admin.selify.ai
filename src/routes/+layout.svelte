<script>
  import '../app.css';
  import {setContext, onMount, onDestroy} from 'svelte';
  import {browser} from '$app/environment';
  import {AdminSidebar, Toaster, ActivityTracker} from '$components';
  import {getThemeState, getAdminState, getToastState, getTemporalState, resetTemporalState} from '$lib/reactiveStates';

  let {data, children} = $props();

  // Initialize reactive states from server data
  // Theme is already applied via inline script in app.html - no onMount needed
  const themeState = getThemeState(data.theme);
  const adminState = getAdminState({
    teamMember: data.teamMember,
    capabilities: data.capabilities
  });
  const toastState = getToastState();

  // Initialize temporal state for ActivityTracker (global workflow monitoring)
  const temporalState = getTemporalState({
    apiBaseUrl: data.apiBaseUrl,
    showToast: (msg) => toastState?.show(msg)
  });

  // Supabase holder - reactive object that gets populated on mount
  const supabaseHolder = {client: null, internalClient: null};

  onMount(async () => {
    if (browser) {
      const {getSupabaseClient, createInternalSchemaProxy} = await import('$lib/supabase.js');
      supabaseHolder.client = getSupabaseClient();
      // Create internal schema proxy from the main client (shares session)
      supabaseHolder.internalClient = createInternalSchemaProxy(supabaseHolder.client);

      // Only fetch active processes if user has temporal access
      // Avoid unnecessary API calls on ops pages that don't need this
      if (data.capabilities?.includes('*') || data.capabilities?.includes('ops.temporal.view')) {
        // Delay initial fetch to avoid competing with page-specific API calls
        setTimeout(() => {
          temporalState.fetchActiveProcesses();
        }, 2000);
      }
    }
  });

  onDestroy(() => {
    // Clean up temporal SSE connections
    temporalState?.cleanup();
  });

  // Provide states via context for child components
  setContext('themeState', themeState);
  setContext('adminState', adminState);
  setContext('toastState', toastState);
  setContext('temporalState', temporalState);
  setContext('supabase', supabaseHolder);

  // Derived values
  let teamMember = $derived(data.teamMember);
  let capabilities = $derived(data.capabilities);
</script>

<div class="admin-layout">
  {#if teamMember}
    <AdminSidebar {teamMember} {capabilities} />
  {/if}

  <main class="main-content">
    <div class="content-container">
      {@render children()}
    </div>
  </main>
</div>

<!-- Toast notifications -->
<Toaster position="bottom-right" />

<!-- Activity tracker for active workflows -->
<ActivityTracker />

<style lang="postcss">
  @reference '$theme';

  .admin-layout {
    @apply flex min-h-screen bg-base00;
  }

  /* Only enable transitions after initial paint to prevent FOUC */
  :global(:root.transitions-enabled) .admin-layout {
    @apply transition-colors duration-200;
  }

  .main-content {
    @apply flex-1 flex flex-col overflow-y-auto;
  }

  .content-container {
    @apply flex-1 p-5 w-full;
  }
</style>
