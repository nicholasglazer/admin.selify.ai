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

  // Column Editing State
  isEditingColumns = $state(false);
  editingColumnId = $state(null);
  columnEditData = $state({});
  showingIconPicker = $state(null);
  showingColorPicker = $state(null);
  pendingColumnChanges = $state(new Set());

  // Column Dragging State
  draggedColumn = $state(null);
  dragOverColumnId = $state(null);
  dragType = $state(null); // 'issue' | 'column'
  columnDragGhost = $state(null);
  columnDragOffset = $state({x: 0, y: 0});

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
    this.dragType = null;
  }

  // Custom drag implementation (like Notion/Trello)
  // Note: Event listeners are handled via svelte:document in PMBoard.svelte
  startCustomDrag(element, issue, event) {
    event.preventDefault();

    this.isDragging = true;
    this.dragType = 'issue';
    this.draggedIssue = issue;
    this.hoveredColumn = null;

    // Calculate offset from mouse to element top-left
    const rect = element.getBoundingClientRect();
    this.customDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Create ghost element (browser-only)
    if (typeof document !== 'undefined') {
      const ghost = element.cloneNode(true);
      ghost.id = 'pm-drag-ghost';
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '10000';
      ghost.style.opacity = '0.9';
      ghost.style.width = rect.width + 'px';
      ghost.style.height = rect.height + 'px';
      ghost.style.left = '0';
      ghost.style.top = '0';
      ghost.style.transform = `translate(${event.clientX - this.customDragOffset.x}px, ${event.clientY - this.customDragOffset.y}px)`;
      ghost.style.transition = 'none';
      ghost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
      ghost.style.willChange = 'transform';

      // Remove any hover/active states from ghost
      ghost.classList.remove('hover', 'hovered', 'dragging', 'active');

      // Preserve all computed styles for proper color inheritance
      if (typeof window !== 'undefined') {
        const preserveStyles = (ghostEl, originalEl) => {
          const ghostChildren = ghostEl.querySelectorAll('*');
          const originalChildren = originalEl.querySelectorAll('*');

          ghostChildren.forEach((child, index) => {
            if (originalChildren[index]) {
              const computed = window.getComputedStyle(originalChildren[index]);
              // Preserve color-related properties
              child.style.color = computed.color;
              child.style.backgroundColor = computed.backgroundColor;
              child.style.borderColor = computed.borderColor;

              // Special handling for SVG elements
              if (child.tagName === 'svg' || child.tagName === 'SVG') {
                child.style.fill = computed.fill !== 'rgb(0, 0, 0)' ? computed.fill : 'currentColor';
                child.style.stroke = computed.stroke;
              }
            }
          });
        };
        preserveStyles(ghost, element);
      }

      document.body.appendChild(ghost);
      this.customDragGhost = ghost;

      // Add visual feedback
      element.classList.add('dragging');
    }
  }

  // Called via svelte:document onmousemove when isDragging && dragType === 'issue'
  handleDragMove = (event) => {
    if (!this.customDragGhost || typeof window === 'undefined') return;

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

          if (typeof document !== 'undefined') {
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
          }
        }, 16);
      }
    });
  };

  // Called via svelte:document onmouseup when isDragging && dragType === 'issue'
  handleDragEnd = async (event) => {
    if (!this.isDragging || this.dragType !== 'issue') return;

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

    // Fade out ghost
    if (this.customDragGhost) {
      this.customDragGhost.style.opacity = '0';
      this.customDragGhost.style.transition = 'opacity 0.15s ease-out';
    }

    // Remove dragging class (browser-only)
    if (typeof document !== 'undefined') {
      const draggedEl = document.querySelector('.issue-card.dragging');
      if (draggedEl) {
        draggedEl.classList.remove('dragging');
      }
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

  // ============================================
  // COLUMN EDITING METHODS
  // ============================================

  // Toggle column edit mode
  toggleColumnEditMode() {
    this.isEditingColumns = !this.isEditingColumns;
    if (!this.isEditingColumns) {
      // Exiting edit mode - save any pending changes
      this.stopEditingColumn();
      this.showingIconPicker = null;
      this.showingColorPicker = null;
    }
  }

  // Start editing a specific column's name
  startEditingColumn(columnId) {
    const column = this.columns.find((c) => c.id === columnId);
    if (!column) return;

    this.editingColumnId = columnId;
    this.columnEditData = {
      name: column.name,
      icon: column.icon || '',
      color: column.color || 'base0D'
    };
  }

  // Stop editing column (discard or save handled separately)
  stopEditingColumn() {
    this.editingColumnId = null;
    this.columnEditData = {};
  }

  // Update a field in the column edit data
  updateColumnField(columnId, field, value) {
    if (this.editingColumnId === columnId) {
      this.columnEditData = {...this.columnEditData, [field]: value};
    }
  }

  // Save column changes
  saveColumnChanges(columnId) {
    const columnIndex = this.columns.findIndex((c) => c.id === columnId);
    if (columnIndex === -1) return;

    const updates = this.columnEditData;
    if (!updates.name || updates.name.trim() === '') return;

    // Update the column
    this.columns[columnIndex] = {
      ...this.columns[columnIndex],
      name: updates.name.trim(),
      icon: updates.icon,
      color: updates.color
    };
    this.columns = [...this.columns];

    // TODO: Persist to database when columns table exists
  }

  // Create a new column at a specific position
  createNewColumn(afterIndex = -1) {
    const newId = `column_${Date.now()}`;
    const newColumn = {
      id: newId,
      name: 'New Column',
      description: '',
      color: 'base0D',
      icon: '',
      order: afterIndex + 1
    };

    // Insert at position
    if (afterIndex < 0) {
      this.columns = [newColumn, ...this.columns];
    } else if (afterIndex >= this.columns.length - 1) {
      this.columns = [...this.columns, newColumn];
    } else {
      const before = this.columns.slice(0, afterIndex + 1);
      const after = this.columns.slice(afterIndex + 1);
      this.columns = [...before, newColumn, ...after];
    }

    // Update order values
    this.columns = this.columns.map((col, idx) => ({...col, order: idx}));

    // Auto-start editing the new column
    this.startEditingColumn(newId);

    if (this.showToast) {
      this.showToast({
        title: 'Column Created',
        message: 'New column added. Click to rename.',
        type: 'success',
        duration: 3000
      });
    }
  }

  // Delete a column (only if empty)
  deleteColumn(columnId) {
    const issuesInColumn = this.issues.filter((i) => i.status === columnId);
    if (issuesInColumn.length > 0) {
      if (this.showToast) {
        this.showToast({
          title: 'Cannot Delete',
          message: 'Move or delete all issues in this column first.',
          type: 'error',
          duration: 3000
        });
      }
      return false;
    }

    this.columns = this.columns.filter((c) => c.id !== columnId);
    this.columns = this.columns.map((col, idx) => ({...col, order: idx}));

    if (this.showToast) {
      this.showToast({
        title: 'Column Deleted',
        message: 'Column has been removed.',
        type: 'info',
        duration: 3000
      });
    }

    return true;
  }

  // Reorder columns
  reorderColumns(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const newColumns = [...this.columns];
    const [removed] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, removed);

    // Update order values
    this.columns = newColumns.map((col, idx) => ({...col, order: idx}));
  }

  // Toggle icon picker for a column
  toggleIconPicker(columnId) {
    this.showingIconPicker = this.showingIconPicker === columnId ? null : columnId;
    this.showingColorPicker = null; // Close color picker
  }

  // Toggle color picker for a column
  toggleColorPicker(columnId) {
    this.showingColorPicker = this.showingColorPicker === columnId ? null : columnId;
    this.showingIconPicker = null; // Close icon picker
  }

  // Select an icon for a column
  selectIcon(columnId, iconName) {
    const columnIndex = this.columns.findIndex((c) => c.id === columnId);
    if (columnIndex !== -1) {
      this.columns[columnIndex] = {...this.columns[columnIndex], icon: iconName};
      this.columns = [...this.columns];

      if (this.editingColumnId === columnId) {
        this.columnEditData = {...this.columnEditData, icon: iconName};
      }
    }
    this.showingIconPicker = null;
  }

  // Select a color for a column
  selectColor(columnId, colorValue) {
    const columnIndex = this.columns.findIndex((c) => c.id === columnId);
    if (columnIndex !== -1) {
      this.columns[columnIndex] = {...this.columns[columnIndex], color: colorValue};
      this.columns = [...this.columns];

      if (this.editingColumnId === columnId) {
        this.columnEditData = {...this.columnEditData, color: colorValue};
      }
    }
    this.showingColorPicker = null;
  }

  // Get available icons list
  getAvailableIcons() {
    return [
      {name: '📋', label: 'Clipboard'},
      {name: '📝', label: 'Note'},
      {name: '🎯', label: 'Target'},
      {name: '🚀', label: 'Rocket'},
      {name: '⚡', label: 'Lightning'},
      {name: '🔥', label: 'Fire'},
      {name: '✅', label: 'Check'},
      {name: '⏳', label: 'Hourglass'},
      {name: '🔄', label: 'Refresh'},
      {name: '🤖', label: 'Robot'},
      {name: '👁️', label: 'Eye'},
      {name: '🎨', label: 'Art'},
      {name: '🐛', label: 'Bug'},
      {name: '💡', label: 'Idea'},
      {name: '⭐', label: 'Star'},
      {name: '🔒', label: 'Lock'},
      {name: '📦', label: 'Package'},
      {name: '🧪', label: 'Test'},
      {name: '📊', label: 'Chart'},
      {name: '🎮', label: 'Game'},
      {name: '💬', label: 'Chat'}
    ];
  }

  // Get available colors list
  getAvailableColors() {
    return [
      {value: 'base05', label: 'Gray'},
      {value: 'base08', label: 'Red'},
      {value: 'base09', label: 'Orange'},
      {value: 'base0A', label: 'Yellow'},
      {value: 'base0B', label: 'Green'},
      {value: 'base0C', label: 'Cyan'},
      {value: 'base0D', label: 'Blue'},
      {value: 'base0E', label: 'Purple'},
      {value: 'base0F', label: 'Brown'}
    ];
  }

  // ============================================
  // COLUMN DRAG AND DROP
  // ============================================

  // Start dragging a column
  // Note: Event listeners are handled via svelte:document in PMBoard.svelte
  startColumnDrag(element, columnId, event) {
    event.preventDefault();

    this.isDragging = true;
    this.dragType = 'column';
    this.draggedColumn = columnId;
    this.dragOverColumnId = null;

    // Calculate offset
    const rect = element.getBoundingClientRect();
    this.columnDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Create ghost element (browser-only)
    if (typeof document !== 'undefined') {
      const ghost = element.cloneNode(true);
      ghost.id = 'pm-column-drag-ghost';
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '10000';
      ghost.style.opacity = '0.85';
      ghost.style.width = rect.width + 'px';
      ghost.style.height = rect.height + 'px';
      ghost.style.left = '0';
      ghost.style.top = '0';
      ghost.style.transform = `translate(${event.clientX - this.columnDragOffset.x}px, ${event.clientY - this.columnDragOffset.y}px)`;
      ghost.style.transition = 'none';
      ghost.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4)';
      ghost.style.willChange = 'transform';
      ghost.style.borderRadius = '12px';

      // Remove any hover/active states from ghost
      ghost.classList.remove('hover', 'hovered', 'dragging', 'drag-over', 'active');

      // Preserve all computed styles for proper color inheritance
      if (typeof window !== 'undefined') {
        const preserveStyles = (ghostEl, originalEl) => {
          const ghostChildren = ghostEl.querySelectorAll('*');
          const originalChildren = originalEl.querySelectorAll('*');

          ghostChildren.forEach((child, index) => {
            if (originalChildren[index]) {
              const computed = window.getComputedStyle(originalChildren[index]);
              child.style.color = computed.color;
              child.style.backgroundColor = computed.backgroundColor;
              child.style.borderColor = computed.borderColor;

              if (child.tagName === 'svg' || child.tagName === 'SVG') {
                child.style.fill = computed.fill !== 'rgb(0, 0, 0)' ? computed.fill : 'currentColor';
                child.style.stroke = computed.stroke;
              }
            }
          });
        };
        preserveStyles(ghost, element);
      }

      document.body.appendChild(ghost);
      this.columnDragGhost = ghost;

      // Visual feedback
      element.classList.add('dragging');
    }
  }

  // Called via svelte:document onmousemove when isDragging && dragType === 'column'
  handleColumnDragMove = (event) => {
    if (!this.columnDragGhost || typeof window === 'undefined') return;

    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
    }

    this.dragAnimationFrame = requestAnimationFrame(() => {
      if (!this.columnDragGhost) return;

      const x = event.clientX - this.columnDragOffset.x;
      const y = event.clientY - this.columnDragOffset.y;
      this.columnDragGhost.style.transform = `translate(${x}px, ${y}px)`;

      // Find column being hovered
      if (typeof document !== 'undefined') {
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        if (elementBelow) {
          const columnEl = elementBelow.closest('.pm-column');
          if (columnEl) {
            const columnId = columnEl.dataset.columnId;
            if (columnId && columnId !== this.draggedColumn) {
              this.dragOverColumnId = columnId;
            }
          } else {
            this.dragOverColumnId = null;
          }
        }
      }
    });
  };

  // Called via svelte:document onmouseup when isDragging && dragType === 'column'
  handleColumnDragEnd = (event) => {
    if (this.dragType !== 'column') return;

    // Get target before cleanup
    const targetColumnId = this.dragOverColumnId;
    const draggedColumnId = this.draggedColumn;

    // Cancel animations
    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
      this.dragAnimationFrame = null;
    }

    // Fade out ghost
    if (this.columnDragGhost) {
      this.columnDragGhost.style.opacity = '0';
      this.columnDragGhost.style.transition = 'opacity 0.15s ease-out';
    }

    // Remove dragging class (browser-only)
    if (typeof document !== 'undefined') {
      const draggedEl = document.querySelector('.pm-column.dragging');
      if (draggedEl) {
        draggedEl.classList.remove('dragging');
      }
    }

    // Handle the reorder
    if (targetColumnId && draggedColumnId && targetColumnId !== draggedColumnId) {
      const fromIndex = this.columns.findIndex((c) => c.id === draggedColumnId);
      const toIndex = this.columns.findIndex((c) => c.id === targetColumnId);

      if (fromIndex !== -1 && toIndex !== -1) {
        this.reorderColumns(fromIndex, toIndex);

        if (this.showToast) {
          this.showToast({
            title: 'Column Reordered',
            message: 'Column position updated.',
            type: 'success',
            duration: 2000
          });
        }
      }
    }

    // Cleanup ghost after animation
    setTimeout(() => {
      if (this.columnDragGhost?.parentNode) {
        this.columnDragGhost.remove();
        this.columnDragGhost = null;
      }
    }, 150);

    // Clear states
    this.isDragging = false;
    this.dragType = null;
    this.draggedColumn = null;
    this.dragOverColumnId = null;
  };

  // Cleanup method - called when component is destroyed
  cleanup() {
    // Cancel any pending animation frames
    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
      this.dragAnimationFrame = null;
    }

    // Clear any pending timeouts
    if (this.hoverCheckThrottle) {
      clearTimeout(this.hoverCheckThrottle);
      this.hoverCheckThrottle = null;
    }

    // Immediately remove ghost elements (don't wait for 150ms timeout)
    if (this.customDragGhost?.parentNode) {
      this.customDragGhost.remove();
      this.customDragGhost = null;
    }
    if (this.columnDragGhost?.parentNode) {
      this.columnDragGhost.remove();
      this.columnDragGhost = null;
    }

    // Clear all drag states
    this.isDragging = false;
    this.dragType = null;
    this.draggedIssue = null;
    this.draggedColumn = null;
    this.hoveredColumn = null;
    this.dragOverColumnId = null;
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
