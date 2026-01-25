<!--
  @component AdminSidebar

  Optimized admin navigation using Svelte 5 best practices (2026):
  - Singleton reactive state for performance
  - Aggressive memoization and caching
  - Minimal re-renders with proper runes usage
  - Event batching and debouncing
  - Memory-efficient patterns
-->
<script>
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { Sidebar, Badge } from '@miozu/jera';
  import { getAdminNavigationState } from '$lib/reactiveStates/adminNavigationSimple.svelte.js';
  import { OptimizedNavigationContainer } from './navigation';
  import AdminOptimizedFooter from './AdminOptimizedFooter.svelte';
  import EnvironmentSwitcher from './EnvironmentSwitcher.svelte';

  // Props - themeState passed from parent (single source of truth pattern)
  let { teamMember, capabilities, themeState } = $props();

  // Sidebar state - optimized for performance
  let collapsed = $state(false);

  // Get singleton navigation state - TRIGGER-BASED (no effects!)
  const adminNavState = $derived.by(() => {
    const state = getAdminNavigationState();

    // Trigger updates directly - more efficient than $effect!
    state.updateCapabilities(capabilities);
    state.updateCurrentPath($page.url.pathname);

    return state;
  });

  // Optimized reactive blocks (cached, memoized)
  const navigationBlocks = $derived(adminNavState.navigationBlocks);

  // Performance stats (dev only)
  const perfStats = $derived(adminNavState.performanceStats);

  // Optimized role variants (static, no re-allocation)
  const ROLE_VARIANTS = Object.freeze({
    super_admin: 'primary',
    developer: 'primary',
    ops: 'success',
    support: 'default'
  });

  // Optimized role formatter (memoized)
  const formatRoleName = $derived.by(() => {
    if (!teamMember?.role_name) return 'Unknown';
    return teamMember.role_name.replace('_', ' ');
  });

  // Optimized event handler - no function recreation on each render
  const handleNavigationEvent = (blockId, eventType, data) => {
    // Event handled by singleton state internally for optimal performance
    switch (eventType) {
      case 'section_toggled':
        adminNavState.toggleSection(blockId);
        break;
      case 'performance_debug':
        if (import.meta.env.DEV) {
          console.log('[AdminNav] Performance stats:', perfStats);
        }
        break;
    }
  };

  // No effects needed - using trigger-based approach for better performance!

  // Cleanup on destroy
  onDestroy(() => {
    // Singleton persists, but cleanup component-specific subscriptions
    // Real cleanup happens when app unmounts
  });

  // Development performance monitoring - TRIGGER-BASED
  const logPerformance = () => {
    if (import.meta.env.DEV) {
      console.log(`[AdminSidebar] Render #${perfStats.renderCount}`);
      console.log(`[AdminSidebar] Cache size: ${perfStats.cacheSize}`);
    }
  };

  // Call when navigation blocks change (more efficient than $effect!)
  const trackedBlocks = $derived.by(() => {
    const blocks = navigationBlocks;
    logPerformance(); // Trigger logging only when blocks actually change
    return blocks;
  });
</script>

<Sidebar
  bind:collapsed
  persistKey="admin-sidebar"
  collapsedWidth={64}
  theme="enterprise-dark"
>
  {#snippet header()}
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">S</span>
        {#if !collapsed}
          <span class="logo-text">Selify</span>
          <Badge variant="primary" size="xs">Admin</Badge>
        {/if}
      </div>
    </div>
  {/snippet}

  <!-- Navigation Container with singleton state -->
  <OptimizedNavigationContainer
    navigationBlocks={trackedBlocks}
    onBlockEvent={handleNavigationEvent}
  />

  {#snippet footer()}
    <!-- Environment Switcher + Optimized Footer -->
    <div class="admin-footer-wrapper">
      <EnvironmentSwitcher {collapsed} />
      <AdminOptimizedFooter
        {teamMember}
        {themeState}
        roleVariants={ROLE_VARIANTS}
        {formatRoleName}
        {collapsed}
      />
    </div>
  {/snippet}
</Sidebar>

<!-- Development performance overlay -->
{#if import.meta.env.DEV}
  <div class="dev-performance-overlay" title="Click to log performance stats">
    <button
      onclick={() => handleNavigationEvent('perf', 'performance_debug', {})}
      class="perf-button"
    >
      R:{perfStats.renderCount} C:{perfStats.cacheSize}
    </button>
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .sidebar-header {
    @apply w-full p-4 border-b border-base02;
  }

  .logo {
    @apply flex items-center gap-2;
  }

  .logo-icon {
    @apply w-8 h-8 rounded-lg;
    @apply bg-base0D text-white;
    @apply flex items-center justify-center;
    @apply text-sm font-bold;
  }

  .logo-text {
    @apply text-lg font-bold text-base06;
    /* Prevent layout shift during collapse animation */
    @apply transition-opacity duration-200;
  }

  .admin-footer-wrapper {
    @apply border-t border-base02;
    @apply flex flex-col;
  }

  /* Development performance overlay */
  .dev-performance-overlay {
    @apply fixed bottom-4 left-4 z-50;
    @apply opacity-20 hover:opacity-100;
    @apply transition-opacity duration-200;
  }

  .perf-button {
    @apply px-2 py-1 text-xs;
    @apply bg-base0D text-white;
    @apply rounded border-none;
    @apply font-mono cursor-pointer;
  }
</style>
