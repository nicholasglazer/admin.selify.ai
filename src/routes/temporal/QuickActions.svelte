<script>
  /**
   * Quick Actions Panel - Trigger common Temporal workflows manually
   *
   * Shows a list of available workflows that can be started from the admin UI.
   * Each action has a form for input parameters.
   */

  import {getContext} from 'svelte';
  import {
    Play,
    Package,
    RefreshCw,
    HeartPulse,
    FileText,
    TestTube2,
    ChevronDown,
    ChevronRight,
    X,
    Check,
    Loader2
  } from '@lucide/svelte';
  import {Button, Badge} from '@miozu/jera';

  const toastState = getContext('toastState');
  const temporalState = getContext('temporalState');

  // Available quick actions
  const quickActions = [
    {
      id: 'package-cascade',
      name: 'Package Cascade',
      description: 'Update a package across all consuming repos',
      icon: Package,
      queue: 'internal-ops-queue',
      workflowType: 'PackageCascadeWorkflow',
      color: 'base0E',
      fields: [
        {name: 'package_name', label: 'Package Name', type: 'text', default: '@miozu/jera', required: true},
        {name: 'new_version', label: 'New Version', type: 'text', placeholder: '0.4.5', required: true},
        {
          name: 'target_branch',
          label: 'Target Branch',
          type: 'select',
          options: ['staging', 'main'],
          default: 'staging'
        }
      ]
    },
    {
      id: 'health-check',
      name: 'Health Check',
      description: 'Run health checks on all services',
      icon: HeartPulse,
      queue: 'internal-ops-queue',
      workflowType: 'HealthCheckWorkflow',
      color: 'base0B',
      fields: []
    },
    {
      id: 'documentation',
      name: 'Regenerate Docs',
      description: 'Regenerate API and database documentation',
      icon: FileText,
      queue: 'internal-ops-queue',
      workflowType: 'DocumentationWorkflow',
      color: 'base0D',
      fields: [
        {
          name: 'doc_types',
          label: 'Documentation Types',
          type: 'multiselect',
          options: ['api-routes', 'database-schema', 'database-functions'],
          default: ['api-routes', 'database-schema']
        }
      ]
    },
    {
      id: 'qa-scheduler',
      name: 'Run QA Tests',
      description: 'Execute scheduled QA test suites',
      icon: TestTube2,
      queue: 'internal-ops-queue',
      workflowType: 'QASchedulerWorkflow',
      color: 'base0C',
      fields: [
        {
          name: 'target_app',
          label: 'Target App',
          type: 'select',
          options: ['dash.selify.ai', 'admin.selify.ai', 'api.selify.ai'],
          default: 'dash.selify.ai'
        }
      ]
    }
  ];

  // UI State
  let expandedAction = $state(null);
  let formData = $state({});
  let runningActions = $state(new Set());

  function toggleAction(actionId) {
    if (expandedAction === actionId) {
      expandedAction = null;
    } else {
      expandedAction = actionId;
      // Initialize form data with defaults
      const action = quickActions.find((a) => a.id === actionId);
      if (action) {
        const defaults = {};
        action.fields.forEach((field) => {
          defaults[field.name] = field.default || '';
        });
        formData = defaults;
      }
    }
  }

  async function runAction(action) {
    runningActions.add(action.id);
    runningActions = runningActions; // Trigger reactivity

    try {
      // Build input based on workflow type
      const input = buildWorkflowInput(action);

      // Use temporalState's startWorkflow method for consistent API handling
      const result = await temporalState?.startWorkflow(
        action.workflowType,
        action.queue,
        input
      );

      if (!result) {
        // Error toast is already shown by startWorkflow
        return;
      }

      // Collapse the action on success
      expandedAction = null;
    } finally {
      runningActions.delete(action.id);
      runningActions = runningActions;
    }
  }

  function buildWorkflowInput(action) {
    switch (action.workflowType) {
      case 'PackageCascadeWorkflow':
        return {
          package_name: formData.package_name,
          new_version: formData.new_version,
          target_branch: formData.target_branch || 'staging',
          triggered_by: 'admin-ui'
        };
      case 'HealthCheckWorkflow':
        return {triggered_by: 'admin-ui'};
      case 'DocumentationWorkflow':
        return {
          doc_types: formData.doc_types || ['api-routes', 'database-schema'],
          triggered_by: 'admin-ui'
        };
      case 'QASchedulerWorkflow':
        return {
          target_app: formData.target_app || 'dash.selify.ai',
          triggered_by: 'admin-ui'
        };
      default:
        return formData;
    }
  }

  function updateField(fieldName, value) {
    formData = {...formData, [fieldName]: value};
  }

  function toggleMultiselect(fieldName, option) {
    const current = formData[fieldName] || [];
    if (current.includes(option)) {
      formData = {...formData, [fieldName]: current.filter((o) => o !== option)};
    } else {
      formData = {...formData, [fieldName]: [...current, option]};
    }
  }
</script>

