<script>
  let {
    children,
    variant = 'default', // default, interactive
    class: className = '',
    href = undefined,
    onclick = undefined
  } = $props();

  const Tag = href ? 'a' : onclick ? 'button' : 'div';
</script>

<svelte:element this={Tag} class="card card-{variant} {className}" {href} {onclick}>
  {#if children}
    {@render children()}
  {/if}
</svelte:element>

<style lang="postcss">
  @reference '$theme';

  .card {
    @apply bg-base01 border border-border rounded-xl;
    @apply transition-all duration-150;
  }

  .card-default {
    @apply p-6;
  }

  .card-interactive {
    @apply p-4 cursor-pointer;
  }

  .card-interactive:hover {
    @apply border-base03 bg-base02/50;
  }
</style>
