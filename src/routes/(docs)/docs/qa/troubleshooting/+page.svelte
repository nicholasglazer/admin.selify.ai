<script>
  import {AlertTriangle, Bug, Clock, XCircle, RefreshCw, Server, Database, Zap, CheckCircle} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  const commonIssues = [
    {
      title: 'Test fails with "Element not found"',
      category: 'Selector',
      symptoms: [
        'Error: Unable to find element matching selector',
        'Test worked yesterday, fails today',
        'Screenshot shows the element exists'
      ],
      causes: [
        'UI changed: selector renamed or restructured',
        'Element loads asynchronously',
        'Element inside iframe or shadow DOM'
      ],
      solutions: [
        'Wait for auto-heal to run (usually fixes within 1 run)',
        'Manually regenerate spec with "Regenerate" button',
        'Check if element needs explicit wait: await page.waitForSelector()',
        'Use more stable selector: data-testid > class > text'
      ]
    },
    {
      title: 'Test times out',
      category: 'Timing',
      symptoms: [
        'Error: Test timeout of 30000ms exceeded',
        'Test hangs indefinitely',
        'Works locally but fails in CI'
      ],
      causes: [
        'Page loads slowly in test environment',
        'Waiting for element that never appears',
        'Network request never completes',
        'Infinite loop in application code'
      ],
      solutions: [
        'Check network tab in trace for slow/failed requests',
        'Increase timeout in spec settings (default: 30s)',
        'Add explicit waits: await page.waitForLoadState("networkidle")',
        'Check if test is waiting for wrong element'
      ]
    },
    {
      title: 'Test is flaky (passes sometimes)',
      category: 'Flaky',
      symptoms: [
        'Same test passes and fails randomly',
        'High flaky_score in dashboard',
        'Works in isolation, fails in suite'
      ],
      causes: [
        'Race condition: element not ready when clicked',
        'Animation interfering with interaction',
        'Test depends on external data',
        'Shared state between tests'
      ],
      solutions: [
        'Add explicit waits before interactions',
        'Wait for animations: await page.waitForTimeout(300)',
        'Ensure test data is isolated',
        'Use test.describe.serial() if order matters',
        'Consider simplifying the test flow'
      ]
    },
    {
      title: 'Generated code is wrong',
      category: 'Generation',
      symptoms: [
        'Code doesn\'t match NL description',
        'Missing assertions',
        'Wrong URLs or selectors'
      ],
      causes: [
        'Ambiguous NL description',
        'DeepSeek model limitations',
        'Target app not specified correctly'
      ],
      solutions: [
        'Be more specific in NL description',
        'Include exact text, URLs, expected outcomes',
        'Try regenerating with different phrasing',
        'Manually edit generated code if needed'
      ]
    },
    {
      title: 'Auto-heal not working',
      category: 'Healing',
      symptoms: [
        'Test keeps failing despite UI only changing slightly',
        'heal_count not incrementing',
        'Same error repeated'
      ],
      causes: [
        'Change too complex for auto-heal',
        'Multiple issues in same test',
        'Healing confidence too low'
      ],
      solutions: [
        'Check heal_history for attempted fixes',
        'Regenerate entire spec from NL',
        'Break complex test into smaller specs',
        'Manually update generated code'
      ]
    },
    {
      title: 'Run stuck in "queued" status',
      category: 'Infrastructure',
      symptoms: [
        'Run created but never starts',
        'Status stays "queued" indefinitely'
      ],
      causes: [
        'Temporal worker not running',
        'Task queue backlog',
        'Worker crashed'
      ],
      solutions: [
        'Check Temporal UI: localhost:8089',
        'Verify internal-worker is running: docker logs selify-internal-worker',
        'Restart worker: docker compose restart internal-worker',
        'Check for errors in worker logs'
      ]
    },
    {
      title: 'Screenshots/videos not captured',
      category: 'Artifacts',
      symptoms: [
        'Failed test has no screenshot',
        'Video URL is null',
        'Trace not available'
      ],
      causes: [
        'Storage volume not mounted',
        'Disk space full',
        'Playwright config missing artifact settings'
      ],
      solutions: [
        'Check qa-runner volume mounts',
        'Verify /tmp/qa-artifacts has space',
        'Check playwright.config.ts has screenshot: "only-on-failure"'
      ]
    },
    {
      title: 'Production run blocked',
      category: 'Permissions',
      symptoms: [
        'Cannot run tests on production',
        'Button disabled or returns 403'
      ],
      causes: [
        'RBAC: production runs restricted to ops',
        'Suite environment set to staging-only'
      ],
      solutions: [
        'Contact ops team for production access',
        'Update suite settings if you have permission',
        'Run on staging first, then request production run'
      ]
    }
  ];
