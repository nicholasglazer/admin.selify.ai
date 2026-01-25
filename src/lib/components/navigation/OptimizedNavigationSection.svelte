<!--
  @component OptimizedNavigationSection

  High-performance navigation section with:
  - Lazy icon loading
  - Minimal DOM updates
  - Cached computations
  - Optimized transitions
-->
<script>
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import OptimizedNavItem from './OptimizedNavItem.svelte';

  let { block, isCollapsed } = $props();

  // Cache computed values
  const sectionId = block.id;
  const isCollapsible = block.collapsible ?? true;
  const title = block.title;
  const items = block.items || [];

  // Derive expanded state efficiently
  const isExpanded = $derived(
    !isCollapsible || block.defaultExpanded !== false
  );

  // Count for badge (only if items have count property)
  const itemCount = $derived(items.length);

  // Only show section if it has items or is always visible
  const shouldShow = $derived(items.length > 0);

  // Optimized chevron rotation
  const chevronClass = $derived(
    `section-chevron ${isExpanded ? 'expanded' : 'collapsed'}`
  );
</script>

{#if shouldShow}
  <div class="nav-section" data-section-id={sectionId}>
    <!-- Section Header -->
    {#if title && !isCollapsed}
      <button
        class="section-header"
        class:collapsible={isCollapsible}
        data-nav-action="toggle-section"
        data-block-id={sectionId}
        aria-expanded={isExpanded}
        aria-controls="section-content-{sectionId}"
        disabled={!isCollapsible}
        type="button"
      >
        <span class="section-title">{title}</span>

        {#if itemCount > 0}
          <span class="section-count" aria-label="{itemCount} items">
            {itemCount}
          </span>
        {/if}

        {#if isCollapsible}
          <svg
            class={chevronClass}
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        {/if}
      </button>
    {:else if title && isCollapsed}
      <!-- Divider for collapsed state -->
      <div class="section-divider" aria-hidden="true"></div>
    {/if}

    <!-- Section Content -->
    {#if isExpanded}
      <div
        class="section-content"
        id="section-content-{sectionId}"
        transition:slide={{ duration: 200, easing: cubicOut }}
      >
        {#each items as item (item.id)}
          <OptimizedNavItem
            {item}
            {isCollapsed}
            blockId={sectionId}
          />
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .nav-section {
    @apply mb-2;
  }

  .section-header {
    @apply w-full flex items-center gap-2;
    @apply px-3 py-2 text-left;
    @apply text-xs font-semibold uppercase tracking-wide;
    @apply text-base04 bg-transparent border-none;
    @apply transition-colors duration-150;
    @apply cursor-pointer;
    font: inherit;
  }

  .section-header:hover {
    @apply text-base05;
  }

  .section-header:disabled {
    @apply cursor-default;
  }

  .section-title {
    @apply flex-1;
  }

  .section-count {
    @apply px-2 py-1 text-xs;
    @apply bg-base02 text-base05 rounded-full;
    @apply flex-shrink-0;
  }

  .section-chevron {
    @apply text-base04 flex-shrink-0;
    @apply transition-transform duration-200;
  }

  .section-chevron.expanded {
    @apply rotate-180;
  }

  .section-divider {
    @apply mx-3 my-2 h-px bg-base02;
  }

  .section-content {
    @apply flex flex-col gap-1;
    @apply px-2;
  }

  /* Performance optimizations */
  .nav-section {
    /* Contain layout and style for better performance */
    contain: layout style;
  }

  .section-header {
    /* Reduce repaints during hover */
    @apply will-change-auto;
  }

  .section-chevron {
    /* Optimize transform animations */
    @apply will-change-transform;
  }
</style>