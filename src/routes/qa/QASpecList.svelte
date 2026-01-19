<script>
  import {getContext, onDestroy} from 'svelte';
  import {Badge} from '@miozu/jera';

  const qaState = getContext('qaState');

  let filteredSpecs = $derived(qaState.getFilteredSpecs());
  let filters = $derived(qaState.filters);
  let searchValue = $state(filters.search || '');

  const targetApps = qaState.targetApps;
  const categories = qaState.categories;

  // Status badge variants
  const statusVariants = {
    draft: 'default',
    active: 'success',
    disabled: 'warning',
    archived: 'error'
  };

  // Debounced search
  let searchTimeout;
  function handleSearch(e) {
    searchValue = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      qaState.setFilter('search', searchValue);
    }, 200);
  }

  // Cleanup on destroy to prevent memory leaks
  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
  });

  function formatDate(dateStr) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  function getLastResultStatus(spec) {
    // This would come from the spec's metadata or a join
    // For now, we'll derive from flaky_score
    if (spec.consecutive_fails > 0) return 'failed';
    if (spec.flaky_score > 20) return 'flaky';
    return 'passed';
  }

  const resultIcons = {
    passed: {color: 'text-base0B', icon: 'check'},
    failed: {color: 'text-base08', icon: 'x'},
    flaky: {color: 'text-base0A', icon: 'alert-triangle'}
  };
</script>

