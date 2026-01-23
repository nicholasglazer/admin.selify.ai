<script>
  import {Zap, Play, Clock, CheckCircle, AlertCircle, ArrowRight, ExternalLink} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  // Temporal workflows documentation
  const workflows = [
    {
      name: 'ProductGenerationWorkflow',
      taskQueue: 'agent-platform',
      description: 'Generates AI-powered product descriptions with gallery images',
      triggers: ['API call', 'Catalog ingestion'],
      activities: [
        'gather_brand_context',
        'analyze_images',
        'plan_generation',
        'write_description',
        'optimize_seo',
        'review_quality',
        'generate_gallery'
      ],
      input: `{
  workspace_id: string,
  product_id: string,
  options: {
    generate_gallery: boolean,
    style: 'professional' | 'casual' | 'luxury'
  }
}`,
      output: `{
  description: string,
  seo_title: string,
  seo_description: string,
  gallery_urls: string[],
  credits_charged: number
}`
    },
    {
      name: 'CatalogIngestionWorkflow',
      taskQueue: 'agent-platform',
      description: 'Batch processes entire product catalog with checkpointing',
      triggers: ['Manual trigger', 'Shopify sync'],
      activities: [
        'fetch_catalog_products',
        'detect_delta_changes',
        'create_chunks',
        'charge_chunk (per chunk)',
        'generate_product (child workflow)',
        'apply_generated_product'
      ],
      input: `{
  workspace_id: string,
  source: 'shopify' | 'imported',
  batch_size: number,
  resume_from_checkpoint: boolean
}`,
      output: `{
  total_products: number,
  processed: number,
  failed: number,
  credits_charged: number
}`
    },
    {
      name: 'DocumentationWorkflow',
      taskQueue: 'internal-ops-queue',
      description: 'Auto-generates documentation from database schema and Kong routes',
      triggers: ['Manual trigger', 'Schema change'],
      activities: [
        'generate_schema_docs',
        'generate_routes_docs',
        'embed_document'
      ],
      input: `{
  generators: ['schema' | 'routes'][],
  schemas: ['public' | 'internal'][]
}`,
      output: `{
  generated_docs: string[],
  content_hashes: Record<string, string>,
  changed: boolean
}`
    },
    {
      name: 'GitPushWorkflow',
      taskQueue: 'internal-ops-queue',
      description: 'Analyzes git pushes with DeepSeek AI for trust scoring and auto-approval',
      triggers: ['Git push webhook'],
      activities: [
        'analyze_commits',
        'calculate_trust_score',
        'run_qa_tests',
        'create_approval_request'
      ],
      input: `{
  repo_name: string,
  branch: string,
  commits: Commit[],
  pusher: string
}`,
      output: `{
  trust_score: number,
  risk_level: 'low' | 'medium' | 'high',
  auto_approved: boolean,
  approval_id: string | null
}`
    },
    {
      name: 'TeamOnboardingWorkflow',
      taskQueue: 'internal-ops-queue',
      description: 'Onboards new team members with email invitations and access setup',
      triggers: ['Admin UI'],
      activities: [
        'validate_email',
        'create_team_member',
        'send_invitation_email',
        'setup_permissions'
      ],
      input: `{
  email: string,
  name: string,
  role: 'developer' | 'ops' | 'support',
  invited_by: string
}`,
      output: `{
  team_member_id: string,
  invitation_sent: boolean,
  access_configured: boolean
}`
    },
    {
      name: 'LoRATrainingWorkflow',
      taskQueue: 'lora-training-queue',
      description: 'Trains custom LoRA models for AI personas on Modal GPUs',
      triggers: ['API call'],
      activities: [
        'validate_lora_images',
        'charge_lora_training',
        'execute_lora_training',
        'update_persona_lora_status'
      ],
      input: `{
  workspace_id: string,
  persona_id: string,
  training_images: string[],
  epochs: number
}`,
      output: `{
  lora_weights_url: string,
  training_time_seconds: number,
  credits_charged: number
}`
    },
    {
      name: 'AIQueueWorkflow',
      taskQueue: 'internal-ops-queue',
      description: 'Processes AI-automatable tasks from PM board queue',
      triggers: ['Manual trigger', 'Scheduled'],
      activities: [
        'fetch_next_task',
        'execute_claude_code',
        'create_pull_request',
        'update_task_status'
      ],
      input: `{
  max_tasks: number,
  dry_run: boolean
}`,
      output: `{
  tasks_processed: number,
  prs_created: string[],
  errors: string[]
}`
    }
  ];

  function getStatusColor(status) {
    switch(status) {
      case 'running': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'secondary';
    }
  }
</script>

<svelte:head>
  <title>Temporal Workflows - Selify Docs</title>
  <meta name="description" content="Temporal workflow documentation and reference" />
</svelte:head>

