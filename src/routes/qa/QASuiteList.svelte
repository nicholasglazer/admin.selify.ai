<script>
  import {getContext} from 'svelte';
  import {Plus, Play, Layers, Tag, Clock, CheckCircle, XCircle, Pencil, Trash2} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  const qaState = getContext('qaState');

  let showCreateModal = $state(false);
  let newSuite = $state({
    name: '',
    description: '',
    suite_type: 'static',
    spec_ids: [],
    filter_tags: [],
    filter_category: null
  });

  // Derived
  let suites = $derived(qaState.suites);
  let specs = $derived(qaState.specs.filter(s => s.status === 'active'));

  function handleCreateSuite() {
    showCreateModal = true;
  }

  async function saveSuite() {
    if (!newSuite.name.trim()) return;

    await qaState.createSuite(newSuite);
    showCreateModal = false;
    newSuite = {
      name: '',
      description: '',
      suite_type: 'static',
      spec_ids: [],
      filter_tags: [],
      filter_category: null
    };
  }

  async function runSuite(suite) {
    await qaState.runSuite(suite.id, 'staging');
  }

  function getStatusColor(status) {
    return {
      passed: 'success',
      healed: 'warning',
      failed: 'error',
      running: 'info'
    }[status] || 'secondary';
  }

  function toggleSpecInSuite(specId) {
    if (newSuite.spec_ids.includes(specId)) {
      newSuite.spec_ids = newSuite.spec_ids.filter(id => id !== specId);
    } else {
      newSuite.spec_ids = [...newSuite.spec_ids, specId];
    }
  }
</script>

