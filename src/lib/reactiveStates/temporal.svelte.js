/**
 * Temporal Reactive State - Manages Temporal workflow monitoring for admin dashboard
 *
 * Provides real-time workflow tracking via SSE, AI-powered search,
 * and process monitoring for the ActivityTracker component.
 *
 * Uses Svelte 5 runes for reactivity.
 */

// Status display configurations
const STATUS_CONFIG = {
  RUNNING: {color: 'base0D', icon: 'pulse', label: 'Running'},
  COMPLETED: {color: 'base0B', icon: 'check', label: 'Completed'},
  FAILED: {color: 'base08', icon: 'x', label: 'Failed'},
  CANCELLED: {color: 'base04', icon: 'x', label: 'Cancelled'},
  TERMINATED: {color: 'base08', icon: 'x', label: 'Terminated'},
  TIMED_OUT: {color: 'base09', icon: 'clock', label: 'Timed Out'}
};

// Workflow type display configurations
const WORKFLOW_TYPE_CONFIG = {
  ProductGenerationWorkflow: {shortName: 'Product Gen', icon: 'package'},
  TeamOnboardingWorkflow: {shortName: 'Onboarding', icon: 'user-plus'},
  HealthCheckWorkflow: {shortName: 'Health Check', icon: 'heart-pulse'},
  CatalogIngestionWorkflow: {shortName: 'Catalog Sync', icon: 'database'},
  BulkImportWorkflow: {shortName: 'Bulk Import', icon: 'upload'}
};

export class TemporalReactiveState {
  // =============================================
  // Core Data
  // =============================================

  // Active processes (for ActivityTracker)
  activeProcesses = $state([]);

  // Full workflow list (for dashboard)
  workflows = $state([]);
  workflowsTotal = $state(0);
  hasMoreWorkflows = $state(false);

  // Selected workflow for detail view
  selectedWorkflow = $state(null);
  workflowHistory = $state([]);

  // AI insights
  insights = $state({
    anomalies: [],
    suggestions: [],
    stats: {}
  });

  // Search
  searchResults = $state([]);
  searchQuery = $state('');
  searchParsedQuery = $state('');
  searchExplanation = $state('');

  // Health/queue info
  health = $state({
    status: 'unknown',
    temporal_connected: false,
    namespace: 'default',
    task_queues: []
  });

  // =============================================
  // Filters
  // =============================================

  filters = $state({
    status: null,
    workflowType: null,
    taskQueue: null,
    since: null
  });

  // =============================================
  // UI State
  // =============================================

  // Activity Tracker
  trackerExpanded = $state(true);
  trackerVisible = $state(false);
  trackerMinimized = $state(false);

  // Dashboard
  isLoading = $state(false);
  isSearching = $state(false);
  isLoadingInsights = $state(false);
  error = $state(null);

  // Recently completed (for strikethrough effect)
  recentlyCompleted = $state(new Map()); // workflow_id -> completion_time

  // =============================================
  // SSE Connection Management
  // =============================================

  eventSource = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  reconnectDelay = 1000;

  // Rate limiting management
  isRateLimited = false;
  rateLimitBackoffMs = 1000; // Start with 1 second
  maxBackoffMs = 60000; // Max 1 minute between requests
  rateLimitTimeout = null;

  // =============================================
  // External References
  // =============================================

  apiBaseUrl = null;
  showToast = null;
  supabaseClient = null;
  realtimeChannel = null;

  // =============================================
  // Constructor
  // =============================================

  constructor(initialData = {}) {
    this.apiBaseUrl = initialData.apiBaseUrl || 'https://api.selify.ai';
    this.showToast = initialData.showToast || null;
    this.supabaseClient = initialData.supabaseClient || null;

    // Restore tracker state from localStorage
    if (typeof localStorage !== 'undefined') {
      const savedExpanded = localStorage.getItem('temporal-tracker-expanded');
      if (savedExpanded !== null) {
        this.trackerExpanded = savedExpanded === 'true';
      }
    }

    // Initialize with any provided data
    if (initialData.workflows) {
      this.workflows = initialData.workflows;
    }
    if (initialData.activeProcesses) {
      this.activeProcesses = initialData.activeProcesses;
    }
  }

  // =============================================
  // Computed Values (via getters)
  // =============================================

  get activeCount() {
    return this.activeProcesses.length;
  }

  get hasActive() {
    return this.activeCount > 0;
  }

