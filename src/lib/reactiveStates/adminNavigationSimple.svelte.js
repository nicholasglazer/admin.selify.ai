/**
 * AdminNavigationState - Simplified high-performance singleton
 *
 * Optimized for Svelte 5 with proper reactive patterns and performance focus.
 */

import { browser } from '$app/environment';
import { page } from '$app/stores';

// Singleton instance
let adminNavInstance = null;

export class AdminNavigationState {
  // Core reactive state
  capabilities = $state([]);
  currentPath = $state('');
  expandedSections = $state({});

  // Performance caches (non-reactive)
  permissionCache = new Map();
  renderCount = 0;

  constructor(initialData = {}) {
    this.capabilities = initialData.capabilities || [];
    this.currentPath = initialData.currentPath || '/';
    this.loadPersistedState();

    console.log('[AdminNav] Initialized with', this.capabilities.length, 'capabilities');
  }

  // High-performance capability checking with caching
  hasCap = (cap) => {
    if (this.permissionCache.has(cap)) {
      return this.permissionCache.get(cap);
    }

    const hasPermission = this.capabilities.includes('*') || this.capabilities.includes(cap);
    this.permissionCache.set(cap, hasPermission);

    // Limit cache size
    if (this.permissionCache.size > 50) {
      this.permissionCache.clear();
    }

    return hasPermission;
  };

  // Optimized active state detection
  isActive = (href) => {
    if (href === '/') return this.currentPath === '/';
    return this.currentPath.startsWith(href);
  };

  // Generate navigation blocks efficiently - MATCHING DASH.SELIFY.AI
  get navigationBlocks() {
    this.renderCount++;

    const blocks = [];

    // Core navigation items (like dash.selify.ai)
    const coreItems = [
      { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'Home', show: true },
      { id: 'pm', label: 'PM Board', href: '/pm', icon: 'Kanban', show: this.hasCap('ops.tasks.view') },
      { id: 'qa', label: 'QA', href: '/qa', icon: 'TestTube', show: this.hasCap('ops.qa.view') },
      { id: 'temporal', label: 'Temporal', href: '/temporal', icon: 'Activity', show: this.hasCap('ops.tasks.view') || this.hasCap('ops.temporal.view') },
      { id: 'approvals', label: 'Approvals', href: '/approvals', icon: 'CheckCircle', show: this.hasCap('approvals.view') || this.hasCap('ops.approvals.view') },
      { id: 'feedback', label: 'Feedback', href: '/feedback', icon: 'MessageSquare', show: this.hasCap('ops.feedback.view') },
      { id: 'webmail', label: 'Webmail', href: '/webmail', icon: 'Mail', show: true }
    ];

    const visibleCoreItems = coreItems.filter(item => item.show);
    visibleCoreItems.forEach(item => {
      item.active = this.isActive(item.href);
    });

    if (visibleCoreItems.length > 0) {
      blocks.push({
        type: 'section',
        id: 'core-nav',
        title: 'Navigation',
        collapsible: false,
        defaultExpanded: true,
        items: visibleCoreItems
      });
    }

    // Administration section
    const adminItems = [
      { id: 'team', label: 'Team', href: '/team', icon: 'Users', show: this.hasCap('team.view') },
      { id: 'workspaces', label: 'Workspaces', href: '/workspaces', icon: 'Building', show: this.hasCap('admin.workspaces.view') }
    ];

    const visibleAdminItems = adminItems.filter(item => item.show);
    visibleAdminItems.forEach(item => {
      item.active = this.isActive(item.href);
    });

    if (visibleAdminItems.length > 0) {
      blocks.push({
        type: 'section',
        id: 'admin-nav',
        title: 'Administration',
        collapsible: true,
        defaultExpanded: this.getSectionExpanded('admin-nav', true),
        items: visibleAdminItems
      });
    }

    // Operations section (UNFOLDABLE like dash.selify.ai)
    const opsItems = [
      { id: 'services', label: 'Services', href: '/services', icon: 'Server', show: this.hasCap('ops.services.view') },
      { id: 'errors', label: 'Errors', href: '/errors', icon: 'AlertCircle', show: this.hasCap('ops.errors.view') },
      { id: 'logs', label: 'Logs', href: '/logs', icon: 'Terminal', show: this.hasCap('ops.logs.view') },
      { id: 'metrics', label: 'Metrics', href: '/metrics', icon: 'BarChart', show: this.hasCap('ops.metrics.view') },
      { id: 'database', label: 'Database', href: '/database', icon: 'Database', show: this.hasCap('ops.metrics.view') },
      { id: 'observability', label: 'Observability', href: '/observability', icon: 'Eye', show: this.hasCap('ops.logs.view') || this.hasCap('ops.metrics.view') }
    ];

    const visibleOpsItems = opsItems.filter(item => item.show);
    visibleOpsItems.forEach(item => {
      item.active = this.isActive(item.href);
    });

    if (visibleOpsItems.length > 0) {
      blocks.push({
        type: 'section',
        id: 'ops-nav',
        title: 'Ops',  // Changed from "Operations" to match request
        collapsible: true,
        defaultExpanded: this.getSectionExpanded('ops-nav', false), // Default collapsed like dash
        items: visibleOpsItems
      });
    }

    // Documentation section (RECURSIVE like dash.selify.ai)
    const docsItems = [
      {
        id: 'reactivity',
        label: 'Reactivity Patterns',
        href: '/docs/reactivity',
        icon: 'Zap',
        show: true,
        active: this.isActive('/docs/reactivity')
      },
      {
        id: 'getting-started',
        label: 'Getting Started',
        href: '/docs/getting-started',
        icon: 'Rocket',
        show: true,
        active: this.isActive('/docs/getting-started')
      },
      {
        id: 'components',
        label: 'Components',
        href: '/docs/components',
        icon: 'Package',
        show: true,
        active: this.isActive('/docs/components')
      },
      {
        id: 'guides',
        label: 'Guides',
        href: '/docs/guides',
        icon: 'MapPin',
        show: true,
        active: this.isActive('/docs/guides')
      },
      {
        id: 'api-reference',
        label: 'API Reference',
        href: '/docs/api',
        icon: 'Code2',
        show: true,
        active: this.isActive('/docs/api')
      },
      {
        id: 'deployment',
        label: 'Deployment',
        href: '/docs/deployment',
        icon: 'BookOpen',
        show: true,
        active: this.isActive('/docs/deployment')
      }
    ];

    blocks.push({
      type: 'section',
      id: 'docs-nav',
      title: 'Documentation',
      collapsible: true,
      defaultExpanded: this.getSectionExpanded('docs-nav', false),
      items: docsItems
    });

    return blocks;
  }

