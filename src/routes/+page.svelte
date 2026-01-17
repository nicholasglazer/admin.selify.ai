<script>
  import {getContext} from 'svelte';
  import {PageHeader, Card, Badge, Button} from '$components';

  let {data} = $props();

  // Get admin state from context
  const adminState = getContext('adminState');

  // Derived values from admin state
  let teamMember = $derived(adminState.teamMember);
  let capabilities = $derived(adminState.capabilities);

  const stats = [
    {label: 'Team', value: '-', href: '/team', show: adminState.hasCap('team.view'), variant: 'primary'},
    {
      label: 'Workspaces',
      value: '-',
      href: '/workspaces',
      show: adminState.hasCap('admin.workspaces.view'),
      variant: 'success'
    },
    {
      label: 'Services',
      value: 'Healthy',
      href: '/services',
      show: adminState.hasCap('ops.services.view'),
      variant: 'success'
    },
    {label: 'Errors', value: '0', href: '/errors', show: adminState.hasCap('ops.errors.view'), variant: 'default'}
  ];

  const quickActions = [
    {label: 'Onboard Member', href: '/team/onboard', show: adminState.hasCap('team.invite')},
    {label: 'Workspaces', href: '/workspaces', show: adminState.hasCap('admin.workspaces.view')},
    {label: 'Services', href: '/services', show: adminState.hasCap('ops.services.view')},
    {label: 'View Logs', href: '/logs', show: adminState.hasCap('ops.logs.view')}
  ];
</script>

<svelte:head>
  <title>Dashboard | Selify Admin</title>
</svelte:head>

<PageHeader title="Dashboard" subtitle="Welcome back, {teamMember?.full_name?.split(' ')[0] || 'Admin'}" />

<div class="stats-grid">
  {#each stats.filter((s) => s.show) as stat}
    <a href={stat.href} class="stat-card">
      <div class="stat-label">{stat.label}</div>
      <div class="stat-value">{stat.value}</div>
    </a>
  {/each}
</div>

<section class="section">
  <h2 class="section-title">Quick Actions</h2>
  <div class="actions-grid">
    {#each quickActions.filter((a) => a.show) as action}
      <Button href={action.href} variant="secondary" class="action-btn">
        {action.label}
      </Button>
    {/each}
  </div>
</section>

<section class="section">
  <h2 class="section-title">Your Capabilities</h2>
  <Card>
    <div class="capabilities-list">
      {#each capabilities || [] as cap}
        <Badge variant="default" size="sm">{cap}</Badge>
      {/each}
    </div>
  </Card>
</section>

<style lang="postcss">
  @reference '$theme';

  .stats-grid {
    @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-8;
  }

  .stat-card {
    @apply bg-base01 border border-border rounded-xl p-5;
    @apply transition-all duration-150;
  }

  .stat-card:hover {
    @apply border-base0D/50 transform -translate-y-0.5;
  }

  .stat-label {
    @apply text-xs font-medium text-base04 uppercase tracking-wide mb-2;
  }

  .stat-value {
    @apply text-2xl font-semibold text-base06;
  }

  .section {
    @apply mb-8;
  }

  .section-title {
    @apply text-sm font-medium text-base04 mb-3;
  }

  .actions-grid {
    @apply flex flex-wrap gap-3;
  }

  :global(.action-btn) {
    @apply min-w-[140px];
  }

  .capabilities-list {
    @apply flex flex-wrap gap-2;
  }
</style>
