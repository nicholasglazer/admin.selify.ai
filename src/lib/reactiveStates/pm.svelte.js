/**
 * PM Board Reactive State - Manages Kanban board for task/issue tracking
 *
 * Adapted from dash.selify.ai WorkspacePipelineReactiveState for admin PM system.
 * Uses Svelte 5 runes for reactivity.
 */

// Default board columns/statuses
const DEFAULT_COLUMNS = [
  {
    id: 'backlog',
    name: 'Backlog',
    description: 'Tasks waiting to be worked on',
    color: 'base05',
    order: 0
  },
  {
    id: 'ai_queue',
    name: 'AI Queue',
    description: 'Tasks assigned to AI agents',
    color: 'base0E',
    order: 1
  },
  {
    id: 'in_progress',
    name: 'In Progress',
    description: 'Currently being worked on',
    color: 'base0D',
    order: 2
  },
  {
    id: 'review',
    name: 'Review',
    description: 'Awaiting human review/approval',
    color: 'base0A',
    order: 3
  },
  {
    id: 'done',
    name: 'Done',
    description: 'Completed tasks',
    color: 'base0B',
    order: 4
  }
];

export class PMBoardReactiveState {
  // Core Data
  columns = $state([]);
  issues = $state([]);

  // UI State
  draggedIssue = $state(null);
  hoveredColumn = $state(null);
  selectedIssue = $state(null);
  viewMode = $state('board'); // 'board' | 'list'
  isLoading = $state(true);

  // Custom drag state
  isDragging = $state(false);
  customDragGhost = $state(null);
  customDragOffset = $state({x: 0, y: 0});
  dragAnimationFrame = null;
  hoverCheckThrottle = null;

  // Filters
  filters = $state({
    search: '',
    assignee: null,
    priority: null,
    labels: []
  });

  // Toast function reference
  showToast = null;

  constructor(initialData = {}) {
    this.columns = initialData.columns?.length > 0 ? initialData.columns : DEFAULT_COLUMNS;
    this.issues = initialData.issues || [];
    this.showToast = initialData.showToast || null;
    this.isLoading = false;
  }

  // Update issues from server
  updateIssues(issues) {
    this.issues = [...(issues || [])];
  }

  // Update columns from server
  updateColumns(columns) {
    this.columns = [...(columns || DEFAULT_COLUMNS)];
  }

  // Get issues in a specific column
  getIssuesInColumn(columnId) {
    return this.issues.filter(i => i.status === columnId);
  }

  // Get filtered issues by column
  getFilteredIssuesByColumn() {
    const filtered = this.getFilteredIssues();
    const organized = {};

    for (const column of this.columns) {
      organized[column.id] = filtered.filter(i => i.status === column.id);
    }

    return organized;
  }