<div class="suite-list">
  <div class="list-header">
    <div class="header-left">
      <h2>Test Suites</h2>
      <span class="count">{suites.length} suites</span>
    </div>
    <button class="btn-primary" onclick={handleCreateSuite}>
      <Plus size={16} />
      New Suite
    </button>
  </div>

  <div class="suites-grid">
    {#each suites as suite}
      <div class="suite-card">
        <div class="suite-header">
          <div class="suite-icon">
            <Layers size={20} />
          </div>
          <div class="suite-info">
            <h3>{suite.name}</h3>
            <p class="suite-type">
              {suite.suite_type === 'static' ? 'Static' : 'Dynamic'} Suite
            </p>
          </div>
          {#if suite.last_run_status}
            <Badge variant={getStatusColor(suite.last_run_status)} size="sm">
              {suite.last_run_status}
            </Badge>
          {/if}
        </div>

        {#if suite.description}
          <p class="suite-description">{suite.description}</p>
        {/if}

        <div class="suite-stats">
          <div class="stat">
            <span class="stat-value">
              {suite.suite_type === 'static' ? suite.spec_ids?.length || 0 : '~'}
            </span>
            <span class="stat-label">Specs</span>
          </div>
          <div class="stat">
            <span class="stat-value">{suite.pass_rate?.toFixed(0) || 0}%</span>
            <span class="stat-label">Pass Rate</span>
          </div>
          <div class="stat">
            <span class="stat-value">
              {suite.avg_duration_ms ? `${(suite.avg_duration_ms / 1000).toFixed(1)}s` : '-'}
            </span>
            <span class="stat-label">Avg Duration</span>
          </div>
        </div>

        {#if suite.tags?.length > 0}
          <div class="suite-tags">
            {#each suite.tags as tag}
              <span class="tag">
                <Tag size={12} />
                {tag}
              </span>
            {/each}
          </div>
        {/if}

        <div class="suite-actions">
          <button class="action-btn run" onclick={() => runSuite(suite)}>
            <Play size={14} />
            Run Suite
          </button>
          <button class="action-btn">
            <Pencil size={14} />
          </button>
        </div>

        {#if suite.last_run_at}
          <div class="last-run">
            <Clock size={12} />
            Last run: {new Date(suite.last_run_at).toLocaleString()}
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <Layers size={48} strokeWidth={1} />
        <h3>No Test Suites</h3>
        <p>Create a suite to group related tests together</p>
        <button class="btn-primary" onclick={handleCreateSuite}>
          <Plus size={16} />
          Create First Suite
        </button>
      </div>
    {/each}
  </div>
</div>

<!-- Create Suite Modal -->
{#if showCreateModal}
  <div class="modal-backdrop" onclick={() => showCreateModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Create Test Suite</h2>
        <button class="close-btn" onclick={() => showCreateModal = false}>&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="suite-name">Suite Name</label>
          <input
            id="suite-name"
            type="text"
            bind:value={newSuite.name}
            placeholder="e.g., Smoke Tests, Auth Flow"
          />
        </div>

        <div class="form-group">
          <label for="suite-desc">Description</label>
          <textarea
            id="suite-desc"
            bind:value={newSuite.description}
            placeholder="Describe what this suite tests..."
            rows="2"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Suite Type</label>
          <div class="type-options">
            <button
              class="type-option"
              class:active={newSuite.suite_type === 'static'}
              onclick={() => newSuite.suite_type = 'static'}
            >
              <strong>Static</strong>
              <span>Manually select specs</span>
            </button>
            <button
              class="type-option"
              class:active={newSuite.suite_type === 'dynamic'}
              onclick={() => newSuite.suite_type = 'dynamic'}
            >
              <strong>Dynamic</strong>
              <span>Auto-populate by filters</span>
            </button>
          </div>
        </div>

        {#if newSuite.suite_type === 'static'}
          <div class="form-group">
            <label>Select Tests ({newSuite.spec_ids.length} selected)</label>
            <div class="spec-selector">
              {#each specs as spec}
                <label class="spec-option">
                  <input
                    type="checkbox"
                    checked={newSuite.spec_ids.includes(spec.id)}
                    onchange={() => toggleSpecInSuite(spec.id)}
                  />
                  <span class="spec-name">{spec.name}</span>
                  <span class="spec-target">{spec.target_app}</span>
                </label>
              {/each}
            </div>
          </div>
        {:else}
          <div class="form-group">
            <label>Filter by Category</label>
            <select bind:value={newSuite.filter_category}>
              <option value={null}>All Categories</option>
              {#each qaState.categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={() => showCreateModal = false}>Cancel</button>
        <button class="btn-primary" onclick={saveSuite} disabled={!newSuite.name.trim()}>
          Create Suite
        </button>
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .suite-list {
    @apply p-4;
  }

  .list-header {
    @apply flex items-center justify-between mb-6;
  }

  .header-left {
    @apply flex items-center gap-3;
  }

  .header-left h2 {
    @apply text-lg font-semibold text-base06;
  }

  .count {
    @apply text-sm text-base04;
  }

  .btn-primary {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base0D text-white rounded-lg;
    @apply text-sm font-medium;
    @apply hover:bg-base0D/90 transition-colors;
  }

  .btn-secondary {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base02 text-base06 rounded-lg;
    @apply text-sm font-medium;
    @apply hover:bg-base03 transition-colors;
  }

  .suites-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .suite-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
    @apply hover:border-base03 transition-colors;
  }

  .suite-header {
    @apply flex items-start gap-3 mb-3;
  }

  .suite-icon {
    @apply w-10 h-10 rounded-lg bg-base0D/20 text-base0D;
    @apply flex items-center justify-center flex-shrink-0;
  }

  .suite-info {
    @apply flex-1 min-w-0;
  }

  .suite-info h3 {
    @apply text-base06 font-medium truncate;
  }

  .suite-type {
    @apply text-xs text-base04;
  }

  .suite-description {
    @apply text-sm text-base04 mb-3 line-clamp-2;
  }

  .suite-stats {
    @apply flex gap-4 py-3 border-t border-b border-base02 mb-3;
  }

  .stat {
    @apply flex flex-col;
  }

  .stat-value {
    @apply text-lg font-semibold text-base06;
  }

  .stat-label {
    @apply text-xs text-base04;
  }

  .suite-tags {
    @apply flex flex-wrap gap-1 mb-3;
  }

  .tag {
    @apply inline-flex items-center gap-1 px-2 py-0.5;
    @apply text-xs text-base04 bg-base02 rounded;
  }

  .suite-actions {
    @apply flex gap-2;
  }

  .action-btn {
    @apply flex items-center gap-1.5 px-3 py-1.5 rounded;
    @apply text-sm text-base04 bg-base02;
    @apply hover:bg-base03 hover:text-base06 transition-colors;
  }

  .action-btn.run {
    @apply bg-base0B/20 text-base0B hover:bg-base0B/30;
  }

  .last-run {
    @apply flex items-center gap-1.5 mt-3 pt-3 border-t border-base02;
    @apply text-xs text-base04;
  }

  .empty-state {
    @apply col-span-full flex flex-col items-center justify-center py-16;
    @apply text-base04;
  }

  .empty-state h3 {
    @apply text-lg font-medium text-base06 mt-4 mb-2;
  }

  .empty-state p {
    @apply text-sm mb-4;
  }

  /* Modal */
  .modal-backdrop {
    @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
  }

  .modal {
    @apply bg-base01 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden;
  }

  .modal-header {
    @apply flex items-center justify-between p-4 border-b border-base02;
  }

  .modal-header h2 {
    @apply text-lg font-semibold text-base06;
  }

  .close-btn {
    @apply text-2xl text-base04 hover:text-base06 leading-none;
  }

  .modal-body {
    @apply p-4 space-y-4 overflow-y-auto max-h-[60vh];
  }

  .modal-footer {
    @apply flex justify-end gap-2 p-4 border-t border-base02;
  }

  .form-group {
    @apply flex flex-col gap-1.5;
  }

  .form-group label {
    @apply text-sm font-medium text-base05;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    @apply w-full px-3 py-2 bg-base00 border border-base02 rounded;
    @apply text-base05 placeholder-base04;
    @apply focus:border-base0D focus:outline-none;
  }

  .type-options {
    @apply flex gap-2;
  }

  .type-option {
    @apply flex-1 p-3 rounded border border-base02 text-left;
    @apply hover:border-base03 transition-colors;
  }

  .type-option.active {
    @apply border-base0D bg-base0D/10;
  }

  .type-option strong {
    @apply block text-base06 text-sm;
  }

  .type-option span {
    @apply text-xs text-base04;
  }

  .spec-selector {
    @apply max-h-48 overflow-y-auto bg-base00 border border-base02 rounded p-2;
  }

  .spec-option {
    @apply flex items-center gap-2 p-2 rounded cursor-pointer;
    @apply hover:bg-base02;
  }

  .spec-name {
    @apply flex-1 text-sm text-base05 truncate;
  }

  .spec-target {
    @apply text-xs text-base04;
  }
</style>
