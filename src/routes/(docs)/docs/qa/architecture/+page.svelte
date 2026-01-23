<script>
  import {Cog, Database, Zap, Server, Layers, Clock, RefreshCw, GitBranch} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';
</script>

<svelte:head>
  <title>QA Architecture - Selify Docs</title>
  <meta name="description" content="Technical architecture of the AI-first QA automation system" />
</svelte:head>

<div class="arch-page">
  <header class="page-header">
    <h1 class="page-title">
      <Cog size={32} />
      QA System Architecture
    </h1>
    <p class="page-description">
      Technical deep-dive into the AI-first test automation infrastructure.
    </p>
    <div class="header-badges">
      <Badge variant="warning" size="sm">Internal Only</Badge>
      <Badge variant="secondary" size="sm">Technical</Badge>
    </div>
  </header>

  <nav class="toc">
    <h2>Contents</h2>
    <ol>
      <li><a href="#overview">System Overview</a></li>
      <li><a href="#database">Database Schema</a></li>
      <li><a href="#temporal">Temporal Workflows</a></li>
      <li><a href="#execution">Test Execution</a></li>
      <li><a href="#auto-healing">Auto-Healing</a></li>
      <li><a href="#integration">Integration Points</a></li>
    </ol>
  </nav>

  <section id="overview" class="arch-section">
    <h2>System Overview</h2>

    <div class="diagram-container">
      <pre class="architecture-diagram">{`
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND LAYER                                         │
│                               admin.selify.ai/qa                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │    Specs    │  │   Suites    │  │    Runs     │  │  Schedules  │  │   Triage    │   │
│  │    Tab      │  │    Tab      │  │    Tab      │  │    Tab      │  │    Tab      │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┴────────────────┘           │
│                                           │                                              │
│                              ┌────────────▼────────────┐                                │
│                              │  QAReactiveState        │                                │
│                              │  (Svelte 5 Runes)       │                                │
│                              └────────────┬────────────┘                                │
└──────────────────────────────────────────┼──────────────────────────────────────────────┘
                                           │
                           ┌───────────────┼───────────────┐
                           │               │               │
                           ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND LAYER                                           │
├────────────────────────┬─────────────────────────────┬───────────────────────────────────┤
│   Supabase (internal)  │    agent-platform (FastAPI) │     Temporal Orchestration        │
│                        │                             │                                    │
│  internal.qa_test_     │  POST /api/qa/generate-test │  QATestRunWorkflow                │
│    specs               │    → DeepSeek NL→Code       │    - resolve_specs                │
│  internal.qa_test_     │                             │    - prepare_environment          │
│    suites              │  POST /api/qa/trigger-run   │    - execute_playwright           │
│  internal.qa_test_     │    → Start Temporal         │    - process_results              │
│    runs                │                             │    - auto_heal                    │
│  internal.qa_test_     │  GET /api/qa/run/{id}       │    - notify                       │
│    results             │    → Query progress         │                                    │
│                        │                             │  QASchedulerWorkflow              │
│  RPC Functions:        │  WebSocket /ws/qa/progress  │    - Long-running scheduler       │
│  - qa_get_dashboard_   │    → Real-time updates      │    - Triggers runs on cron        │
│    summary             │                             │                                    │
│  - qa_resolve_suite    │                             │  Task Queue:                       │
│  - qa_record_results   │                             │  internal-ops-queue               │
└────────────────────────┴─────────────────────────────┴───────────────────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXECUTION LAYER                                              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         selify-qa-runner (Docker)                                │   │
│   │                         mcr.microsoft.com/playwright                             │   │
│   │                                                                                  │   │
│   │   /tmp/qa-runs/{run_id}/                                                        │   │
│   │   ├── specs/                   ← Generated .spec.ts files from DB               │   │
│   │   │   ├── spec-001.spec.ts                                                      │   │
│   │   │   ├── spec-002.spec.ts                                                      │   │
│   │   │   └── ...                                                                   │   │
│   │   ├── playwright.config.ts     ← Standard config                                │   │
│   │   └── results/                 ← Output parsed back to DB                       │   │
│   │       ├── report.json                                                           │   │
│   │       ├── screenshots/                                                          │   │
│   │       ├── videos/                                                               │   │
│   │       └── traces/                                                               │   │
│   │                                                                                  │   │
│   │   npx playwright test specs/ --reporter=json,html                               │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                              │
│                           ┌───────────────┴───────────────┐                             │
│                           ▼                               ▼                             │
│              ┌────────────────────────┐     ┌────────────────────────┐                 │
│              │  staging.selify.ai     │     │  dash.selify.ai        │                 │
│              │  (Default target)      │     │  (Production - RBAC)   │                 │
│              └────────────────────────┘     └────────────────────────┘                 │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
      `}</pre>
    </div>
  </section>

  <section id="database" class="arch-section">
    <h2>Database Schema</h2>
    <p>All QA tables live in the <code>internal</code> schema, following the pattern of other ops features like PM board.</p>

    <div class="schema-grid">
      <div class="schema-card">
        <h3><Database size={16} /> internal.qa_test_specs</h3>
        <p>Test specifications with NL description and generated code.</p>
        <table class="schema-table">
          <tbody>
            <tr><td><code>id</code></td><td>UUID</td><td>Primary key</td></tr>
            <tr><td><code>spec_number</code></td><td>SERIAL</td><td>Human-readable ID (#1, #2)</td></tr>
            <tr><td><code>name</code></td><td>TEXT</td><td>Test name</td></tr>
            <tr><td><code>nl_spec</code></td><td>TEXT</td><td>Natural language description</td></tr>
            <tr><td><code>generated_code</code></td><td>TEXT</td><td>Playwright TypeScript code</td></tr>
            <tr><td><code>target_app</code></td><td>ENUM</td><td>dash, admin, api, vr</td></tr>
            <tr><td><code>status</code></td><td>ENUM</td><td>draft, active, disabled, archived</td></tr>
            <tr><td><code>category</code></td><td>TEXT</td><td>auth, billing, wardrobe, etc.</td></tr>
            <tr><td><code>tags</code></td><td>TEXT[]</td><td>Arbitrary tags</td></tr>
            <tr><td><code>heal_count</code></td><td>INT</td><td>Times auto-healed</td></tr>
            <tr><td><code>flaky_score</code></td><td>DECIMAL</td><td>0-100 flakiness score</td></tr>
            <tr><td><code>is_quarantined</code></td><td>BOOL</td><td>Flaky quarantine status</td></tr>
            <tr><td><code>run_on_push</code></td><td>BOOL</td><td>Trigger on git push</td></tr>
            <tr><td><code>trigger_on_repos</code></td><td>TEXT[]</td><td>Which repos trigger</td></tr>
          </tbody>
        </table>
      </div>

      <div class="schema-card">
        <h3><Layers size={16} /> internal.qa_test_suites</h3>
        <p>Named collections of tests for grouped execution.</p>
        <table class="schema-table">
          <tbody>
            <tr><td><code>id</code></td><td>UUID</td><td>Primary key</td></tr>
            <tr><td><code>name</code></td><td>TEXT</td><td>Suite name</td></tr>
            <tr><td><code>suite_type</code></td><td>TEXT</td><td>'static' or 'dynamic'</td></tr>
            <tr><td><code>spec_ids</code></td><td>UUID[]</td><td>Explicit specs (static)</td></tr>
            <tr><td><code>filter_query</code></td><td>JSONB</td><td>Filter rules (dynamic)</td></tr>
            <tr><td><code>environment</code></td><td>TEXT</td><td>staging, production, both</td></tr>
            <tr><td><code>schedule_cron</code></td><td>TEXT</td><td>Cron expression</td></tr>
            <tr><td><code>discord_webhook_url</code></td><td>TEXT</td><td>Alert destination</td></tr>
            <tr><td><code>alert_threshold</code></td><td>INT</td><td>Alert if pass rate &lt; X%</td></tr>
          </tbody>
        </table>
      </div>

      <div class="schema-card">
        <h3><Clock size={16} /> internal.qa_test_runs</h3>
        <p>Test execution sessions with aggregated results.</p>
        <table class="schema-table">
          <tbody>
            <tr><td><code>id</code></td><td>UUID</td><td>Primary key</td></tr>
            <tr><td><code>run_number</code></td><td>SERIAL</td><td>Human-readable ID</td></tr>
            <tr><td><code>suite_id</code></td><td>UUID</td><td>FK to qa_test_suites</td></tr>
            <tr><td><code>status</code></td><td>ENUM</td><td>queued, running, passed, failed, healed</td></tr>
            <tr><td><code>environment</code></td><td>TEXT</td><td>staging or production</td></tr>
            <tr><td><code>total_specs</code></td><td>INT</td><td>Total spec count</td></tr>
            <tr><td><code>passed_count</code></td><td>INT</td><td>Passed tests</td></tr>
            <tr><td><code>failed_count</code></td><td>INT</td><td>Failed tests</td></tr>
            <tr><td><code>healed_count</code></td><td>INT</td><td>Auto-healed tests</td></tr>
            <tr><td><code>temporal_workflow_id</code></td><td>TEXT</td><td>Temporal tracking</td></tr>
          </tbody>
        </table>
      </div>

      <div class="schema-card">
        <h3><RefreshCw size={16} /> internal.qa_test_results</h3>
        <p>Individual test results per run.</p>
        <table class="schema-table">
          <tbody>
            <tr><td><code>id</code></td><td>UUID</td><td>Primary key</td></tr>
            <tr><td><code>run_id</code></td><td>UUID</td><td>FK to qa_test_runs</td></tr>
            <tr><td><code>spec_id</code></td><td>UUID</td><td>FK to qa_test_specs</td></tr>
            <tr><td><code>status</code></td><td>ENUM</td><td>passed, failed, healed, skipped</td></tr>
            <tr><td><code>duration_ms</code></td><td>INT</td><td>Execution time</td></tr>
            <tr><td><code>error_message</code></td><td>TEXT</td><td>Failure details</td></tr>
            <tr><td><code>screenshot_url</code></td><td>TEXT</td><td>Failure screenshot</td></tr>
            <tr><td><code>was_healed</code></td><td>BOOL</td><td>Auto-healed flag</td></tr>
            <tr><td><code>heal_reason</code></td><td>TEXT</td><td>What was fixed</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section id="temporal" class="arch-section">
    <h2>Temporal Workflows</h2>
    <p>Durable workflow orchestration on the <code>internal-ops-queue</code> task queue.</p>

    <div class="workflow-cards">
      <div class="workflow-card">
        <h3><Zap size={16} /> QATestRunWorkflow</h3>
        <p>Main workflow for executing test runs.</p>
        <div class="workflow-steps">
          <div class="wf-step">
            <span class="step-num">1</span>
            <div>
              <strong>resolve_specs_activity</strong>
              <p>Fetch specs from suite or explicit list. Resolve dynamic filters.</p>
            </div>
          </div>
          <div class="wf-step">
            <span class="step-num">2</span>
            <div>
              <strong>prepare_environment_activity</strong>
              <p>Write spec code to temp .spec.ts files. Set base URL.</p>
            </div>
          </div>
          <div class="wf-step">
            <span class="step-num">3</span>
            <div>
              <strong>execute_playwright_activity</strong>
              <p>Run Playwright CLI. Parse JSON results. Timeout: 15 min.</p>
            </div>
          </div>
          <div class="wf-step">
            <span class="step-num">4</span>
            <div>
              <strong>process_results_activity</strong>
              <p>Record results to DB. Update flaky scores. Upload artifacts.</p>
            </div>
          </div>
          <div class="wf-step">
            <span class="step-num">5</span>
            <div>
              <strong>auto_heal_activity</strong>
              <p>For failures: DeepSeek analyzes, fixes selectors, re-runs.</p>
            </div>
          </div>
          <div class="wf-step">
            <span class="step-num">6</span>
            <div>
              <strong>notify_activity</strong>
              <p>Send Discord/Slack alerts if thresholds breached.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="workflow-card">
        <h3><Clock size={16} /> QASchedulerWorkflow</h3>
        <p>Long-running workflow for scheduled test runs.</p>
        <pre class="code-block">{`@workflow.defn
class QASchedulerWorkflow:
    @workflow.run
    async def run(self, input: SchedulerInput):
        while True:
            # Calculate next run from cron
            next_run = calculate_next_cron(
                input.schedule_cron,
                input.timezone
            )

            # Sleep until scheduled time
            await workflow.sleep_until(next_run)

            # Trigger test run as child workflow
            await workflow.execute_child_workflow(
                QATestRunWorkflow.run,
                QATestRunInput(
                    suite_id=input.suite_id,
                    environment=input.environment,
                    trigger_type="scheduled"
                )
            )`}</pre>
      </div>
    </div>
  </section>

  <section id="execution" class="arch-section">
    <h2>Test Execution Flow</h2>

    <div class="execution-diagram">
      <pre>{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TEST EXECUTION LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────────┘

1. TRIGGER
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │   Manual     │   │  Scheduled   │   │   Git Push   │   │     PR       │
   │  "Run" btn   │   │  (cron)      │   │  (webhook)   │   │  (webhook)   │
   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
          │                  │                  │                  │
          └──────────────────┴──────────────────┴──────────────────┘
                                    │
                                    ▼
2. ORCHESTRATION
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Temporal: QATestRunWorkflow                                            │
   │  Task Queue: internal-ops-queue                                         │
   │  Timeout: 30 minutes (configurable per suite)                           │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
3. PREPARATION
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Activity: prepare_environment_activity                                  │
   │                                                                          │
   │  • Query specs from internal.qa_test_specs                              │
   │  • Filter by suite, status=active                                       │
   │  • Write generated_code to /tmp/qa-runs/{run_id}/specs/*.spec.ts        │
   │  • Generate playwright.config.ts with base_url                          │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
4. EXECUTION
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Activity: execute_playwright_activity                                   │
   │  Container: selify-qa-runner (Playwright Docker image)                  │
   │                                                                          │
   │  Command:                                                                │
   │  npx playwright test specs/ --reporter=json --output=results/           │
   │                                                                          │
   │  Parallelism: 3 workers (configurable)                                  │
   │  Browsers: Chromium headless                                            │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
5. RESULTS
   ┌─────────────────────┐            ┌─────────────────────┐
   │  All Passed         │            │  Some Failed        │
   │                     │            │                     │
   │  • Record results   │            │  • Record failures  │
   │  • Update run stats │            │  • Try auto-heal    │
   │  • Mark complete    │            │  • If healed: re-run│
   └─────────────────────┘            │  • Update flaky     │
                                      └─────────────────────┘
                                                │
                                                ▼
6. NOTIFICATION
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Activity: notify_activity                                               │
   │                                                                          │
   │  If pass_rate < threshold:                                              │
   │  • POST to Discord webhook                                              │
   │  • Include: pass rate, top failures, run link                           │
   └─────────────────────────────────────────────────────────────────────────┘
      `}</pre>
    </div>
  </section>

  <section id="auto-healing" class="arch-section">
    <h2>Auto-Healing System</h2>

    <div class="healing-flow">
      <pre>{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AUTO-HEALING FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. TEST FAILS
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Error: "Unable to find element [data-testid='submit-btn']"             │
   │  Screenshot: /results/screenshots/failure-1.png                         │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
2. ANALYZE FAILURE
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  DeepSeek R1 Analysis:                                                  │
   │                                                                          │
   │  Input:                                                                  │
   │  • Error message                                                        │
   │  • Screenshot (base64)                                                  │
   │  • Original spec code                                                   │
   │  • Current DOM snapshot                                                 │
   │                                                                          │
   │  Output:                                                                 │
   │  • Diagnosis: "Selector changed from 'submit-btn' to 'submit-button'"  │
   │  • Suggested fix: Update selector                                       │
   │  • Confidence: 0.92                                                     │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
3. APPLY FIX
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  If confidence > 0.8:                                                   │
   │                                                                          │
   │  UPDATE internal.qa_test_specs                                          │
   │  SET generated_code = <fixed_code>,                                     │
   │      heal_count = heal_count + 1,                                       │
   │      heal_history = heal_history || <heal_record>                       │
   │  WHERE id = <spec_id>                                                   │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
4. RE-RUN
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Execute single spec with fixed code                                    │
   │                                                                          │
   │  If passes:                                                             │
   │  • Result status = 'healed'                                             │
   │  • was_healed = true                                                    │
   │  • heal_reason = "Selector updated: submit-btn → submit-button"        │
   │                                                                          │
   │  If still fails:                                                        │
   │  • Result status = 'failed'                                             │
   │  • Revert code change                                                   │
   │  • Flag for manual review                                               │
   └─────────────────────────────────────────────────────────────────────────┘
      `}</pre>
    </div>

    <div class="heal-types">
      <h3>Healable Issues</h3>
      <div class="heal-grid">
        <div class="heal-type">
          <h4>Selector Changes</h4>
          <p><code>data-testid</code>, <code>class</code>, <code>id</code> attribute changes</p>
          <Badge variant="success" size="sm">High success</Badge>
        </div>
        <div class="heal-type">
          <h4>Text Changes</h4>
          <p>Button text, labels, placeholder text</p>
          <Badge variant="success" size="sm">High success</Badge>
        </div>
        <div class="heal-type">
          <h4>Timing Issues</h4>
          <p>Add wait conditions, increase timeouts</p>
          <Badge variant="warning" size="sm">Medium success</Badge>
        </div>
        <div class="heal-type">
          <h4>Structure Changes</h4>
          <p>DOM hierarchy changes, new wrappers</p>
          <Badge variant="warning" size="sm">Medium success</Badge>
        </div>
      </div>
    </div>
  </section>

  <section id="integration" class="arch-section">
    <h2>Integration Points</h2>

    <div class="integration-grid">
      <div class="integration-card">
        <h3><GitBranch size={16} /> Git Push Integration</h3>
        <p>Tests run automatically when code is pushed.</p>
        <pre class="code-block">{`GitPushWorkflow
    │
    ├─► analyze_changes_activity
    │
    ├─► Run QA Tests  ◄─── HERE
    │   └─► QATestRunWorkflow (child)
    │       └─► Only specs with run_on_push=true
    │           AND trigger_on_repos contains pushed repo
    │
    └─► If tests fail:
        └─► Force trust_level = "human_required"
        └─► Create approval request`}</pre>
      </div>

      <div class="integration-card">
        <h3><Server size={16} /> API Endpoints</h3>
        <table class="api-table">
          <tbody>
            <tr>
              <td><code>POST</code></td>
              <td><code>/api/qa/generate-test</code></td>
              <td>NL → Playwright code</td>
            </tr>
            <tr>
              <td><code>POST</code></td>
              <td><code>/api/qa/trigger-run</code></td>
              <td>Start test run workflow</td>
            </tr>
            <tr>
              <td><code>GET</code></td>
              <td><code>/api/qa/run/{`{id}`}</code></td>
              <td>Get run status & results</td>
            </tr>
            <tr>
              <td><code>GET</code></td>
              <td><code>/api/qa/run/{`{id}`}/progress</code></td>
              <td>Temporal workflow progress</td>
            </tr>
            <tr>
              <td><code>POST</code></td>
              <td><code>/api/qa/suite</code></td>
              <td>Create test suite</td>
            </tr>
            <tr>
              <td><code>WS</code></td>
              <td><code>/ws/qa/progress</code></td>
              <td>Real-time updates</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="integration-card">
        <h3><Database size={16} /> RPC Functions</h3>
        <table class="api-table">
          <tbody>
            <tr>
              <td><code>qa_get_dashboard_summary()</code></td>
              <td>Stats, flaky tests, recent runs</td>
            </tr>
            <tr>
              <td><code>qa_resolve_suite(suite_id)</code></td>
              <td>Get specs for suite (static or dynamic)</td>
            </tr>
            <tr>
              <td><code>qa_record_results(run_id, results)</code></td>
              <td>Batch insert results, update stats</td>
            </tr>
            <tr>
              <td><code>qa_get_specs_for_push(repo)</code></td>
              <td>Specs to run on git push</td>
            </tr>
            <tr>
              <td><code>qa_update_flaky_scores()</code></td>
              <td>Recalculate flakiness</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <footer class="arch-footer">
    <div class="footer-links">
      <a href="/docs/qa/guide">← QA Engineer Guide</a>
      <a href="/docs/qa/troubleshooting">Troubleshooting →</a>
    </div>
  </footer>
</div>

<style lang="postcss">
  @reference '$theme';

  .arch-page {
    @apply max-w-5xl mx-auto p-8;
  }

  .page-header {
    @apply mb-8;
  }

  .page-title {
    @apply flex items-center gap-3 text-3xl font-bold text-base07 mb-3;
  }

  .page-description {
    @apply text-lg text-base04 mb-4;
  }

  .header-badges {
    @apply flex gap-2;
  }

  /* TOC */
  .toc {
    @apply bg-base01 border border-base02 rounded-lg p-5 mb-10;
  }

  .toc h2 {
    @apply text-sm font-medium text-base05 uppercase tracking-wider mb-3;
  }

  .toc ol {
    @apply flex flex-wrap gap-4;
  }

  .toc a {
    @apply text-sm text-base04 hover:text-base0D;
  }

  /* Sections */
  .arch-section {
    @apply mb-12 pb-8 border-b border-base02;
  }

  .arch-section h2 {
    @apply text-2xl font-semibold text-base06 mb-4;
  }

  .arch-section h3 {
    @apply text-lg font-medium text-base06 mt-6 mb-3 flex items-center gap-2;
  }

  .arch-section p {
    @apply text-base04 mb-4;
  }

  .arch-section code {
    @apply bg-base02 text-base0E px-1 rounded text-sm;
  }

  /* Diagrams */
  .diagram-container, .execution-diagram, .healing-flow {
    @apply bg-base01 border border-base02 rounded-lg p-4 overflow-x-auto mb-6;
  }

  .architecture-diagram, .execution-diagram pre, .healing-flow pre {
    @apply text-xs font-mono text-base05 whitespace-pre leading-relaxed;
  }

  /* Schema Grid */
  .schema-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
  }

  .schema-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .schema-card h3 {
    @apply flex items-center gap-2 text-base06 font-medium mt-0 mb-2;
  }

  .schema-card > p {
    @apply text-sm text-base04 mb-4;
  }

  .schema-table {
    @apply w-full text-sm;
  }

  .schema-table tr {
    @apply border-b border-base02;
  }

  .schema-table td {
    @apply py-1.5;
  }

  .schema-table td:first-child {
    @apply font-mono text-base0E;
  }

  .schema-table td:nth-child(2) {
    @apply text-base04 px-2;
  }

  .schema-table td:last-child {
    @apply text-base04 text-xs;
  }

  /* Workflow Cards */
  .workflow-cards {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
  }

  .workflow-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .workflow-card h3 {
    @apply flex items-center gap-2 text-base06 font-medium mt-0 mb-2;
  }

  .workflow-card > p {
    @apply text-sm text-base04 mb-4;
  }

  .workflow-steps {
    @apply space-y-3;
  }

  .wf-step {
    @apply flex gap-3;
  }

  .wf-step .step-num {
    @apply w-6 h-6 rounded-full bg-base0D text-base00 flex items-center justify-center text-xs font-bold flex-shrink-0;
  }

  .wf-step strong {
    @apply text-base05 text-sm block;
  }

  .wf-step p {
    @apply text-xs text-base04 mb-0;
  }

  .code-block {
    @apply bg-base00 border border-base02 rounded p-3 text-xs font-mono text-base05 whitespace-pre overflow-x-auto;
  }

  /* Heal Types */
  .heal-types h3 {
    @apply text-base06 font-medium mt-6 mb-4;
  }

  .heal-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .heal-type {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .heal-type h4 {
    @apply text-base06 font-medium mb-1;
  }

  .heal-type p {
    @apply text-sm text-base04 mb-2;
  }

  /* Integration Grid */
  .integration-grid {
    @apply grid grid-cols-1 gap-6;
  }

  .integration-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .integration-card h3 {
    @apply flex items-center gap-2 text-base06 font-medium mt-0 mb-4;
  }

  .api-table {
    @apply w-full text-sm;
  }

  .api-table tr {
    @apply border-b border-base02;
  }

  .api-table td {
    @apply py-2;
  }

  .api-table td:first-child {
    @apply font-mono text-base0E text-xs w-16;
  }

  .api-table td:nth-child(2) {
    @apply font-mono text-base05;
  }

  .api-table td:last-child {
    @apply text-base04;
  }

  /* Footer */
  .arch-footer {
    @apply pt-8;
  }

  .footer-links {
    @apply flex justify-between;
  }

  .footer-links a {
    @apply text-base0D hover:underline;
  }
</style>