<div class="spec-list-container">
  <!-- Filters Bar -->
  <div class="filters-bar">
    <div class="search-box">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        placeholder="Search specs..."
        value={searchValue}
        oninput={handleSearch}
      />
    </div>

    <select
      class="filter-select"
      value={filters.targetApp || ''}
      onchange={(e) => qaState.setFilter('targetApp', e.target.value || null)}
    >
      <option value="">All Apps</option>
      {#each targetApps as app}
        <option value={app}>{app}</option>
      {/each}
    </select>

    <select
      class="filter-select"
      value={filters.category || ''}
      onchange={(e) => qaState.setFilter('category', e.target.value || null)}
    >
      <option value="">All Categories</option>
      {#each categories as cat}
        <option value={cat.id}>{cat.name}</option>
      {/each}
    </select>

    <select
      class="filter-select"
      value={filters.status || ''}
      onchange={(e) => qaState.setFilter('status', e.target.value || null)}
    >
      <option value="">All Status</option>
      <option value="draft">Draft</option>
      <option value="active">Active</option>
      <option value="disabled">Disabled</option>
    </select>

    <label class="push-filter">
      <input
        type="checkbox"
        checked={filters.pushEnabled || false}
        onchange={(e) => qaState.setFilter('pushEnabled', e.target.checked || null)}
      />
      <span>Push-Enabled Only</span>
    </label>

    {#if filters.search || filters.targetApp || filters.category || filters.status || filters.pushEnabled}
      <button class="clear-filters" onclick={() => qaState.clearFilters()}>
        Clear filters
      </button>
    {/if}
  </div>

  <!-- Specs Grid -->
  <div class="specs-grid">
    {#each filteredSpecs as spec (spec.id)}
      {@const lastResult = getLastResultStatus(spec)}
      {@const resultStyle = resultIcons[lastResult]}
      <button class="spec-card" onclick={() => qaState.selectSpec(spec)}>
        <div class="spec-header">
          <div class="spec-title-row">
            <span class="spec-number">#{spec.spec_number}</span>
            <h3 class="spec-name">{spec.name}</h3>
          </div>
          <Badge variant={statusVariants[spec.status]} size="sm">{spec.status}</Badge>
        </div>

        <p class="spec-nl">{spec.nl_spec}</p>

        <div class="spec-meta">
          <span class="spec-target">{spec.target_app}</span>
          {#if spec.category}
            <span class="spec-category">{spec.category}</span>
          {/if}
          {#if spec.run_on_push}
            <span class="spec-push" title="Runs on git push to: {spec.trigger_on_repos?.join(', ') || 'configured repos'}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <line x1="3" x2="9" y1="12" y2="12" />
                <line x1="15" x2="21" y1="12" y2="12" />
              </svg>
              Push
            </span>
          {/if}
        </div>

        <div class="spec-footer">
          <div class="spec-result {resultStyle.color}">
            {#if lastResult === 'passed'}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            {:else if lastResult === 'failed'}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            {/if}
            <span>{lastResult}</span>
          </div>

          <div class="spec-stats">
            {#if spec.heal_count > 0}
              <span class="heal-badge" title="Auto-healed {spec.heal_count} times">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                {spec.heal_count}
              </span>
            {/if}
            <span class="last-run">Last: {formatDate(spec.last_run_at)}</span>
          </div>
        </div>

        {#if spec.tags?.length > 0}
          <div class="spec-tags">
            {#each spec.tags.slice(0, 3) as tag}
              <span class="tag">{tag}</span>
            {/each}
            {#if spec.tags.length > 3}
              <span class="tag-more">+{spec.tags.length - 3}</span>
            {/if}
          </div>
        {/if}
      </button>
    {:else}
      <div class="empty-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m9 15 2 2 4-4" />
        </svg>
        <h3>No test specs found</h3>
        <p>Create your first test spec using natural language</p>
        <button class="btn-primary" onclick={() => qaState.openNLCreator()}>
          Create Spec
        </button>
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .spec-list-container {
    @apply flex flex-col gap-4;
  }

  /* Filters Bar */
  .filters-bar {
    @apply flex flex-wrap items-center gap-3 p-4;
    @apply bg-base01 rounded-xl border border-base02;
  }

  .search-box {
    @apply flex items-center gap-2 flex-1 min-w-[200px];
    @apply px-3 py-2 bg-base02 rounded-lg;
  }

  .search-box svg {
    @apply text-base04;
  }

  .search-box input {
    @apply flex-1 bg-transparent border-none outline-none;
    @apply text-sm text-base06 placeholder:text-base04;
  }

  .filter-select {
    @apply px-3 py-2 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06;
    @apply focus:outline-none focus:ring-2 focus:ring-base0D/50;
  }

  .push-filter {
    @apply flex items-center gap-2 px-3 py-2 text-sm text-base05;
    @apply cursor-pointer hover:text-base06 transition-colors;
  }

  .push-filter input {
    @apply w-4 h-4 accent-base0E rounded;
  }

  .clear-filters {
    @apply px-3 py-2 text-sm text-base08 hover:text-base08/80;
    @apply transition-colors;
  }

  /* Specs Grid */
  .specs-grid {
    @apply grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4;
  }

  .spec-card {
    @apply w-full text-left p-4 bg-base01 rounded-xl border border-base02;
    @apply hover:border-base03 hover:bg-base01/80;
    @apply transition-all duration-150 cursor-pointer;
  }

  .spec-header {
    @apply flex justify-between items-start mb-2;
  }

  .spec-title-row {
    @apply flex items-center gap-2;
  }

  .spec-number {
    @apply text-xs text-base04 font-mono;
  }

  .spec-name {
    @apply text-base font-medium text-base06 truncate;
  }

  .spec-nl {
    @apply text-sm text-base04 line-clamp-2 mb-3;
  }

  .spec-meta {
    @apply flex items-center gap-2 mb-3;
  }

  .spec-target {
    @apply text-xs px-2 py-0.5 bg-base02 rounded text-base05;
  }

  .spec-category {
    @apply text-xs px-2 py-0.5 bg-base0D/20 text-base0D rounded;
  }

  .spec-push {
    @apply flex items-center gap-1 text-xs px-2 py-0.5;
    @apply bg-base0E/20 text-base0E rounded;
  }

  .spec-footer {
    @apply flex justify-between items-center;
  }

  .spec-result {
    @apply flex items-center gap-1 text-xs font-medium;
  }

  .spec-stats {
    @apply flex items-center gap-3 text-xs text-base04;
  }

  .heal-badge {
    @apply flex items-center gap-1 text-base0E;
  }

  .last-run {
    @apply text-base04;
  }

  .spec-tags {
    @apply flex flex-wrap gap-1 mt-3 pt-3 border-t border-base02;
  }

  .tag {
    @apply text-xs px-2 py-0.5 bg-base02 text-base05 rounded;
  }

  .tag-more {
    @apply text-xs px-2 py-0.5 text-base04;
  }

  /* Empty State */
  .empty-state {
    @apply col-span-full flex flex-col items-center justify-center py-16 text-base04;
  }

  .empty-state svg {
    @apply mb-4 opacity-50;
  }

  .empty-state h3 {
    @apply text-lg font-medium text-base05 mb-1;
  }

  .empty-state p {
    @apply text-sm mb-4;
  }

  .btn-primary {
    @apply px-4 py-2 bg-base0D text-white rounded-lg;
    @apply text-sm font-medium hover:bg-base0D/90;
    @apply transition-colors;
  }
</style>
