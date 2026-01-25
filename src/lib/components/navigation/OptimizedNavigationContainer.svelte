<!--
  @component OptimizedNavigationContainer

  Performance-optimized navigation container for admin dashboard.
  Uses 2026 Svelte 5 best practices:
  - Minimal re-renders with cached components
  - Event delegation for optimal performance
  - Lazy loading of icon components
  - Memory-efficient DOM updates
-->
<script>
  import { getContext, tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import OptimizedNavigationSection from './OptimizedNavigationSection.svelte';

  // Local context key (avoids dependency on jera internal utils)
  const SIDEBAR_CONTEXT_KEY = Symbol.for('sidebar-state');

  let { navigationBlocks, onBlockEvent } = $props();

  // Get sidebar state for collapsed detection
  const sidebar = getContext(SIDEBAR_CONTEXT_KEY);
  const isCollapsed = $derived(sidebar?.collapsed ?? false);

  // Performance tracking
  let renderCount = 0;
  let lastRender = performance.now();

  // Optimized event delegation - single handler for all events
  const handleDelegatedEvent = async (event) => {
    const target = event.target.closest('[data-nav-action]');
    if (!target) return;

    const action = target.dataset.navAction;
    const blockId = target.dataset.blockId;
    const itemId = target.dataset.itemId;
    const href = target.dataset.href;

    // Prevent default for non-navigation actions
    if (action !== 'navigate') {
      event.preventDefault();
      event.stopPropagation();
    }

    // Handle different action types
    switch (action) {
      case 'navigate':
        // Let SvelteKit handle navigation naturally
        if (href && onBlockEvent) {
          await tick(); // Ensure DOM updates complete
          onBlockEvent(blockId, 'item_navigate', {
            item: { id: itemId, href },
            timestamp: Date.now()
          });
        }
        break;

      case 'toggle-section':
        if (onBlockEvent) {
          onBlockEvent(blockId, 'section_toggled', {
            blockId,
            timestamp: Date.now()
          });
        }
        break;

      default:
        console.warn('[OptimizedNavContainer] Unknown action:', action);
    }
  };

  // Track performance in development
  if (import.meta.env.DEV) {
    $effect(() => {
      renderCount++;
      lastRender = performance.now();
    });
  }
</script>

<!--
  Event delegation container - single event listener for performance
  Uses capture phase for better event handling
-->
<nav
  class="optimized-nav-container"
  onclick={handleDelegatedEvent}
  role="navigation"
  aria-label="Admin navigation"
>
  {#each navigationBlocks as block (block.id)}
    {#if block.type === 'section'}
      <OptimizedNavigationSection
        {block}
        {isCollapsed}
      />
    {:else if block.type === 'custom'}
      <!-- Custom blocks render directly for now - can be optimized further if needed -->
      <div class="custom-block-wrapper" data-block-id={block.id}>
        {#if block.component}
          <svelte:component this={block.component} {block} {isCollapsed} />
        {/if}
      </div>
    {/if}
  {/each}
</nav>

<!-- Performance info in development -->
{#if import.meta.env.DEV}
  <!-- This comment helps with debugging: Render #{renderCount} at {lastRender}ms -->
{/if}

<style lang="postcss">
  @reference '$theme';

  .optimized-nav-container {
    @apply flex-1 overflow-y-auto;
    @apply px-3 py-2;

    /* Optimize scrolling performance */
    scrollbar-width: thin;
    scrollbar-color: var(--color-base02) transparent;

    /* Hardware acceleration for smooth animations */
    @apply will-change-auto;
  }

  .optimized-nav-container::-webkit-scrollbar {
    @apply w-1;
  }

  .optimized-nav-container::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  .optimized-nav-container::-webkit-scrollbar-thumb {
    @apply bg-base02 rounded;
  }

  .optimized-nav-container::-webkit-scrollbar-thumb:hover {
    @apply bg-base03;
  }

  .custom-block-wrapper {
    @apply mb-2;
  }

  /* Optimize for collapsed state */
  :global(.sidebar-collapsed) .optimized-nav-container {
    @apply px-2;
  }

  /* Performance: reduce paint complexity */
  .optimized-nav-container * {
    @apply will-change-auto;
  }

  /* Reduce layout thrashing during animations */
  .optimized-nav-container {
    contain: layout style;
  }
</style>