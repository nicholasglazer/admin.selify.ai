<script>
  import {getContext} from 'svelte';
  import {Modal, Button} from '@miozu/jera';
  import {Sparkles, AlertCircle, RefreshCw, Save, X, Bot, Zap} from '@lucide/svelte';

  const pmState = getContext('pmState');
  const toastState = getContext('toastState');

  // Derived state from pmState
  let nlCreator = $derived(pmState?.nlCreator ?? {isOpen: false});
  let isGenerating = $derived(nlCreator.isGenerating);
  let generatedTask = $derived(nlCreator.generatedTask);
  let error = $derived(nlCreator.error);
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

  // Example prompts for inspiration
  const examplePrompts = [
    'Fix the login page crash when using OAuth on mobile',
    'Add dark mode toggle to user settings page',
    'Implement CSV export for analytics dashboard',
    'Refactor payment processing to use new Stripe API',
    'Set up automated test coverage for auth module'
  ];

  function handleClose() {
    pmState?.closeNLCreator?.();
  }

  async function handleGenerate() {
    await pmState?.generateTaskFromNL?.();
  }

  async function handleSave() {
    const result = await pmState?.saveGeneratedTask?.();
    if (result) {
      toastState?.show({
        title: 'Task Created',
        message: `"${result.title}" has been added to the board`,
        type: 'success',
        duration: 3000
      });
    }
  }

  function useExample(example) {
    pmState?.setNLDescription?.(example);
  }

  function updateField(field, value) {
    pmState?.updateGeneratedTaskField?.(field, value);
  }
</script>

<Modal open={true} onClose={handleClose} size="lg">
  <div class="nl-creator">
    <div class="nl-header">
      <div class="header-icon">
        <Sparkles size={24} />
      </div>
      <div class="header-text">
        <h2>Create Task with AI</h2>
        <p>Describe your task in plain English. DeepSeek will analyze and structure it for you.</p>
      </div>
      <button class="close-btn" onclick={handleClose}>
        <X size={20} />
      </button>
    </div>

    <div class="nl-body">
      <!-- Natural Language Input -->
      <div class="form-group">
        <label for="nl-description">Task Description</label>
        <textarea
          id="nl-description"
          class="nl-textarea"
          placeholder="Describe what needs to be done...

