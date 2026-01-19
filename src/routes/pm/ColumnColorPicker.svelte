<script>
  import {getContext} from 'svelte';
  import {X} from '@lucide/svelte';

  let {column} = $props();
  const pmState = getContext('pmState');

  // With null safety for SSR
  const colors = pmState?.getAvailableColors?.() ?? [];

  function selectColor(colorValue) {
    pmState?.selectColor?.(column.id, colorValue);
  }
</script>

<div class="color-picker">
  <div class="picker-header">
    <span>Choose Color</span>
    <button class="close-btn" onclick={() => pmState?.toggleColorPicker?.(null)}>
      <X size={14} />
    </button>
  </div>
  <div class="color-grid">
    {#each colors as color}
      <button
        class="color-option color-{color.value}"
        class:selected={column.color === color.value}
        onclick={() => selectColor(color.value)}
        title={color.label}
      >
        <span class="color-swatch"></span>
        <span class="color-label">{color.label}</span>
      </button>
    {/each}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .color-picker {
    @apply absolute top-full left-0 mt-2 z-50;
    @apply bg-base01 border border-border rounded-lg;
    @apply shadow-lg p-2;
    @apply w-48;
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

  .color-grid {
    @apply flex flex-col gap-0.5;
  }

  .color-option {
    @apply flex items-center gap-2 px-2 py-1.5 rounded;
    @apply hover:bg-base02;
    @apply transition-colors;
  }

  .color-option.selected {
    @apply bg-base02;
  }

  .color-swatch {
    @apply w-4 h-4 rounded-full;
  }

  .color-label {
    @apply text-xs text-base05;
  }

  /* Color swatch variants */
  .color-base05 .color-swatch { @apply bg-base05; }
  .color-base08 .color-swatch { @apply bg-base08; }
  .color-base09 .color-swatch { @apply bg-base09; }
  .color-base0A .color-swatch { @apply bg-base0A; }
  .color-base0B .color-swatch { @apply bg-base0B; }
  .color-base0C .color-swatch { @apply bg-base0C; }
  .color-base0D .color-swatch { @apply bg-base0D; }
  .color-base0E .color-swatch { @apply bg-base0E; }
  .color-base0F .color-swatch { @apply bg-base0F; }
</style>
