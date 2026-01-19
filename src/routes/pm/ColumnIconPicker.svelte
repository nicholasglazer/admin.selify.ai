<script>
  import {getContext} from 'svelte';
  import {X} from '@lucide/svelte';

  let {column} = $props();
  const pmState = getContext('pmState');

  // With null safety for SSR
  const icons = pmState?.getAvailableIcons?.() ?? [];

  function selectIcon(iconName) {
    pmState?.selectIcon?.(column.id, iconName);
  }
</script>

<div class="icon-picker">
  <div class="picker-header">
    <span>Choose Icon</span>
    <button class="close-btn" onclick={() => pmState?.toggleIconPicker?.(null)}>
      <X size={14} />
    </button>
  </div>
  <div class="icon-grid">
    {#each icons as icon}
      <button
        class="icon-option"
        class:selected={column.icon === icon.name}
        onclick={() => selectIcon(icon.name)}
        title={icon.label}
      >
        <span class="icon-text">{icon.name}</span>
      </button>
    {/each}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .icon-picker {
    @apply absolute top-full left-0 mt-2 z-50;
    @apply bg-base01 border border-border rounded-lg;
    @apply shadow-lg p-2;
    @apply w-64;
  }

  .picker-header {
    @apply flex items-center justify-between mb-2 px-1;
    @apply text-xs font-medium text-base04;
  }

  .close-btn {
    @apply p-0.5 rounded;
    @apply text-base04 hover:text-base05 hover:bg-base02;
    @apply transition-colors;
  }

  .icon-grid {
    @apply grid grid-cols-7 gap-1;
  }

  .icon-option {
    @apply p-1.5 rounded;
    @apply text-base05 hover:text-base06;
    @apply hover:bg-base02;
    @apply transition-colors;
    @apply text-xs truncate;
  }

  .icon-option.selected {
    @apply bg-base0D/15 text-base0D;
  }

  .icon-text {
    @apply text-[10px];
  }
</style>