  get performanceStats() {
    return {
      renderCount: this.renderCount,
      cacheSize: this.permissionCache.size
    };
  }

  // State management
  updateCapabilities(newCapabilities) {
    if (JSON.stringify(newCapabilities) !== JSON.stringify(this.capabilities)) {
      this.capabilities = newCapabilities;
      this.permissionCache.clear();
      console.log('[AdminNav] Capabilities updated:', newCapabilities.length);
    }
  }

  updateCurrentPath(newPath) {
    if (newPath !== this.currentPath) {
      this.currentPath = newPath;
    }
  }

  toggleSection(sectionId) {
    const currentExpanded = this.getSectionExpanded(sectionId, true);
    this.expandedSections[sectionId] = !currentExpanded;
    this.persistState();
  }

  getSectionExpanded(sectionId, defaultValue) {
    return this.expandedSections[sectionId] ?? defaultValue;
  }

  // Persistence
  loadPersistedState() {
    if (!browser) return;

    try {
      const stored = localStorage.getItem('admin-navigation-state');
      if (stored) {
        const state = JSON.parse(stored);
        this.expandedSections = { ...state.expandedSections };
      }
    } catch (err) {
      console.warn('[AdminNav] Failed to load persisted state:', err);
    }
  }

  persistState() {
    if (!browser) return;

    try {
      const state = {
        expandedSections: this.expandedSections,
        timestamp: Date.now()
      };
      localStorage.setItem('admin-navigation-state', JSON.stringify(state));
    } catch (err) {
      console.warn('[AdminNav] Failed to persist state:', err);
    }
  }

  destroy() {
    console.log('[AdminNav] Destroying state');
    this.persistState();
  }
}

// Singleton factory
export function getAdminNavigationState(initialData = {}) {
  if (!adminNavInstance) {
    console.log('[AdminNav] Creating singleton instance');
    adminNavInstance = new AdminNavigationState(initialData);
  } else {
    // Update existing instance
    if (initialData.capabilities) {
      adminNavInstance.updateCapabilities(initialData.capabilities);
    }
    if (initialData.currentPath) {
      adminNavInstance.updateCurrentPath(initialData.currentPath);
    }
  }

  return adminNavInstance;
}

export function resetAdminNavigationState() {
  if (adminNavInstance) {
    adminNavInstance.destroy();
    adminNavInstance = null;
  }
}