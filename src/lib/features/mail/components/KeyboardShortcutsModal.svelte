<script>
  /**
   * Keyboard Shortcuts Help Modal
   *
   * Shows available keyboard shortcuts for the webmail interface.
   */
  import {X} from '$components/icons';
  import {KEYBOARD_SHORTCUTS} from '../state/useKeyboardNav.svelte.js';

  let {open = false, onClose} = $props();

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      onClose?.();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
    <div class="shortcuts-modal">
      <header class="modal-header">
        <h2 class="modal-title">Keyboard Shortcuts</h2>
        <button class="close-btn" onclick={onClose}>
          <X size={20} />
        </button>
      </header>

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

      <footer class="modal-footer">
        <p class="footer-tip">Press <kbd>?</kbd> to toggle this help</p>
      </footer>
    </div>
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .modal-backdrop {
    @apply fixed inset-0 z-50 bg-black/50;
    @apply flex items-center justify-center p-4;
  }

  .shortcuts-modal {
    @apply bg-base01 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh];
    @apply flex flex-col overflow-hidden;
  }

  .modal-header {
    @apply flex items-center justify-between px-6 py-4;
    @apply border-b border-border/30;
  }

  .modal-title {
    @apply text-lg font-semibold text-base07;
  }

  .close-btn {
    @apply p-1.5 rounded text-base05 hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .shortcuts-content {
    @apply flex-1 overflow-y-auto p-6;
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

  .modal-footer {
    @apply px-6 py-4 border-t border-border/30 bg-base02/20;
  }

  .footer-tip {
    @apply text-xs text-base05 text-center;
  }

  .footer-tip kbd {
    @apply px-1.5 py-0.5 bg-base02 rounded text-base06 font-mono;
  }
</style>
