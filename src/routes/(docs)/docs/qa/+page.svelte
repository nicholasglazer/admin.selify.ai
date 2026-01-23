<script>
  import {FlaskConical, Brain, Wand2, Calendar, AlertTriangle, Database, Zap, Play, CheckCircle, XCircle, RefreshCw, ArrowRight} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  const features = [
    {
      title: 'Natural Language Tests',
      description: 'Write tests in plain English. DeepSeek generates Playwright code automatically.',
      icon: Brain,
      color: 'primary'
    },
    {
      title: 'Auto-Healing',
      description: 'Broken selectors fixed automatically. Tests adapt to UI changes.',
      icon: Wand2,
      color: 'success'
    },
    {
      title: 'Test Suites',
      description: 'Group tests into suites. Run smoke, regression, or custom collections.',
      icon: FlaskConical,
      color: 'warning'
    },
    {
      title: 'Scheduled Runs',
      description: 'Nightly runs, pre-demo checks. Discord alerts when thresholds breach.',
      icon: Calendar,
      color: 'error'
    },
    {
      title: 'Flaky Quarantine',
      description: 'Flaky tests auto-quarantined. Track owners and fix priorities.',
      icon: AlertTriangle,
      color: 'secondary'
    },
    {
      title: 'Temporal Orchestration',
      description: 'Durable workflows for test execution. Real-time progress tracking.',
      icon: Zap,
      color: 'info'
    }
  ];

  const workflow = [
    {step: 1, title: 'Write NL Spec', description: 'Describe what to test in plain English'},
    {step: 2, title: 'Generate Code', description: 'DeepSeek creates Playwright test'},
    {step: 3, title: 'Review & Activate', description: 'QA reviews, then activates spec'},
    {step: 4, title: 'Run Tests', description: 'Execute on staging or production'},
    {step: 5, title: 'Auto-Heal', description: 'Broken tests fixed automatically'},
    {step: 6, title: 'Triage', description: 'Review failures, track flaky tests'}
  ];
</script>

<svelte:head>
  <title>QA Automation - Selify Docs</title>
  <meta name="description" content="AI-first test automation platform using natural language and Playwright" />
</svelte:head>

