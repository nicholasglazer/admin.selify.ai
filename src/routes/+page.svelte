<script>
  import { getContext } from 'svelte';
  import {
    Card,
    Badge,
    StatusBadge,
    Button,
    Stat,
    ProgressBar,
    Divider
  } from '@miozu/jera';
  import { Activity, Database, AlertCircle, Users, Building2, Table2, Shield, ArrowRight, ExternalLink } from '@lucide/svelte';

  let { data } = $props();

  // Get context safely
  let adminState;
  try {
    adminState = getContext('adminState');
  } catch (e) {
    adminState = null;
  }

  // Derived from data to handle updates
  let dashboard = $derived(data?.dashboard ?? null);
  let databaseHealth = $derived(data?.databaseHealth ?? null);
  let teamCount = $derived(data?.teamCount ?? 0);
  let workspaceCount = $derived(data?.workspaceCount ?? 0);
  let teamMember = $derived(adminState?.teamMember ?? null);

  // Helper to check capabilities safely
  function hasCap(cap) {
    try {
      return adminState?.hasCap?.(cap) ?? false;
    } catch {
      return false;
    }
  }

  // Derived data
  const dbSummary = $derived(databaseHealth?.summary || {});
  const errorStats = $derived(dashboard?.errors || {});
  const health = $derived({
    services: dashboard?.health?.services_healthy || 0,
    total: dashboard?.health?.services_total || 0,
    uptime: dashboard?.health?.avg_uptime_24h || 0
  });

  const allHealthy = $derived(health.services === health.total && health.total > 0);
  const hasErrors = $derived(errorStats.unresolved_count > 0);
  const connectionPercent = $derived(dbSummary.connections?.usage_percent || 0);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  // Navigation items
  const navItems = [
    { href: '/services', title: 'Ops Hub', cap: 'ops.services.view' },
    { href: '/pm', title: 'PM Board', cap: 'ops.tasks.view' },
    { href: '/qa', title: 'QA Dashboard', cap: 'ops.qa.view' },
    { href: '/team/onboard', title: 'Onboard Member', cap: 'team.invite' }
  ];

  const externalLinks = [
    { href: 'https://metrics.selify.ai', label: 'SigNoz' },
    { href: 'https://temporal.selify.ai', label: 'Temporal' },
    { href: 'https://modal.com/apps', label: 'Modal' }
  ];
</script>

<svelte:head>
  <title>Dashboard | Selify Admin</title>
</svelte:head>