  get runningWorkflows() {
    return this.workflows.filter((w) => w.status === 'RUNNING');
  }

  get completedWorkflows() {
    return this.workflows.filter((w) => w.status === 'COMPLETED');
  }

  get failedWorkflows() {
    return this.workflows.filter((w) => ['FAILED', 'TIMED_OUT'].includes(w.status));
  }

  get hasAnomalies() {
    return this.insights.anomalies?.length > 0;
  }

  // Get processes that completed recently (for auto-dismiss)
  get completedRecently() {
    const now = Date.now();
    const recent = [];
    for (const [id, time] of this.recentlyCompleted) {
      if (now - time < 3000) {
        // Within 3 seconds
        recent.push(id);
      }
    }
    return recent;
  }

  // =============================================
  // Status/Type Helpers
  // =============================================

  getStatusConfig(status) {
    return STATUS_CONFIG[status] || {color: 'base04', icon: 'circle', label: status};
  }

  getWorkflowTypeConfig(type) {
    return WORKFLOW_TYPE_CONFIG[type] || {shortName: type?.replace('Workflow', ''), icon: 'play'};
  }

  formatDuration(startTime) {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const ms = now - start;

    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  formatDurationMs(ms) {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  // =============================================
  // API Methods - Workflows
  // =============================================

  async fetchWorkflows() {
    this.isLoading = true;
    this.error = null;

    try {
      const params = new URLSearchParams();
      if (this.filters.status) params.set('status', this.filters.status);
      if (this.filters.workflowType) params.set('workflow_type', this.filters.workflowType);
      if (this.filters.taskQueue) params.set('task_queue', this.filters.taskQueue);
      if (this.filters.since) params.set('since', this.filters.since);
      params.set('limit', '50');

      const response = await fetch(`${this.apiBaseUrl}/api/temporal/workflows?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.status}`);
      }

      const data = await response.json();
      this.workflows = data.workflows || [];
      this.workflowsTotal = data.total || 0;
      this.hasMoreWorkflows = data.has_more || false;
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      this.error = err.message;
      if (this.showToast) {
        this.showToast({
          title: 'Error',
          message: 'Failed to fetch workflows',
          type: 'error',
          duration: 5000
        });
      }
    } finally {
      this.isLoading = false;
    }
  }

  async fetchActiveProcesses() {
    // Use database RPC instead of polling API
    if (!this.supabaseClient) {
      console.warn('No Supabase client available for Temporal workflow tracking');
      return;
    }

    try {
      const { data, error } = await this.supabaseClient
        .rpc('get_active_temporal_workflows');

      if (error) {
        console.error('Failed to fetch active workflows from database:', error);
        return;
      }

      // Transform database format to expected format
      this.activeProcesses = (data || []).map(workflow => ({
        id: workflow.workflow_id,
        type: workflow.workflow_type,
        friendly_name: workflow.friendly_name || this.getWorkflowTypeConfig(workflow.workflow_type).shortName,
        status: 'RUNNING',
        progress: workflow.progress_percentage || 0,
        current_step: workflow.current_step,
        start_time: workflow.started_at,
        duration_ms: workflow.duration_ms || 0
      }));

      // Show tracker if we have active processes
      if (this.activeProcesses.length > 0) {
        this.trackerVisible = true;
      }
    } catch (err) {
      console.error('Failed to fetch active processes from database:', err);
    }
  }

  async fetchWorkflowDetails(workflowId) {
    this.isLoading = true;

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/temporal/workflows/${workflowId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow details: ${response.status}`);
      }

      const data = await response.json();
      this.selectedWorkflow = data;
      return data;
    } catch (err) {
      console.error('Failed to fetch workflow details:', err);
      if (this.showToast) {
        this.showToast({
          title: 'Error',
          message: 'Failed to fetch workflow details',
          type: 'error',
          duration: 5000
        });
      }
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  async fetchWorkflowHistory(workflowId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/temporal/workflows/${workflowId}/history`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow history: ${response.status}`);
      }

      const data = await response.json();
      this.workflowHistory = data.events || [];
      return data.events;
    } catch (err) {
      console.error('Failed to fetch workflow history:', err);
      return [];
    }
  }

  // =============================================
  // API Methods - Actions
  // =============================================

  async cancelWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/temporal/workflows/${workflowId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel workflow: ${response.status}`);
      }

      // Update local state
      this.updateWorkflowStatus(workflowId, 'CANCELLED');

      if (this.showToast) {
        this.showToast({
          title: 'Workflow Cancelled',
          message: `Workflow ${workflowId.slice(-8)} has been cancelled`,
          type: 'info',
          duration: 3000
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to cancel workflow:', err);
      if (this.showToast) {
        this.showToast({
          title: 'Error',
          message: 'Failed to cancel workflow',
          type: 'error',
          duration: 5000
        });
      }
      return false;
    }
  }

  async terminateWorkflow(workflowId, reason = 'Terminated via admin dashboard') {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/temporal/workflows/${workflowId}/terminate?reason=${encodeURIComponent(reason)}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to terminate workflow: ${response.status}`);
      }

      // Update local state
      this.updateWorkflowStatus(workflowId, 'TERMINATED');

      if (this.showToast) {
        this.showToast({
          title: 'Workflow Terminated',
          message: `Workflow ${workflowId.slice(-8)} has been terminated`,
          type: 'warning',
          duration: 3000
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to terminate workflow:', err);
      if (this.showToast) {
        this.showToast({
          title: 'Error',
          message: 'Failed to terminate workflow',
          type: 'error',
          duration: 5000
        });
      }
      return false;
    }
  }

  /**
   * Start a new workflow from the admin dashboard.
   *
   * @param {string} workflowType - The workflow type name (e.g., 'HealthCheckWorkflow')
   * @param {string} taskQueue - The task queue (e.g., 'internal-ops-queue')
   * @param {object} input - The workflow input parameters
   * @returns {Promise<{workflow_id: string, workflow_type: string, task_queue: string}|null>}
   */
  async startWorkflow(workflowType, taskQueue, input = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/temporal/start`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({
          workflowType,
          taskQueue,
          input
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to start workflow: ${response.status}`);
      }

      const result = await response.json();

      // Refresh workflow list to show the new workflow
      await this.fetchWorkflows();

      if (this.showToast) {
        this.showToast({
          title: 'Workflow Started',
          message: `Started ${workflowType.replace('Workflow', '')}`,
          type: 'success',
          duration: 3000
        });
      }

      return result;
    } catch (err) {
      console.error('Failed to start workflow:', err);
      if (this.showToast) {
        this.showToast({
          title: 'Error',
          message: err.message || 'Failed to start workflow',
          type: 'error',
          duration: 5000
        });
      }
      return null;
    }
  }

  // =============================================
  // API Methods - Search & Insights
  // =============================================

  async searchWorkflows(query) {
    if (!query?.trim()) {
      this.searchResults = [];
      this.searchQuery = '';
      return;
    }

    this.isSearching = true;
    this.searchQuery = query;

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/temporal/search?q=${encodeURIComponent(query)}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      this.searchResults = data.results || [];
      this.searchParsedQuery = data.parsed_query || '';
      this.searchExplanation = data.explanation || '';
    } catch (err) {
      console.error('Search failed:', err);
      this.searchResults = [];
      if (this.showToast) {
        this.showToast({
          title: 'Search Failed',
          message: err.message,
          type: 'error',
          duration: 5000
        });
      }
    } finally {
      this.isSearching = false;
    }
  }

  async fetchInsights() {
    this.isLoadingInsights = true;

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/temporal/insights`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.status}`);
      }

      const data = await response.json();
      this.insights = {
        anomalies: data.anomalies || [],
        suggestions: data.suggestions || [],
        stats: data.stats || {}
      };
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      this.isLoadingInsights = false;
    }
  }

  async fetchHealth() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/temporal/health`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch health: ${response.status}`);
      }

      this.health = await response.json();
    } catch (err) {
      console.error('Failed to fetch health:', err);
      this.health = {
        status: 'unhealthy',
        temporal_connected: false,
        namespace: 'default',
        task_queues: []
      };
    }
  }

  // =============================================
  // SSE Stream Management
  // =============================================

  connectToRealtimeWorkflows() {
    if (!this.supabaseClient) {
      console.warn('No Supabase client available for real-time workflow tracking');
      return;
    }

    // Disconnect existing channel
    this.disconnectRealtime();

    try {
      // Subscribe to database changes for temporal workflows
      this.realtimeChannel = this.supabaseClient
        .channel('temporal-workflow-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'temporal_workflows',
          filter: 'status=eq.RUNNING'
        }, (payload) => {
          this.handleWorkflowRealtimeUpdate(payload);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'temporal_workflows',
          filter: 'status=neq.RUNNING'
        }, (payload) => {
          this.handleWorkflowCompletion(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Temporal] Real-time subscribed to workflow updates');
            this.reconnectAttempts = 0;
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Temporal] Real-time channel error');
            this.handleStreamError();
          }
        });

      // Initial fetch
      this.fetchActiveProcesses();
    } catch (err) {
      console.error('Failed to connect to real-time workflow updates:', err);
    }
  }

  handleWorkflowRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (!newRecord) return;

    const workflowData = {
      id: newRecord.workflow_id,
      type: newRecord.workflow_type,
      friendly_name: newRecord.friendly_name || this.getWorkflowTypeConfig(newRecord.workflow_type).shortName,
      status: newRecord.status,
      progress: newRecord.progress_percentage || 0,
      current_step: newRecord.current_step,
      start_time: newRecord.started_at,
      duration_ms: newRecord.duration_ms || 0
    };

    if (eventType === 'INSERT') {
      // New workflow started
      console.log('[Temporal] New workflow started:', workflowData.id);
      this.activeProcesses = [...this.activeProcesses, workflowData];
      this.trackerVisible = true;
    } else if (eventType === 'UPDATE') {
      // Workflow status/progress updated
      const index = this.activeProcesses.findIndex(p => p.id === workflowData.id);
      if (index !== -1) {
        this.activeProcesses[index] = workflowData;
        this.activeProcesses = [...this.activeProcesses]; // Trigger reactivity
      }
    }
  }

  handleWorkflowCompletion(payload) {
    const { new: newRecord } = payload;
    if (!newRecord) return;

    const workflowId = newRecord.workflow_id;
    console.log('[Temporal] Workflow completed:', workflowId, newRecord.status);

    // Remove from active processes
    this.activeProcesses = this.activeProcesses.filter(p => p.id !== workflowId);

    // Track recently completed for visual effects
    if (newRecord.status === 'COMPLETED') {
      this.recentlyCompleted.set(workflowId, Date.now());
      setTimeout(() => {
        this.recentlyCompleted.delete(workflowId);
        this.recentlyCompleted = new Map(this.recentlyCompleted);
      }, 5000);
    }

    // Show completion toast if available
    if (this.showToast) {
      const status = newRecord.status;
      const isSuccess = status === 'COMPLETED';
      this.showToast({
        title: isSuccess ? 'Workflow Completed' : 'Workflow Failed',
        message: `${newRecord.friendly_name || 'Workflow'} ${status.toLowerCase()}`,
        type: isSuccess ? 'success' : 'error',
        duration: 3000
      });
    }
  }

  disconnectRealtime() {
    if (this.realtimeChannel) {
      this.supabaseClient?.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
      console.log('[Temporal] Disconnected from real-time workflow updates');
    }
  }

  // =============================================
  // Rate Limiting Management
  // =============================================

  // Legacy polling stubs (polling replaced by real-time subscriptions)
  startPolling() {
    // No-op: polling replaced by real-time subscriptions
    console.log('[Temporal] startPolling called but polling is disabled - using real-time subscriptions');
  }

  stopPolling() {
    // No-op: polling replaced by real-time subscriptions
  }

  handleRateLimit() {
    if (this.isRateLimited) return; // Already handling rate limit

    this.isRateLimited = true;
    console.log(`[Temporal] Rate limited, backing off for ${this.rateLimitBackoffMs}ms`);

    // Clear any existing timeout
    if (this.rateLimitTimeout) {
      clearTimeout(this.rateLimitTimeout);
    }

    // Set timeout to retry with exponential backoff
    this.rateLimitTimeout = setTimeout(() => {
      this.isRateLimited = false;
      console.log('[Temporal] Rate limit backoff complete, resuming');

      // Exponential backoff (double the delay, up to max)
      this.rateLimitBackoffMs = Math.min(this.rateLimitBackoffMs * 2, this.maxBackoffMs);
    }, this.rateLimitBackoffMs);
  }

  resetRateLimit() {
    this.isRateLimited = false;
    this.rateLimitBackoffMs = 1000; // Reset to initial delay
    if (this.rateLimitTimeout) {
      clearTimeout(this.rateLimitTimeout);
      this.rateLimitTimeout = null;
    }
  }

  handleStreamError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[Temporal] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connectToRealtimeWorkflows();
      }, delay);
    } else {
      console.error('[Temporal] Max reconnect attempts reached');
    }
  }

  disconnectStream() {
    // Legacy SSE cleanup (if still in use)
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    // Disconnect real-time subscriptions
    this.disconnectRealtime();
  }

  // =============================================
  // Local State Updates
  // =============================================

  updateWorkflowStatus(workflowId, newStatus) {
    // Update in workflows list
    const workflowIndex = this.workflows.findIndex((w) => w.workflow_id === workflowId);
    if (workflowIndex !== -1) {
      this.workflows[workflowIndex] = {
        ...this.workflows[workflowIndex],
        status: newStatus
      };
      this.workflows = [...this.workflows];
    }

    // Update in active processes
    if (newStatus !== 'RUNNING') {
      this.activeProcesses = this.activeProcesses.filter((p) => p.id !== workflowId);

      // Track recently completed for strikethrough effect
      if (newStatus === 'COMPLETED') {
        this.recentlyCompleted.set(workflowId, Date.now());
        // Auto-remove after 5 seconds
        setTimeout(() => {
          this.recentlyCompleted.delete(workflowId);
          this.recentlyCompleted = new Map(this.recentlyCompleted);
        }, 5000);
      }
    }

    // Update selected workflow if viewing
    if (this.selectedWorkflow?.workflow_id === workflowId) {
      this.selectedWorkflow = {
        ...this.selectedWorkflow,
        status: newStatus
      };
    }
  }

  updateActiveProcess(workflowId, data) {
    const index = this.activeProcesses.findIndex((p) => p.id === workflowId);
    if (index !== -1) {
      this.activeProcesses[index] = {
        ...this.activeProcesses[index],
        ...data
      };
      this.activeProcesses = [...this.activeProcesses];
    } else if (data.status === 'RUNNING') {
      // New active process
      this.activeProcesses = [
        ...this.activeProcesses,
        {
          id: workflowId,
          ...data
        }
      ];
    }
  }

  // =============================================
  // Tracker UI Methods
  // =============================================

  showTracker() {
    this.trackerVisible = true;
  }

  hideTracker() {
    this.trackerVisible = false;
  }

  toggleTracker() {
    this.trackerExpanded = !this.trackerExpanded;

    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('temporal-tracker-expanded', String(this.trackerExpanded));
    }
  }

  minimizeTracker() {
    this.trackerMinimized = true;
    this.trackerExpanded = false;
  }

  maximizeTracker() {
    this.trackerMinimized = false;
    this.trackerExpanded = true;
  }

  // =============================================
  // Filter Methods
  // =============================================

  setFilter(key, value) {
    this.filters = {...this.filters, [key]: value};
    // Auto-fetch when filters change
    this.fetchWorkflows();
  }

  clearFilters() {
    this.filters = {
      status: null,
      workflowType: null,
      taskQueue: null,
      since: null
    };
    this.fetchWorkflows();
  }

  // =============================================
  // Selection Methods
  // =============================================

  selectWorkflow(workflow) {
    this.selectedWorkflow = workflow;
    if (workflow?.workflow_id) {
      this.fetchWorkflowHistory(workflow.workflow_id);
    }
  }

  clearSelection() {
    this.selectedWorkflow = null;
    this.workflowHistory = [];
  }

  // =============================================
  // Cleanup
  // =============================================

  cleanup() {
    this.disconnectStream();
    this.disconnectRealtime();

    // Clear rate limit timeout (legacy, but keep for compatibility)
    if (this.rateLimitTimeout) {
      clearTimeout(this.rateLimitTimeout);
      this.rateLimitTimeout = null;
    }
    this.resetRateLimit();
  }
}

// =============================================
// Singleton Instance
// =============================================

let temporalState = null;

/**
 * Get or create the Temporal state singleton
 * @param {Object} [initialData] - Initial data
 * @returns {TemporalReactiveState}
 */
export function getTemporalState(initialData = {}) {
  if (!temporalState) {
    temporalState = new TemporalReactiveState(initialData);
  } else if (Object.keys(initialData).length > 0) {
    // Update existing state with new data
    if (initialData.apiBaseUrl) {
      temporalState.apiBaseUrl = initialData.apiBaseUrl;
    }
    if (initialData.showToast) {
      temporalState.showToast = initialData.showToast;
    }
    if (initialData.supabaseClient) {
      temporalState.supabaseClient = initialData.supabaseClient;
    }
  }
  return temporalState;
}

/**
 * Reset the singleton (useful for testing or logout)
 */
export function resetTemporalState() {
  if (temporalState) {
    temporalState.cleanup();
  }
  temporalState = null;
}
