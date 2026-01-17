<script>
  import {getContext} from 'svelte';
  import {formatDistanceToNow} from 'date-fns';
  import {PageHeader, Badge, Button, Card} from '$components';

  let {data} = $props();
  const {members} = data;

  // Get admin state from context for capability checking
  const adminState = getContext('adminState');

  // Role badge variants
  const roleVariants = {
    super_admin: 'primary',
    developer: 'primary',
    ops: 'success',
    support: 'default'
  };

  // Status badge variants
  const statusVariants = {
    active: 'success',
    suspended: 'warning',
    offboarded: 'error'
  };
</script>

<svelte:head>
  <title>Team | Selify Admin</title>
</svelte:head>

<PageHeader title="Team Members" subtitle="{members.length} members total">
  {#snippet actions()}
    {#if adminState.hasCap('team.invite')}
      <Button href="/team/onboard" variant="primary">Onboard Member</Button>
    {/if}
  {/snippet}
</PageHeader>

<Card class="overflow-hidden p-0">
  <table class="data-table">
    <thead>
      <tr>
        <th>Member</th>
        <th>Role</th>
        <th>Status</th>
        <th>Last Login</th>
        <th>Joined</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each members as member}
        <tr>
          <td>
            <div class="member-cell">
              <div class="member-avatar">
                {member.full_name?.charAt(0) || '?'}
              </div>
              <div class="member-info">
                <div class="member-name">{member.full_name}</div>
                <div class="member-email">{member.email}</div>
              </div>
            </div>
          </td>
          <td>
            <Badge variant={roleVariants[member.role_name] || 'default'} size="sm">
              {member.role_name.replace('_', ' ')}
            </Badge>
          </td>
          <td>
            <Badge variant={statusVariants[member.status] || 'default'} size="sm">
              {member.status}
            </Badge>
          </td>
          <td class="text-muted">
            {member.last_login_at ? formatDistanceToNow(new Date(member.last_login_at), {addSuffix: true}) : 'Never'}
          </td>
          <td class="text-muted">
            {formatDistanceToNow(new Date(member.created_at), {addSuffix: true})}
          </td>
          <td>
            {#if adminState.hasCap('team.edit')}
              <a href="/team/{member.id}" class="action-link">View</a>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</Card>

{#if members.length === 0}
  <div class="empty-state">
    <p class="empty-text">No team members yet.</p>
    {#if adminState.hasCap('team.invite')}
      <Button href="/team/onboard" variant="primary">Onboard First Member</Button>
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  :global(.overflow-hidden) {
    overflow: hidden;
  }

  :global(.p-0) {
    padding: 0;
  }

  .data-table {
    @apply w-full border-collapse;
  }

  .data-table th {
    @apply text-left px-5 py-3;
    @apply text-xs font-medium text-base04 uppercase tracking-wide;
    @apply bg-base02/50 border-b border-border;
  }

  .data-table td {
    @apply px-5 py-4 border-b border-border;
    @apply text-sm;
  }

  .data-table tbody tr:last-child td {
    @apply border-b-0;
  }

  .data-table tbody tr:hover {
    @apply bg-base02/30;
  }

  .member-cell {
    @apply flex items-center gap-3;
  }

  .member-avatar {
    @apply w-9 h-9 rounded-lg bg-base0D text-white;
    @apply flex items-center justify-center font-semibold text-sm;
  }

  .member-name {
    @apply font-medium text-base06;
  }

  .member-email {
    @apply text-xs text-base04;
  }

  .text-muted {
    @apply text-base04;
  }

  .action-link {
    @apply text-base0D font-medium text-sm hover:underline;
  }

  .empty-state {
    @apply text-center py-16;
  }

  .empty-text {
    @apply text-base04 mb-4;
  }
</style>
