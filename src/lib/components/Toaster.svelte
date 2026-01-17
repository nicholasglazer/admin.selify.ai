<script>
  import {getToastState} from '$lib/reactiveStates';

  let {position = 'bottom-right'} = $props();

  // Get toast state singleton
  const toastState = getToastState();

  // Position classes mapping
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  // Icon components by type
  const icons = {
    success: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    warning: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
  };

  function handleDismiss(id) {
    toastState.dismiss(id);
  }

  function handleAction(toast, action) {
    if (action?.onClick) {
      action.onClick();
    }
    toastState.dismiss(toast.id);
  }
</script>

<div class="toast-container fixed z-50 flex flex-col gap-3 {positionClasses[position]}">
  {#each toastState.toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}" role="alert" aria-live="polite">
      <!-- Progress bar -->
      {#if toast.duration > 0}
        <div class="toast-progress" style="width: {toast.progress}%"></div>
      {/if}

      <div class="toast-content">
        <!-- Icon -->
        <div class="toast-icon">
          {@html icons[toast.type]}
        </div>

        <!-- Text content -->
        <div class="toast-text">
          <div class="toast-title">{toast.title}</div>
          {#if toast.message}
            <div class="toast-message">{toast.message}</div>
          {/if}
        </div>

        <!-- Actions -->
        <div class="toast-actions">
          {#if toast.action}
            <button class="toast-action-primary" onclick={() => handleAction(toast, toast.action)}>
              {toast.action.label}
            </button>
          {/if}
          {#if toast.secondaryAction}
            <button class="toast-action-secondary" onclick={() => handleAction(toast, toast.secondaryAction)}>
              {toast.secondaryAction.label}
            </button>
          {/if}
          <button class="toast-dismiss" onclick={() => handleDismiss(toast.id)} aria-label="Dismiss">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/each}
</div>

<style lang="postcss">
  @reference '$theme';

  .toast-container {
    pointer-events: none;
    max-width: 420px;
    width: 100%;
  }

  .toast {
    @apply relative overflow-hidden;
    @apply bg-base01 border border-border rounded-lg;
    @apply shadow-lg;
    pointer-events: auto;
    animation: toast-in 200ms ease-out;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .toast-progress {
    @apply absolute top-0 left-0 h-0.5;
    @apply transition-all duration-50 ease-linear;
  }

  .toast-success .toast-progress {
    @apply bg-base0B;
  }

  .toast-error .toast-progress {
    @apply bg-base08;
  }

  .toast-warning .toast-progress {
    @apply bg-base09;
  }

  .toast-info .toast-progress {
    @apply bg-base0D;
  }

  .toast-content {
    @apply flex items-start gap-3 p-4;
  }

  .toast-icon {
    @apply flex-shrink-0 mt-0.5;
  }

  .toast-success .toast-icon {
    @apply text-base0B;
  }

  .toast-error .toast-icon {
    @apply text-base08;
  }

  .toast-warning .toast-icon {
    @apply text-base09;
  }

  .toast-info .toast-icon {
    @apply text-base0D;
  }

  .toast-text {
    @apply flex-1 min-w-0;
  }

  .toast-title {
    @apply font-medium text-base05 text-sm;
  }

  .toast-message {
    @apply text-base04 text-sm mt-0.5;
  }

  .toast-actions {
    @apply flex items-center gap-2 flex-shrink-0;
  }

  .toast-action-primary {
    @apply text-sm font-medium text-base0D hover:text-base0D/80;
    @apply transition-colors;
  }

  .toast-action-secondary {
    @apply text-sm text-base04 hover:text-base05;
    @apply transition-colors;
  }

  .toast-dismiss {
    @apply p-1 rounded text-base04 hover:text-base05 hover:bg-base02;
    @apply transition-colors;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .toast-container {
      left: 1rem;
      right: 1rem;
      max-width: none;
    }

    :global(.toast-container.left-1\/2) {
      transform: none;
    }
  }
</style>
