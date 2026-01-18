<script>
  import {page} from '$app/stores';
  import {getContext} from 'svelte';
  import {
    Sidebar,
    SidebarSection,
    SidebarItem,
    SidebarToggle,
    Badge,
    Avatar
  } from '@miozu/jera';
  import {Sun, Moon} from './icons';
  import {
    Home,
    Kanban,
    MessageSquare,
    Users,
    Building,
    Server,
    AlertCircle,
    Terminal,
    BarChart,
    TestTube,
    Database,
    CheckCircle,
    Mail
  } from './icons';

  let {teamMember, capabilities} = $props();

  let collapsed = $state(false);

  // Get theme state from context
  const themeState = getContext('themeState');

  // Check capability
  const hasCap = (cap) => capabilities?.includes(cap) || capabilities?.includes('*');

  // Navigation items with icons
  const navItems = $derived.by(() => {
    return [
      {label: 'Dashboard', href: '/', icon: Home, show: true},
      {label: 'PM Board', href: '/pm', icon: Kanban, show: hasCap('ops.tasks.view')},
      {label: 'QA', href: '/qa', icon: TestTube, show: hasCap('ops.qa.view')},
      {label: 'Approvals', href: '/approvals', icon: CheckCircle, show: hasCap('approvals.view') || hasCap('ops.approvals.view')},
      {label: 'Feedback', href: '/feedback', icon: MessageSquare, show: hasCap('ops.feedback.view')},
      {label: 'Webmail', href: '/webmail', icon: Mail, show: true},
      {label: 'Team', href: '/team', icon: Users, show: hasCap('team.view')},
      {label: 'Workspaces', href: '/workspaces', icon: Building, show: hasCap('admin.workspaces.view')},
      {label: 'Ops Hub', href: '/services', icon: Server, show: hasCap('ops.services.view')},
      {label: 'Errors', href: '/errors', icon: AlertCircle, show: hasCap('ops.errors.view')},
      {label: 'Logs', href: '/logs', icon: Terminal, show: hasCap('ops.logs.view')},
      {label: 'Metrics', href: '/metrics', icon: BarChart, show: hasCap('ops.metrics.view')},
      {label: 'Database', href: '/database', icon: Database, show: hasCap('ops.metrics.view')}
    ];
  });

  // Role badge variants
  const roleVariants = {
    super_admin: 'primary',
    developer: 'primary',
    ops: 'success',
    support: 'default'
  };

  // Check if current path matches
  const isActive = (href) => {
    const pathname = $page.url.pathname;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Format role name for display
  const formatRoleName = (role) => {
    return role?.replace('_', ' ') || 'Unknown';
  };
</script>

<Sidebar bind:collapsed persistKey="admin-sidebar" collapsedWidth={64}>
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

  <SidebarSection title={collapsed ? '' : 'Navigation'}>
    {#each navItems.filter((i) => i.show) as item}
      <SidebarItem
        href={item.href}
        icon={item.icon}
        label={item.label}
        active={isActive(item.href)}
      />
    {/each}
  </SidebarSection>

  {#snippet footer()}
    <div class="sidebar-footer-content">
      <!-- Theme Toggle -->
      {#if themeState}
        <button
          class="theme-toggle"
          class:collapsed
          onclick={() => themeState.toggle()}
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

      {#if teamMember}
        <div class="user-info" class:collapsed>
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
        </div>
      {/if}

      <SidebarToggle />
    </div>
  {/snippet}
</Sidebar>

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
  }

  .sidebar-footer-content {
    @apply p-3 border-t border-base02;
    @apply flex flex-col gap-2;
  }

  .user-info {
    @apply flex items-center gap-3 p-2;
    @apply rounded-lg bg-base02/50;
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

  .theme-toggle {
    @apply flex items-center gap-2 w-full p-2 rounded-lg;
    @apply text-base05 hover:text-base06 hover:bg-base02;
    @apply transition-colors cursor-pointer;
  }

  .theme-toggle.collapsed {
    @apply justify-center;
  }

  .toggle-label {
    @apply text-sm;
  }
</style>
