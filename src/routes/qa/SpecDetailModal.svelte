<script>
  import {getContext} from 'svelte';
  import {Modal, Badge} from '@miozu/jera';

  let {spec, onClose} = $props();

  const qaState = getContext('qaState');
  const toastState = getContext('toastState');

  let activeTab = $state('overview');
  let isEditing = $state(false);
  let editedNlSpec = $state(spec.nl_spec || '');

  const statusVariants = {
    draft: 'default',
    active: 'success',
    disabled: 'warning',
    archived: 'error'
  };

  const tabs = [
    {id: 'overview', label: 'Overview'},
    {id: 'push', label: 'Push Trigger'},
    {id: 'code', label: 'Generated Code'},
    {id: 'history', label: 'Run History'},
    {id: 'heals', label: 'Auto-Heals'}
  ];

  // Push trigger state
  let runOnPush = $state(spec.run_on_push || false);
  let triggerRepos = $state(spec.trigger_on_repos || []);
  let pushPriority = $state(spec.push_priority || 100);

  const gitRepos = qaState.gitRepos;

  function formatDate(dateStr) {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  }

  async function handleStatusChange(newStatus) {
    await qaState.updateSpec(spec.id, {status: newStatus});
    spec.status = newStatus;
  }

  async function handleSaveNlSpec() {
    await qaState.updateSpec(spec.id, {nl_spec: editedNlSpec});
    spec.nl_spec = editedNlSpec;
    isEditing = false;
    toastState?.show({
      title: 'Spec Updated',
      message: 'Natural language description saved',
      type: 'success',
      duration: 3000
    });
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to archive this spec?')) {
      await qaState.deleteSpec(spec.id);
      onClose();
    }
  }

  async function handleRunSpec() {
    await qaState.startRun({specIds: [spec.id]});
    toastState?.show({
      title: 'Test Started',
      message: `Running spec: ${spec.name}`,
      type: 'info',
      duration: 3000
    });
  }

  async function handleTogglePush() {
    runOnPush = !runOnPush;
    await qaState.updateSpec(spec.id, {run_on_push: runOnPush});
    spec.run_on_push = runOnPush;
  }

  async function handleToggleRepo(repo) {
    if (triggerRepos.includes(repo)) {
      triggerRepos = triggerRepos.filter((r) => r !== repo);
    } else {
      triggerRepos = [...triggerRepos, repo];
    }
    await qaState.updateSpec(spec.id, {trigger_on_repos: triggerRepos});
    spec.trigger_on_repos = triggerRepos;
  }

  async function handlePriorityChange(e) {
    pushPriority = parseInt(e.target.value);
    await qaState.updateSpec(spec.id, {push_priority: pushPriority});
    spec.push_priority = pushPriority;
  }
</script>

