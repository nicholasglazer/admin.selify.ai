<script>
  /**
   * ResponseTimeChart - D3-based area chart for response time trends
   *
   * @prop {Array} data - Array of { bucket, avg_response_time_ms, status }
   * @prop {number} height - Chart height in pixels (default: 120)
   */

  import {onMount} from 'svelte';
  import * as d3 from 'd3';

  let {data = [], height = 120, class: className = ''} = $props();

  let chartContainer;
  let resizeObserver;

  function renderChart() {
    if (!chartContainer || !data || data.length === 0) return;

    // Clear existing
    d3.select(chartContainer).selectAll('*').remove();

    const width = chartContainer.clientWidth;
    const margin = {top: 10, right: 10, bottom: 25, left: 40};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartContainer).append('svg').attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse data
    const parsed = data
      .filter((d) => d.avg_response_time_ms !== null)
      .map((d) => ({
        date: new Date(d.bucket),
        value: d.avg_response_time_ms,
        status: d.status
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (parsed.length === 0) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--color-base04)')
        .style('font-size', '12px')
        .text('No data available');
      return;
    }

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(parsed, (d) => d.date))
      .range([0, innerWidth]);

    const yMax = d3.max(parsed, (d) => d.value) * 1.1;
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax || 100])
      .range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(4))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .style('stroke', 'var(--color-border)')
      .style('stroke-opacity', 0.3)
      .style('stroke-dasharray', '2,2');

    // Area gradient
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'response-time-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgb(var(--color-base0D))')
      .attr('stop-opacity', 0.3);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgb(var(--color-base0D))')
      .attr('stop-opacity', 0);

    // Area generator
    const area = d3
      .area()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw area
    g.append('path').datum(parsed).attr('fill', 'url(#response-time-gradient)').attr('d', area);

    // Draw line
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(var(--color-base0D))')
      .attr('stroke-width', 2)
      .attr('d', line);

    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%H:%M'));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .style('color', 'var(--color-base04)')
      .style('font-size', '10px')
      .select('.domain')
      .style('stroke', 'var(--color-border)');

    // Y axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => `${d}ms`);

    g.append('g')
      .call(yAxis)
      .style('color', 'var(--color-base04)')
      .style('font-size', '10px')
      .select('.domain')
      .style('stroke', 'var(--color-border)');

    // Tooltip overlay
    const tooltip = g.append('g').attr('class', 'tooltip').style('display', 'none');

    tooltip
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('stroke', 'var(--color-base05)')
      .style('stroke-dasharray', '2,2');

    tooltip
      .append('circle')
      .attr('r', 4)
      .style('fill', 'rgb(var(--color-base0D))')
      .style('stroke', 'var(--color-base00)')
      .style('stroke-width', 2);

    const tooltipText = tooltip
      .append('text')
      .attr('y', -10)
      .style('fill', 'var(--color-base06)')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('text-anchor', 'middle');

    // Bisector for tooltip
    const bisect = d3.bisector((d) => d.date).left;

    // Overlay for mouse events
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        const i = bisect(parsed, x0, 1);
        const d0 = parsed[i - 1];
        const d1 = parsed[i];

        if (!d0 || !d1) return;

        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        tooltip.style('display', null);
        tooltip.attr('transform', `translate(${xScale(d.date)},0)`);
        tooltip.select('circle').attr('cy', yScale(d.value));
        tooltipText.text(`${Math.round(d.value)}ms`);
      })
      .on('mouseleave', function () {
        tooltip.style('display', 'none');
      });
  }

  onMount(() => {
    renderChart();

    resizeObserver = new ResizeObserver(() => {
      renderChart();
    });
    resizeObserver.observe(chartContainer);

    return () => resizeObserver.disconnect();
  });

  $effect(() => {
    if (data) renderChart();
  });
</script>

<div bind:this={chartContainer} class="response-time-chart {className}" style="height: {height}px;"></div>

<style lang="postcss">
  @reference '$theme';

  .response-time-chart {
    @apply w-full;
  }

  :global(.response-time-chart .tick line) {
    stroke: var(--color-border);
  }
</style>
