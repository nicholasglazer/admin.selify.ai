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
  teamMembers = $state([]);
  boardSummary = $state({});

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

  // Supabase client reference
  supabase = null;

  constructor(initialData = {}) {
    this.columns = initialData.columns?.length > 0 ? initialData.columns : DEFAULT_COLUMNS;
    this.issues = initialData.issues || [];
    this.teamMembers = initialData.teamMembers || [];
    this.boardSummary = initialData.boardSummary || {};
    this.showToast = initialData.showToast || null;
    this.supabase = initialData.supabase || null;
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
    return this.issues.filter((i) => i.status === columnId);
  }

  // Get filtered issues by column
  getFilteredIssuesByColumn() {
    const filtered = this.getFilteredIssues();
    const organized = {};

    for (const column of this.columns) {
      organized[column.id] = filtered.filter((i) => i.status === column.id);
    }

    return organized;
  }

  // Get filtered issues
  getFilteredIssues() {
    let filtered = [...this.issues];

    // Apply search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter((i) => {
        const title = i.title?.toLowerCase() || '';
        const description = i.description?.toLowerCase() || '';
        return title.includes(search) || description.includes(search);
      });
    }

    // Apply assignee filter
    if (this.filters.assignee) {
      filtered = filtered.filter((i) => i.assignee === this.filters.assignee);
    }

    // Apply priority filter
    if (this.filters.priority) {
      filtered = filtered.filter((i) => i.priority === this.filters.priority);
    }

    // Apply label filter
    if (this.filters.labels?.length > 0) {
      filtered = filtered.filter((i) => this.filters.labels.some((label) => i.labels?.includes(label)));
    }

    return filtered;
  }

  // Move issue to another column (persists to internal.tasks)
  async moveIssue(issueId, toColumnId, position = null) {
    const issue = this.issues.find((i) => i.id === issueId);
    const toColumn = this.columns.find((c) => c.id === toColumnId);

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

    try {
      // Persist to database
      if (this.supabase) {
        const {error: updateError} = await this.supabase
          .schema('internal')
          .from('tasks')
          .update({status: toColumnId})
          .eq('id', issueId);

        if (updateError) {
          throw updateError;
        }
      }

      if (this.showToast) {
        this.showToast({
          title: 'Task Moved',
          message: `"${issue.title}" moved to ${toColumn.name}`,
          type: 'success',
          duration: 3000
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to move task:', error);

      // Rollback on error
      issue.status = oldStatus;
      issue.updated_at = oldUpdatedAt;
      this.issues = [...this.issues];

      if (this.showToast) {
        this.showToast({
          title: 'Move Failed',
          message: 'Unable to move task. Please try again.',
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

  // Add a new task (persists to internal.tasks)
  async addIssue(issueData) {
    const newTaskData = {
      title: issueData.title || 'New Task',
      description: issueData.description || '',
      status: issueData.status || 'backlog',
      priority: issueData.priority || 'medium',
      issue_type: issueData.issue_type || 'task',
      labels: issueData.labels || [],
      assignee_id: issueData.assignee_id || null,
      source: issueData.source || 'manual'
    };

    try {
      if (this.supabase) {
        const {data: insertedTask, error: insertError} = await this.supabase
          .schema('internal')
          .from('tasks')
          .insert(newTaskData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Add to local state with team member info
        const assignee = this.teamMembers.find((m) => m.id === insertedTask.assignee_id);
        const localTask = {
          ...insertedTask,
          task_number: insertedTask.issue_number,
          assignee: assignee?.display_name || null,
          assignee_avatar: assignee?.avatar_url || null
        };

        this.issues = [localTask, ...this.issues];

        if (this.showToast) {
          this.showToast({
            title: 'Task Created',
            message: `"${localTask.title}" added to Backlog`,
            type: 'success',
            duration: 3000
          });
        }

        return localTask;
      } else {
        // Fallback for no supabase (shouldn't happen)
        const tempTask = {
          id: crypto.randomUUID(),
          ...newTaskData,
          task_number: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.issues = [tempTask, ...this.issues];
        return tempTask;
      }
    } catch (error) {
      console.error('Failed to create task:', error);

      if (this.showToast) {
        this.showToast({
          title: 'Creation Failed',
          message: 'Unable to create task. Please try again.',
          type: 'error',
          duration: 5000
        });
      }

      return null;
    }
  }

  // Update an existing task (persists to internal.tasks)
  async updateIssue(issueId, updates) {
    const index = this.issues.findIndex((i) => i.id === issueId);
    if (index === -1) return false;

    const oldIssue = {...this.issues[index]};

    // Optimistic update
    this.issues[index] = {
      ...this.issues[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.issues = [...this.issues];

    try {
      if (this.supabase) {
        // Only send DB-safe fields
        const dbUpdates = {};
        const allowedFields = [
          'title',
          'description',
          'status',
          'priority',
          'issue_type',
          'labels',
          'assignee_id',
          'parent_id'
        ];
        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            dbUpdates[field] = updates[field];
          }
        }

        const {error: updateError} = await this.supabase
          .schema('internal')
          .from('tasks')
          .update(dbUpdates)
          .eq('id', issueId);

        if (updateError) {
          throw updateError;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update task:', error);

      // Rollback
      this.issues[index] = oldIssue;
      this.issues = [...this.issues];

      if (this.showToast) {
        this.showToast({
          title: 'Update Failed',
          message: 'Unable to update task. Please try again.',
          type: 'error',
          duration: 5000
        });
      }

      return false;
    }
  }

  // Delete a task (soft delete in internal.tasks)
  async deleteIssue(issueId) {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return false;

    // Optimistic removal
    this.issues = this.issues.filter((i) => i.id !== issueId);

    if (this.selectedIssue?.id === issueId) {
      this.selectedIssue = null;
    }

    try {
      if (this.supabase) {
        // Soft delete
        const {error: deleteError} = await this.supabase
          .schema('internal')
          .from('tasks')
          .update({deleted_at: new Date().toISOString()})
          .eq('id', issueId);

        if (deleteError) {
          throw deleteError;
        }
      }

      if (this.showToast) {
        this.showToast({
          title: 'Task Deleted',
          message: `"${issue.title}" has been removed`,
          type: 'info',
          duration: 3000
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);

      // Rollback
      this.issues = [issue, ...this.issues];

      if (this.showToast) {
        this.showToast({
          title: 'Delete Failed',
          message: 'Unable to delete task. Please try again.',
          type: 'error',
          duration: 5000
        });
      }

      return false;
    }
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

  handleDragMove = (event) => {
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

  handleDragEnd = async (event) => {
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
    return this.issues.filter((i) => i.priority === priority);
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
  } else if (Object.keys(initialData).length > 0) {
    // Update existing state with new data
    if (initialData.issues) {
      pmBoardState.updateIssues(initialData.issues);
    }
    if (initialData.columns) {
      pmBoardState.updateColumns(initialData.columns);
    }
    if (initialData.teamMembers) {
      pmBoardState.teamMembers = initialData.teamMembers;
    }
    if (initialData.boardSummary) {
      pmBoardState.boardSummary = initialData.boardSummary;
    }
    if (initialData.showToast) {
      pmBoardState.showToast = initialData.showToast;
    }
    if (initialData.supabase) {
      pmBoardState.supabase = initialData.supabase;
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
