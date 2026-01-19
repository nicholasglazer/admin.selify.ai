<script>
  /**
   * Keyboard Shortcuts Help Modal
   *
   * Shows available keyboard shortcuts for the webmail interface.
   */
  import {Modal} from '@miozu/jera';
  import {KEYBOARD_SHORTCUTS} from '../state/useKeyboardNav.svelte.js';

  let {open = false, onClose} = $props();
</script>

<Modal
  bind:open={open}
  title="Keyboard Shortcuts"
  size="lg"
  onclose={onClose}
>
  <div class="shortcuts-content">
    {#each KEYBOARD_SHORTCUTS as category (category.category)}
      <div class="shortcut-category">
        <h3 class="category-title">{category.category}</h3>
        <div class="shortcut-list">
          {#each category.shortcuts as shortcut}
            <div class="shortcut-item">
              <div class="shortcut-keys">
                {#each shortcut.keys as key, i}
                  {#if i > 0}
                    <span class="key-separator">then</span>
                  {/if}
                  <kbd class="key">{key}</kbd>
                {/each}
              </div>
              <span class="shortcut-desc">{shortcut.description}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#snippet footer()}
    <p class="footer-tip">Press <kbd>?</kbd> to toggle this help</p>
  {/snippet}
</Modal>

<style lang="postcss">
  @reference '$theme';

  .shortcuts-content {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .shortcut-category {
    @apply space-y-3;
  }

  .category-title {
    @apply text-sm font-semibold text-base0D uppercase tracking-wide;
  }

  .shortcut-list {
    @apply space-y-2;
  }

  .shortcut-item {
    @apply flex items-center justify-between gap-4;
  }

  .shortcut-keys {
    @apply flex items-center gap-1;
  }

  .key {
    @apply px-2 py-1 bg-base02 border border-border/40 rounded;
    @apply text-xs font-mono text-base07;
    @apply min-w-[24px] text-center;
  }

  .key-separator {
    @apply text-xs text-base05 mx-1;
  }

  .shortcut-desc {
    @apply text-sm text-base06;
  }

  .footer-tip {
    @apply text-xs text-base05 text-center;
  }

  .footer-tip kbd {
    @apply px-1.5 py-0.5 bg-base02 rounded text-base06 font-mono;
  }
</style>
