<script>
  let {
    children,
    variant = 'secondary', // primary, secondary, ghost, danger
    size = 'md', // sm, md, lg
    disabled = false,
    type = 'button',
    class: className = '',
    onclick = undefined,
    href = undefined,
    ...rest
  } = $props();

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger'
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  const Tag = href ? 'a' : 'button';
</script>

<svelte:element
  this={Tag}
  class="btn {variantClasses[variant]} {sizeClasses[size]} {className}"
  {href}
  {disabled}
  {type}
  {onclick}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</svelte:element>

<style lang="postcss">
  @reference '$theme';

  .btn {
    @apply inline-flex items-center justify-center gap-2;
    @apply rounded-lg font-medium;
    @apply transition-all duration-150;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    @apply cursor-pointer;
  }

  .btn-sm {
    @apply text-xs px-3 py-1.5;
  }

  .btn-md {
    @apply text-sm px-4 py-2;
  }

  .btn-lg {
    @apply text-base px-6 py-2.5;
  }

  .btn-primary {
    @apply bg-base0D text-white;
  }

  .btn-primary:hover:not(:disabled) {
    @apply bg-base0D/90;
  }

  .btn-secondary {
    @apply bg-base02 text-base05 border border-border;
  }

  .btn-secondary:hover:not(:disabled) {
    @apply bg-base03/50 text-base06;
  }

  .btn-ghost {
    @apply bg-transparent text-base05;
  }

  .btn-ghost:hover:not(:disabled) {
    @apply bg-base02 text-base06;
  }

  .btn-danger {
    @apply bg-base08/15 text-base08 border border-base08/30;
  }

  .btn-danger:hover:not(:disabled) {
    @apply bg-base08/25;
  }
</style>
