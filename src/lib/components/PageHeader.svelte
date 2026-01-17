<script>
  let {title, subtitle = '', actions} = $props();
</script>

<header class="page-header">
  <div class="header-content">
    <h1 class="page-title">{title}</h1>
    {#if subtitle}
      <p class="page-subtitle">{subtitle}</p>
    {/if}
  </div>
  {#if actions}
    <div class="header-actions">
      {@render actions()}
    </div>
  {/if}
</header>

<style lang="postcss">
  @reference '$theme';

  .page-header {
    @apply flex items-start justify-between gap-4;
    @apply mb-6;
  }

  .header-content {
    @apply flex-1;
  }

  .page-title {
    @apply text-2xl font-semibold text-base06;
    @apply m-0;
  }

  .page-subtitle {
    @apply text-sm text-base04;
    @apply mt-1;
  }

  .header-actions {
    @apply flex items-center gap-3;
  }
</style>
