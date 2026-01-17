<script>
  /**
   * Webmail Layout
   *
   * Provides the outer shell with account switcher and keyboard navigation.
   * Contains the 3-pane layout: sidebar | thread list | message view
   */
  import {page} from '$app/stores';

  let {data, children} = $props();
</script>

<div class="webmail-layout">
  {@render children()}
</div>

<style lang="postcss">
  @reference '$theme';

  .webmail-layout {
    @apply flex flex-col h-[calc(100vh-64px)];
    @apply bg-base00 overflow-hidden;
  }
</style>
