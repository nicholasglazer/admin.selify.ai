<script>
  import {Clock, RefreshCw, AlertCircle, Database, ChevronRight, Search, X, Users, Shield, Filter} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  let {data} = $props();

  const workflowCmd = `temporal workflow start --type DocumentationWorkflow --input '{"generators": ["schema"]}'`;

  // Extract table names and classifications from HTML for TOC
  // The HTML contains blockquotes with classification info after each h2
  let tableNames = $derived.by(() => {
    if (!data.html) return [];
    const matches = data.html.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>\s*<blockquote>\s*<p><strong>Usage:<\/strong>\s*<code>([^<]+)<\/code>\s*·\s*<strong>Audience:<\/strong>\s*<code>([^<]+)<\/code>\s*·\s*<strong>Domain:<\/strong>\s*<code>([^<]+)<\/code>/g);
    return Array.from(matches).map(m => ({
      id: m[1],
      name: m[2],
      usage: m[3],
      audience: m[4],
      domain: m[5]
    }));
  });

  // Search functionality for TOC
  let searchQuery = $state('');

  // Audience filter
  let audienceFilter = $state('all'); // all, external, internal

  // Usage filter
  let usageFilter = $state('all'); // all, frontend, backend, both

  // Filtered tables based on search and filters
  let filteredTables = $derived.by(() => {
    let result = tableNames;

    // Apply search filter
    if (searchQuery) {
      result = result.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply audience filter
    if (audienceFilter !== 'all') {
      result = result.filter(t => t.audience === audienceFilter);
    }

    // Apply usage filter
    if (usageFilter !== 'all') {
      result = result.filter(t => t.usage === usageFilter);
    }

    return result;
  });

  // Stats
  let stats = $derived({
    total: tableNames.length,
    external: tableNames.filter(t => t.audience === 'external').length,
    internal: tableNames.filter(t => t.audience === 'internal').length,
    frontend: tableNames.filter(t => t.usage === 'frontend').length,
    backend: tableNames.filter(t => t.usage === 'backend').length
  });

  // Active section tracking
  let activeSection = $state('');

  function scrollToTable(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
      activeSection = id;
    }
  }

  function clearSearch() {
    searchQuery = '';
  }

  function resetFilters() {
    audienceFilter = 'all';
    usageFilter = 'all';
    searchQuery = '';
  }

  function getAudienceBadge(audience) {
    return audience === 'external' ? 'success' : 'warning';
  }
</script>

<svelte:head>
  <title>{data.title} - Selify Docs</title>
  <meta name="description" content={data.description} />
</svelte:head>

