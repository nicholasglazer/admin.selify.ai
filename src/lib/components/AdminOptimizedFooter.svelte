<!--
  @component AdminOptimizedFooter

  Ultra-optimized footer with:
  - Cached icon components
  - Minimized re-renders
  - Efficient prop handling
  - Hardware-accelerated animations
-->
<script>
  import { Badge, Avatar, SidebarToggle } from '@miozu/jera';

  // Props - themeState passed from parent (single source of truth pattern)
  let {
    teamMember,
    themeState,
    roleVariants,
    formatRoleName,
    collapsed
  } = $props();

  // Lazy load icons for better performance
  let SunIcon = $state(null);
  let MoonIcon = $state(null);
  let iconsLoading = $state(false);

  // Load icons asynchronously
  $effect(async () => {
    if (iconsLoading || (SunIcon && MoonIcon)) return;

    iconsLoading = true;
    try {
      const iconsModule = await import('./icons');
      SunIcon = iconsModule.Sun;
      MoonIcon = iconsModule.Moon;
    } catch (err) {
      console.error('[AdminOptimizedFooter] Failed to load icons:', err);
    } finally {
      iconsLoading = false;
    }
  });

  // Cached computed values
  const isDark = $derived(themeState?.isDark ?? true);
  const userRoleVariant = $derived.by(() => {
    if (!teamMember?.role_name || !roleVariants) return 'default';
    return roleVariants[teamMember.role_name] || 'default';
  });

  // Optimized event handlers (no function recreation)
  const handleThemeToggle = () => {
    themeState?.toggle();
  };

  const handleUserClick = () => {
    // Could open user menu in the future
    console.log('[AdminOptimizedFooter] User clicked:', teamMember?.full_name);
  };

  // Memoized theme icon
  const ThemeIcon = $derived(isDark ? SunIcon : MoonIcon);
  const themeLabel = $derived(isDark ? 'Light Mode' : 'Dark Mode');
  const themeTitle = $derived(isDark ? 'Switch to light mode' : 'Switch to dark mode');
</script>

<div class="admin-optimized-footer">
  <!-- Theme Toggle -->
  {#if themeState && ThemeIcon}
    <button
      class="theme-toggle"
      class:collapsed
      onclick={handleThemeToggle}
      title={themeTitle}
      type="button"
      aria-label={themeLabel}
    >
      <ThemeIcon size={18} aria-hidden="true" />
      {#if !collapsed}
        <span class="toggle-label">{themeLabel}</span>
      {/if}
    </button>
  {:else if iconsLoading}
    <!-- Loading state -->
    <div class="theme-toggle-skeleton" class:collapsed>
      <div class="icon-skeleton"></div>
      {#if !collapsed}
        <div class="label-skeleton"></div>
      {/if}
    </div>
  {/if}

  <!-- User Info -->
  {#if teamMember}
    <button
      class="user-info"
      class:collapsed
      onclick={handleUserClick}
      title={teamMember.full_name}
      type="button"
      aria-label="User menu for {teamMember.full_name}"
    >
      <Avatar
        name={teamMember.full_name}
        src={teamMember.avatar_url}
        size={collapsed ? 'sm' : 'md'}
      />
      {#if !collapsed}
        <div class="user-details">
          <div class="user-name">{teamMember.full_name}</div>
          <Badge variant={userRoleVariant} size="sm">
            {formatRoleName}
          </Badge>
        </div>
      {/if}
    </button>
  {/if}

  <!-- Sidebar Toggle -->
  <SidebarToggle />
</div>

<style lang="postcss">
  @reference '$theme';

  .admin-optimized-footer {
    @apply flex flex-col gap-2 p-3;
  }

  .theme-toggle {
    @apply flex items-center gap-2 w-full p-2 rounded-lg;
    @apply text-base05 bg-transparent border-none;
    @apply transition-all duration-150 cursor-pointer;
    font: inherit;

    /* Hardware acceleration */
    @apply will-change-auto;
  }

  .theme-toggle:hover {
    @apply text-base06 bg-base02;
  }

  .theme-toggle.collapsed {
    @apply justify-center;
  }

  .toggle-label {
    @apply text-sm flex-1 text-left;
  }

  .user-info {
    @apply flex items-center gap-3 p-2 w-full;
    @apply rounded-lg bg-base02/50;
    @apply transition-all duration-150 cursor-pointer;
    @apply border-none bg-transparent text-left;
    font: inherit;

    /* Hardware acceleration */
    @apply will-change-auto;
  }

  .user-info:hover {
    @apply bg-base02;
  }

  .user-info.collapsed {
    @apply justify-center;
  }

  .user-details {
    @apply flex-1 min-w-0;
  }

  .user-name {
    @apply text-sm font-medium text-base06;
    @apply truncate mb-1;

    /* Optimize text rendering */
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  /* Loading skeletons */
  .theme-toggle-skeleton {
    @apply flex items-center gap-2 w-full p-2;
  }

  .theme-toggle-skeleton.collapsed {
    @apply justify-center;
  }

  .icon-skeleton {
    @apply w-5 h-5 bg-base03 rounded animate-pulse;
  }

  .label-skeleton {
    @apply h-4 w-20 bg-base03 rounded animate-pulse;
  }

  /* Performance optimizations */
  .admin-optimized-footer {
    /* Contain layout changes */
    contain: layout style;
  }

  .theme-toggle,
  .user-info {
    /* Optimize for transform animations */
    transform: translateZ(0);

    /* Reduce reflow during hover */
    backface-visibility: hidden;
  }

  /* Accessibility improvements */
  .theme-toggle:focus-visible,
  .user-info:focus-visible {
    @apply outline-2 outline-base0D outline-offset-2;
  }
</style>