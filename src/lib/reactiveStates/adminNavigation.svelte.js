/**
 * AdminNavigationState - Optimized singleton for admin navigation
 *
 * 2026 Best Practices:
 * - Singleton pattern for global state
 * - Reactive class with proper cleanup
 * - Optimized computations with memoization
 * - Event batching and debouncing
 * - Memory-efficient permission checking
 *
 * @author Nicholas Glazer <glazer.nicholas@gmail.com>
 */

import { browser } from '$app/environment';
import { page } from '$app/stores';
import { get } from 'svelte/store';

// Singleton instance
let adminNavInstance = null;

export class AdminNavigationState {
  // Core reactive state - optimized for admin use case
  #capabilities = $state([]);
  #currentPath = $state('');
  #searchQuery = $state('');
  #expandedSections = $state({});
  #sectionStates = $state(new Map());

  // Cache for expensive computations
  #permissionCache = new Map();
  #blockCache = new Map();
  #lastCacheKey = '';

  // Performance tracking
  #renderCount = 0;
  #lastRender = 0;

  // Cleanup function for subscriptions
  #cleanup = null;

  constructor(initialData = {}) {
    // Initialize state
    this.#capabilities = initialData.capabilities || [];
    this.#currentPath = initialData.currentPath || '/';

    // Load persisted state
    this.#loadPersistedState();

    // Subscribe to route changes for active state detection
    if (browser) {
      this.#setupRouteSubscription();
    }

    console.log('[AdminNav] Initialized with capabilities:', this.#capabilities.length);
  }

  // === OPTIMIZED GETTERS (with memoization) ===

  get capabilities() {
    return this.#capabilities;
  }

  get currentPath() {
    return this.#currentPath;
  }

  get searchQuery() {
    return this.#searchQuery;
  }

  // Reactive navigation blocks using $derived at class level
  navigationBlocks = $derived.by(() => {
    // Create cache key for memoization
    const cacheKey = `${this.#capabilities.join(',')}_${this.#currentPath}_${this.#searchQuery}`;

    // Return cached result if unchanged
    if (cacheKey === this.#lastCacheKey && this.#blockCache.has(cacheKey)) {
      return this.#blockCache.get(cacheKey);
    }

    this.#lastCacheKey = cacheKey;
    this.#renderCount++;
    this.#lastRender = performance.now();

    // Generate blocks efficiently
    const blocks = this.#generateNavigationBlocks();

    // Cache result
    this.#blockCache.set(cacheKey, blocks);

    // Limit cache size
    if (this.#blockCache.size > 10) {
      const firstKey = this.#blockCache.keys().next().value;
      this.#blockCache.delete(firstKey);
    }

    console.log(`[AdminNav] Blocks generated (render #${this.#renderCount}):`, blocks.length, 'blocks');
    return blocks;
  });

  // Reactive performance stats
  performanceStats = $derived({
    renderCount: this.#renderCount,
    lastRenderTime: this.#lastRender,
    cacheSize: this.#blockCache.size,
    permissionCacheSize: this.#permissionCache.size
  });

  // === OPTIMIZED METHODS ===

  // High-performance capability checking with caching
  #hasCap = (cap) => {
    // Check cache first
    if (this.#permissionCache.has(cap)) {
      return this.#permissionCache.get(cap);
    }

    // Compute permission
    const hasPermission = this.#capabilities.includes('*') || this.#capabilities.includes(cap);

    // Cache result
    this.#permissionCache.set(cap, hasPermission);

    // Limit cache size
    if (this.#permissionCache.size > 50) {
      this.#permissionCache.clear();
    }

    return hasPermission;
  };

