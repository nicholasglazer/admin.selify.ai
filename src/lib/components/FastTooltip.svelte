<!--
  @component FastTooltip

  Fast appearing tooltip for collapsed navigation - matches dash.selify.ai patterns.
  Features:
  - Ultra-fast appearance (50ms delay)
  - Modern animations with proper easing
  - Optimized for frequent hover interactions
  - Hardware-accelerated transforms
-->
<script>
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let {
    content,
    position = 'right',
    delay = 50,  // Super fast for nav tooltips
    offset = 8,
    children
  } = $props();

  let showTooltip = $state(false);
  let tooltipElement = $state(null);
  let triggerElement = $state(null);

  let showTimeout;
  let hideTimeout;

  // Fast show on hover
  function handleMouseEnter() {
    clearTimeout(hideTimeout);
    showTimeout = setTimeout(() => {
      showTooltip = true;
    }, delay);
  }

  // Fast hide on leave
  function handleMouseLeave() {
    clearTimeout(showTimeout);
    hideTimeout = setTimeout(() => {
      showTooltip = false;
    }, 50); // Very fast hide
  }

  // Position calculation
  const tooltipStyles = $derived.by(() => {
    if (!tooltipElement || !triggerElement) return '';

    const triggerRect = triggerElement.getBoundingClientRect();

    let top, left, transformOrigin;

    switch (position) {
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2);
        left = triggerRect.right + offset;
        transformOrigin = 'left center';
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2);
        left = triggerRect.left - offset;
        transformOrigin = 'right center';
        break;
      case 'top':
        top = triggerRect.top - offset;
        left = triggerRect.left + (triggerRect.width / 2);
        transformOrigin = 'center bottom';
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width / 2);
        transformOrigin = 'center top';
        break;
      default:
        return '';
    }

    return `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      transform: ${position === 'right' || position === 'left' ? 'translateY(-50%)' : 'translateX(-50%)'};
      transform-origin: ${transformOrigin};
      z-index: 9999;
    `;
  });

  // Transition props based on position
  const transitionProps = $derived(() => {
    const duration = 150;
    const easing = quintOut;

    switch (position) {
      case 'right':
        return { x: -8, duration, easing };
      case 'left':
        return { x: 8, duration, easing };
      case 'top':
        return { y: 4, duration, easing };
      case 'bottom':
        return { y: -4, duration, easing };
      default:
        return { x: -8, duration, easing };
    }
  });
</script>

<!-- Trigger Element -->
<div
  bind:this={triggerElement}
  class="tooltip-trigger"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  role="tooltip"
  aria-label={content}
>
  {@render children()}
</div>

<!-- Tooltip -->
{#if showTooltip}
  <div
    bind:this={tooltipElement}
    class="tooltip-content"
    style={tooltipStyles}
    transition:fly={transitionProps}
  >
    <div class="tooltip-arrow {position}"></div>
    <div class="tooltip-text">{content}</div>
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .tooltip-trigger {
    @apply inline-block;
  }

  .tooltip-content {
    @apply relative;
    pointer-events: none;
    user-select: none;
  }

  .tooltip-text {
    @apply px-2 py-1.5;
    @apply bg-base01 text-base06;
    @apply border border-border;
    @apply rounded-lg shadow-lg;
    @apply text-sm font-medium;
    @apply whitespace-nowrap;
    @apply backdrop-blur-sm;

    /* Modern glass effect */
    background: color-mix(in srgb, var(--color-base01) 90%, transparent);
    backdrop-filter: blur(8px);

    /* Hardware acceleration for smooth animations */
    transform: translateZ(0);
    will-change: transform, opacity;
  }

  .tooltip-arrow {
    @apply absolute w-2 h-2;
    @apply bg-base01 border border-border;
    @apply rotate-45;
  }

  /* Arrow positioning */
  .tooltip-arrow.right {
    @apply -left-1 top-1/2 -translate-y-1/2;
    border-right: none;
    border-bottom: none;
  }

  .tooltip-arrow.left {
    @apply -right-1 top-1/2 -translate-y-1/2;
    border-left: none;
    border-top: none;
  }

  .tooltip-arrow.top {
    @apply -bottom-1 left-1/2 -translate-x-1/2;
    border-top: none;
    border-left: none;
  }

  .tooltip-arrow.bottom {
    @apply -top-1 left-1/2 -translate-x-1/2;
    border-bottom: none;
    border-right: none;
  }

  /* Dark theme adjustments */
  :global([data-theme*="dark"]) .tooltip-text {
    background: color-mix(in srgb, var(--color-base01) 95%, transparent);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3);
  }

  :global([data-theme*="dark"]) .tooltip-arrow {
    background: var(--color-base01);
  }

  /* Performance optimizations */
  .tooltip-content {
    /* Optimize for animations */
    contain: layout style paint;

    /* Reduce paint operations */
    isolation: isolate;

    /* Hardware acceleration */
    transform: translateZ(0);
  }

  /* Responsive behavior */
  @media (max-width: 640px) {
    .tooltip-content {
      display: none; /* Hide on mobile for better UX */
    }
  }
</style>