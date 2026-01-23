/**
 * Environment Reactive State - Production/Staging environment switcher
 *
 * Manages which environment (production vs staging) is currently active
 * and provides the correct API endpoints and configurations.
 */

/**
 * @typedef {'production' | 'staging'} Environment
 */

/**
 * @typedef {Object} EnvironmentConfig
 * @property {string} supabaseUrl
 * @property {string} supabaseAnonKey
 * @property {string} apiBaseUrl
 * @property {string} label
 * @property {string} color - Tailwind color class
 */

/** @type {EnvironmentReactiveState | null} */
let instance = null;

export class EnvironmentReactiveState {
  /** @type {Environment} */
  #current = $state('production');

  /** @type {Record<Environment, EnvironmentConfig>} */
  #configs = $state({
    production: {
      supabaseUrl: '',
      supabaseAnonKey: '',
      apiBaseUrl: '',
      label: 'Production',
      color: 'base0B' // green
    },
    staging: {
      supabaseUrl: '',
      supabaseAnonKey: '',
      apiBaseUrl: '',
      label: 'Staging',
      color: 'base0A' // yellow/warning
    }
  });

  /** @type {boolean} */
  #isLoading = $state(false);

  /** @type {Function[]} */
  #listeners = [];

  /**
   * @param {Object} options
   * @param {EnvironmentConfig} options.production
   * @param {EnvironmentConfig} options.staging
   * @param {Environment} [options.initial='production']
   */
  constructor(options) {
    this.#configs.production = {...this.#configs.production, ...options.production};
    this.#configs.staging = {...this.#configs.staging, ...options.staging};

    // Load saved preference from localStorage (browser only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-environment');
      if (saved === 'staging' || saved === 'production') {
        this.#current = saved;
      } else if (options.initial) {
        this.#current = options.initial;
      }
    }
  }

  /** Current environment */
  get current() {
    return this.#current;
  }

  /** Is production */
  get isProduction() {
    return this.#current === 'production';
  }

  /** Is staging */
  get isStaging() {
    return this.#current === 'staging';
  }

  /** Current config */
  get config() {
    return this.#configs[this.#current];
  }

  /** Production config */
  get productionConfig() {
    return this.#configs.production;
  }

  /** Staging config */
  get stagingConfig() {
    return this.#configs.staging;
  }

  /** Is currently switching */
  get isLoading() {
    return this.#isLoading;
  }

  /** Current Supabase URL */
  get supabaseUrl() {
    return this.config.supabaseUrl;
  }

  /** Current Supabase Anon Key */
  get supabaseAnonKey() {
    return this.config.supabaseAnonKey;
  }

  /** Current API Base URL */
  get apiBaseUrl() {
    return this.config.apiBaseUrl;
  }

  /** Current environment label */
  get label() {
    return this.config.label;
  }

  /** Current environment color */
  get color() {
    return this.config.color;
  }

  /**
   * Switch to a different environment
   * @param {Environment} env
   */
  async switchTo(env) {
    if (env === this.#current) return;
    if (env !== 'production' && env !== 'staging') return;

    this.#isLoading = true;

    try {
      this.#current = env;

      // Persist choice in cookie (for SSR) and localStorage (for quick access)
      if (typeof window !== 'undefined') {
        // Set cookie with 1 year expiry, accessible across the domain
        document.cookie = `admin-environment=${env}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('admin-environment', env);
      }

      // Notify listeners
      this.#listeners.forEach((fn) => fn(env));
    } finally {
      this.#isLoading = false;
    }
  }

  /** Toggle between production and staging */
  async toggle() {
    await this.switchTo(this.#current === 'production' ? 'staging' : 'production');
  }

  /**
   * Subscribe to environment changes
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.#listeners.push(callback);
    return () => {
      const idx = this.#listeners.indexOf(callback);
      if (idx > -1) this.#listeners.splice(idx, 1);
    };
  }

  /**
   * Check if a route needs environment switching
   * @param {string} pathname
   * @returns {boolean}
   */
  routeNeedsEnvSwitch(pathname) {
    // Routes that DON'T need environment switching
    const sharedRoutes = ['/team', '/webmail', '/docs'];
    return !sharedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
  }
}

/**
 * Get or create singleton environment state
 * @param {Object} options
 * @returns {EnvironmentReactiveState}
 */
export function getEnvironmentState(options) {
  if (!instance) {
    instance = new EnvironmentReactiveState(options);
  }
  return instance;
}

/**
 * Reset environment state (for testing)
 */
export function resetEnvironmentState() {
  instance = null;
}
