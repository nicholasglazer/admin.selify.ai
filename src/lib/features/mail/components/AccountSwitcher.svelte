<script>
  /**
   * Account Switcher
   *
   * Dropdown to switch between email accounts (personal + shared).
   * Shows unread counts per account and visual distinction for shared accounts.
   */
  import {ChevronDown, Check, Users, User} from '$components/icons';
  import {Badge} from '@miozu/jera';

  let {mail, class: className = ''} = $props();

  let open = $state(false);

  function selectAccount(accountId) {
    mail.switchAccount(accountId);
    open = false;
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.account-switcher')) {
      open = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="account-switcher {className}">
  <button class="switcher-trigger" onclick={() => (open = !open)} aria-expanded={open}>
    <div class="account-info">
      {#if mail.activeAccount?.type === 'shared'}
        <Users size={16} class="account-icon shared" />
      {:else}
        <User size={16} class="account-icon" />
      {/if}
      <span class="account-email">{mail.activeAccount?.email || 'Select account'}</span>
      {#if mail.activeAccount?.unreadCount}
        <Badge variant="primary" size="xs">{mail.activeAccount.unreadCount}</Badge>
      {/if}
    </div>
    <ChevronDown size={16} class={`chevron ${open ? 'rotated' : ''}`} />
  </button>

  {#if open}
    <div class="dropdown">
      {#each mail.accounts as account (account.id)}
        {@const isActive = account.id === mail.activeAccountId}
        <button
          class={['account-option', isActive && 'active']}
          onclick={() => selectAccount(account.id)}
        >
          <div class="option-left">
            {#if account.type === 'shared'}
              <Users size={16} class="option-icon shared" />
            {:else}
              <User size={16} class="option-icon" />
            {/if}
            <div class="option-info">
              <span class="option-email">{account.email}</span>
              {#if account.displayName !== account.email}
                <span class="option-name">{account.displayName}</span>
              {/if}
              {#if account.type === 'shared'}
                <Badge variant="secondary" size="xs">Team</Badge>
              {/if}
            </div>
          </div>
          <div class="option-right">
            {#if account.unreadCount}
              <Badge variant="primary" size="xs">{account.unreadCount}</Badge>
            {/if}
            {#if isActive}
              <Check size={16} class="check-icon" />
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .account-switcher {
    @apply relative;
  }

  .switcher-trigger {
    @apply flex items-center justify-between w-full gap-2;
    @apply px-3 py-2 rounded-lg;
    @apply bg-base02/50 hover:bg-base02 transition-colors;
    @apply text-left;
  }

  .account-info {
    @apply flex items-center gap-2 min-w-0;
  }

  .account-icon {
    @apply text-base05 flex-shrink-0;
  }

  .account-icon.shared {
    @apply text-base0D;
  }

  .account-email {
    @apply text-sm font-medium text-base07 truncate;
  }

  .chevron {
    @apply text-base05 transition-transform duration-200 flex-shrink-0;
  }

  .chevron.rotated {
    @apply rotate-180;
  }

  .dropdown {
    @apply absolute top-full left-0 right-0 mt-1 z-50;
    @apply bg-base01 border border-border/40 rounded-lg shadow-lg;
    @apply py-1 max-h-80 overflow-y-auto;
  }

  .account-option {
    @apply flex items-center justify-between w-full px-3 py-2;
    @apply hover:bg-base02/50 transition-colors;
    @apply text-left;
  }

  .account-option.active {
    @apply bg-base0D/10;
  }

  .option-left {
    @apply flex items-center gap-2 min-w-0 flex-1;
  }

  .option-icon {
    @apply text-base05 flex-shrink-0;
  }

  .option-icon.shared {
    @apply text-base0D;
  }

  .option-info {
    @apply flex flex-col gap-0.5 min-w-0;
  }

  .option-email {
    @apply text-sm text-base07 truncate;
  }

  .option-name {
    @apply text-xs text-base05 truncate;
  }

  .option-right {
    @apply flex items-center gap-2 flex-shrink-0;
  }

  .check-icon {
    @apply text-base0D;
  }
</style>
