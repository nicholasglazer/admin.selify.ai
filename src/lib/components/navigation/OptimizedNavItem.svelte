<!--
  @component OptimizedNavItem

  Ultra-high performance navigation item with:
  - Lazy icon loading with dynamic imports
  - Minimal DOM updates
  - Optimized active state detection
  - Hardware-accelerated animations
-->
<script>
  import { tick } from 'svelte';

  let { item, isCollapsed, blockId } = $props();

  // Static item properties (won't change during component lifecycle)
  const itemId = item.id;
  const href = item.href;
  const label = item.label;
  const iconName = item.icon;

  // Reactive properties
  const isActive = $derived(item.active ?? false);
  const hasHref = $derived(Boolean(href));

  // Dynamic icon loading with caching
  let IconComponent = $state(null);
  let iconLoading = $state(false);
  let iconError = $state(false);

  // Load icon component dynamically for better performance
  $effect(async () => {
    if (!iconName || IconComponent) return;

    iconLoading = true;
    try {
      // Dynamic import with proper error handling
      const iconModule = await import('../icons/index.js');
      IconComponent = iconModule[iconName];

      if (!IconComponent) {
        console.warn(`[OptimizedNavItem] Icon '${iconName}' not found`);
        iconError = true;
      }
    } catch (err) {
      console.error(`[OptimizedNavItem] Failed to load icon '${iconName}':`, err);
      iconError = true;
    } finally {
      iconLoading = false;
    }
  });

  // Optimized classes with memoization
  const itemClasses = $derived.by(() => {
    const classes = ['nav-item'];
    if (isActive) classes.push('active');
    if (isCollapsed) classes.push('collapsed');
    if (!hasHref) classes.push('no-link');
    return classes.join(' ');
  });

  // Handle clicks efficiently
  const handleClick = async (event) => {
    if (hasHref) {
      // Let the link handle navigation naturally
      await tick(); // Ensure any state updates complete
    } else {
      // Prevent default for non-navigation items
      event.preventDefault();
    }
  };
</script>

<!--
  Use the most appropriate element for accessibility and performance.
  Links for navigation, buttons for actions.
-->
{#if hasHref}
  <a
    {href}
    class={itemClasses}
    data-nav-action="navigate"
    data-block-id={blockId}
    data-item-id={itemId}
    data-href={href}
    onclick={handleClick}
    aria-current={isActive ? 'page' : null}
  >
    <!-- Icon with lazy loading -->
    <span class="nav-item-icon" aria-hidden="true">
      {#if iconLoading}
        <div class="icon-skeleton"></div>
      {:else if IconComponent}
        <IconComponent size={18} />
      {:else if iconError}
        <div class="icon-fallback">?</div>
      {/if}
    </span>

    <!-- Label with conditional rendering for collapsed state -->
    {#if !isCollapsed}
      <span class="nav-item-label">{label}</span>
    {/if}
  </a>
{:else}
  <button
    class={itemClasses}
    data-nav-action="action"
    data-block-id={blockId}
    data-item-id={itemId}
    onclick={handleClick}
    type="button"
  >
    <span class="nav-item-icon" aria-hidden="true">
      {#if iconLoading}
        <div class="icon-skeleton"></div>
      {:else if IconComponent}
        <IconComponent size={18} />
      {:else if iconError}
        <div class="icon-fallback">?</div>
      {/if}
    </span>

    {#if !isCollapsed}
      <span class="nav-item-label">{label}</span>
    {/if}
  </button>
{/if}

<style lang="postcss">
  @reference '$theme';

  .nav-item {
    @apply flex items-center gap-3;
    @apply px-3 py-2 rounded-lg;
    @apply text-sm font-medium;
    @apply text-base05 bg-transparent;
    @apply border-none cursor-pointer;
    @apply transition-all duration-150;
    @apply text-left;
    font: inherit;
    @apply w-full no-underline;

    /* Hardware acceleration for better performance */
    @apply will-change-auto;
  }

  .nav-item:hover {
    @apply text-base06 bg-base02;
  }

  .nav-item.active {
    @apply text-base0D bg-base02;
    @apply font-semibold;
  }

  .nav-item.collapsed {
    @apply justify-center px-2;
  }

  .nav-item-icon {
    @apply flex-shrink-0 flex items-center justify-center;
    @apply w-5 h-5;
  }

  .nav-item-label {
    @apply flex-1 min-w-0;
    @apply whitespace-nowrap overflow-hidden text-ellipsis;
  }

  /* Icon loading states */
  .icon-skeleton {
    @apply w-4 h-4 bg-base03 rounded animate-pulse;
  }

  .icon-fallback {
    @apply w-4 h-4 flex items-center justify-center;
    @apply text-xs font-bold text-base04;
  }

  /* Performance optimizations */
  .nav-item {
    /* Contain layout and paint for better rendering performance */
    contain: layout style paint;

    /* Optimize for transform operations */
    transform: translateZ(0);
  }

  /* Reduce layout thrashing during animations */
  .nav-item-icon {
    @apply will-change-auto;
  }

  /* Optimize for font rendering */
  .nav-item-label {
    @apply will-change-auto;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Improve accessibility */
  .nav-item:focus-visible {
    @apply outline-2 outline-base0D outline-offset-2;
  }

  /* Optimize for collapsed state */
  .nav-item.collapsed .nav-item-icon {
    @apply w-6 h-6;
  }
</style>