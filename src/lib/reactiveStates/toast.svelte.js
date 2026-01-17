/**
 * Toast Reactive State - Manages toast notifications
 *
 * Provides a centralized way to show toast notifications across the app.
 * Uses Svelte 5 runes for reactivity.
 */

export class ToastReactiveState {
  // All active toasts
  toasts = $state([]);

  // Default configuration
  defaultConfig = {
    duration: 4000,
    position: 'bottom-right',
    type: 'info'
  };

  constructor(config = {}) {
    this.defaultConfig = {...this.defaultConfig, ...config};
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.title - Toast title (required)
   * @param {string} [options.message] - Toast message/description
   * @param {string} [options.type] - 'success' | 'error' | 'warning' | 'info'
   * @param {number} [options.duration] - Duration in ms (0 = no auto-dismiss)
   * @param {Object} [options.action] - Primary action {label, onClick}
   * @param {Object} [options.secondaryAction] - Secondary action {label, onClick}
   * @returns {string} Toast ID
   */
  show(options) {
    const id = this._generateId();
    const toast = {
      id,
      title: options.title,
      message: options.message || null,
      type: options.type || this.defaultConfig.type,
      duration: options.duration ?? this.defaultConfig.duration,
      action: options.action || null,
      secondaryAction: options.secondaryAction || null,
      createdAt: Date.now(),
      progress: 0
    };

    this.toasts = [...this.toasts, toast];

    // Auto-dismiss if duration > 0
    if (toast.duration > 0) {
      this._startProgressTimer(id, toast.duration);
    }

    return id;
  }

  /**
   * Show a success toast
   */
  success(title, message = null, options = {}) {
    return this.show({title, message, type: 'success', ...options});
  }

  /**
   * Show an error toast
   */
  error(title, message = null, options = {}) {
    return this.show({title, message, type: 'error', duration: 6000, ...options});
  }

  /**
   * Show a warning toast
   */
  warning(title, message = null, options = {}) {
    return this.show({title, message, type: 'warning', ...options});
  }

  /**
   * Show an info toast
   */
  info(title, message = null, options = {}) {
    return this.show({title, message, type: 'info', ...options});
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    this.toasts = [];
  }

  /**
   * Update toast progress (called by timer)
   */
  _updateProgress(id, progress) {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      // Create new array to trigger reactivity
      this.toasts = this.toasts.map((t) => (t.id === id ? {...t, progress} : t));
    }
  }

  /**
   * Start progress timer for auto-dismiss
   */
  _startProgressTimer(id, duration) {
    const startTime = Date.now();
    const interval = 50; // Update every 50ms for smooth animation

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      this._updateProgress(id, progress);

      if (progress >= 100) {
        clearInterval(timer);
        // Small delay before dismissing for visual feedback
        setTimeout(() => this.dismiss(id), 100);
      }
    }, interval);
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return Math.random().toString(36).slice(2, 9);
  }
}

// Singleton instance
let toastState = null;

/**
 * Get or create the toast state singleton
 * @param {Object} [config] - Default configuration
 * @returns {ToastReactiveState}
 */
export function getToastState(config = {}) {
  if (!toastState) {
    toastState = new ToastReactiveState(config);
  }
  return toastState;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetToastState() {
  toastState = null;
}
