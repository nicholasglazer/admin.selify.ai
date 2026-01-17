<script>
  import {getThemeState} from '$lib/reactiveStates';

  let {size = 20, class: className = ''} = $props();

  const themeState = getThemeState();

  function handleToggle() {
    themeState.toggle();
  }

  // Derived state for current theme
  let isDark = $derived(themeState.isDark);
</script>

<button
  type="button"
  class="theme-toggle {className}"
  onclick={handleToggle}
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if isDark}
    <!-- Sun icon for dark mode (click to switch to light) -->
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon sun"
    >
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  {:else}
    <!-- Moon icon for light mode (click to switch to dark) -->
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon moon"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  {/if}
</button>

<style lang="postcss">
  @reference '$theme';

  .theme-toggle {
    @apply flex items-center justify-center;
    @apply p-2 rounded-lg;
    @apply text-base04 hover:text-base05;
    @apply bg-transparent hover:bg-base02;
    @apply transition-all duration-150;
    @apply cursor-pointer;
  }

  .icon {
    @apply transition-transform duration-200;
  }

  .theme-toggle:hover .icon {
    @apply scale-110;
  }

  .sun {
    @apply text-base0A;
  }

  .moon {
    @apply text-base0D;
  }
</style>