</script>

<svelte:head>
  <title>QA Troubleshooting - Selify Docs</title>
  <meta name="description" content="Common issues and solutions for the QA automation system" />
</svelte:head>

<div class="troubleshoot-page">
  <header class="page-header">
    <h1 class="page-title">
      <AlertTriangle size={32} />
      QA Troubleshooting Guide
    </h1>
    <p class="page-description">
      Common issues and solutions for the AI-first test automation system.
    </p>
    <div class="header-badges">
      <Badge variant="warning" size="sm">Internal Only</Badge>
      <Badge variant="secondary" size="sm">{commonIssues.length} Issues Covered</Badge>
    </div>
  </header>

  <nav class="quick-nav">
    <h2>Quick Jump</h2>
    <div class="nav-tags">
      <a href="#selector" class="nav-tag">Selector Issues</a>
      <a href="#timing" class="nav-tag">Timeout/Timing</a>
      <a href="#flaky" class="nav-tag">Flaky Tests</a>
      <a href="#generation" class="nav-tag">Code Generation</a>
      <a href="#healing" class="nav-tag">Auto-Healing</a>
      <a href="#infrastructure" class="nav-tag">Infrastructure</a>
    </div>
  </nav>

  <section class="issues-list">
    {#each commonIssues as issue}
      <div class="issue-card" id={issue.category.toLowerCase()}>
        <div class="issue-header">
          <h2>{issue.title}</h2>
          <Badge variant="secondary" size="sm">{issue.category}</Badge>
        </div>

        <div class="issue-content">
          <div class="symptoms">
            <h3><Bug size={16} /> Symptoms</h3>
            <ul>
              {#each issue.symptoms as symptom}
                <li>{symptom}</li>
              {/each}
            </ul>
          </div>

          <div class="causes">
            <h3><XCircle size={16} /> Possible Causes</h3>
            <ul>
              {#each issue.causes as cause}
                <li>{cause}</li>
              {/each}
            </ul>
          </div>

          <div class="solutions">
            <h3><CheckCircle size={16} /> Solutions</h3>
            <ol>
              {#each issue.solutions as solution}
                <li>{solution}</li>
              {/each}
            </ol>
          </div>
        </div>
      </div>
    {/each}
  </section>

  <section class="debug-tools">
    <h2>Debugging Tools</h2>

    <div class="tools-grid">
      <div class="tool-card">
        <h3><Server size={20} /> Temporal UI</h3>
        <p>View workflow status, history, and errors.</p>
        <code>http://localhost:8089</code>
        <ul>
          <li>Filter by workflow type: QATestRunWorkflow</li>
          <li>View activity inputs/outputs</li>
          <li>Check for failed activities</li>
          <li>See retry attempts</li>
        </ul>
      </div>

      <div class="tool-card">
        <h3><Database size={20} /> Database Queries</h3>
        <p>Direct SQL for debugging.</p>
        <pre class="sql-example">{`-- Check recent runs
SELECT run_number, status, passed_count, failed_count
FROM internal.qa_test_runs
ORDER BY created_at DESC
LIMIT 10;

-- Find flaky tests
SELECT name, flaky_score, heal_count
FROM internal.qa_test_specs
WHERE flaky_score > 20
ORDER BY flaky_score DESC;

-- Check heal history for a spec
SELECT heal_history
FROM internal.qa_test_specs
WHERE id = '<spec-uuid>';`}</pre>
      </div>

      <div class="tool-card">
        <h3><Zap size={20} /> Playwright Traces</h3>
        <p>View detailed test execution.</p>
        <ol>
          <li>Click failed test in Run Detail modal</li>
          <li>Click "View Trace" link</li>
          <li>Opens Playwright Trace Viewer</li>
          <li>See: DOM snapshots, network, console, timeline</li>
        </ol>
      </div>

      <div class="tool-card">
        <h3><RefreshCw size={20} /> Docker Logs</h3>
        <p>Check service logs.</p>
        <pre class="cmd-example">{`# Internal worker (runs QA workflows)
docker logs selify-internal-worker --tail 100 -f

# QA runner (Playwright execution)
docker logs selify-qa-runner --tail 100 -f

# Agent API (generates code)
docker logs selify-agent-api --tail 100 -f`}</pre>
      </div>
    </div>
  </section>

  <section class="escalation">
    <h2>Escalation Path</h2>

    <div class="escalation-flow">
      <div class="esc-step">
        <div class="esc-num">1</div>
        <div>
          <h4>Self-Service</h4>
          <p>Check this guide, view traces, try regenerating spec</p>
        </div>
      </div>
      <div class="esc-arrow">→</div>
      <div class="esc-step">
        <div class="esc-num">2</div>
        <div>
          <h4>QA Team</h4>
          <p>Ask in #qa-automation Discord channel</p>
        </div>
      </div>
      <div class="esc-arrow">→</div>
      <div class="esc-step">
        <div class="esc-num">3</div>
        <div>
          <h4>Create PM Task</h4>
          <p>If infrastructure issue, create task in PM board</p>
        </div>
      </div>
      <div class="esc-arrow">→</div>
      <div class="esc-step">
        <div class="esc-num">4</div>
        <div>
          <h4>Ops Team</h4>
          <p>For production issues or worker problems</p>
        </div>
      </div>
    </div>
  </section>

  <section class="faq">
    <h2>Frequently Asked Questions</h2>

    <div class="faq-list">
      <details class="faq-item">
        <summary>Why does my test work locally but fail in CI?</summary>
        <p>
          Common causes: different browser versions, timing differences, network latency.
          Try adding explicit waits and using <code>waitForLoadState("networkidle")</code>.
          Also check if test depends on local-only data or cookies.
        </p>
      </details>

      <details class="faq-item">
        <summary>How long does auto-healing take?</summary>
        <p>
          Auto-healing runs as part of the test run workflow. If a test fails, it attempts
          healing immediately. The entire process (analyze → fix → re-run) takes 30-60 seconds
          per failed test.
        </p>
      </details>

      <details class="faq-item">
        <summary>Can I manually edit generated code?</summary>
        <p>
          Yes. Open the spec detail modal → Generated Code tab. You can edit the code directly.
          However, if you regenerate from NL, your manual changes will be overwritten. Consider
          updating the NL description instead for long-term maintainability.
        </p>
      </details>

      <details class="faq-item">
        <summary>Why is my suite not running on schedule?</summary>
        <p>
          Check: 1) Schedule is enabled in suite settings, 2) Cron expression is valid,
          3) QASchedulerWorkflow is running in Temporal UI, 4) Suite has at least one active spec.
          You can manually trigger the scheduler workflow if needed.
        </p>
      </details>

      <details class="faq-item">
        <summary>How do I debug a spec that always times out?</summary>
        <p>
          1) Run with headed mode locally to see what's happening, 2) Check the trace for where
          it hangs, 3) Look for network requests that never complete, 4) Add console.log statements
          to the generated code temporarily. Often it's waiting for an element that doesn't exist
          or has a different selector.
        </p>
      </details>

      <details class="faq-item">
        <summary>What happens when quarantined tests are fixed?</summary>
        <p>
          Once a quarantined test passes 5 times consecutively, it's automatically unquarantined
          and rejoins regular test runs. You can also manually unquarantine from the spec detail
          modal if you've fixed the underlying issue.
        </p>
      </details>
    </div>
  </section>

  <footer class="page-footer">
    <p>Still stuck? Create a task in the PM board with the test details and error messages.</p>
    <div class="footer-links">
      <a href="/docs/qa/guide">← QA Guide</a>
      <a href="/docs/qa/architecture">Architecture →</a>
      <a href="/qa">Open QA Dashboard →</a>
    </div>
  </footer>
