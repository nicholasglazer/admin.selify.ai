<script>
  import '../app.css';
  import {setContext, onMount, onDestroy} from 'svelte';
  import {browser} from '$app/environment';
  import {getTheme} from '@miozu/jera';
  import {DashStyleSidebar, Toaster, ActivityTracker} from '$components';
  import {
    getAdminState,
    getToastState,
    getTemporalState,
    getEnvironmentState,
    resetTemporalState
  } from '$lib/reactiveStates';

  let {data, children} = $props();

  // Theme singleton from Jera - syncs with DOM set by app.html
  const themeState = getTheme();
  const adminState = getAdminState({
    teamMember: data.teamMember,
    capabilities: data.capabilities
  });
  const toastState = getToastState();

  // Initialize environment state from server data
  const environmentState = getEnvironmentState({
    production: data.environment?.production || {
      supabaseUrl: '',
      supabaseAnonKey: '',
      apiBaseUrl: 'https://api.selify.ai',
      label: 'Production',
      color: 'base0B'
    },
    staging: data.environment?.staging || {
      supabaseUrl: '',
      supabaseAnonKey: '',
      apiBaseUrl: 'https://staging-api.selify.ai',
      label: 'Staging',
      color: 'base0A'
    },
    initial: data.environment?.current || 'production'
  });

  // Initialize temporal state for ActivityTracker (global workflow monitoring)
  const temporalState = getTemporalState({
    apiBaseUrl: data.apiBaseUrl,
    showToast: (msg) => toastState?.show(msg)
  });

  // Supabase holder - reactive object that gets populated on mount
  const supabaseHolder = {client: null, internalClient: null};

  onMount(async () => {
    if (browser) {
      // Sync theme state with DOM (hydration from app.html inline script)
      themeState.sync();
      themeState.init();

      const {getSupabaseClient, createInternalSchemaProxy} = await import('$lib/supabase.js');
      supabaseHolder.client = getSupabaseClient();
      // Create internal schema proxy from the main client (shares session)
      supabaseHolder.internalClient = createInternalSchemaProxy(supabaseHolder.client);

      // Update temporal state with Supabase client for real-time subscriptions
      temporalState.supabaseClient = supabaseHolder.client;

      // Only connect to real-time workflow updates if user has temporal access
      if (data.capabilities?.includes('*') || data.capabilities?.includes('ops.temporal.view')) {
        // Connect to real-time database notifications instead of polling
        temporalState.connectToRealtimeWorkflows();
      }
    }
  });

  onDestroy(() => {
    // Clean up temporal SSE connections
    temporalState?.cleanup();
  });

  // Provide states via context for child components
  // Note: themeState uses Jera singleton pattern - no context needed
  setContext('adminState', adminState);
  setContext('toastState', toastState);
  setContext('temporalState', temporalState);
  setContext('environmentState', environmentState);
  setContext('supabase', supabaseHolder);

  // Derived values
  let teamMember = $derived(data.teamMember);
  let capabilities = $derived(data.capabilities);
  let currentEnv = $derived(data.environment?.current || 'production');
</script>

<div class="admin-layout">
  {#if teamMember}
    <DashStyleSidebar {teamMember} {capabilities} {themeState} />
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
    @apply min-h-screen bg-base00;
    @apply flex flex-col;
  }

  /* Only enable transitions after initial paint to prevent FOUC */
  :global(:root.transitions-enabled) .admin-layout {
    @apply transition-colors duration-200;
  }

  .main-content {
    @apply flex-1 flex flex-col overflow-y-auto;
    /* Account for fixed sidebar */
    margin-left: 300px;
    transition: margin-left 250ms cubic-bezier(0.23, 1, 0.320, 1);
  }

  /* Adjust for collapsed sidebar */
  :global(.navigation-sidebar.collapsed) ~ .main-content {
    margin-left: 60px;
  }

  .content-container {
    @apply flex-1 p-5 w-full;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
    }

    :global(.navigation-sidebar) {
      transform: translateX(-100%);
    }

    :global(.navigation-sidebar.mobile-open) {
      transform: translateX(0);
    }
  }
</style>
