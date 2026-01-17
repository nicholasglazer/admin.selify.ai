<script>
  import {Card} from '$components';
</script>

<div class="docs-container">
  <!-- Architecture Overview -->
  <Card class="doc-card">
    <h2 class="doc-title">QA Module Architecture</h2>
    <p class="doc-intro">
      AI-first test automation using Playwright Test Agents with natural language test creation.
    </p>

    <div class="architecture-diagram">
      <pre class="diagram">{`
┌─────────────────────────────────────────────────────────────────┐
│                     admin.selify.ai/qa                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Test Specs  │  │  Test Runs   │  │   Coverage   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              QAReactiveState (Svelte 5 runes)           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Playwright Test Agents                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Planner   │ →  │  Generator  │ →  │   Healer    │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
      `}</pre>
    </div>
  </Card>

  <!-- Playwright Test Agents -->
  <Card class="doc-card">
    <h3 class="section-title">Playwright Test Agents</h3>
    <p class="section-desc">Native Playwright agents (released Oct 2025) for intelligent test automation:</p>

    <div class="agents-grid">
      <div class="agent-card planner">
        <div class="agent-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h4>Planner Agent</h4>
        <p>Explores your app and generates markdown test plans from natural language descriptions.</p>
        <code class="trigger">Triggered: When creating new specs</code>
      </div>

      <div class="agent-card generator">
        <div class="agent-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <h4>Generator Agent</h4>
        <p>Converts markdown plans into executable Playwright test files with assertions.</p>
        <code class="trigger">Triggered: After NL → code generation</code>
      </div>

      <div class="agent-card healer">
        <div class="agent-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        <h4>Healer Agent</h4>
        <p>Auto-fixes broken selectors and timeouts when tests fail, keeping your suite healthy.</p>
        <code class="trigger">Triggered: When tests fail</code>
      </div>
    </div>
  </Card>

  <!-- Natural Language Flow -->
  <Card class="doc-card">
    <h3 class="section-title">Natural Language → Playwright Flow</h3>

    <div class="flow-steps">
      <div class="flow-step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h4>Write Natural Language</h4>
          <div class="example-box">
            "User logs in, navigates to wardrobe, uploads a garment image"
          </div>
        </div>
      </div>

      <div class="flow-arrow">→</div>

      <div class="flow-step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h4>DeepSeek Generates Code</h4>
          <pre class="code-example">{`test('upload garment', async ({page}) => {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', '...');
  await page.click('text=Wardrobe');
  await page.setInputFiles('input[type="file"]', ...);
});`}</pre>
        </div>
      </div>

      <div class="flow-arrow">→</div>

      <div class="flow-step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h4>Review & Activate</h4>
          <p>QA reviews generated code, makes edits if needed, then activates the spec.</p>
        </div>
      </div>

      <div class="flow-arrow">→</div>

      <div class="flow-step">
        <div class="step-number">4</div>
        <div class="step-content">
          <h4>Execute & Auto-Heal</h4>
          <p>Tests run via Playwright. If selectors break, Healer auto-fixes them.</p>
        </div>
      </div>
    </div>
  </Card>

  <!-- Auto-Healing Process -->
  <Card class="doc-card">
    <h3 class="section-title">Auto-Healing Process</h3>
    <p class="section-desc">When a test fails due to UI changes, the Healer agent steps in:</p>

    <div class="heal-flow">
      <div class="heal-step fail">
        <span class="heal-icon">✗</span>
        <div class="heal-content">
          <strong>Test Fails</strong>
          <code>Unable to find [data-testid='old-button']</code>
        </div>
      </div>

      <div class="heal-step analyze">
        <span class="heal-icon">🔍</span>
        <div class="heal-content">
          <strong>Healer Analyzes</strong>
          <p>DOM inspection + visual/semantic matching</p>
        </div>
      </div>

      <div class="heal-step fix">
        <span class="heal-icon">🔧</span>
        <div class="heal-content">
          <strong>Selector Updated</strong>
          <code>[data-testid='old-button'] → [data-testid='new-button']</code>
        </div>
      </div>

      <div class="heal-step pass">
        <span class="heal-icon">✓</span>
        <div class="heal-content">
          <strong>Test Passes</strong>
          <p>Heal logged to history, count incremented</p>
        </div>
      </div>
    </div>
  </Card>

  <!-- Database Schema -->
  <Card class="doc-card">
    <h3 class="section-title">Database Tables</h3>

    <div class="schema-grid">
      <div class="schema-table">
        <h4>qa_test_specs</h4>
        <ul>
          <li><code>id</code> - UUID primary key</li>
          <li><code>name</code> - Test name</li>
          <li><code>nl_spec</code> - Natural language description</li>
          <li><code>generated_code</code> - Playwright code</li>
          <li><code>target_app</code> - dash/admin/api/vr</li>
          <li><code>status</code> - draft/active/disabled</li>
          <li><code>heal_count</code> - Times auto-healed</li>
          <li><code>flaky_score</code> - 0-100 flakiness</li>
        </ul>
      </div>

      <div class="schema-table">
        <h4>qa_test_runs</h4>
        <ul>
          <li><code>id</code> - UUID primary key</li>
          <li><code>run_number</code> - Auto-increment</li>
          <li><code>status</code> - queued/running/passed/failed</li>
          <li><code>total_specs</code> - Count of specs</li>
          <li><code>passed_count</code> - Passed tests</li>
          <li><code>healed_count</code> - Auto-healed tests</li>
          <li><code>duration_ms</code> - Execution time</li>
          <li><code>report_url</code> - Playwright report</li>
        </ul>
      </div>

      <div class="schema-table">
        <h4>qa_test_results</h4>
        <ul>
          <li><code>id</code> - UUID primary key</li>
          <li><code>run_id</code> - Parent run</li>
          <li><code>spec_id</code> - Test spec</li>
          <li><code>status</code> - passed/failed/healed</li>
          <li><code>was_healed</code> - Boolean flag</li>
          <li><code>heal_reason</code> - Why healed</li>
          <li><code>error_message</code> - Failure details</li>
          <li><code>screenshot_url</code> - Failure screenshot</li>
        </ul>
      </div>
    </div>
  </Card>

  <!-- Setup Instructions -->
  <Card class="doc-card">
    <h3 class="section-title">Setup Instructions</h3>

    <div class="setup-steps">
      <div class="setup-step">
        <h4>1. Run Database Migration</h4>
        <pre class="command">docker exec -i supabase-db psql -U postgres -d postgres &lt; supabase/migrations/20260117_create_qa_system.sql</pre>
      </div>

      <div class="setup-step">
        <h4>2. Add QA Capability to Roles</h4>
        <pre class="command">{`INSERT INTO internal.team_capabilities (role_id, capability)
SELECT id, 'ops.qa.view' FROM internal.team_roles WHERE name IN ('developer', 'ops');`}</pre>
      </div>

      <div class="setup-step">
        <h4>3. Initialize Playwright Agents</h4>
        <pre class="command">npx playwright init-agents --loop=claude</pre>
      </div>

      <div class="setup-step">
        <h4>4. Configure Backend API</h4>
        <p>Implement <code>POST /api/qa/generate-test</code> and <code>POST /api/qa/execute-run</code> endpoints.</p>
      </div>
    </div>
  </Card>
