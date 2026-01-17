/**
 * Theme Reactive State - Singleton pattern for theme management
 *
 * Manages dark/light theme with persistence to localStorage and cookies.
 * Uses Svelte 5 runes for reactivity.
 */

export class ThemeReactiveState {
  // Reactive state using $state rune
  currentTheme = $state('miozu-dark');
  isInitialized = $state(false);

  constructor(initialTheme = null) {
    // Server-side: use provided theme or default
    if (typeof window === 'undefined') {
      this.currentTheme = initialTheme || 'miozu-dark';
      this.isInitialized = true;
      return;
    }

    // Client-side: check localStorage first (fastest)
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme && (savedTheme === 'miozu-light' || savedTheme === 'miozu-dark')) {
      this.currentTheme = savedTheme;
    } else if (initialTheme) {
      this.currentTheme = initialTheme;
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'miozu-dark' : 'miozu-light';
    }

    this.isInitialized = true;
    this.apply();
  }

  // Computed property - is dark theme active
  get isDark() {
    return this.currentTheme === 'miozu-dark';
  }

  // Computed property - is light theme active
  get isLight() {
    return this.currentTheme === 'miozu-light';
  }

  // Toggle between light and dark
  toggle() {
    this.currentTheme = this.isDark ? 'miozu-light' : 'miozu-dark';
    this.apply();
    this.persist();
  }

  // Set specific theme
  setTheme(theme) {
    if (theme !== 'miozu-light' && theme !== 'miozu-dark') {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }
    this.currentTheme = theme;
    this.apply();
    this.persist();
  }

  // Apply theme to DOM
  apply() {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme', this.currentTheme);

    // Also set color-scheme for native elements
    document.documentElement.style.colorScheme = this.isDark ? 'dark' : 'light';
  }

  // Persist to localStorage and cookie
  persist() {
    if (typeof document === 'undefined') return;

    localStorage.setItem('admin-theme', this.currentTheme);

    // Set cookie for SSR (1 year expiry)
    document.cookie = `admin-theme=${this.currentTheme}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

// Singleton instance
let themeState = null;

/**
 * Get or create the theme state singleton
 * @param {string|null} initialTheme - Initial theme from server (cookie)
 * @returns {ThemeReactiveState}
 */
export function getThemeState(initialTheme = null) {
  if (!themeState) {
    themeState = new ThemeReactiveState(initialTheme);
  }
  return themeState;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetThemeState() {
  themeState = null;
}
