<script>
  import {getContext, onMount} from 'svelte';
  import {Button} from '$components';

  let {issue, onClose} = $props();

  // Focus trap refs
  let modalRef = $state(null);
  let previousActiveElement = $state(null);

  // Focus trap on mount
  onMount(() => {
    previousActiveElement = document.activeElement;
    // Focus the title input when modal opens
    const firstInput = modalRef?.querySelector('input, button, select, textarea');
    firstInput?.focus();

    return () => {
      // Return focus on unmount
      previousActiveElement?.focus();
    };
  });

  // Handle tab key for focus trap
  function handleModalKeydown(e) {
    if (e.key === 'Tab' && modalRef) {
      const focusable = modalRef.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  const pmState = getContext('pmState');
  const toastState = getContext('toastState');

  // Editable state
  let title = $state(issue.title);
  let description = $state(issue.description);
  let priority = $state(issue.priority);
  let status = $state(issue.status);
  let assigneeId = $state(issue.assignee_id || '');
  let labels = $state([...(issue.labels || [])]);
  let newLabel = $state('');
  let isSaving = $state(false);

  // Priority options
  const priorities = [
    {value: 'critical', label: 'Critical', color: 'base08'},
    {value: 'high', label: 'High', color: 'base09'},
    {value: 'medium', label: 'Medium', color: 'base0A'},
    {value: 'low', label: 'Low', color: 'base0B'}
  ];

  // Issue type options
  const issueTypes = [
    {value: 'bug', label: '🐛 Bug'},
    {value: 'feature', label: '✨ Feature'},
    {value: 'task', label: '📋 Task'},
    {value: 'improvement', label: '🔧 Improvement'}
  ];

  let issueType = $state(issue.issue_type || 'task');

  // Status options (columns) - with null safety for SSR
  const statuses = (pmState?.columns ?? []).map((c) => ({
    value: c.id,
    label: c.name
  }));

  // Team members for assignee dropdown (with null safety)
  let teamMembers = $derived(pmState?.teamMembers ?? []);

  // Format date
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // Add label
  function addLabel() {
    const label = newLabel.trim().toLowerCase();
    if (label && !labels.includes(label)) {
      labels = [...labels, label];
      newLabel = '';
    }
  }

  // Remove label
  function removeLabel(labelToRemove) {
    labels = labels.filter((l) => l !== labelToRemove);
  }

  // Handle label input keydown
  function handleLabelKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLabel();
    }
  }

  // Save changes
  async function handleSave() {
    isSaving = true;

    try {
      await pmState?.updateIssue?.(issue.id, {
        title,
        description,
        priority,
        status,
        issue_type: issueType,
        assignee_id: assigneeId || null,
        labels
      });

      toastState?.show({
        title: 'Task Updated',
        message: 'Changes saved successfully',
        type: 'success',
        duration: 3000
      });

      onClose();
    } catch (err) {
      toastState?.show({
        title: 'Save Failed',
        message: err.message || 'Failed to save changes',
        type: 'error',
        duration: 5000
      });
    } finally {
      isSaving = false;
    }
  }

  // Delete issue
  async function handleDelete() {
    if (confirm('Are you sure you want to delete this task?')) {
      await pmState?.deleteIssue?.(issue.id);
      onClose();
    }
  }

  // Close on escape
  function handleKeydown(e) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop" onclick={onClose} role="presentation">
  <div
    class="modal"
    bind:this={modalRef}
    onclick={(e) => e.stopPropagation()}
    onkeydown={handleModalKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="modal-header">
      <div class="modal-title-row">
        <input type="text" class="title-input" id="modal-title" bind:value={title} placeholder="Task title" aria-label="Task title" />
        <button class="close-btn" onclick={onClose} aria-label="Close modal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-meta">
        {#if issue.task_number}
          <span class="task-number">#{issue.task_number}</span>
          <span class="meta-separator">|</span>
        {/if}
        <span class="meta-item">Created {formatDate(issue.created_at)}</span>
        <span class="meta-separator">|</span>
        <span class="meta-item">Updated {formatDate(issue.updated_at)}</span>
        {#if issue.source === 'feedback'}
          <span class="source-tag">From Feedback</span>
        {/if}
      </div>
    </div>

    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Status</label>
          <select bind:value={status}>
            {#each statuses as s}
              <option value={s.value}>{s.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label>Priority</label>
          <select bind:value={priority}>
            {#each priorities as p}
              <option value={p.value}>{p.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Type</label>
          <select bind:value={issueType}>
            {#each issueTypes as t}
              <option value={t.value}>{t.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label>Assignee</label>
          <select bind:value={assigneeId}>
            <option value="">Unassigned</option>
            {#each teamMembers as member}
              <option value={member.id}>{member.display_name || member.full_name || member.email}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea bind:value={description} placeholder="Add a description..." rows="6"></textarea>
      </div>

      <div class="form-group">
        <label>Labels</label>
        <div class="labels-container">
          <div class="labels-display">
            {#each labels as label}
              <span class="label">
                {label}
                <button class="label-remove" onclick={() => removeLabel(label)}>×</button>
              </span>
            {/each}
          </div>
          <div class="label-input-row">
            <input
              type="text"
              class="label-input"
              bind:value={newLabel}
              placeholder="Add label..."
              onkeydown={handleLabelKeydown}
            />
            <button class="add-label-btn" onclick={addLabel} disabled={!newLabel.trim()}> Add </button>
          </div>
        </div>
      </div>

      {#if issue.ai_analysis}
        <div class="form-group">
          <label>AI Analysis</label>
          <div class="ai-analysis">
            <div class="ai-confidence">
              Confidence: <strong>{Math.round((issue.ai_confidence || 0) * 100)}%</strong>
              {#if issue.ai_automatable}
                <span class="automatable-badge">Automatable</span>
              {/if}
            </div>
            <pre>{JSON.stringify(issue.ai_analysis, null, 2)}</pre>
          </div>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-delete" onclick={handleDelete}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
        Delete
      </button>
      <div class="footer-actions">
        <Button variant="secondary" onclick={onClose}>Cancel</Button>
        <Button variant="primary" onclick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .modal-backdrop {
    @apply fixed inset-0 z-50;
    @apply bg-base00/80 backdrop-blur-sm;
    @apply flex items-center justify-center p-4;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal {
    @apply bg-base01 rounded-xl border border-border;
    @apply w-full max-w-lg max-h-[90vh] overflow-hidden;
    @apply flex flex-col;
    @apply shadow-2xl;
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    @apply p-4 border-b border-border;
  }

  .modal-title-row {
    @apply flex items-start gap-3;
  }

  .title-input {
    @apply flex-1 text-lg font-semibold;
    @apply bg-transparent border-none outline-none;
    @apply text-base06;
    @apply placeholder:text-base04;
  }

  .close-btn {
    @apply p-1 rounded hover:bg-base02;
    @apply text-base04 hover:text-base05;
    @apply transition-colors cursor-pointer;
  }

  .modal-meta {
    @apply flex items-center gap-2 mt-2 text-xs text-base04;
  }

  .task-number {
    @apply font-mono text-base05;
  }

  .meta-separator {
    @apply text-border;
  }

  .source-tag {
    @apply px-2 py-0.5 rounded-full;
    @apply bg-base0D/15 text-base0D;
    @apply font-medium;
  }

  .modal-body {
    @apply flex-1 overflow-y-auto p-4 space-y-4;
  }

  .form-row {
    @apply grid grid-cols-2 gap-4;
  }

  .form-group {
    @apply flex flex-col gap-1.5;
  }

  .form-group label {
    @apply text-xs font-medium text-base04 uppercase tracking-wide;
  }

  .form-group select,
  .form-group textarea {
    @apply w-full px-3 py-2 rounded-lg;
    @apply bg-base00 border border-border;
    @apply text-sm text-base06;
    @apply outline-none focus:border-base0D;
    @apply transition-colors;
  }

  .form-group textarea {
    @apply resize-none;
  }

  .labels-container {
    @apply space-y-2;
  }

  .labels-display {
    @apply flex flex-wrap gap-1 min-h-[28px];
  }

  .label {
    @apply text-xs px-2 py-1 rounded;
    @apply bg-base02 text-base05;
    @apply font-medium;
    @apply flex items-center gap-1;
  }

  .label-remove {
    @apply text-base04 hover:text-base08;
    @apply cursor-pointer bg-transparent border-none;
    @apply text-sm leading-none;
  }

  .label-input-row {
    @apply flex gap-2;
  }

  .label-input {
    @apply flex-1 px-3 py-1.5 rounded-lg;
    @apply bg-base00 border border-border;
    @apply text-sm text-base06;
    @apply outline-none focus:border-base0D;
  }

  .add-label-btn {
    @apply px-3 py-1.5 rounded-lg;
    @apply bg-base02 text-base05 text-sm;
    @apply hover:bg-base03 cursor-pointer;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    @apply transition-colors;
  }

  .ai-analysis {
    @apply bg-base00 border border-border rounded-lg p-3;
  }

  .ai-confidence {
    @apply text-sm text-base05 mb-2;
  }

  .automatable-badge {
    @apply ml-2 px-2 py-0.5 rounded-full;
    @apply bg-base0B/15 text-base0B text-xs;
  }

  .ai-analysis pre {
    @apply text-xs text-base04 whitespace-pre-wrap;
    @apply max-h-32 overflow-auto;
  }

  .modal-footer {
    @apply flex items-center justify-between p-4;
    @apply border-t border-border;
  }

  .btn-delete {
    @apply flex items-center gap-1.5 px-3 py-2 rounded-lg;
    @apply text-sm font-medium text-base08;
    @apply bg-base08/10 hover:bg-base08/20;
    @apply transition-colors cursor-pointer;
  }

  .footer-actions {
    @apply flex items-center gap-2;
  }
</style>
