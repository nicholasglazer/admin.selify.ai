<!--
  @component AdminFooterBlock

  Custom footer block for admin navigation with theme toggle and user info.
-->
<script>
  import { getContext } from 'svelte';
  import { Badge, Avatar } from '@miozu/jera';
  import { Sun, Moon, ChevronLeft, ChevronRight } from './icons';

  // Local context key (avoids dependency on jera internal utils)
  const SIDEBAR_CONTEXT_KEY = Symbol.for('sidebar-state');

  // Props - themeState passed from parent (single source of truth pattern)
  let {
    block,
    themeState,
    navigationState = null,
    sidebar,
    isCollapsed,
    onEvent
  } = $props();

  // Get props from block - use $derived for reactivity
  const blockProps = $derived(block.props || {});
  const { teamMember, roleVariants, formatRoleName } = $derived(blockProps);

  // Get sidebar context if not passed directly
  const sidebarContext = getContext(SIDEBAR_CONTEXT_KEY);
  const sidebarState = $derived(sidebar || sidebarContext);
  const collapsed = $derived(isCollapsed ?? sidebarState?.collapsed ?? false);

  function handleThemeToggle() {
    if (themeState) {
      themeState.toggle();
    }
    if (onEvent) {
      onEvent('theme_toggled', { isDark: themeState?.isDark });
    }
  }

  function handleUserClick() {
    if (onEvent) {
      onEvent('user_clicked', { teamMember });
    }
  }
</script>

<div class="admin-footer-block">
  <!-- Theme Toggle -->
  {#if themeState}
    <button
      class="theme-toggle"
      class:collapsed
      onclick={handleThemeToggle}
      title={themeState.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {#if themeState.isDark}
        <Sun size={18} />
        {#if !collapsed}<span class="toggle-label">Light Mode</span>{/if}
      {:else}
        <Moon size={18} />
        {#if !collapsed}<span class="toggle-label">Dark Mode</span>{/if}
      {/if}
    </button>
  {/if}

  <!-- User Info -->
  {#if teamMember}
    <button
      class="user-info"
      class:collapsed
      onclick={handleUserClick}
      title={teamMember.full_name}
    >
      <Avatar
        name={teamMember.full_name}
        src={teamMember.avatar_url}
        size={collapsed ? 'sm' : 'md'}
      />
      {#if !collapsed}
        <div class="user-details">
          <div class="user-name">{teamMember.full_name}</div>
          <Badge variant={roleVariants[teamMember.role_name] || 'default'} size="sm">
            {formatRoleName(teamMember.role_name)}
          </Badge>
        </div>
      {/if}
    </button>
  {/if}

  <!-- Sidebar Toggle -->
  {#if sidebarState?.toggle}
    <button class="sidebar-toggle" onclick={() => sidebarState.toggle()}>
      {#if collapsed}
        <ChevronRight size={18} />
      {:else}
        <ChevronLeft size={18} />
      {/if}
    </button>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .admin-footer-block {
    @apply flex flex-col gap-2;
    @apply p-3 border-t border-base02;
  }

  .theme-toggle {
    @apply flex items-center gap-2 w-full p-2 rounded-lg;
    @apply text-base05 hover:text-base06 hover:bg-base02;
    @apply transition-all duration-200 cursor-pointer;
    @apply border-none bg-transparent;
    font: inherit;
  }

  .theme-toggle.collapsed {
    @apply justify-center;
  }

  .toggle-label {
    @apply text-sm;
  }

  .user-info {
    @apply flex items-center gap-3 p-2;
    @apply rounded-lg bg-base02/50;
    @apply transition-all duration-200 cursor-pointer;
    @apply hover:bg-base02;
    @apply border-none bg-transparent;
    font: inherit;
    @apply text-left;
    @apply w-full;
  }

  .user-info.collapsed {
    @apply justify-center p-2;
  }

  .user-details {
    @apply flex-1 min-w-0;
  }

  .user-name {
    @apply text-sm font-medium text-base06;
    @apply truncate mb-0.5;
  }

  .sidebar-toggle {
    @apply flex items-center justify-center w-full p-2 rounded-lg;
    @apply text-base04 hover:text-base05 hover:bg-base02;
    @apply transition-all duration-150 cursor-pointer;
    @apply border-none bg-transparent;
    font: inherit;
  }
</style>