  // Get filtered issues
  getFilteredIssues() {
    let filtered = [...this.issues];

    // Apply search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(i => {
        const title = i.title?.toLowerCase() || '';
        const description = i.description?.toLowerCase() || '';
        return title.includes(search) || description.includes(search);
      });
    }

    // Apply assignee filter
    if (this.filters.assignee) {
      filtered = filtered.filter(i => i.assignee === this.filters.assignee);
    }

    // Apply priority filter
    if (this.filters.priority) {
      filtered = filtered.filter(i => i.priority === this.filters.priority);
    }

    // Apply label filter
    if (this.filters.labels?.length > 0) {
      filtered = filtered.filter(i =>
        this.filters.labels.some(label => i.labels?.includes(label))
      );
    }

    return filtered;
  }

  // Move issue to another column
  async moveIssue(issueId, toColumnId, position = null) {
    const issue = this.issues.find(i => i.id === issueId);
    const toColumn = this.columns.find(c => c.id === toColumnId);

    if (!issue || !toColumn) {
      console.error('[PM Board] Issue or column not found:', {issueId, toColumnId});
      return false;
    }

    // Store old values for rollback
    const oldStatus = issue.status;
    const oldUpdatedAt = issue.updated_at;

    // Optimistic update
    issue.status = toColumnId;
    issue.updated_at = new Date().toISOString();

    // Force reactivity
    this.issues = [...this.issues];

    // Clear drag states
    this.clearDragStates();

    // TODO: Persist to backend (Gitea API or Supabase)
    try {
      // For now, just show success toast
      if (this.showToast) {
        this.showToast({
          title: 'Issue Moved',
          message: `"${issue.title}" moved to ${toColumn.name}`,
          type: 'success',
          duration: 3000
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to move issue:', error);

      // Rollback on error
      issue.status = oldStatus;
      issue.updated_at = oldUpdatedAt;
      this.issues = [...this.issues];

      if (this.showToast) {
        this.showToast({
          title: 'Move Failed',
          message: 'Unable to move issue. Please try again.',
          type: 'error',
          duration: 5000
        });
      }

      return false;
    }
  }

  // Select an issue for detail view
  selectIssue(issue) {
    this.selectedIssue = issue;
  }

  // Close issue detail
  closeIssue() {
    this.selectedIssue = null;
  }

  // Add a new issue
  addIssue(issueData) {
    const newIssue = {
      id: `issue_${Date.now()}`,
      title: issueData.title || 'New Issue',
      description: issueData.description || '',
      status: issueData.status || 'backlog',
      priority: issueData.priority || 'medium',
      labels: issueData.labels || [],
      assignee: issueData.assignee || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: issueData.source || 'manual', // 'manual' | 'feedback' | 'gitea'
      external_id: issueData.external_id || null
    };

    this.issues = [newIssue, ...this.issues];

    if (this.showToast) {
      this.showToast({
        title: 'Issue Created',
        message: `"${newIssue.title}" added to Backlog`,
        type: 'success',
        duration: 3000
      });
    }

    return newIssue;
  }

  // Update an existing issue
  updateIssue(issueId, updates) {
    const index = this.issues.findIndex(i => i.id === issueId);
    if (index === -1) return false;

    this.issues[index] = {
      ...this.issues[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.issues = [...this.issues];

    return true;
  }

  // Delete an issue
  deleteIssue(issueId) {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) return false;

    this.issues = this.issues.filter(i => i.id !== issueId);

    if (this.selectedIssue?.id === issueId) {
      this.selectedIssue = null;
    }

    if (this.showToast) {
      this.showToast({
        title: 'Issue Deleted',
        message: `"${issue.title}" has been removed`,
        type: 'info',
        duration: 3000
      });
    }

    return true;
  }

  // Drag state management
  setDraggedIssue(issue) {
    this.draggedIssue = issue;
  }

  setHoveredColumn(columnId) {
    if (this.draggedIssue || columnId === null) {
      this.hoveredColumn = columnId;
    }
  }

  clearDragStates() {
    this.draggedIssue = null;
    this.hoveredColumn = null;
    this.isDragging = false;
  }

  // Custom drag implementation (like Notion/Trello)
  startCustomDrag(element, issue, event) {
    event.preventDefault();

    this.isDragging = true;
    this.draggedIssue = issue;
    this.hoveredColumn = null;

    // Calculate offset from mouse to element top-left
    const rect = element.getBoundingClientRect();
    this.customDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Create ghost element
    const ghost = element.cloneNode(true);
    ghost.id = 'pm-drag-ghost';
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '10000';
    ghost.style.opacity = '0.9';
    ghost.style.width = rect.width + 'px';
    ghost.style.transform = `translate(${event.clientX - this.customDragOffset.x}px, ${event.clientY - this.customDragOffset.y}px)`;
    ghost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    ghost.style.willChange = 'transform';
    ghost.classList.remove('hover');

    document.body.appendChild(ghost);
    this.customDragGhost = ghost;

    // Add global event listeners
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);

    // Add visual feedback
    element.classList.add('dragging');
    document.body.classList.add('pm-dragging');
  }

  handleDragMove = event => {
    if (!this.customDragGhost) return;

    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
    }

    this.dragAnimationFrame = requestAnimationFrame(() => {
      if (!this.customDragGhost) return;

      const x = event.clientX - this.customDragOffset.x;
      const y = event.clientY - this.customDragOffset.y;
      this.customDragGhost.style.transform = `translate(${x}px, ${y}px)`;

      // Throttle hover detection
      if (!this.hoverCheckThrottle) {
        this.hoverCheckThrottle = setTimeout(() => {
          this.hoverCheckThrottle = null;

          const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
          if (elementBelow) {
            const columnEl = elementBelow.closest('.pm-column');
            if (columnEl) {
              const columnId = columnEl.dataset.columnId;
              if (columnId !== this.hoveredColumn) {
                this.setHoveredColumn(columnId);
              }
            } else if (this.hoveredColumn) {
              this.setHoveredColumn(null);
            }
          }
        }, 16);
      }
    });
  };

  handleDragEnd = async event => {
    if (!this.isDragging) return;

    const targetColumn = this.hoveredColumn;

    // Cancel animations
    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
      this.dragAnimationFrame = null;
    }
    if (this.hoverCheckThrottle) {
      clearTimeout(this.hoverCheckThrottle);
      this.hoverCheckThrottle = null;
    }

    // Remove event listeners
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);

    // Fade out ghost
    if (this.customDragGhost) {
      this.customDragGhost.style.opacity = '0';
      this.customDragGhost.style.transition = 'opacity 0.15s ease-out';
    }

    // Remove dragging class
    const draggedEl = document.querySelector('.issue-card.dragging');
    if (draggedEl) {
      draggedEl.classList.remove('dragging');
    }

    // Handle the drop
    if (targetColumn && this.draggedIssue) {
      await this.moveIssue(this.draggedIssue.id, targetColumn);
    }

    // Cleanup ghost after animation
    setTimeout(() => {
      if (this.customDragGhost?.parentNode) {
        this.customDragGhost.remove();
        this.customDragGhost = null;
      }
    }, 150);

    // Clear states
    this.clearDragStates();
    document.body.classList.remove('pm-dragging');
  };

  // Set filter
  setFilter(key, value) {
    this.filters = {...this.filters, [key]: value};
  }

  // Clear all filters
  clearFilters() {
    this.filters = {
      search: '',
      assignee: null,
      priority: null,
      labels: []
    };
  }

  // Get issue counts by column
  getColumnCounts() {
    const counts = {};
    for (const column of this.columns) {
      counts[column.id] = this.getIssuesInColumn(column.id).length;
    }
    return counts;
  }

  // Get total issue count
  get totalIssues() {
    return this.issues.length;
  }

  // Get issues by priority
  getIssuesByPriority(priority) {
    return this.issues.filter(i => i.priority === priority);
  }

  // Cleanup method
  cleanup() {
    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
    }
    if (this.hoverCheckThrottle) {
      clearTimeout(this.hoverCheckThrottle);
    }
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }
}

// Singleton instance
let pmBoardState = null;

/**
 * Get or create the PM board state singleton
 * @param {Object} [initialData] - Initial data from server
 * @returns {PMBoardReactiveState}
 */
export function getPMBoardState(initialData = {}) {
  if (!pmBoardState) {
    pmBoardState = new PMBoardReactiveState(initialData);
  } else if (initialData.issues || initialData.columns) {
    // Update existing state with new data
    if (initialData.issues) {
      pmBoardState.updateIssues(initialData.issues);
    }
    if (initialData.columns) {
      pmBoardState.updateColumns(initialData.columns);
    }
    if (initialData.showToast) {
      pmBoardState.showToast = initialData.showToast;
    }
  }
  return pmBoardState;
}

/**
 * Reset the singleton (useful for testing or logout)
 */
export function resetPMBoardState() {
  if (pmBoardState) {
    pmBoardState.cleanup();
  }
  pmBoardState = null;
}
