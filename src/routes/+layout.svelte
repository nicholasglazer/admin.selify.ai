<script>
  import '../app.css';
  import {setContext, onMount} from 'svelte';
  import {browser} from '$app/environment';
  import {AdminSidebar, Toaster} from '$components';
  import {getThemeState, getAdminState, getToastState} from '$lib/reactiveStates';

  let {data, children} = $props();

  // Initialize reactive states from server data
  // Theme is already applied via inline script in app.html - no onMount needed
  const themeState = getThemeState(data.theme);
  const adminState = getAdminState({
    teamMember: data.teamMember,
    capabilities: data.capabilities
  });
  const toastState = getToastState();

  // Supabase holder - reactive object that gets populated on mount
  const supabaseHolder = {client: null};

  onMount(async () => {
    if (browser) {
      const {getSupabaseClient} = await import('$lib/supabase.js');
      supabaseHolder.client = getSupabaseClient();
    }
  });

  // Provide states via context for child components
  setContext('themeState', themeState);
  setContext('adminState', adminState);
  setContext('toastState', toastState);
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
