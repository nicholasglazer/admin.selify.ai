<script>
  import '../../app.css';
  import {DocsNav} from '$lib/components/docs';

  let {children} = $props();
</script>

<div class="docs-layout">
  <DocsNav />
  <main class="docs-main">
    {@render children()}
  </main>
</div>

<style lang="postcss">
  @reference '$theme';

  .docs-layout {
    @apply flex bg-base00;
    /* Override parent padding - docs has its own layout */
    margin: -1.25rem;
    width: calc(100% + 2.5rem);
    height: calc(100vh - 0px);
  }

  .docs-main {
    @apply flex-1 flex flex-col overflow-hidden;
  }
</style>