<div class="page">
  <!-- Header -->
  <header class="page-header">
    <h1 class="page-title">{getGreeting()}, {teamMember?.full_name?.split(' ')[0] || 'Admin'}</h1>
    <p class="page-subtitle">Platform overview</p>
  </header>

  <!-- System Status Alert -->
  <div class="status-alert {allHealthy ? 'status-success' : 'status-warning'}">
    <Activity size={16} />
    <span>
      {#if allHealthy}
        All systems operational
      {:else}
        {health.services}/{health.total} services healthy
      {/if}
      {#if health.uptime}
        <span class="text-base04"> · {health.uptime}% uptime (24h)</span>
      {/if}
    </span>
  </div>

  <!-- Primary Metrics -->
  <section class="metrics-grid">
    {#if hasCap('ops.services.view')}
      <a href="/services" class="metric-link">
        <Card class="metric-card">
          <div class="metric-header">
            <span class="metric-icon"><Activity size={14} /></span>
            <span class="metric-label">Services</span>
            <StatusBadge variant={allHealthy ? 'success' : 'warning'} size="sm">
              {allHealthy ? 'OK' : 'WARN'}
            </StatusBadge>
          </div>
          <Stat
            value={health.services}
            unit="/{health.total}"
            label="healthy"
            size="lg"
          />
        </Card>
      </a>
    {/if}

    {#if hasCap('ops.metrics.view')}
      <a href="/database" class="metric-link">
        <Card class="metric-card">
          <div class="metric-header">
            <span class="metric-icon"><Database size={14} /></span>
            <span class="metric-label">Cache</span>
            <StatusBadge
              variant={dbSummary.cache_status === 'good' ? 'success' : 'warning'}
              size="sm"
            >
              {dbSummary.cache_status === 'good' ? 'OK' : 'LOW'}
            </StatusBadge>
          </div>
          <Stat
            value={dbSummary.cache_hit_ratio || 0}
            unit="%"
            label="hit ratio"
            size="lg"
          />
        </Card>
      </a>

      <Card class="metric-card">
        <div class="metric-header">
          <span class="metric-icon"><Database size={14} /></span>
          <span class="metric-label">Connections</span>
        </div>
        <Stat
          value={dbSummary.connections?.current || 0}
          unit="/{dbSummary.connections?.max || 100}"
          label="active"
          size="lg"
        />
        <ProgressBar
          value={connectionPercent}
          size="sm"
          variant={connectionPercent > 80 ? 'error' : connectionPercent > 60 ? 'warning' : 'primary'}
          class="mt-3"
        />
      </Card>
    {/if}

    {#if hasCap('ops.errors.view')}
      <a href="/errors" class="metric-link">
        <Card class="metric-card {hasErrors ? 'metric-card-error' : ''}">
          <div class="metric-header">
            <span class="metric-icon"><AlertCircle size={14} /></span>
            <span class="metric-label">Errors</span>
            {#if hasErrors}
              <StatusBadge variant="error" size="sm">ALERT</StatusBadge>
            {/if}
          </div>
          <Stat
            value={errorStats.unresolved_count || 0}
            label="unresolved"
            size="lg"
            status={hasErrors ? 'error' : ''}
          />
        </Card>
      </a>
    {/if}
  </section>

  <Divider spacing="lg" />

  <!-- Overview Stats -->
  <section class="mb-10">
    <h2 class="section-header">Overview</h2>
    <div class="stats-row">
      {#if hasCap('team.view')}
        <a href="/team" class="stat-link">
          <Stat value={teamCount} label="Team" size="md">
            {#snippet icon()}
              <Users size={16} class="text-base04" />
            {/snippet}
          </Stat>
        </a>
      {/if}

      {#if hasCap('admin.workspaces.view')}
        <a href="/workspaces" class="stat-link">
          <Stat value={workspaceCount} label="Workspaces" size="md" />
        </a>
      {/if}

      {#if hasCap('ops.metrics.view')}
        <Stat value={dbSummary.total_tables || 0} label="Tables" size="md" />
        <Stat value={dbSummary.total_rls_policies || 0} label="Policies" size="md" />
      {/if}
    </div>
  </section>

  <!-- Quick Navigation -->
  <section class="mb-10">
    <h2 class="section-header">Navigate</h2>
    <div class="nav-grid">
      {#each navItems as item}
        {#if hasCap(item.cap)}
          <a href={item.href} class="nav-card">
            <span class="nav-title">{item.title}</span>
            <span class="nav-arrow"><ArrowRight size={14} /></span>
          </a>
        {/if}
      {/each}
    </div>
  </section>

  <!-- External Links -->
  {#if hasCap('ops.services.view')}
    <section>
      <h2 class="section-header">External</h2>
      <div class="external-row">
        {#each externalLinks as link}
          <Button
            variant="ghost"
            size="sm"
            href={link.href}
            target="_blank"
            rel="noopener"
          >
            {link.label}
            <ExternalLink size={12} />
          </Button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  /* Page layout */
  .page {
    @apply w-full;
  }

  .page-header {
    @apply mb-8;
  }

  .page-title {
    @apply text-2xl font-semibold text-base06 m-0;
    letter-spacing: -0.02em;
  }

  .page-subtitle {
    @apply text-sm text-base04 mt-1;
  }

  .section-header {
    @apply text-xs font-medium text-base04 uppercase tracking-wider mb-4;
  }

  /* Status alert */
  .status-alert {
    @apply flex items-center gap-3 mb-8 py-3 px-4 rounded-lg text-sm;
  }

  .status-success {
    background: color-mix(in srgb, var(--color-base0B) 8%, transparent);
    color: var(--color-base0B);
  }

  .status-warning {
    background: color-mix(in srgb, var(--color-base0A) 8%, transparent);
    color: var(--color-base0A);
  }

  /* Metrics grid */
  .metrics-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .metric-link {
    @apply no-underline;
  }

  .metric-link :global(.card) {
    @apply h-full;
  }

  .metric-link:hover :global(.card) {
    @apply border-base03;
  }

  :global(.metric-card) {
    @apply p-5;
    background: var(--color-base01);
  }

  :global(.metric-card-error) {
    border-color: color-mix(in srgb, var(--color-base08) 30%, transparent);
  }

  .metric-header {
    @apply flex items-center gap-2 mb-3;
  }

  .metric-icon {
    @apply text-base04;
  }

  .metric-label {
    @apply text-xs font-medium text-base04 uppercase tracking-wider flex-1;
  }

  /* Stats row */
  .stats-row {
    @apply flex gap-8 flex-wrap;
  }

  .stat-link {
    @apply no-underline;
  }

  .stat-link:hover :global(.stat-value) {
    @apply text-base07;
  }

  /* Navigation grid */
  .nav-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-3;
  }

  .nav-card {
    @apply flex items-center justify-between;
    @apply py-3 px-4 rounded-lg;
    @apply bg-base01 border border-base02;
    @apply transition-all duration-200 no-underline;
  }

  .nav-card:hover {
    @apply border-base03 bg-base02;
  }

  .nav-title {
    @apply text-sm font-medium text-base05;
  }

  .nav-arrow {
    @apply text-base04 transition-colors;
  }

  .nav-card:hover .nav-arrow {
    @apply text-base06;
  }

  /* External links */
  .external-row {
    @apply flex gap-2 flex-wrap;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .metrics-grid {
      @apply grid-cols-2;
    }

    .stats-row {
      @apply grid grid-cols-4 gap-4;
    }

    .nav-grid {
      @apply grid-cols-2;
    }
  }
</style>
