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
  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
  <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
  <path d="M3 12A9 3 0 0 0 21 12"></path>
</svg>
