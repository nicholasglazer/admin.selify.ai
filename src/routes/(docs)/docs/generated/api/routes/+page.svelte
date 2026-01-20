<script>
  import {Clock, RefreshCw, AlertCircle} from '@lucide/svelte';

  let {data} = $props();

  const workflowCmd = `temporal workflow start --type DocumentationWorkflow --input '{"generators": ["routes"]}'`;
</script>

<svelte:head>
  <title>{data.title} - Selify Docs</title>
  <meta name="description" content={data.description} />
</svelte:head>

<article class="doc-article">
  {#if data.notGenerated}
    <div class="not-generated">
      <AlertCircle size={48} />
      <h1>Routes Not Generated</h1>
      <p>Run the DocumentationWorkflow to generate routes documentation.</p>
      <code>{workflowCmd}</code>
    </div>
  {:else}
    <header class="doc-header">
      <div class="meta">
        {#if data.generatedAt}
          <span class="meta-item">
            <Clock size={14} />
            Generated: {new Date(data.generatedAt).toLocaleString()}
          </span>
        {/if}
        {#if data.generator}
          <span class="meta-item">
            <RefreshCw size={14} />
            {data.generator}
          </span>
        {/if}
      </div>
      {#if data.tags?.length}
        <div class="tags">
          {#each data.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </header>

    <div class="doc-content">
      {@html data.html}
    </div>
  {/if}
</article>

<style lang="postcss">
  @reference '$theme';

  .doc-article {
    @apply py-4;
  }

  .doc-header {
    @apply mb-8 pb-4 border-b border-base02;
  }

  .meta {
    @apply flex items-center gap-4 text-sm text-base04 mb-3;
  }

  .meta-item {
    @apply flex items-center gap-1.5;
  }

  .tags {
    @apply flex gap-2;
  }

  .tag {
    @apply text-xs px-2 py-0.5 rounded bg-base02 text-base04;
  }

  .not-generated {
    @apply text-center py-16;
  }

  .not-generated :global(svg) {
    @apply mx-auto text-base04 mb-4;
  }

  .not-generated h1 {
    @apply text-xl font-medium text-base05 mb-2;
  }

  .not-generated p {
    @apply text-base04 mb-4;
  }

  .not-generated code {
    @apply block bg-base01 p-3 rounded text-sm text-base0E font-mono mx-auto max-w-2xl;
  }
</style>
