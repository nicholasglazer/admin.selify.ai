<script>
  import {page} from '$app/stores';
  import {Badge, Avatar} from '@miozu/jera';

  let {teamMember, capabilities} = $props();

  // Check capability - must be called reactively inside $derived
  const hasCap = (cap) => capabilities?.includes(cap) || capabilities?.includes('*');

  // Navigation items - compute show reactively based on capabilities
  const navItems = $derived.by(() => {
    const check = (cap) => capabilities?.includes(cap) || capabilities?.includes('*');
    return [
      {label: 'Dashboard', href: '/', icon: 'home', show: true},
      {label: 'PM Board', href: '/pm', icon: 'kanban', show: check('ops.tasks.view')},
      {label: 'Feedback', href: '/feedback', icon: 'message', show: check('ops.feedback.view')},
      {label: 'Team', href: '/team', icon: 'users', show: check('team.view')},
      {label: 'Workspaces', href: '/workspaces', icon: 'building', show: check('admin.workspaces.view')},
      {label: 'Services', href: '/services', icon: 'server', show: check('ops.services.view')},
      {label: 'Errors', href: '/errors', icon: 'alert', show: check('ops.errors.view')},
      {label: 'Logs', href: '/logs', icon: 'terminal', show: check('ops.logs.view')},
      {label: 'Metrics', href: '/metrics', icon: 'chart', show: check('ops.metrics.view')}
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
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <div class="logo">
      <span class="logo-text">Selify</span>
      <Badge variant="primary" size="xs">Admin</Badge>
    </div>
  </div>

  <nav class="nav">
    {#each navItems.filter((i) => i.show) as item}
      <a href={item.href} class="nav-item" class:active={isActive(item.href)}>
        {item.label}
      </a>
    {/each}
  </nav>

  <div class="sidebar-footer">
    <div class="user-info">
      <Avatar
        name={teamMember.full_name}
        src={teamMember.avatar_url}
        size="md"
      />
      <div class="user-details">
        <div class="user-name">{teamMember.full_name}</div>
        <Badge variant={roleVariants[teamMember.role_name] || 'default'} size="sm">
          {teamMember.role_name.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  </div>
</aside>

<style lang="postcss">
  @reference '$theme';

  .sidebar {
    @apply w-60 bg-base01 border-r border-border;
    @apply flex flex-col h-screen sticky top-0;
  }

  .sidebar-header {
    @apply p-4 border-b border-border;
  }

  .logo {
    @apply flex items-center gap-2;
  }

  .logo-text {
    @apply text-lg font-bold text-base06;
  }

  .nav {
    @apply flex-1 p-3 flex flex-col gap-1;
  }

  .nav-item {
    @apply px-3 py-2 rounded-lg;
    @apply text-sm font-medium text-base04;
    @apply transition-all duration-150;
  }

  .nav-item:hover {
    @apply bg-base02 text-base05;
  }

  .nav-item.active {
    @apply bg-base0D/15 text-base0D;
  }

  .sidebar-footer {
    @apply p-4 border-t border-border;
  }

  .user-info {
    @apply flex items-center gap-3;
  }

  .user-details {
    @apply flex-1 min-w-0;
  }

  .user-name {
    @apply text-sm font-medium text-base06;
    @apply truncate mb-0.5;
  }
</style>