<div class="schema-page">
  {#if data.notGenerated}
    <div class="not-generated">
      <AlertCircle size={48} />
      <h1>Schema Not Generated</h1>
      <p>Run the DocumentationWorkflow to generate schema documentation.</p>
      <code>{workflowCmd}</code>
    </div>
  {:else}
    <!-- Left: Table of Contents -->
    <aside class="toc-sidebar">
      <div class="toc-header">
        <Database size={16} />
        <span class="toc-title">Tables</span>
        <Badge variant="secondary" size="sm">{filteredTables.length}/{tableNames.length}</Badge>
      </div>

      <div class="toc-search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Filter tables..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="clear-btn" onclick={clearSearch}>
            <X size={12} />
          </button>
        {/if}
      </div>

      <!-- Audience Filter -->
      <div class="filter-section">
        <div class="filter-label">
          <Users size={12} />
          Audience
        </div>
        <div class="filter-buttons">
          <button
            class="filter-btn"
            class:active={audienceFilter === 'all'}
            onclick={() => audienceFilter = 'all'}
          >
            All
          </button>
          <button
            class="filter-btn external"
            class:active={audienceFilter === 'external'}
            onclick={() => audienceFilter = 'external'}
          >
            External ({stats.external})
          </button>
          <button
            class="filter-btn internal"
            class:active={audienceFilter === 'internal'}
            onclick={() => audienceFilter = 'internal'}
          >
            Internal ({stats.internal})
          </button>
        </div>
      </div>

      <!-- Usage Filter -->
      <div class="filter-section">
        <div class="filter-label">
          <Shield size={12} />
          Usage
        </div>
        <div class="filter-buttons">
          <button
            class="filter-btn"
            class:active={usageFilter === 'all'}
            onclick={() => usageFilter = 'all'}
          >
            All
          </button>
          <button
            class="filter-btn"
            class:active={usageFilter === 'frontend'}
            onclick={() => usageFilter = 'frontend'}
          >
            Frontend
          </button>
          <button
            class="filter-btn"
            class:active={usageFilter === 'backend'}
            onclick={() => usageFilter = 'backend'}
          >
            Backend
          </button>
        </div>
      </div>

      {#if audienceFilter !== 'all' || usageFilter !== 'all' || searchQuery}
        <button class="reset-filters" onclick={resetFilters}>
          <X size={12} />
          Reset filters
        </button>
      {/if}

      <nav class="toc-list">
        {#each filteredTables as table (table.id)}
          <button
            class="toc-item"
            class:active={activeSection === table.id}
            onclick={() => scrollToTable(table.id)}
          >
            <ChevronRight size={12} />
            <span class="table-name">{table.name}</span>
            <span class="table-badge {table.audience}">
              {table.audience === 'external' ? 'E' : 'I'}
            </span>
          </button>
        {/each}
        {#if filteredTables.length === 0}
          <p class="no-results">No tables match filters</p>
        {/if}
      </nav>
    </aside>

    <!-- Right: Main Content -->
    <div class="content-area">
      <header class="doc-header">
        <div class="header-top">
          <h1 class="doc-title">{data.title}</h1>
          <div class="header-meta">
            {#if data.generatedAt}
              <span class="meta-item">
                <Clock size={14} />
                {new Date(data.generatedAt).toLocaleDateString()}
              </span>
            {/if}
            {#if data.generator}
              <span class="meta-item">
                <RefreshCw size={14} />
                {data.generator}
              </span>
            {/if}
          </div>
        </div>
        {#if data.tags?.length}
          <div class="header-tags">
            {#each data.tags as tag}
              <Badge variant="secondary" size="sm">{tag}</Badge>
            {/each}
          </div>
        {/if}
      </header>

      <div class="doc-content">
        {@html data.html}
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .schema-page {
    @apply flex h-full overflow-hidden;
  }

  /* TOC Sidebar */
  .toc-sidebar {
    @apply w-64 flex-shrink-0 flex flex-col;
    @apply bg-base01 border-r border-base02;
    @apply overflow-hidden;
  }

  .toc-header {
    @apply flex items-center gap-2 p-4;
    @apply border-b border-base02;
    @apply text-base05;
  }

  .toc-title {
    @apply text-sm font-medium flex-1;
  }

  .toc-search {
    @apply flex items-center gap-2 p-3 mx-3 my-2;
    @apply bg-base00 border border-base02 rounded-lg;
    @apply text-base04;
  }

  .toc-search input {
    @apply flex-1 bg-transparent border-none outline-none;
    @apply text-sm text-base05;
    @apply placeholder:text-base04;
  }

  .clear-btn {
    @apply p-0.5 rounded hover:bg-base02;
    @apply text-base04 hover:text-base06;
    @apply transition-colors;
  }

  /* Filter Sections */
  .filter-section {
    @apply px-3 py-2 border-b border-base02;
  }

  .filter-label {
    @apply flex items-center gap-1.5 text-xs text-base04 mb-2;
  }

  .filter-buttons {
    @apply flex gap-1 flex-wrap;
  }

  .filter-btn {
    @apply px-2 py-1 rounded text-xs text-base04;
    @apply bg-base00 border border-base02;
    @apply hover:border-base04 transition-colors;
  }

  .filter-btn.active {
    @apply bg-base0D/20 border-base0D text-base0D;
  }

  .filter-btn.external.active {
    @apply bg-base0B/20 border-base0B text-base0B;
  }

  .filter-btn.internal.active {
    @apply bg-base0A/20 border-base0A text-base0A;
  }

  .reset-filters {
    @apply flex items-center gap-1.5 mx-3 my-2 px-2 py-1 rounded;
    @apply text-xs text-base08 bg-base08/10;
    @apply hover:bg-base08/20 transition-colors;
  }

  .toc-list {
    @apply flex-1 overflow-y-auto px-3 py-2;
  }

  .toc-item {
    @apply flex items-center gap-1.5 w-full px-2 py-1.5 rounded;
    @apply text-xs text-base04 text-left;
    @apply hover:bg-base02 hover:text-base06;
    @apply transition-colors;
  }

  .toc-item.active {
    @apply bg-base0D/15 text-base0D;
  }

  .table-name {
    @apply flex-1 truncate;
  }

  .table-badge {
    @apply w-4 h-4 rounded text-[10px] font-medium flex items-center justify-center flex-shrink-0;
  }

  .table-badge.external {
    @apply bg-base0B/20 text-base0B;
  }

  .table-badge.internal {
    @apply bg-base0A/20 text-base0A;
  }

  .no-results {
    @apply text-xs text-base04 text-center py-4;
  }

  /* Content Area */
  .content-area {
    @apply flex-1 flex flex-col overflow-hidden;
  }

  .doc-header {
    @apply p-6 border-b border-base02;
    @apply flex-shrink-0;
  }

  .header-top {
    @apply flex items-start justify-between gap-4;
  }

  .doc-title {
    @apply text-2xl font-bold text-base07 m-0;
  }

  .header-meta {
    @apply flex items-center gap-4 text-sm text-base04;
  }

  .meta-item {
    @apply flex items-center gap-1.5;
  }

  .header-tags {
    @apply flex gap-2 mt-3;
  }

  .doc-content {
    @apply flex-1 overflow-y-auto p-6;
  }

  /* Markdown Content Styling */
  .doc-content :global(h1) {
    @apply text-2xl font-bold text-base07 mb-6;
  }

  .doc-content :global(h2) {
    @apply text-xl font-semibold text-base06 mt-12 mb-4 pb-2;
    @apply border-b border-base02;
    scroll-margin-top: 1rem;
  }

  .doc-content :global(h3) {
    @apply text-lg font-medium text-base05 mt-6 mb-3;
  }

  .doc-content :global(p) {
    @apply text-base05 leading-relaxed mb-4;
  }

  .doc-content :global(blockquote) {
    @apply border-l-4 border-base0D pl-4 text-base04 my-4;
    @apply bg-base01 py-2 pr-4 rounded-r;
  }

  .doc-content :global(ul),
  .doc-content :global(ol) {
    @apply mb-4 pl-6;
  }

  .doc-content :global(li) {
    @apply text-base05 mb-2;
  }

  .doc-content :global(ul li) {
    @apply list-disc;
  }

  .doc-content :global(ol li) {
    @apply list-decimal;
  }

  .doc-content :global(code) {
    @apply bg-base01 px-1.5 py-0.5 rounded text-base0E text-sm font-mono;
  }

  .doc-content :global(pre) {
    @apply bg-base01 p-4 rounded-lg overflow-x-auto mb-4;
    @apply border border-base02;
  }

  .doc-content :global(pre code) {
    @apply bg-transparent p-0;
  }

  .doc-content :global(table) {
    @apply w-full mb-6 text-sm;
    @apply border border-base02 rounded-lg overflow-hidden;
  }

  .doc-content :global(th),
  .doc-content :global(td) {
    @apply border-b border-base02 px-4 py-2 text-left;
  }

  .doc-content :global(th) {
    @apply bg-base01 text-base05 font-medium;
  }

  .doc-content :global(td) {
    @apply text-base04;
  }

  .doc-content :global(tr:last-child td) {
    @apply border-b-0;
  }

  .doc-content :global(td code) {
    @apply text-xs;
  }

  /* Not Generated State */
  .not-generated {
    @apply flex-1 flex flex-col items-center justify-center text-center p-8;
  }

  .not-generated :global(svg) {
    @apply text-base04 mb-4;
  }

  .not-generated h1 {
    @apply text-xl font-medium text-base05 mb-2;
  }

  .not-generated p {
    @apply text-base04 mb-4;
  }

  .not-generated code {
    @apply block bg-base01 p-3 rounded text-sm text-base0E font-mono max-w-2xl;
  }
</style>
