<script>
  let {
    children,
    label = '',
    variant = 'default', // default, primary, success, warning, error
    size = 'md', // xs, sm, md, lg
    class: className = ''
  } = $props();

  const variantClasses = {
    default: 'badge-default',
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error'
  };

  const sizeClasses = {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };
</script>

<span class="badge {variantClasses[variant]} {sizeClasses[size]} {className}">
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</span>

<style lang="postcss">
  @reference '$theme';

  .badge {
    @apply inline-flex items-center justify-center gap-1;
    @apply rounded-md font-medium whitespace-nowrap;
    @apply transition-all duration-150;
  }

  .badge-xs {
    @apply text-[10px] px-2 py-0.5;
  }

  .badge-sm {
    @apply text-xs px-2.5 py-0.5;
  }

  .badge-md {
    @apply text-xs px-3 py-1;
  }

  .badge-lg {
    @apply text-sm px-4 py-1.5;
  }

  .badge-default {
    @apply bg-base03/30 text-base05;
  }

  .badge-primary {
    @apply bg-base0D/15 text-base0D;
  }

  .badge-success {
    @apply bg-base0B/15 text-base0B;
  }

  .badge-warning {
    @apply bg-base09/15 text-base09;
  }

  .badge-error {
    @apply bg-base08/15 text-base08;
  }
</style>
