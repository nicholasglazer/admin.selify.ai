<script>
  let {size = 20, color = 'currentColor', strokeWidth = 2, class: className = ''} = $props();
</script>

<svg
  class={className}
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line
    x1="14"
    x2="21"
    y1="10"
    y2="3"
  /><line x1="3" x2="10" y1="21" y2="14" />
</svg>
