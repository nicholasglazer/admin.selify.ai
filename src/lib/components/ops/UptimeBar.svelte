<script>
  /**
   * UptimeBar - Horizontal status bar showing uptime over time
   *
   * Similar to GitHub/Stripe status pages. Shows a series of bars
   * representing health status over time buckets.
   *
   * @prop {Array} data - Array of { bucket, status, uptime_percent }
   * @prop {number} buckets - Number of buckets to display (default: 90)
   * @prop {number} height - Height of the bar in pixels (default: 32)
   */

  let {data = [], buckets = 90, height = 32, showTooltip = true, class: className = ''} = $props();

  import {formatDistanceToNow} from 'date-fns';

  // Status colors
  const statusColors = {
    healthy: 'var(--color-base0B)', // Green
    degraded: 'var(--color-base09)', // Orange
    unhealthy: 'var(--color-base08)', // Red
    unknown: 'var(--color-base03)' // Gray
  };

  // Fill empty buckets and normalize data
  let normalizedData = $derived(() => {
    if (!data || data.length === 0) {
      // Show empty bars
      return Array(buckets).fill({status: 'unknown', uptime_percent: null});
    }

    // Sort by bucket time (oldest first)
    const sorted = [...data].sort((a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime());

    // Take last N buckets
    return sorted.slice(-buckets);
  });

  // Calculate overall uptime
  let overallUptime = $derived(() => {
    if (!data || data.length === 0) return null;

    const validBuckets = data.filter((d) => d.uptime_percent !== null);
    if (validBuckets.length === 0) return null;

    const sum = validBuckets.reduce((acc, d) => acc + (d.uptime_percent || 0), 0);
    return (sum / validBuckets.length).toFixed(2);
  });

  // Tooltip state
  let hoveredIndex = $state(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  function handleMouseEnter(e, index) {
    if (!showTooltip) return;
    hoveredIndex = index;
    const rect = e.target.getBoundingClientRect();
    tooltipX = rect.left + rect.width / 2;
    tooltipY = rect.top;
  }

  function handleMouseLeave() {
    hoveredIndex = null;
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'healthy':
        return 'Operational';
      case 'degraded':
        return 'Degraded';
      case 'unhealthy':
        return 'Outage';
      default:
        return 'No data';
    }
  }
</script>

<div class="uptime-bar-container {className}">
  <div class="uptime-header">
    {#if overallUptime() !== null}
      <span class="uptime-label">
        {overallUptime()}% uptime
      </span>
    {/if}
  </div>

  <div class="uptime-bar" style="height: {height}px;" role="img" aria-label="Uptime status over time">
    {#each normalizedData() as bucket, i}
      <div
        class="bar-segment"
        style="background-color: {statusColors[bucket.status] || statusColors.unknown};"
        onmouseenter={(e) => handleMouseEnter(e, i)}
        onmouseleave={handleMouseLeave}
        role="presentation"
      ></div>
    {/each}
  </div>

  <div class="uptime-footer">
    <span class="time-label">{buckets} days ago</span>
    <span class="time-label">Today</span>
  </div>

  {#if showTooltip && hoveredIndex !== null}
    {@const bucket = normalizedData()[hoveredIndex]}
    <div class="tooltip" style="left: {tooltipX}px; top: {tooltipY}px;">
      <div class="tooltip-status">
        <span class="status-dot" style="background-color: {statusColors[bucket.status]};"></span>
        {getStatusLabel(bucket.status)}
      </div>
      {#if bucket.bucket}
        <div class="tooltip-time">
          {formatDistanceToNow(new Date(bucket.bucket), {addSuffix: true})}
        </div>
      {/if}
      {#if bucket.uptime_percent !== null}
        <div class="tooltip-uptime">
          {bucket.uptime_percent}% uptime
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference '$theme';

  .uptime-bar-container {
    @apply relative w-full;
  }

  .uptime-header {
    @apply flex justify-end mb-2;
  }

  .uptime-label {
    @apply text-sm font-medium text-base0B;
  }

  .uptime-bar {
    @apply flex gap-0.5 rounded-lg overflow-hidden bg-base02;
  }

  .bar-segment {
    @apply flex-1 min-w-0 transition-opacity duration-150;
    @apply rounded-sm;
  }

  .bar-segment:hover {
    @apply opacity-80;
  }

  .uptime-footer {
    @apply flex justify-between mt-2;
  }

  .time-label {
    @apply text-xs text-base04;
  }

  .tooltip {
    @apply fixed z-50 transform -translate-x-1/2 -translate-y-full;
    @apply bg-base01 border border-border rounded-lg shadow-lg;
    @apply px-3 py-2 mb-2;
    @apply text-sm;
    pointer-events: none;
  }

  .tooltip-status {
    @apply flex items-center gap-2 font-medium text-base06;
  }

  .status-dot {
    @apply w-2 h-2 rounded-full;
  }

  .tooltip-time {
    @apply text-xs text-base04 mt-1;
  }

  .tooltip-uptime {
    @apply text-xs text-base05 mt-0.5;
  }
</style>
