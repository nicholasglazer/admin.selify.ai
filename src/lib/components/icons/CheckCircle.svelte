<script>
  let {
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    class: className = '',
    ...restProps
  } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  {...restProps}
>
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
  <polyline points="22,4 12,14.01 9,11.01" />
</svg>
