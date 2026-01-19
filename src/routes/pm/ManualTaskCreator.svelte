<script>
  import {getContext} from 'svelte';
  import {Modal} from '@miozu/jera';
  import {X, Save, AlertCircle} from '@lucide/svelte';

  const pmState = getContext('pmState');
  const toastState = getContext('toastState');

  // Form state
  let title = $state('');
  let description = $state('');
  let priority = $state('medium');
  let issueType = $state('task');
  let assigneeId = $state('');
  let labelsInput = $state('');
  let isSubmitting = $state(false);
  let error = $state(null);

  // Get team members for assignee dropdown
  let teamMembers = $derived(pmState?.teamMembers ?? []);

  // Priority options
  const priorities = [
    {value: 'critical', label: 'Critical', color: 'base08'},
    {value: 'high', label: 'High', color: 'base09'},
    {value: 'medium', label: 'Medium', color: 'base0A'},
    {value: 'low', label: 'Low', color: 'base0B'}
  ];

  // Task type options
  const taskTypes = [
    {value: 'bug', label: 'Bug', icon: '🐛'},
    {value: 'feature', label: 'Feature', icon: '✨'},
    {value: 'task', label: 'Task', icon: '📋'},
    {value: 'improvement', label: 'Improvement', icon: '🔧'}
  ];

  function handleClose() {
    pmState?.closeManualCreator?.();
  }

  async function handleSubmit() {
    if (!title.trim()) {
      error = 'Title is required';
      return;
    }

    isSubmitting = true;
    error = null;

    try {
      // Parse labels from comma-separated input
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim().toLowerCase())
        .filter((l) => l.length > 0);

      const result = await pmState?.addIssue({
        title: title.trim(),
        description: description.trim(),
        priority,
        issue_type: issueType,
        assignee_id: assigneeId || null,
        labels,
        status: 'backlog',
        source: 'manual'
      });

      if (result) {
        toastState?.show({
          title: 'Task Created',
          message: `"${result.title}" has been added to the board`,
          type: 'success',
          duration: 3000
        });
        handleClose();
      }
    } catch (err) {
      error = err.message || 'Failed to create task';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal open={true} onClose={handleClose} size="lg">
  <div class="manual-creator">
    <div class="creator-header">
      <div class="header-text">
        <h2>Create Task</h2>
        <p>Fill in the details to create a new task manually.</p>
      </div>
      <button class="close-btn" onclick={handleClose}>
        <X size={20} />
      </button>
    </div>

    <form class="creator-body" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <!-- Title -->
      <div class="form-group">
        <label for="task-title">Title <span class="required">*</span></label>
        <input
          id="task-title"
          type="text"
          class="input-field"
          placeholder="Enter task title..."
          bind:value={title}
          required
        />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="task-description">Description</label>
        <textarea
          id="task-description"
          class="textarea-field"
          placeholder="Describe the task, acceptance criteria, context..."
          bind:value={description}
          rows="4"
        ></textarea>
      </div>

      <!-- Priority, Type, Assignee row -->
      <div class="form-row">
        <div class="form-group">
          <label for="task-priority">Priority</label>
          <select id="task-priority" class="select-field" bind:value={priority}>
            {#each priorities as p}
              <option value={p.value}>{p.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="task-type">Type</label>
          <select id="task-type" class="select-field" bind:value={issueType}>
            {#each taskTypes as t}
              <option value={t.value}>{t.icon} {t.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="task-assignee">Assignee</label>
          <select id="task-assignee" class="select-field" bind:value={assigneeId}>
            <option value="">Unassigned</option>
            {#each teamMembers as member}
              <option value={member.id}>{member.display_name || member.full_name}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Labels -->
      <div class="form-group">
        <label for="task-labels">Labels</label>
        <input
          id="task-labels"
          type="text"
          class="input-field"
          placeholder="frontend, bug-fix, urgent (comma-separated)"
          bind:value={labelsInput}
        />
        <span class="field-hint">Separate multiple labels with commas</span>
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      {/if}
    </form>

    <div class="creator-footer">
      <button class="cancel-btn" onclick={handleClose} type="button">Cancel</button>
      <button class="save-btn" onclick={handleSubmit} disabled={isSubmitting || !title.trim()}>
        <Save size={16} />
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </button>
    </div>
  </div>
</Modal>

<style lang="postcss">
  @reference '$theme';

  .manual-creator {
    @apply flex flex-col;
  }

  .creator-header {
    @apply flex items-start justify-between p-6 border-b border-base02;
  }

  .header-text h2 {
    @apply text-lg font-semibold text-base06 mb-1;
  }

  .header-text p {
    @apply text-sm text-base04;
  }

  .close-btn {
    @apply p-2 rounded-lg text-base04 hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .creator-body {
    @apply p-6 flex flex-col gap-4;
    @apply max-h-[60vh] overflow-y-auto;
  }

  .form-group {
    @apply flex flex-col gap-1.5;
  }

  .form-group label {
    @apply text-sm font-medium text-base05;
  }

  .required {
    @apply text-base08;
  }

  .form-row {
    @apply grid grid-cols-3 gap-3;
  }

  .select-field,
  .input-field {
    @apply w-full px-3 py-2 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06;
    @apply focus:outline-none focus:ring-2 focus:ring-base0D/50 focus:border-base0D;
  }

  .textarea-field {
    @apply w-full px-3 py-2 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06 resize-none;
    @apply focus:outline-none focus:ring-2 focus:ring-base0D/50 focus:border-base0D;
  }

  .field-hint {
    @apply text-xs text-base04;
  }

  .error-message {
    @apply flex items-center gap-2 p-3 bg-base08/10 border border-base08/30 rounded-lg;
    @apply text-sm text-base08;
  }

  .creator-footer {
    @apply flex justify-end gap-3 p-6 border-t border-base02;
  }

  .cancel-btn {
    @apply px-4 py-2 text-sm text-base04 hover:text-base06;
    @apply transition-colors;
  }

  .save-btn {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base0D text-white rounded-lg font-medium;
    @apply hover:bg-base0D/90 transition-colors;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
</style>