<div class="workflows-page">
  <header class="page-header">
    <h1 class="page-title">
      <Zap size={28} />
      Temporal Workflows
    </h1>
    <p class="page-description">
      Durable workflow orchestration for AI processing, integrations, and ops automation.
    </p>
    <div class="header-badges">
      <Badge variant="warning" size="sm">Internal Only</Badge>
      <Badge variant="secondary" size="sm">{workflows.length} Workflows</Badge>
      <a href="http://localhost:8089" target="_blank" rel="noopener" class="temporal-link">
        <Badge variant="primary" size="sm">
          Temporal UI
          <ExternalLink size={12} />
        </Badge>
      </a>
    </div>
  </header>

  <section class="quick-reference">
    <h2>Task Queues</h2>
    <div class="queues-grid">
      <div class="queue-card">
        <code>agent-platform</code>
        <p>AI product generation, catalog processing</p>
      </div>
      <div class="queue-card">
        <code>internal-ops-queue</code>
        <p>Documentation, git analysis, onboarding</p>
      </div>
      <div class="queue-card">
        <code>lora-training-queue</code>
        <p>GPU-intensive LoRA model training</p>
      </div>
    </div>
  </section>

  <section class="workflows-list">
    {#each workflows as workflow}
      <div class="workflow-card">
        <div class="workflow-header">
          <h2>{workflow.name}</h2>
          <Badge variant="secondary" size="sm">{workflow.taskQueue}</Badge>
        </div>

        <p class="workflow-description">{workflow.description}</p>

        <div class="workflow-triggers">
          <span class="label">Triggers:</span>
          {#each workflow.triggers as trigger}
            <Badge variant="outline" size="sm">{trigger}</Badge>
          {/each}
        </div>

        <div class="workflow-details">
          <div class="activities-section">
            <h3>Activities</h3>
            <ol class="activities-list">
              {#each workflow.activities as activity, i}
                <li>
                  <span class="activity-num">{i + 1}</span>
                  <code>{activity}</code>
                </li>
              {/each}
            </ol>
          </div>

          <div class="io-section">
            <div class="input-block">
              <h3>Input</h3>
              <pre><code>{workflow.input}</code></pre>
            </div>
            <div class="output-block">
              <h3>Output</h3>
              <pre><code>{workflow.output}</code></pre>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </section>

  <section class="start-workflow">
    <h2>Starting a Workflow</h2>
    <div class="code-example">
      <h3>Via Temporal CLI</h3>
      <pre><code>{`temporal workflow start \\
  --type DocumentationWorkflow \\
  --task-queue internal-ops-queue \\
  --workflow-id "docs-$(date +%s)" \\
  --input '{"generators": ["schema"], "schemas": ["public"]}'`}</code></pre>
    </div>

    <div class="code-example">
      <h3>Via Python SDK</h3>
      <pre><code>{`from temporalio.client import Client

client = await Client.connect("temporal-server:7233")

result = await client.execute_workflow(
    DocumentationWorkflow.run,
    DocumentationWorkflowInput(
        generators=["schema"],
        schemas=["public"]
    ),
    id=f"docs-{int(time.time())}",
    task_queue="internal-ops-queue"
)`}</code></pre>
    </div>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .workflows-page {
    @apply max-w-5xl mx-auto p-8;
  }

  .page-header {
    @apply mb-8;
  }

  .page-title {
    @apply flex items-center gap-3 text-3xl font-bold text-base07 mb-3;
  }

  .page-description {
    @apply text-base04 text-lg mb-4;
  }

  .header-badges {
    @apply flex items-center gap-2;
  }

  .temporal-link {
    @apply ml-auto;
  }

  .temporal-link :global(.badge) {
    @apply flex items-center gap-1.5;
  }

  .quick-reference {
    @apply mb-10;
  }

  .quick-reference h2 {
    @apply text-xl font-semibold text-base06 mb-4;
  }

  .queues-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .queue-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .queue-card code {
    @apply block text-base0E font-mono text-sm mb-2;
  }

  .queue-card p {
    @apply text-sm text-base04;
  }

  .workflows-list {
    @apply space-y-6;
  }

  .workflow-card {
    @apply bg-base01 border border-base02 rounded-lg p-6;
  }

  .workflow-header {
    @apply flex items-center gap-3 mb-3;
  }

  .workflow-header h2 {
    @apply text-xl font-semibold text-base06 m-0;
  }

  .workflow-description {
    @apply text-base04 mb-4;
  }

  .workflow-triggers {
    @apply flex items-center gap-2 mb-4 flex-wrap;
  }

  .workflow-triggers .label {
    @apply text-sm text-base04;
  }

  .workflow-details {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
  }

  .activities-section h3,
  .io-section h3 {
    @apply text-sm font-medium text-base05 mb-2;
  }

  .activities-list {
    @apply space-y-1;
  }

  .activities-list li {
    @apply flex items-center gap-2;
  }

  .activity-num {
    @apply w-5 h-5 rounded-full bg-base02 text-xs text-base04 flex items-center justify-center;
  }

  .activities-list code {
    @apply text-sm text-base0E;
  }

  .io-section {
    @apply space-y-4;
  }

  .input-block pre,
  .output-block pre {
    @apply bg-base00 border border-base02 rounded p-3 overflow-x-auto;
  }

  .input-block code,
  .output-block code {
    @apply text-xs text-base05 font-mono whitespace-pre;
  }

  .start-workflow {
    @apply mt-12 pt-8 border-t border-base02;
  }

  .start-workflow h2 {
    @apply text-xl font-semibold text-base06 mb-6;
  }

  .code-example {
    @apply mb-6;
  }

  .code-example h3 {
    @apply text-sm font-medium text-base05 mb-2;
  }

  .code-example pre {
    @apply bg-base01 border border-base02 rounded-lg p-4 overflow-x-auto;
  }

  .code-example code {
    @apply text-sm text-base05 font-mono whitespace-pre;
  }
</style>