Example: We need to add a feature that allows users to export their wardrobe data as a PDF. This should include all garment images, categories, and metadata. The export button should be in the user settings page."
          value={nlCreator.nlDescription}
          oninput={(e) => pmState?.setNLDescription?.(e.target.value)}
          rows="6"
        ></textarea>
      </div>

      <!-- Example Prompts -->
      {#if !generatedTask}
        <div class="examples">
          <span class="examples-label">Try an example:</span>
          <div class="examples-list">
            {#each examplePrompts as example}
              <button class="example-btn" onclick={() => useExample(example)}>
                {example.slice(0, 45)}...
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Error Message -->
      {#if error}
        <div class="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      {/if}

      <!-- Generate Button -->
      {#if !generatedTask}
        <button
          class="generate-btn"
          onclick={handleGenerate}
          disabled={isGenerating || !nlCreator.nlDescription?.trim()}
        >
          {#if isGenerating}
            <RefreshCw size={18} class="spinner" />
            Analyzing with DeepSeek...
          {:else}
            <Bot size={18} />
            Generate Task Details
          {/if}
        </button>
      {/if}

      <!-- Generated Task Preview -->
      {#if generatedTask}
        <div class="generated-section">
          <div class="generated-header">
            <h3>
              <Zap size={16} />
              AI-Generated Task
            </h3>
            <button
              class="regenerate-btn"
              onclick={handleGenerate}
              disabled={isGenerating}
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          </div>

          <!-- Editable Fields -->
          <div class="task-form">
            <div class="form-group">
              <label for="task-title">Title</label>
              <input
                id="task-title"
                type="text"
                class="input-field"
                value={generatedTask.title}
                oninput={(e) => updateField('title', e.target.value)}
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="task-priority">Priority</label>
                <select
                  id="task-priority"
                  class="select-field"
                  value={generatedTask.priority}
                  onchange={(e) => updateField('priority', e.target.value)}
                >
                  {#each priorities as p}
                    <option value={p.value}>{p.label}</option>
                  {/each}
                </select>
              </div>

              <div class="form-group">
                <label for="task-type">Type</label>
                <select
                  id="task-type"
                  class="select-field"
                  value={generatedTask.issue_type}
                  onchange={(e) => updateField('issue_type', e.target.value)}
                >
                  {#each taskTypes as t}
                    <option value={t.value}>{t.icon} {t.label}</option>
                  {/each}
                </select>
              </div>

              <div class="form-group">
                <label for="task-assignee">Assignee</label>
                <select
                  id="task-assignee"
                  class="select-field"
                  value={generatedTask.assignee_id || ''}
                  onchange={(e) => updateField('assignee_id', e.target.value || null)}
                >
                  <option value="">Unassigned</option>
                  {#each teamMembers as member}
                    <option value={member.id}>{member.display_name || member.full_name}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="task-description">Description</label>
              <textarea
                id="task-description"
                class="textarea-field"
                value={generatedTask.description}
                oninput={(e) => updateField('description', e.target.value)}
                rows="4"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Labels</label>
              <div class="labels-display">
                {#each generatedTask.labels || [] as label}
                  <span class="label-tag">{label}</span>
                {/each}
                {#if !generatedTask.labels?.length}
                  <span class="no-labels">No labels suggested</span>
                {/if}
              </div>
            </div>

            <!-- AI Analysis Section -->
            {#if generatedTask.ai_analysis}
              <div class="ai-analysis">
                <div class="ai-analysis-header">
                  <Bot size={14} />
                  <span>AI Analysis</span>
                  {#if generatedTask.ai_confidence}
                    <span class="confidence-badge">
                      {Math.round(generatedTask.ai_confidence * 100)}% confident
                    </span>
                  {/if}
                </div>
                <p class="ai-reasoning">{generatedTask.ai_analysis.reasoning || generatedTask.ai_analysis}</p>
                {#if generatedTask.ai_automatable}
                  <div class="automatable-badge">
                    <Zap size={12} />
                    This task can be automated by AI
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <div class="nl-footer">
      <button class="cancel-btn" onclick={handleClose}>Cancel</button>
      {#if generatedTask}
        <button class="save-btn" onclick={handleSave}>
          <Save size={16} />
          Create Task
        </button>
      {/if}
    </div>
  </div>
</Modal>

<style lang="postcss">
  @reference '$theme';

  .nl-creator {
    @apply flex flex-col;
  }

  .nl-header {
    @apply flex items-start gap-4 p-6 border-b border-base02;
    @apply relative;
  }

  .header-icon {
    @apply w-12 h-12 rounded-xl bg-base0E/20 text-base0E;
    @apply flex items-center justify-center flex-shrink-0;
  }

  .header-text {
    @apply flex-1;
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

  .nl-body {
    @apply p-6 flex flex-col gap-4;
    @apply max-h-[60vh] overflow-y-auto;
  }

  .form-group {
    @apply flex flex-col gap-1.5;
  }

  .form-group label {
    @apply text-sm font-medium text-base05;
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

  .nl-textarea {
    @apply w-full px-4 py-3 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06 resize-none;
    @apply focus:outline-none focus:ring-2 focus:ring-base0E/50 focus:border-base0E;
    @apply placeholder:text-base04;
  }

  .examples {
    @apply flex flex-col gap-2;
  }

  .examples-label {
    @apply text-xs text-base04;
  }

  .examples-list {
    @apply flex flex-wrap gap-2;
  }

  .example-btn {
    @apply px-3 py-1.5 text-xs bg-base02 text-base05 rounded-lg;
    @apply hover:bg-base03 transition-colors;
    @apply truncate max-w-[220px];
  }

  .error-message {
    @apply flex items-center gap-2 p-3 bg-base08/10 border border-base08/30 rounded-lg;
    @apply text-sm text-base08;
  }

  .generate-btn {
    @apply flex items-center justify-center gap-2 w-full py-3;
    @apply bg-base0E text-white rounded-lg font-medium;
    @apply hover:bg-base0E/90 transition-colors;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .generate-btn :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .generated-section {
    @apply flex flex-col gap-4 p-4 bg-base01 border border-base02 rounded-xl;
  }

  .generated-header {
    @apply flex justify-between items-center;
  }

  .generated-header h3 {
    @apply flex items-center gap-2 text-sm font-semibold text-base0E;
  }

  .regenerate-btn {
    @apply flex items-center gap-1 px-2 py-1 text-xs text-base04;
    @apply hover:text-base06 transition-colors;
    @apply disabled:opacity-50;
  }

  .task-form {
    @apply flex flex-col gap-4;
  }

  .labels-display {
    @apply flex flex-wrap gap-2;
  }

  .label-tag {
    @apply px-2 py-1 text-xs bg-base02 text-base05 rounded;
  }

  .no-labels {
    @apply text-xs text-base04 italic;
  }

  .ai-analysis {
    @apply p-3 bg-base00 border border-base02 rounded-lg;
  }

  .ai-analysis-header {
    @apply flex items-center gap-2 text-xs text-base0E font-medium mb-2;
  }

  .confidence-badge {
    @apply ml-auto px-2 py-0.5 bg-base0B/20 text-base0B rounded-full;
  }

  .ai-reasoning {
    @apply text-sm text-base05 leading-relaxed;
  }

  .automatable-badge {
    @apply flex items-center gap-1 mt-2 px-2 py-1;
    @apply text-xs bg-base0E/15 text-base0E rounded;
    @apply inline-flex w-fit;
  }

  .nl-footer {
    @apply flex justify-end gap-3 p-6 border-t border-base02;
  }

  .cancel-btn {
    @apply px-4 py-2 text-sm text-base04 hover:text-base06;
    @apply transition-colors;
  }

  .save-btn {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base0B text-white rounded-lg font-medium;
    @apply hover:bg-base0B/90 transition-colors;
  }
</style>
