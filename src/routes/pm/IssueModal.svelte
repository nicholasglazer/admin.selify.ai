<script>
  import {getContext} from 'svelte';
  import {Button} from '$components';

  let {issue, onClose} = $props();

  const pmState = getContext('pmState');
  const toastState = getContext('toastState');

  // Editable state
  let title = $state(issue.title);
  let description = $state(issue.description);
  let priority = $state(issue.priority);
  let status = $state(issue.status);

  // Priority options
  const priorities = [
    {value: 'critical', label: 'Critical', color: 'base08'},
    {value: 'high', label: 'High', color: 'base09'},
    {value: 'medium', label: 'Medium', color: 'base0A'},
    {value: 'low', label: 'Low', color: 'base0B'}
  ];

  // Status options (columns)
  const statuses = pmState.columns.map(c => ({
    value: c.id,
    label: c.name
  }));

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

  // Save changes
  function handleSave() {
    pmState.updateIssue(issue.id, {
      title,
      description,
      priority,
      status
    });

    toastState?.show({
      title: 'Issue Updated',
      message: 'Changes saved successfully',
      type: 'success',
      duration: 3000
    });

    onClose();
  }

  // Delete issue
  function handleDelete() {
    if (confirm('Are you sure you want to delete this issue?')) {
      pmState.deleteIssue(issue.id);
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
  <div class="modal" onclick={e => e.stopPropagation()} role="dialog" aria-modal="true">
    <div class="modal-header">
      <div class="modal-title-row">
        <input
          type="text"
          class="title-input"
          bind:value={title}
          placeholder="Issue title"
        />
        <button class="close-btn" onclick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-meta">
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

      <div class="form-group">
        <label>Description</label>
        <textarea
          bind:value={description}
          placeholder="Add a description..."
          rows="6"
        ></textarea>
      </div>

      {#if issue.labels?.length > 0}
        <div class="form-group">
          <label>Labels</label>
          <div class="labels-display">
            {#each issue.labels as label}
              <span class="label">{label}</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if issue.assignee}
        <div class="form-group">
          <label>Assignee</label>
          <div class="assignee-display">
            {#if issue.assignee === 'ai-agent'}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8V4H8"/>
                <rect width="16" height="12" x="4" y="8" rx="2"/>
                <path d="M2 14h2"/>
                <path d="M20 14h2"/>
                <path d="M15 13v2"/>
                <path d="M9 13v2"/>
              </svg>
              <span>AI Agent</span>
            {:else}
              <span>{issue.assignee}</span>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-delete" onclick={handleDelete}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
        Delete
      </button>
      <div class="footer-actions">
        <Button variant="secondary" onclick={onClose}>Cancel</Button>
        <Button variant="primary" onclick={handleSave}>Save Changes</Button>
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
    from { opacity: 0; }
    to { opacity: 1; }
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
    @apply transition-colors;
  }

  .modal-meta {
    @apply flex items-center gap-2 mt-2 text-xs text-base04;
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

  .labels-display {
    @apply flex flex-wrap gap-1;
  }

  .label {
    @apply text-xs px-2 py-1 rounded;
    @apply bg-base02 text-base05;
    @apply font-medium;
  }

  .assignee-display {
    @apply flex items-center gap-2;
    @apply px-3 py-2 rounded-lg bg-base00 border border-border;
    @apply text-sm text-base06;
  }

  .assignee-display svg {
    @apply text-base0E;
  }

  .modal-footer {
    @apply flex items-center justify-between p-4;
    @apply border-t border-border;
  }

  .btn-delete {
    @apply flex items-center gap-1.5 px-3 py-2 rounded-lg;
    @apply text-sm font-medium text-base08;
    @apply bg-base08/10 hover:bg-base08/20;
    @apply transition-colors;
  }

  .footer-actions {
    @apply flex items-center gap-2;
  }
</style>
