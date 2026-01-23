<script>
  import {getContext} from 'svelte';
  import {Badge} from '@miozu/jera';
  import {Server, FlaskConical} from './icons';

  let {collapsed = false} = $props();

  // Get environment state from context
  const envState = getContext('environmentState');

  // Handle switch
  const handleSwitch = async () => {
    if (!envState) return;
    await envState.toggle();
    // Reload the page to fetch data from new environment
    window.location.reload();
  };
</script>

{#if envState}
  <button
    class="env-switcher"
    class:collapsed
    class:staging={envState.isStaging}
    onclick={handleSwitch}
    disabled={envState.isLoading}
    title={envState.isStaging
      ? 'Switch to Production'
      : 'Switch to Staging'}
  >
    <div class="env-icon" class:staging={envState.isStaging}>
      {#if envState.isStaging}
        <FlaskConical size={18} />
      {:else}
        <Server size={18} />
      {/if}
    </div>

    {#if !collapsed}
      <div class="env-info">
        <span class="env-label">{envState.label}</span>
        <Badge
          variant={envState.isStaging ? 'warning' : 'success'}
          size="xs"
        >
          {envState.isStaging ? 'STAGING' : 'PROD'}
        </Badge>
      </div>
    {:else}
      <Badge
        variant={envState.isStaging ? 'warning' : 'success'}
        size="xs"
        class="collapsed-badge"
      >
        {envState.isStaging ? 'S' : 'P'}
      </Badge>
    {/if}
  </button>

  <!-- Warning banner for staging -->
  {#if envState.isStaging && !collapsed}
    <div class="staging-warning">
      <FlaskConical size={12} />
      <span>Viewing staging data</span>
    </div>
  {/if}
{/if}

<style lang="postcss">
  @reference '$theme';

  .env-switcher {
    @apply flex items-center gap-2 w-full p-2 rounded-lg;
    @apply text-base05 hover:text-base06;
    @apply transition-all cursor-pointer;
    @apply border border-transparent;
  }

  .env-switcher:hover {
    @apply bg-base02 border-base03;
  }

  .env-switcher.staging {
    @apply bg-base0A/10 border-base0A/30;
  }

  .env-switcher.staging:hover {
    @apply bg-base0A/20;
  }

  .env-switcher.collapsed {
    @apply justify-center flex-col gap-1;
  }

  .env-switcher:disabled {
    @apply opacity-50 cursor-wait;
  }

  .env-icon {
    @apply w-8 h-8 rounded-lg flex items-center justify-center;
    @apply bg-base0B/20 text-base0B;
    @apply transition-colors;
  }

  .env-icon.staging {
    @apply bg-base0A/20 text-base0A;
  }

  .env-info {
    @apply flex-1 flex items-center justify-between;
  }

  .env-label {
    @apply text-sm font-medium;
  }

  .staging-warning {
    @apply flex items-center gap-1.5 px-2 py-1;
    @apply text-xs text-base0A bg-base0A/10;
    @apply rounded border border-base0A/20;
    @apply mt-1;
  }

  :global(.collapsed-badge) {
    @apply mt-0.5;
  }
</style>