  // Optimized active state detection
  #isActive = (href) => {
    if (href === '/') return this.#currentPath === '/';
    return this.#currentPath.startsWith(href);
  };

  // Generate navigation blocks efficiently
  #generateNavigationBlocks() {
    const blocks = [];

    // Core navigation items (always visible, minimal allocations)
    const coreItems = [
      { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'Home', show: true },
      { id: 'pm', label: 'PM Board', href: '/pm', icon: 'Kanban', show: this.#hasCap('ops.tasks.view') },
      { id: 'qa', label: 'QA', href: '/qa', icon: 'TestTube', show: this.#hasCap('ops.qa.view') },
      { id: 'temporal', label: 'Temporal', href: '/temporal', icon: 'Activity', show: this.#hasCap('ops.tasks.view') || this.#hasCap('ops.temporal.view') },
      { id: 'approvals', label: 'Approvals', href: '/approvals', icon: 'CheckCircle', show: this.#hasCap('approvals.view') || this.#hasCap('ops.approvals.view') },
      { id: 'feedback', label: 'Feedback', href: '/feedback', icon: 'MessageSquare', show: this.#hasCap('ops.feedback.view') },
      { id: 'webmail', label: 'Webmail', href: '/webmail', icon: 'Mail', show: true }
    ];

    const visibleCoreItems = coreItems.filter(item => item.show);
    visibleCoreItems.forEach(item => {
      item.active = this.#isActive(item.href);
    });

    if (visibleCoreItems.length > 0) {
      blocks.push({
        type: 'section',
        id: 'core-nav',
        title: 'Core',
        collapsible: false,
        defaultExpanded: true,
        items: visibleCoreItems
      });
    }

    // Administration items (conditional)
    const adminItems = [
      { id: 'team', label: 'Team', href: '/team', icon: 'Users', show: this.#hasCap('team.view') },
      { id: 'workspaces', label: 'Workspaces', href: '/workspaces', icon: 'Building', show: this.#hasCap('admin.workspaces.view') }
    ];

    const visibleAdminItems = adminItems.filter(item => item.show);
    visibleAdminItems.forEach(item => {
      item.active = this.#isActive(item.href);
    });

    if (visibleAdminItems.length > 0) {
      blocks.push({
        type: 'section',
        id: 'admin-nav',
        title: 'Administration',
        collapsible: true,
        defaultExpanded: this.#getSectionExpanded('admin-nav', true),
        items: visibleAdminItems
      });
    }

    // Operations items (conditional)
    const opsItems = [
      { id: 'services', label: 'Ops Hub', href: '/services', icon: 'Server', show: this.#hasCap('ops.services.view') },
      { id: 'errors', label: 'Errors', href: '/errors', icon: 'AlertCircle', show: this.#hasCap('ops.errors.view') },
      { id: 'logs', label: 'Logs', href: '/logs', icon: 'Terminal', show: this.#hasCap('ops.logs.view') },
      { id: 'metrics', label: 'Metrics', href: '/metrics', icon: 'BarChart', show: this.#hasCap('ops.metrics.view') },
      { id: 'database', label: 'Database', href: '/database', icon: 'Database', show: this.#hasCap('ops.metrics.view') },
      { id: 'observability', label: 'Observability', href: '/observability', icon: 'Eye', show: this.#hasCap('ops.logs.view') || this.#hasCap('ops.metrics.view') }
    ];

    const visibleOpsItems = opsItems.filter(item => item.show);
    visibleOpsItems.forEach(item => {
      item.active = this.#isActive(item.href);
    });

    if (visibleOpsItems.length > 0) {
      blocks.push({
        type: 'section',
        id: 'ops-nav',
        title: 'Operations',
        collapsible: true,
        defaultExpanded: this.#getSectionExpanded('ops-nav', true),
        items: visibleOpsItems
      });
    }

    // Documentation (always available)
    const docsItems = [
      { id: 'docs', label: 'Documentation', href: '/docs', icon: 'BookOpen', show: true, active: this.#isActive('/docs') }
    ];

    blocks.push({
      type: 'section',
      id: 'docs-nav',
      title: 'Resources',
      collapsible: true,
      defaultExpanded: this.#getSectionExpanded('docs-nav', false),
      items: docsItems
    });

    return blocks;
  }

  // === STATE MANAGEMENT ===

  updateCapabilities(newCapabilities) {
    if (JSON.stringify(newCapabilities) !== JSON.stringify(this.#capabilities)) {
      this.#capabilities = newCapabilities;
      this.#permissionCache.clear(); // Clear permission cache
      this.#blockCache.clear(); // Clear block cache
      console.log('[AdminNav] Capabilities updated:', newCapabilities.length);
    }
  }

  updateCurrentPath(newPath) {
    if (newPath !== this.#currentPath) {
      this.#currentPath = newPath;
      console.log('[AdminNav] Path updated:', newPath);
    }
  }

  setSearchQuery(query) {
    this.#searchQuery = query;
  }

  toggleSection(sectionId) {
    const currentExpanded = this.#getSectionExpanded(sectionId, true);
    this.#expandedSections[sectionId] = !currentExpanded;
    this.#persistState();
  }

  #getSectionExpanded(sectionId, defaultValue) {
    return this.#expandedSections[sectionId] ?? defaultValue;
  }

  // === PERSISTENCE ===

  #loadPersistedState() {
    if (!browser) return;

    try {
      const stored = localStorage.getItem('admin-navigation-state');
      if (stored) {
        const state = JSON.parse(stored);
        this.#expandedSections = { ...state.expandedSections };
      }
    } catch (err) {
      console.warn('[AdminNav] Failed to load persisted state:', err);
    }
  }

  #persistState() {
    if (!browser) return;

    try {
      const state = {
        expandedSections: this.#expandedSections,
        timestamp: Date.now()
      };
      localStorage.setItem('admin-navigation-state', JSON.stringify(state));
    } catch (err) {
      console.warn('[AdminNav] Failed to persist state:', err);
    }
  }

  // === ROUTE SUBSCRIPTION ===

  #setupRouteSubscription() {
    // Subscribe to page store changes efficiently
    const unsubscribe = page.subscribe((pageValue) => {
      if (pageValue?.url?.pathname !== this.#currentPath) {
        this.updateCurrentPath(pageValue.url.pathname);
      }
    });

    // Store cleanup function
    this.#cleanup = unsubscribe;
  }

  // === CLEANUP ===

  destroy() {
    console.log('[AdminNav] Destroying state');
    this.#cleanup?.();
    this.#permissionCache.clear();
    this.#blockCache.clear();
    this.#persistState();
  }
}

// === SINGLETON FACTORY ===

export function getAdminNavigationState(initialData = {}) {
  if (!adminNavInstance) {
    console.log('[AdminNav] Creating singleton instance');
    adminNavInstance = new AdminNavigationState(initialData);
  } else {
    // Update existing instance with new data
    if (initialData.capabilities) {
      adminNavInstance.updateCapabilities(initialData.capabilities);
    }
    if (initialData.currentPath) {
      adminNavInstance.updateCurrentPath(initialData.currentPath);
    }
  }

  return adminNavInstance;
}

// Reset singleton (for testing or hot reload)
export function resetAdminNavigationState() {
  if (adminNavInstance) {
    adminNavInstance.destroy();
    adminNavInstance = null;
  }
}

// Performance utilities
export function getNavigationPerformanceStats() {
  return adminNavInstance?.performanceStats || null;
}