<div class="qa-docs-page">
  <header class="page-header">
    <h1 class="page-title">
      <FlaskConical size={32} />
      AI-First QA Automation
    </h1>
    <p class="page-description">
      Write tests in plain English. Let AI generate, execute, and maintain Playwright tests automatically.
    </p>
    <div class="header-badges">
      <Badge variant="primary" size="sm">AI-Powered</Badge>
      <Badge variant="success" size="sm">Self-Healing</Badge>
      <Badge variant="warning" size="sm">Internal Only</Badge>
    </div>
  </header>

  <section class="hero-diagram">
    <div class="diagram-container">
      <pre class="architecture-ascii">{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                            QA ENGINEER                                       │
│                    "Test that user can upload garment"                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        admin.selify.ai/qa                                    │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│   │   Specs   │  │   Suites  │  │   Runs    │  │  Triage   │               │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│     DeepSeek R1     │  │   Temporal Workflow │  │  Playwright Runner  │
│  NL → Playwright    │  │   Orchestration     │  │  Test Execution     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          internal.qa_*                                       │
│   qa_test_specs  │  qa_test_suites  │  qa_test_runs  │  qa_test_results    │
└─────────────────────────────────────────────────────────────────────────────┘
      `}</pre>
    </div>
  </section>

  <section class="features-section">
    <h2>Key Capabilities</h2>
    <div class="features-grid">
      {#each features as feature}
        <div class="feature-card {feature.color}">
          <div class="feature-icon">
            <svelte:component this={feature.icon} size={24} />
          </div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="workflow-section">
    <h2>QA Workflow</h2>
    <p class="section-description">From idea to passing test in minutes, not hours.</p>
    <div class="workflow-steps">
      {#each workflow as item, i}
        <div class="workflow-step">
          <div class="step-number">{item.step}</div>
          <div class="step-content">
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </div>
        </div>
        {#if i < workflow.length - 1}
          <ArrowRight size={20} class="step-arrow" />
        {/if}
      {/each}
    </div>
  </section>

  <section class="comparison-section">
    <h2>Traditional vs AI-First Testing</h2>
    <div class="comparison-grid">
      <div class="comparison-card traditional">
        <h3>
          <XCircle size={20} />
          Traditional Approach
        </h3>
        <ul>
          <li>QA writes TypeScript code manually</li>
          <li>Tests break when UI changes</li>
          <li>Manual maintenance overhead</li>
          <li>Requires IDE and git knowledge</li>
          <li>Test creation takes hours</li>
        </ul>
      </div>
      <div class="comparison-card ai-first">
        <h3>
          <CheckCircle size={20} />
          AI-First Approach
        </h3>
        <ul>
          <li>QA writes plain English descriptions</li>
          <li>Auto-healing fixes broken selectors</li>
          <li>AI maintains test code</li>
          <li>No coding required</li>
          <li>Test creation takes minutes</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="quickstart-section">
    <h2>Quick Start</h2>
    <div class="quickstart-steps">
      <div class="qs-step">
        <div class="qs-number">1</div>
        <div class="qs-content">
          <h4>Open QA Dashboard</h4>
          <p>Navigate to <code>/qa</code> in admin dashboard</p>
        </div>
      </div>
      <div class="qs-step">
        <div class="qs-number">2</div>
        <div class="qs-content">
          <h4>Create New Spec</h4>
          <p>Click "New Spec" and describe your test in plain English</p>
        </div>
      </div>
      <div class="qs-step">
        <div class="qs-number">3</div>
        <div class="qs-content">
          <h4>Generate & Review</h4>
          <p>Click "Generate" and review the generated Playwright code</p>
        </div>
      </div>
      <div class="qs-step">
        <div class="qs-number">4</div>
        <div class="qs-content">
          <h4>Run Test</h4>
          <p>Save and run on staging to verify it works</p>
        </div>
      </div>
    </div>
  </section>

  <section class="docs-links">
    <h2>Documentation</h2>
    <div class="docs-grid">
      <a href="/docs/qa/guide" class="doc-link">
        <h3>QA Engineer Guide</h3>
        <p>Complete workflow guide for QA engineers</p>
      </a>
      <a href="/docs/qa/architecture" class="doc-link">
        <h3>Architecture</h3>
        <p>Technical deep-dive into the system</p>
      </a>
      <a href="/docs/qa/troubleshooting" class="doc-link">
        <h3>Troubleshooting</h3>
        <p>Common issues and solutions</p>
      </a>
      <a href="/qa" class="doc-link highlight">
        <h3>Open QA Dashboard</h3>
        <p>Start creating tests now</p>
        <ArrowRight size={16} />
      </a>
    </div>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .qa-docs-page {
    @apply max-w-5xl mx-auto p-8;
  }

  .page-header {
    @apply mb-10;
  }

  .page-title {
    @apply flex items-center gap-3 text-3xl font-bold text-base07 mb-3;
  }

  .page-description {
    @apply text-lg text-base04 mb-4 max-w-2xl;
  }

  .header-badges {
    @apply flex gap-2;
  }

  /* Hero Diagram */
  .hero-diagram {
    @apply mb-12;
  }

  .diagram-container {
    @apply bg-base01 border border-base02 rounded-lg p-4 overflow-x-auto;
  }

  .architecture-ascii {
    @apply text-xs font-mono text-base05 whitespace-pre leading-tight;
  }

  /* Features */
  .features-section {
    @apply mb-12;
  }

  .features-section h2 {
    @apply text-xl font-semibold text-base06 mb-6;
  }

  .features-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .feature-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .feature-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center mb-3;
  }

  .feature-card.primary .feature-icon { @apply bg-base0D/20 text-base0D; }
  .feature-card.success .feature-icon { @apply bg-base0B/20 text-base0B; }
  .feature-card.warning .feature-icon { @apply bg-base0A/20 text-base0A; }
  .feature-card.error .feature-icon { @apply bg-base08/20 text-base08; }
  .feature-card.secondary .feature-icon { @apply bg-base04/20 text-base04; }
  .feature-card.info .feature-icon { @apply bg-base0C/20 text-base0C; }

  .feature-card h3 {
    @apply text-base06 font-medium mb-2;
  }

  .feature-card p {
    @apply text-sm text-base04;
  }

  /* Workflow */
  .workflow-section {
    @apply mb-12;
  }

  .workflow-section h2 {
    @apply text-xl font-semibold text-base06 mb-2;
  }

  .section-description {
    @apply text-base04 mb-6;
  }

  .workflow-steps {
    @apply flex flex-wrap items-center gap-2;
  }

  .workflow-step {
    @apply flex items-center gap-3 bg-base01 border border-base02 rounded-lg p-3;
  }

  .step-number {
    @apply w-8 h-8 rounded-full bg-base0D text-base00 flex items-center justify-center text-sm font-bold flex-shrink-0;
  }

  .step-content h4 {
    @apply text-sm font-medium text-base06;
  }

  .step-content p {
    @apply text-xs text-base04;
  }

  :global(.step-arrow) {
    @apply text-base04 flex-shrink-0;
  }

  /* Comparison */
  .comparison-section {
    @apply mb-12;
  }

  .comparison-section h2 {
    @apply text-xl font-semibold text-base06 mb-6;
  }

  .comparison-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .comparison-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .comparison-card h3 {
    @apply flex items-center gap-2 font-medium mb-4;
  }

  .comparison-card.traditional h3 {
    @apply text-base08;
  }

  .comparison-card.ai-first h3 {
    @apply text-base0B;
  }

  .comparison-card ul {
    @apply space-y-2;
  }

  .comparison-card li {
    @apply text-sm text-base04 flex items-start gap-2;
  }

  .comparison-card li::before {
    content: '•';
    @apply text-base04;
  }

  /* Quick Start */
  .quickstart-section {
    @apply mb-12;
  }

  .quickstart-section h2 {
    @apply text-xl font-semibold text-base06 mb-6;
  }

  .quickstart-steps {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .qs-step {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .qs-number {
    @apply w-8 h-8 rounded-full bg-base0E text-base00 flex items-center justify-center text-sm font-bold mb-3;
  }

  .qs-content h4 {
    @apply text-base06 font-medium mb-1;
  }

  .qs-content p {
    @apply text-sm text-base04;
  }

  .qs-content code {
    @apply text-base0E bg-base02 px-1 rounded text-xs;
  }

  /* Docs Links */
  .docs-links {
    @apply border-t border-base02 pt-8;
  }

  .docs-links h2 {
    @apply text-xl font-semibold text-base06 mb-6;
  }

  .docs-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .doc-link {
    @apply bg-base01 border border-base02 rounded-lg p-4 hover:border-base0D transition-colors;
  }

  .doc-link.highlight {
    @apply bg-base0D/10 border-base0D/30 hover:bg-base0D/20;
  }

  .doc-link h3 {
    @apply text-base06 font-medium mb-1;
  }

  .doc-link p {
    @apply text-sm text-base04;
  }

  .doc-link.highlight {
    @apply flex flex-col;
  }

  .doc-link.highlight :global(svg) {
    @apply mt-auto text-base0D;
  }
</style>
