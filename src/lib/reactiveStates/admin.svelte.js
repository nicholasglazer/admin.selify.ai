/**
 * Admin Reactive State - Manages admin dashboard state
 *
 * Centralizes state for team member, capabilities, and admin UI state.
 * Uses Svelte 5 runes for reactivity.
 */

export class AdminReactiveState {
  // Current authenticated team member
  teamMember = $state(null);

  // User capabilities
  capabilities = $state([]);

  // Sidebar state
  sidebarCollapsed = $state(false);

  // Mobile menu state
  mobileMenuOpen = $state(false);

  // Loading states
  loading = $state(false);
  initialLoadComplete = $state(false);

  // Error state
  error = $state(null);

  constructor(initialData = {}) {
    if (initialData.teamMember) {
      this.teamMember = initialData.teamMember;
    }
    if (initialData.capabilities) {
      this.capabilities = initialData.capabilities;
    }

    // Load sidebar preference from localStorage
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('admin-sidebar-collapsed');
      if (savedCollapsed !== null) {
        this.sidebarCollapsed = savedCollapsed === 'true';
      }
    }

    this.initialLoadComplete = true;
  }

  // Computed: Check if user has a specific capability
  hasCap(capability) {
    if (!this.capabilities) return false;
    // Wildcard capability grants all access
    if (this.capabilities.includes('*')) return true;
    return this.capabilities.includes(capability);
  }

  // Computed: Is user a super admin
  get isSuperAdmin() {
    return this.teamMember?.role_name === 'super_admin' || this.hasCap('*');
  }

  // Computed: Display name
  get displayName() {
    return this.teamMember?.full_name || 'Unknown';
  }

  // Computed: Display email
  get displayEmail() {
    return this.teamMember?.email || '';
  }

  // Computed: User initials for avatar
  get initials() {
    const name = this.teamMember?.full_name || '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  // Toggle sidebar collapsed state
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this._persistSidebarState();
  }

  // Set sidebar collapsed state
  setSidebarCollapsed(collapsed) {
    this.sidebarCollapsed = collapsed;
    this._persistSidebarState();
  }

  // Toggle mobile menu
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // Close mobile menu
  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  // Update team member data
  updateTeamMember(data) {
    this.teamMember = {...this.teamMember, ...data};
  }

  // Update capabilities
  updateCapabilities(caps) {
    this.capabilities = caps;
  }

  // Set loading state
  setLoading(isLoading) {
    this.loading = isLoading;
  }

  // Set error
  setError(error) {
    this.error = error;
  }

  // Clear error
  clearError() {
    this.error = null;
  }

  // Persist sidebar state
  _persistSidebarState() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', String(this.sidebarCollapsed));
    }
  }
}

// Singleton instance
let adminState = null;

/**
 * Get or create the admin state singleton
 * @param {Object} [initialData] - Initial data from server
 * @returns {AdminReactiveState}
 */
export function getAdminState(initialData = {}) {
  if (!adminState) {
    adminState = new AdminReactiveState(initialData);
  } else if (initialData.teamMember || initialData.capabilities) {
    // Update existing state with new data
    if (initialData.teamMember) {
      adminState.teamMember = initialData.teamMember;
    }
    if (initialData.capabilities) {
      adminState.capabilities = initialData.capabilities;
    }
  }
  return adminState;
}

/**
 * Reset the singleton (useful for testing or logout)
 */
export function resetAdminState() {
  adminState = null;
}
