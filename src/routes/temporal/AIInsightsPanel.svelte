<script>
  /**
   * AIInsightsPanel - Displays AI-detected anomalies and suggestions
   *
   * Shows a banner-style panel with:
   * - Detected anomalies (failure spikes, slow workflows)
   * - Suggested actions
   * - Dismissable state
   */

  import {AlertTriangle, TrendingUp, Clock, Lightbulb, X, ChevronDown, ChevronUp} from '@lucide/svelte';

  let {insights = {anomalies: [], suggestions: []}} = $props();

  let isDismissed = $state(false);
  let isExpanded = $state(true);

  // Get icon for anomaly type
  function getAnomalyIcon(type) {
    const icons = {
      failure_spike: AlertTriangle,
      slow_workflow: Clock,
      retry_loop: TrendingUp
    };
    return icons[type] || AlertTriangle;
  }

  // Get severity color
  function getSeverityColor(severity) {
    const colors = {
      high: 'base08',
      medium: 'base09',
      low: 'base0A'
    };
    return colors[severity] || 'base0A';
  }

  // Format priority
  function getPriorityBadge(priority) {
    const badges = {
      high: {color: 'base08', label: 'High Priority'},
      medium: {color: 'base09', label: 'Medium'},
      low: {color: 'base0B', label: 'Low'}
    };
    return badges[priority] || badges.medium;
  }
</script>

{#if !isDismissed && (insights.anomalies?.length > 0 || insights.suggestions?.length > 0)}
  <div class="insights-panel" class:collapsed={!isExpanded}>
    <header class="panel-header">
      <div class="header-left">
        <AlertTriangle size={16} class="text-base09" />
        <span class="header-title">
          AI Insights
          {#if insights.anomalies?.length > 0}
            <span class="anomaly-count">{insights.anomalies.length} anomal{insights.anomalies.length === 1 ? 'y' : 'ies'}</span>
          {/if}
        </span>
      </div>
      <div class="header-actions">
        <button class="toggle-btn" onclick={() => (isExpanded = !isExpanded)}>
          {#if isExpanded}
            <ChevronUp size={14} />
          {:else}
            <ChevronDown size={14} />
          {/if}
        </button>
        <button class="close-btn" onclick={() => (isDismissed = true)}>
          <X size={14} />
        </button>
      </div>
    </header>

    {#if isExpanded}
      <div class="panel-content">
        <!-- Anomalies -->
        {#if insights.anomalies?.length > 0}
          <div class="anomalies-section">
            {#each insights.anomalies as anomaly}
              {@const AnomalyIcon = getAnomalyIcon(anomaly.type)}
              <div class="anomaly-item" style="--severity-color: var(--color-{getSeverityColor(anomaly.severity)})">
                <div class="anomaly-icon">
                  <AnomalyIcon size={14} />
                </div>
                <div class="anomaly-content">
                  <p class="anomaly-message">{anomaly.message}</p>
                  {#if anomaly.workflow_type}
                    <span class="anomaly-type">{anomaly.workflow_type}</span>
                  {/if}
                </div>
                <span class="severity-badge">{anomaly.severity}</span>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Suggestions -->
        {#if insights.suggestions?.length > 0}
          <div class="suggestions-section">
            <h3 class="section-title">
              <Lightbulb size={12} />
              Suggested Actions
            </h3>
            <div class="suggestions-list">
              {#each insights.suggestions as suggestion}
                {@const badge = getPriorityBadge(suggestion.priority)}
                <div class="suggestion-item">
                  <div class="suggestion-content">
                    <p class="suggestion-action">{suggestion.action}</p>
                    <p class="suggestion-reason">{suggestion.reason}</p>
                  </div>
                  <span class="priority-badge" style="--priority-color: var(--color-{badge.color})">
                    {badge.label}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .insights-panel {
    @apply rounded-lg overflow-hidden mb-4;
    background: var(--color-base01);
    border: 1px solid var(--color-base02);
    border-left: 3px solid var(--color-base09);
  }

  /* Header */
  .panel-header {
    @apply flex items-center justify-between px-4 py-3;
    background: rgba(var(--color-base09-rgb, 255, 180, 50), 0.05);
  }

  .header-left {
    @apply flex items-center gap-2;
  }

  .header-title {
    @apply text-sm font-medium;
    color: var(--color-base06);
  }

  .anomaly-count {
    @apply ml-2 px-1.5 py-0.5 rounded text-xs;
    background: rgba(var(--color-base09-rgb, 255, 180, 50), 0.2);
    color: var(--color-base09);
  }

  .header-actions {
    @apply flex items-center gap-1;
  }

  .toggle-btn,
  .close-btn {
    @apply p-1.5 rounded transition-colors;
    color: var(--color-base04);
  }

  .toggle-btn:hover,
  .close-btn:hover {
    background: var(--color-base02);
    color: var(--color-base06);
  }

  /* Content */
  .panel-content {
    @apply px-4 pb-4;
  }

  /* Anomalies */
  .anomalies-section {
    @apply flex flex-col gap-2 mb-4;
  }

  .anomaly-item {
    @apply flex items-start gap-3 p-3 rounded-lg;
    background: var(--color-base00);
    border-left: 2px solid var(--severity-color);
  }

  .anomaly-icon {
    @apply flex-shrink-0 mt-0.5;
    color: var(--severity-color);
  }

  .anomaly-content {
    @apply flex-1 min-w-0;
  }

  .anomaly-message {
    @apply text-sm;
    color: var(--color-base06);
  }

  .anomaly-type {
    @apply inline-block mt-1 px-1.5 py-0.5 rounded text-xs;
    background: var(--color-base02);
    color: var(--color-base04);
  }

  .severity-badge {
    @apply px-2 py-0.5 rounded text-xs font-medium uppercase flex-shrink-0;
    background: color-mix(in srgb, var(--severity-color) 15%, transparent);
    color: var(--severity-color);
  }

  /* Suggestions */
  .suggestions-section {
    @apply pt-3 border-t;
    border-color: var(--color-base02);
  }

  .section-title {
    @apply flex items-center gap-1.5 text-xs font-medium uppercase mb-2;
    color: var(--color-base04);
  }

  .suggestions-list {
    @apply flex flex-col gap-2;
  }

  .suggestion-item {
    @apply flex items-start justify-between gap-3 p-3 rounded-lg;
    background: var(--color-base00);
  }

  .suggestion-content {
    @apply flex-1 min-w-0;
  }

  .suggestion-action {
    @apply text-sm font-medium;
    color: var(--color-base06);
  }

  .suggestion-reason {
    @apply text-xs mt-0.5;
    color: var(--color-base04);
  }

  .priority-badge {
    @apply px-2 py-0.5 rounded text-xs font-medium flex-shrink-0;
    background: color-mix(in srgb, var(--priority-color) 10%, transparent);
    color: var(--priority-color);
  }

  /* Collapsed state */
  .insights-panel.collapsed .panel-content {
    display: none;
  }
</style>
