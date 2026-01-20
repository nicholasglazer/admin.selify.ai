<script>
  import '../../app.css';
  import {DocsNav} from '$lib/components/docs';

  let {children} = $props();
</script>

<div class="docs-layout">
  <DocsNav />

  <main class="docs-content">
    {@render children()}
  </main>
</div>

<style lang="postcss">
  @reference '$theme';

  .docs-layout {
    @apply flex min-h-screen bg-base00;
  }

  .docs-content {
    @apply flex-1 p-8 max-w-4xl mx-auto;
  }

  /* Markdown content styling */
  :global(.docs-content h1) {
    @apply text-3xl font-bold text-base07 mb-6;
  }

  :global(.docs-content h2) {
    @apply text-2xl font-semibold text-base06 mt-8 mb-4 pb-2 border-b border-base02;
  }

  :global(.docs-content h3) {
    @apply text-xl font-medium text-base05 mt-6 mb-3;
  }

  :global(.docs-content p) {
    @apply text-base05 leading-relaxed mb-4;
  }

  :global(.docs-content a) {
    @apply text-base0D hover:underline;
  }

  :global(.docs-content ul),
  :global(.docs-content ol) {
    @apply mb-4 pl-6;
  }

  :global(.docs-content li) {
    @apply text-base05 mb-2;
  }

  :global(.docs-content ul li) {
    @apply list-disc;
  }

  :global(.docs-content ol li) {
    @apply list-decimal;
  }

  :global(.docs-content code) {
    @apply bg-base01 px-1.5 py-0.5 rounded text-base0E text-sm font-mono;
  }

  :global(.docs-content pre) {
    @apply bg-base01 p-4 rounded-lg overflow-x-auto mb-4;
  }

  :global(.docs-content pre code) {
    @apply bg-transparent p-0;
  }

  :global(.docs-content blockquote) {
    @apply border-l-4 border-base0D pl-4 italic text-base04 my-4;
  }

  :global(.docs-content table) {
    @apply w-full mb-4 border-collapse;
  }

  :global(.docs-content th),
  :global(.docs-content td) {
    @apply border border-base02 px-3 py-2 text-left;
  }

  :global(.docs-content th) {
    @apply bg-base01 text-base06 font-medium;
  }

  :global(.docs-content td) {
    @apply text-base05;
  }
</style>
