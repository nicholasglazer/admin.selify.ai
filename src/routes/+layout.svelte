<script>
  import '../app.css';
  import {setContext, onMount} from 'svelte';
  import {AdminSidebar, Toaster} from '$components';
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

  // Provide supabase client for client-side operations
  setContext('supabase', data.supabase);

  // Apply theme on mount (client-side)
  onMount(() => {
    themeState.apply();
  });

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
    @apply transition-colors duration-200;
  }

  .main-content {
    @apply flex-1 flex flex-col overflow-y-auto;
  }

  .content-container {
    @apply flex-1 grid p-6 w-full;
  }
</style>