<div class="quick-actions">
  <div class="panel-header">
    <h3>
      <Play size={16} />
      Quick Actions
    </h3>
    <span class="action-count">{quickActions.length} available</span>
  </div>

  <div class="actions-list">
    {#each quickActions as action}
      <div class="action-item" class:expanded={expandedAction === action.id}>
        <button
          class="action-trigger"
          onclick={() => toggleAction(action.id)}
          aria-expanded={expandedAction === action.id}
          aria-controls="action-form-{action.id}"
        >
          <div class="action-icon" style="--action-color: var(--color-{action.color})">
            <svelte:component this={action.icon} size={18} />
          </div>
          <div class="action-info">
            <span class="action-name">{action.name}</span>
            <span class="action-desc">{action.description}</span>
          </div>
          <div class="action-chevron">
            {#if expandedAction === action.id}
              <ChevronDown size={16} />
            {:else}
              <ChevronRight size={16} />
            {/if}
          </div>
        </button>

        {#if expandedAction === action.id}
          <div class="action-form" id="action-form-{action.id}">
            {#if action.fields.length > 0}
              {#each action.fields as field}
                <div class="form-field">
                  <label for={field.name}>{field.label}</label>
                  {#if field.type === 'text'}
                    <input
                      type="text"
                      id={field.name}
                      value={formData[field.name] || ''}
                      placeholder={field.placeholder || ''}
                      oninput={(e) => updateField(field.name, e.target.value)}
                      required={field.required}
                    />
                  {:else if field.type === 'select'}
                    <select
                      id={field.name}
                      value={formData[field.name] || field.default}
                      onchange={(e) => updateField(field.name, e.target.value)}
                    >
                      {#each field.options as option}
                        <option value={option}>{option}</option>
                      {/each}
                    </select>
                  {:else if field.type === 'multiselect'}
                    <div class="multiselect">
                      {#each field.options as option}
                        <button
                          type="button"
                          class="multiselect-option"
                          class:selected={(formData[field.name] || []).includes(option)}
                          role="checkbox"
                          aria-checked={(formData[field.name] || []).includes(option)}
                          onclick={() => toggleMultiselect(field.name, option)}
                        >
                          {#if (formData[field.name] || []).includes(option)}
                            <Check size={12} />
                          {/if}
                          {option}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            {:else}
              <p class="no-params">No parameters required</p>
            {/if}

            <div class="form-actions">
              <Button variant="ghost" size="sm" onclick={() => (expandedAction = null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onclick={() => runAction(action)}
                disabled={runningActions.has(action.id)}
                loading={runningActions.has(action.id)}
              >
                {runningActions.has(action.id) ? 'Starting...' : 'Run Workflow'}
              </Button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  .quick-actions {
    @apply rounded-lg overflow-hidden;
    background: var(--color-base01);
  }

  .panel-header {
    @apply flex items-center justify-between px-4 py-3 border-b;
    border-color: var(--color-base02);
  }

  .panel-header h3 {
    @apply flex items-center gap-2 text-sm font-medium;
    color: var(--color-base06);
  }

  .action-count {
    @apply text-xs px-2 py-0.5 rounded;
    background: var(--color-base02);
    color: var(--color-base04);
  }

  .actions-list {
    @apply divide-y;
    divide-color: var(--color-base02);
  }

  .action-item {
    @apply transition-colors;
  }

  .action-item.expanded {
    background: var(--color-base00);
  }

  .action-trigger {
    @apply w-full flex items-center gap-3 px-4 py-3 text-left transition-colors;
  }

  .action-trigger:hover {
    background: var(--color-base02);
  }

  .action-icon {
    @apply w-9 h-9 flex items-center justify-center rounded-lg;
    background: color-mix(in srgb, var(--action-color) 15%, transparent);
    color: var(--action-color);
  }

  .action-info {
    @apply flex-1 min-w-0;
  }

  .action-name {
    @apply block text-sm font-medium;
    color: var(--color-base06);
  }

  .action-desc {
    @apply block text-xs truncate;
    color: var(--color-base04);
  }

  .action-chevron {
    @apply flex-shrink-0;
    color: var(--color-base04);
  }

  .action-form {
    @apply px-4 pb-4 pt-2 space-y-3;
    border-top: 1px solid var(--color-base02);
  }

  .form-field {
    @apply space-y-1.5;
  }

  .form-field label {
    @apply block text-xs font-medium;
    color: var(--color-base05);
  }

  .form-field input,
  .form-field select {
    @apply w-full px-3 py-2 rounded border text-sm;
    background: var(--color-base01);
    border-color: var(--color-base02);
    color: var(--color-base06);
  }

  .form-field input:focus,
  .form-field select:focus {
    outline: none;
    border-color: var(--color-base0D);
  }

  .form-field input::placeholder {
    color: var(--color-base04);
  }

  .multiselect {
    @apply flex flex-wrap gap-2;
  }

  .multiselect-option {
    @apply flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors;
    background: var(--color-base02);
    color: var(--color-base05);
  }

  .multiselect-option:hover {
    background: var(--color-base03);
  }

  .multiselect-option.selected {
    background: color-mix(in srgb, var(--color-base0D) 20%, transparent);
    color: var(--color-base0D);
  }

  .no-params {
    @apply text-sm text-center py-2;
    color: var(--color-base04);
  }

  .form-actions {
    @apply flex items-center justify-end gap-2 pt-2;
  }
</style>