</div>

<style lang="postcss">
  @reference '$theme';

  .troubleshoot-page {
    @apply max-w-4xl mx-auto p-8;
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

  /* Quick Nav */
  .quick-nav {
    @apply bg-base01 border border-base02 rounded-lg p-5 mb-10;
  }

  .quick-nav h2 {
    @apply text-sm font-medium text-base05 uppercase tracking-wider mb-3;
  }

  .nav-tags {
    @apply flex flex-wrap gap-2;
  }

  .nav-tag {
    @apply px-3 py-1.5 bg-base02 rounded-full text-sm text-base04 hover:bg-base03 hover:text-base06 transition-colors;
  }

  /* Issues List */
  .issues-list {
    @apply space-y-6 mb-12;
  }

  .issue-card {
    @apply bg-base01 border border-base02 rounded-lg overflow-hidden;
  }

  .issue-header {
    @apply flex items-center justify-between p-5 border-b border-base02 bg-base02/30;
  }

  .issue-header h2 {
    @apply text-lg font-semibold text-base06 m-0;
  }

  .issue-content {
    @apply p-5 grid grid-cols-1 md:grid-cols-3 gap-6;
  }

  .symptoms, .causes, .solutions {
    @apply space-y-2;
  }

  .symptoms h3, .causes h3, .solutions h3 {
    @apply flex items-center gap-2 text-sm font-medium mb-2;
  }

  .symptoms h3 { @apply text-base0A; }
  .causes h3 { @apply text-base08; }
  .solutions h3 { @apply text-base0B; }

  .symptoms ul, .causes ul, .solutions ol {
    @apply text-sm text-base04 space-y-1;
  }

  .symptoms li, .causes li, .solutions li {
    @apply ml-4;
  }

  /* Debug Tools */
  .debug-tools {
    @apply mb-12;
  }

  .debug-tools h2 {
    @apply text-2xl font-semibold text-base06 mb-6;
  }

  .tools-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .tool-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .tool-card h3 {
    @apply flex items-center gap-2 text-base06 font-medium mb-2;
  }

  .tool-card > p {
    @apply text-sm text-base04 mb-3;
  }

  .tool-card code {
    @apply block bg-base00 text-base0E px-3 py-2 rounded text-sm mb-3;
  }

  .tool-card ul, .tool-card ol {
    @apply text-sm text-base04 space-y-1;
  }

  .tool-card li {
    @apply ml-4;
  }

  .sql-example, .cmd-example {
    @apply bg-base00 border border-base02 rounded p-3 text-xs font-mono text-base05 whitespace-pre overflow-x-auto;
  }

  /* Escalation */
  .escalation {
    @apply mb-12;
  }

  .escalation h2 {
    @apply text-2xl font-semibold text-base06 mb-6;
  }

  .escalation-flow {
    @apply flex flex-wrap items-center gap-4;
  }

  .esc-step {
    @apply flex-1 min-w-[200px] flex gap-3 bg-base01 border border-base02 rounded-lg p-4;
  }

  .esc-num {
    @apply w-8 h-8 rounded-full bg-base0D text-base00 flex items-center justify-center text-sm font-bold flex-shrink-0;
  }

  .esc-step h4 {
    @apply text-base06 font-medium mb-1;
  }

  .esc-step p {
    @apply text-sm text-base04;
  }

  .esc-arrow {
    @apply text-base04 text-xl hidden md:block;
  }

  /* FAQ */
  .faq {
    @apply mb-12;
  }

  .faq h2 {
    @apply text-2xl font-semibold text-base06 mb-6;
  }

  .faq-list {
    @apply space-y-2;
  }

  .faq-item {
    @apply bg-base01 border border-base02 rounded-lg;
  }

  .faq-item summary {
    @apply p-4 cursor-pointer text-base05 font-medium hover:text-base06;
  }

  .faq-item summary::-webkit-details-marker {
    @apply text-base04;
  }

  .faq-item p {
    @apply px-4 pb-4 text-sm text-base04;
  }

  .faq-item code {
    @apply bg-base02 text-base0E px-1 rounded text-xs;
  }

  /* Footer */
  .page-footer {
    @apply text-center pt-8 border-t border-base02;
  }

  .page-footer > p {
    @apply text-base04 mb-4;
  }

  .footer-links {
    @apply flex justify-center gap-6;
  }

  .footer-links a {
    @apply text-base0D hover:underline;
  }
</style>
