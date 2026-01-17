<script>
  let {
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    disabled = false,
    required = false,
    id = undefined,
    name = undefined,
    class: className = '',
    ...rest
  } = $props();
</script>

<input
  class="input {className}"
  bind:value
  {type}
  {placeholder}
  {disabled}
  {required}
  {id}
  {name}
  {...rest}
/>

<style lang="postcss">
  @reference '$theme';

  .input {
    @apply w-full;
    @apply px-3 py-2;
    @apply text-sm text-base06;
    @apply placeholder:text-base04;
    @apply bg-base00 border border-border rounded-lg;
    @apply transition-all duration-150;
    @apply focus:outline-none focus:border-base0D focus:ring-1 focus:ring-base0D/30;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
</style>