</div>

<style lang="postcss">
  @reference '$theme';

  .docs-container {
    @apply flex flex-col gap-6;
  }

  :global(.doc-card) {
    @apply p-6;
  }

  .doc-title {
    @apply text-xl font-bold text-base06 mb-2;
  }

  .doc-intro {
    @apply text-base04 mb-6;
  }

  .section-title {
    @apply text-lg font-semibold text-base06 mb-2;
  }

  .section-desc {
    @apply text-sm text-base04 mb-4;
  }

  /* Architecture Diagram */
  .architecture-diagram {
    @apply bg-base00 rounded-lg p-4 overflow-x-auto;
  }

  .diagram {
    @apply text-xs font-mono text-base05 whitespace-pre;
  }

  /* Agents Grid */
  .agents-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .agent-card {
    @apply p-4 rounded-lg border;
  }

  .agent-card.planner {
    @apply bg-base0D/10 border-base0D/30;
  }

  .agent-card.generator {
    @apply bg-base0E/10 border-base0E/30;
  }

  .agent-card.healer {
    @apply bg-base0B/10 border-base0B/30;
  }

  .agent-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center mb-3;
  }

  .planner .agent-icon {
    @apply bg-base0D/20 text-base0D;
  }

  .generator .agent-icon {
    @apply bg-base0E/20 text-base0E;
  }

  .healer .agent-icon {
    @apply bg-base0B/20 text-base0B;
  }

  .agent-card h4 {
    @apply text-base font-medium text-base06 mb-2;
  }

  .agent-card p {
    @apply text-sm text-base04 mb-3;
  }

  .trigger {
    @apply text-xs px-2 py-1 bg-base02 rounded text-base04;
  }

  /* Flow Steps */
  .flow-steps {
    @apply flex flex-wrap items-start gap-4;
  }

  .flow-step {
    @apply flex-1 min-w-[200px] flex gap-3;
  }

  .step-number {
    @apply w-8 h-8 rounded-full bg-base0D text-white;
    @apply flex items-center justify-center text-sm font-bold;
    @apply flex-shrink-0;
  }

  .step-content h4 {
    @apply text-sm font-medium text-base06 mb-2;
  }

  .step-content p {
    @apply text-sm text-base04;
  }

  .example-box {
    @apply p-3 bg-base02 rounded-lg text-sm text-base05 italic;
  }

  .code-example {
    @apply p-3 bg-base00 rounded-lg text-xs font-mono text-base05;
    @apply overflow-x-auto;
  }

  .flow-arrow {
    @apply text-2xl text-base04 self-center hidden md:block;
  }

  /* Heal Flow */
  .heal-flow {
    @apply flex flex-col gap-3;
  }

  .heal-step {
    @apply flex items-center gap-4 p-3 rounded-lg;
  }

  .heal-step.fail {
    @apply bg-base08/10;
  }

  .heal-step.analyze {
    @apply bg-base0A/10;
  }

  .heal-step.fix {
    @apply bg-base0E/10;
  }

  .heal-step.pass {
    @apply bg-base0B/10;
  }

  .heal-icon {
    @apply text-xl w-8 text-center;
  }

  .heal-content strong {
    @apply text-sm text-base06 block mb-1;
  }

  .heal-content code {
    @apply text-xs font-mono text-base04;
  }

  .heal-content p {
    @apply text-xs text-base04;
  }

  /* Schema Grid */
  .schema-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .schema-table {
    @apply p-4 bg-base02/50 rounded-lg;
  }

  .schema-table h4 {
    @apply text-sm font-medium text-base0D mb-3 font-mono;
  }

  .schema-table ul {
    @apply space-y-1;
  }

  .schema-table li {
    @apply text-xs text-base04;
  }

  .schema-table code {
    @apply text-base05 font-mono;
  }

  /* Setup Steps */
  .setup-steps {
    @apply flex flex-col gap-4;
  }

  .setup-step {
    @apply p-4 bg-base02/50 rounded-lg;
  }

  .setup-step h4 {
    @apply text-sm font-medium text-base06 mb-2;
  }

  .setup-step p {
    @apply text-sm text-base04;
  }

  .command {
    @apply p-3 bg-base00 rounded text-xs font-mono text-base05;
    @apply overflow-x-auto;
  }
</style>