<Modal open={true} {onClose} size="lg">
  <div class="spec-detail">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-info">
        <span class="spec-number">#{spec.spec_number}</span>
        <h2 class="spec-name">{spec.name}</h2>
        <Badge variant={statusVariants[spec.status]} size="sm">{spec.status}</Badge>
      </div>
      <div class="header-actions">
        <button class="action-btn" onclick={handleRunSpec}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run
        </button>
        <select
          class="status-select"
          value={spec.status}
          onchange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
    </div>

    <!-- Tabs -->
    <div class="detail-tabs">
      {#each tabs as tab}
        <button
          class="tab"
          class:active={activeTab === tab.id}
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
          {#if tab.id === 'heals' && spec.heal_count > 0}
            <span class="tab-badge">{spec.heal_count}</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Content -->
    <div class="detail-content">
      {#if activeTab === 'overview'}
        <div class="overview-section">
          <!-- Target & Category -->
          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">Target App</span>
              <span class="meta-value">{spec.target_app}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Category</span>
              <span class="meta-value">{spec.category || 'Uncategorized'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Last Run</span>
              <span class="meta-value">{formatDate(spec.last_run_at)}</span>
            </div>
          </div>

          <!-- NL Spec -->
          <div class="nl-section">
            <div class="nl-header">
              <span class="nl-label">Test Description (Natural Language)</span>
              {#if !isEditing}
                <button class="edit-btn" onclick={() => (isEditing = true)}>Edit</button>
              {/if}
            </div>
            {#if isEditing}
              <textarea
                class="nl-textarea"
                bind:value={editedNlSpec}
                rows="4"
              ></textarea>
              <div class="edit-actions">
                <button class="cancel-btn" onclick={() => (isEditing = false)}>Cancel</button>
                <button class="save-btn" onclick={handleSaveNlSpec}>Save</button>
              </div>
            {:else}
              <p class="nl-text">{spec.nl_spec}</p>
            {/if}
          </div>

          <!-- Tags -->
          {#if spec.tags?.length > 0}
            <div class="tags-section">
              <span class="tags-label">Tags</span>
              <div class="tags-list">
                {#each spec.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-value">{spec.consecutive_passes || 0}</span>
              <span class="stat-label">Consecutive Passes</span>
            </div>
            <div class="stat-card">
              <span class="stat-value flaky">{spec.flaky_score || 0}%</span>
              <span class="stat-label">Flaky Score</span>
            </div>
            <div class="stat-card">
              <span class="stat-value healed">{spec.heal_count || 0}</span>
              <span class="stat-label">Times Healed</span>
            </div>
          </div>
        </div>

      {:else if activeTab === 'push'}
        <div class="push-section">
          <!-- Enable Toggle -->
          <div class="push-toggle-row">
            <div class="push-toggle-info">
              <h4>Run on Git Push</h4>
              <p>Automatically run this spec when code is pushed to configured repositories.</p>
            </div>
            <button
              class="toggle-switch"
              class:active={runOnPush}
              onclick={handleTogglePush}
              role="switch"
              aria-checked={runOnPush}
            >
              <span class="toggle-slider"></span>
            </button>
          </div>

          {#if runOnPush}
            <!-- Repository Selection -->
            <div class="push-config">
              <h4>Trigger Repositories</h4>
              <p class="push-hint">Select which repos should trigger this test when code is pushed.</p>
              <div class="repo-checkboxes">
                {#each gitRepos as repo}
                  <label class="repo-checkbox">
                    <input
                      type="checkbox"
                      checked={triggerRepos.includes(repo)}
                      onchange={() => handleToggleRepo(repo)}
                    />
                    <span class="repo-name">{repo}</span>
                  </label>
                {/each}
              </div>
            </div>

            <!-- Priority -->
            <div class="push-config">
              <h4>Execution Priority</h4>
              <p class="push-hint">Lower priority runs first. Use low numbers for critical smoke tests.</p>
              <div class="priority-input">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={pushPriority}
                  oninput={handlePriorityChange}
                />
                <span class="priority-value">{pushPriority}</span>
              </div>
              <div class="priority-labels">
                <span>High Priority (1)</span>
                <span>Low Priority (100)</span>
              </div>
            </div>

            <!-- Info Box -->
            <div class="push-info-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <strong>How it works:</strong>
                <p>When code is pushed to a selected repo, GitPushWorkflow will automatically run this test. If the test fails, the push will require human approval regardless of trust level.</p>
              </div>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'code'}
        <div class="code-section">
          {#if spec.generated_code}
            <div class="code-meta">
              <span>Generated by: {spec.generated_by || 'Unknown'}</span>
              <span>Generated at: {formatDate(spec.generated_at)}</span>
            </div>
            <pre class="code-block"><code>{spec.generated_code}</code></pre>
          {:else}
            <div class="empty-state">
              <p>No generated code yet. Edit the NL spec and regenerate.</p>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'history'}
        <div class="history-section">
          <p class="empty-text">Run history will appear here after tests are executed.</p>
        </div>

      {:else if activeTab === 'heals'}
        <div class="heals-section">
          {#if spec.heal_history?.length > 0}
            <div class="heal-list">
              {#each spec.heal_history as heal}
                <div class="heal-item">
                  <span class="heal-date">{formatDate(heal.date)}</span>
                  <span class="heal-reason">{heal.reason}</span>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <p>No auto-heals recorded for this spec yet.</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="detail-footer">
      <button class="delete-btn" onclick={handleDelete}>Archive Spec</button>
      <button class="close-btn" onclick={onClose}>Close</button>
    </div>
  </div>
</Modal>

<style lang="postcss">
  @reference '$theme';

  .spec-detail {
    @apply flex flex-col max-h-[80vh];
  }

  .detail-header {
    @apply flex justify-between items-start p-6 border-b border-base02;
  }

  .header-info {
    @apply flex items-center gap-3;
  }

  .spec-number {
    @apply text-sm font-mono text-base04;
  }

  .spec-name {
    @apply text-lg font-semibold text-base06;
  }

  .header-actions {
    @apply flex items-center gap-2;
  }

  .action-btn {
    @apply flex items-center gap-2 px-3 py-1.5;
    @apply bg-base0D text-white rounded-lg text-sm;
    @apply hover:bg-base0D/90 transition-colors;
  }

  .status-select {
    @apply px-3 py-1.5 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06;
  }

  .detail-tabs {
    @apply flex gap-1 px-6 py-3 border-b border-base02 bg-base01/50;
  }

  .tab {
    @apply flex items-center gap-2 px-4 py-2 rounded-lg text-sm;
    @apply text-base04 hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .tab.active {
    @apply bg-base02 text-base06;
  }

  .tab-badge {
    @apply px-1.5 py-0.5 text-xs bg-base0E/20 text-base0E rounded;
  }

  .detail-content {
    @apply flex-1 overflow-y-auto p-6;
  }

  /* Overview */
  .meta-row {
    @apply grid grid-cols-3 gap-4 mb-6;
  }

  .meta-item {
    @apply flex flex-col gap-1;
  }

  .meta-label {
    @apply text-xs text-base04;
  }

  .meta-value {
    @apply text-sm text-base06;
  }

  .nl-section {
    @apply mb-6;
  }

  .nl-header {
    @apply flex justify-between items-center mb-2;
  }

  .nl-label {
    @apply text-sm font-medium text-base05;
  }

  .edit-btn {
    @apply text-xs text-base0D hover:text-base0D/80;
  }

  .nl-textarea {
    @apply w-full p-3 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06 resize-none;
  }

  .edit-actions {
    @apply flex justify-end gap-2 mt-2;
  }

  .cancel-btn {
    @apply px-3 py-1 text-sm text-base04;
  }

  .save-btn {
    @apply px-3 py-1 bg-base0D text-white text-sm rounded;
  }

  .nl-text {
    @apply p-3 bg-base02/50 rounded-lg text-sm text-base05;
  }

  .tags-section {
    @apply mb-6;
  }

  .tags-label {
    @apply text-xs text-base04 block mb-2;
  }

  .tags-list {
    @apply flex flex-wrap gap-2;
  }

  .tag {
    @apply px-2 py-1 bg-base02 text-xs text-base05 rounded;
  }

  .stats-row {
    @apply grid grid-cols-3 gap-4;
  }

  .stat-card {
    @apply flex flex-col items-center p-4 bg-base02/50 rounded-lg;
  }

  .stat-value {
    @apply text-2xl font-bold text-base06;
  }

  .stat-value.flaky {
    @apply text-base0A;
  }

  .stat-value.healed {
    @apply text-base0E;
  }

  .stat-label {
    @apply text-xs text-base04 mt-1;
  }

  /* Code */
  .code-section {
    @apply flex flex-col gap-3;
  }

  .code-meta {
    @apply flex gap-4 text-xs text-base04;
  }

  .code-block {
    @apply p-4 bg-base00 border border-base02 rounded-lg;
    @apply text-xs font-mono text-base05 overflow-x-auto;
    @apply max-h-[400px] overflow-y-auto;
  }

  /* Empty */
  .empty-state {
    @apply flex flex-col items-center justify-center py-12 text-base04;
  }

  .empty-state svg {
    @apply mb-3 opacity-50;
  }

  .empty-text {
    @apply text-sm text-base04 text-center;
  }

  /* Heals */
  .heal-list {
    @apply flex flex-col gap-2;
  }

  .heal-item {
    @apply flex justify-between items-center p-3 bg-base02/50 rounded-lg;
  }

  .heal-date {
    @apply text-xs text-base04;
  }

  .heal-reason {
    @apply text-sm text-base05;
  }

  /* Footer */
  .detail-footer {
    @apply flex justify-between items-center p-6 border-t border-base02;
  }

  .delete-btn {
    @apply text-sm text-base08 hover:text-base08/80;
  }

  .close-btn {
    @apply px-4 py-2 bg-base02 text-base06 rounded-lg text-sm;
    @apply hover:bg-base03 transition-colors;
  }

  /* Push Section */
  .push-section {
    @apply flex flex-col gap-6;
  }

  .push-toggle-row {
    @apply flex justify-between items-start gap-4 p-4;
    @apply bg-base02/50 rounded-xl;
  }

  .push-toggle-info h4 {
    @apply text-base font-medium text-base06 mb-1;
  }

  .push-toggle-info p {
    @apply text-sm text-base04;
  }

  .toggle-switch {
    @apply relative w-12 h-6 bg-base03 rounded-full cursor-pointer;
    @apply transition-colors flex-shrink-0;
  }

  .toggle-switch.active {
    @apply bg-base0E;
  }

  .toggle-slider {
    @apply absolute top-1 left-1 w-4 h-4 bg-white rounded-full;
    @apply transition-transform;
  }

  .toggle-switch.active .toggle-slider {
    @apply translate-x-6;
  }

  .push-config {
    @apply flex flex-col gap-2;
  }

  .push-config h4 {
    @apply text-sm font-medium text-base05;
  }

  .push-hint {
    @apply text-xs text-base04;
  }

  .repo-checkboxes {
    @apply flex flex-col gap-2 mt-2;
  }

  .repo-checkbox {
    @apply flex items-center gap-3 p-3 bg-base02/50 rounded-lg;
    @apply cursor-pointer hover:bg-base02 transition-colors;
  }

  .repo-checkbox input {
    @apply w-4 h-4 accent-base0E;
  }

  .repo-checkbox .repo-name {
    @apply text-sm font-mono text-base05;
  }

  .priority-input {
    @apply flex items-center gap-4 mt-2;
  }

  .priority-input input[type="range"] {
    @apply flex-1 h-2 bg-base03 rounded-lg appearance-none;
    @apply accent-base0E;
  }

  .priority-value {
    @apply w-10 text-center text-sm font-mono text-base06;
    @apply bg-base02 px-2 py-1 rounded;
  }

  .priority-labels {
    @apply flex justify-between text-xs text-base04 mt-1;
  }

  .push-info-box {
    @apply flex gap-3 p-4 bg-base0D/10 border border-base0D/30 rounded-lg;
  }

  .push-info-box svg {
    @apply text-base0D flex-shrink-0 mt-0.5;
  }

  .push-info-box strong {
    @apply text-sm text-base06;
  }

  .push-info-box p {
    @apply text-xs text-base04 mt-1;
  }
</style>
