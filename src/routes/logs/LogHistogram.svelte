<script>
  import {onMount} from 'svelte';

  /** @type {{buckets: Array<{start: string, end: string, error: number, warn: number, info: number, debug: number, total: number}>, bucket_minutes: number, total_logs: number, total_errors: number, total_warnings: number}} */
  let {data = {buckets: [], bucket_minutes: 2, total_logs: 0, total_errors: 0, total_warnings: 0}, onBucketClick = null} = $props();

  // Calculate max value for scaling
  let maxValue = $derived(Math.max(...(data.buckets || []).map(b => b.total), 1));

  function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  function handleBarClick(bucket, index) {
    if (onBucketClick) {
      onBucketClick(bucket, index);
    }
  }
</script>

<div class="histogram-container">
  <div class="histogram-header">
    <div class="histogram-title">Log Volume</div>
    <div class="histogram-legend">
      <span class="legend-item error"><span class="dot"></span> Error</span>
      <span class="legend-item warn"><span class="dot"></span> Warn</span>
      <span class="legend-item info"><span class="dot"></span> Info</span>
    </div>
  </div>

  <div class="histogram-chart">
    {#if data.buckets && data.buckets.length > 0}
      <div class="bars-container">
        {#each data.buckets as bucket, i}
          {@const height = (bucket.total / maxValue) * 100}
          {@const errorHeight = (bucket.error / maxValue) * 100}
          {@const warnHeight = (bucket.warn / maxValue) * 100}
          {@const infoHeight = ((bucket.info + bucket.debug) / maxValue) * 100}
          <button
            class="bar-wrapper"
            class:has-errors={bucket.error > 0}
            onclick={() => handleBarClick(bucket, i)}
            title="{formatTime(bucket.start)} - {bucket.total} logs ({bucket.error} errors, {bucket.warn} warnings)"
          >
            <div class="bar-stack" style="height: {height}%">
              {#if bucket.error > 0}
                <div class="bar-segment error" style="height: {(bucket.error / bucket.total) * 100}%"></div>
              {/if}
              {#if bucket.warn > 0}
                <div class="bar-segment warn" style="height: {(bucket.warn / bucket.total) * 100}%"></div>
              {/if}
              {#if bucket.info + bucket.debug > 0}
                <div class="bar-segment info" style="height: {((bucket.info + bucket.debug) / bucket.total) * 100}%"></div>
              {/if}
            </div>
          </button>
        {/each}
      </div>

      <!-- Time axis -->
      <div class="time-axis">
        <span class="time-label">{formatTime(data.buckets[0]?.start)}</span>
        <span class="time-label">{formatTime(data.buckets[Math.floor(data.buckets.length / 2)]?.start)}</span>
        <span class="time-label">Now</span>
      </div>
    {:else}
      <div class="empty-histogram">
        <p>No data available for histogram</p>
      </div>
    {/if}
  </div>

  <!-- Summary stats -->
  <div class="histogram-stats">
    <div class="stat">
      <span class="stat-value">{(data.total_logs || 0).toLocaleString()}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat error">
      <span class="stat-value">{(data.total_errors || 0).toLocaleString()}</span>
      <span class="stat-label">Errors</span>
    </div>
    <div class="stat warn">
      <span class="stat-value">{(data.total_warnings || 0).toLocaleString()}</span>
      <span class="stat-label">Warnings</span>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .histogram-container {
    @apply bg-base01 border border-base02 rounded-xl p-5 mb-6;
  }

  .histogram-header {
    @apply flex justify-between items-center mb-4;
  }

  .histogram-title {
    @apply text-sm font-semibold text-base05;
  }

  .histogram-legend {
    @apply flex gap-4 text-xs;
  }

  .legend-item {
    @apply flex items-center gap-1.5 text-base04;
  }

  .legend-item .dot {
    @apply w-2 h-2 rounded-full;
  }

  .legend-item.error .dot {
    @apply bg-base08;
  }

  .legend-item.warn .dot {
    @apply bg-base09;
  }

  .legend-item.info .dot {
    @apply bg-base0B;
  }

  .histogram-chart {
    @apply relative;
  }

  .bars-container {
    @apply flex items-end gap-px h-24 mb-2;
  }

  .bar-wrapper {
    @apply flex-1 h-full flex items-end cursor-pointer bg-transparent border-none p-0;
    @apply hover:bg-base02/30 transition-colors duration-150 rounded-t;
    min-width: 4px;
  }

  .bar-wrapper.has-errors {
    @apply bg-base08/5;
  }

  .bar-stack {
    @apply w-full flex flex-col-reverse rounded-t overflow-hidden;
    min-height: 2px;
  }

  .bar-segment {
    @apply w-full transition-all duration-200;
    min-height: 1px;
  }

  .bar-segment.error {
    @apply bg-base08;
  }

  .bar-segment.warn {
    @apply bg-base09;
  }

  .bar-segment.info {
    @apply bg-base0B/60;
  }

  .time-axis {
    @apply flex justify-between text-xs text-base04 pt-2 border-t border-base02;
  }

  .time-label {
    @apply font-mono;
  }

  .empty-histogram {
    @apply h-24 flex items-center justify-center text-sm text-base04;
  }

  .histogram-stats {
    @apply flex gap-6 mt-4 pt-4 border-t border-base02;
  }

  .stat {
    @apply flex flex-col;
  }

  .stat-value {
    @apply text-lg font-semibold text-base05;
  }

  .stat-label {
    @apply text-xs text-base04;
  }

  .stat.error .stat-value {
    @apply text-base08;
  }

  .stat.warn .stat-value {
    @apply text-base09;
  }
</style>
