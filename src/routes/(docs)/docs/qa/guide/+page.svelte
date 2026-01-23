<script>
  import {TestTube2, Plus, Play, CheckCircle, AlertTriangle, Clock, RefreshCw, Layers, Calendar, Bell, Filter, Search, Eye, Pencil, Trash2} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';
</script>

<svelte:head>
  <title>QA Engineer Guide - Selify Docs</title>
  <meta name="description" content="Complete workflow guide for QA engineers using the AI-first test automation platform" />
</svelte:head>

<div class="guide-page">
  <header class="page-header">
    <h1 class="page-title">
      <TestTube2 size={32} />
      QA Engineer Guide
    </h1>
    <p class="page-description">
      Complete workflow guide for creating, managing, and maintaining AI-first tests.
      No coding required.
    </p>
    <div class="header-badges">
      <Badge variant="warning" size="sm">Internal Only</Badge>
      <Badge variant="secondary" size="sm">Updated Jan 2026</Badge>
    </div>
  </header>

  <nav class="toc">
    <h2>Contents</h2>
    <ol>
      <li><a href="#daily-workflow">Daily Workflow</a></li>
      <li><a href="#creating-specs">Creating Test Specs</a></li>
      <li><a href="#managing-suites">Managing Test Suites</a></li>
      <li><a href="#running-tests">Running Tests</a></li>
      <li><a href="#triage">Triage & Debugging</a></li>
      <li><a href="#flaky-tests">Handling Flaky Tests</a></li>
      <li><a href="#scheduling">Scheduled Runs & Alerts</a></li>
      <li><a href="#best-practices">Best Practices</a></li>
    </ol>
  </nav>

  <section id="daily-workflow" class="guide-section">
    <h2>Daily Workflow</h2>
    <p>Start your day with a quick health check of the test suite.</p>

    <div class="workflow-box">
      <h3>Morning Routine</h3>
      <ol class="workflow-steps">
        <li>
          <strong>Check overnight results</strong>
          <p>Open <code>/qa</code> → Triage tab. Review any failures from nightly runs.</p>
        </li>
        <li>
          <strong>Review auto-heals</strong>
          <p>Check Coverage tab for "Auto-healed today" count. Review what was fixed.</p>
        </li>
        <li>
          <strong>Check flaky quarantine</strong>
          <p>See if any tests were quarantined. Assign owners if needed.</p>
        </li>
        <li>
          <strong>Prioritize fixes</strong>
          <p>Real bugs → create PM task. Test issues → fix spec or regenerate.</p>
        </li>
      </ol>
    </div>

    <div class="workflow-box">
      <h3>Pre-Demo Checklist</h3>
      <ol class="workflow-steps">
        <li>Go to Suites tab → find "Pre-Demo Smoke" suite</li>
        <li>Click "Run Suite" (staging first)</li>
        <li>Watch real-time progress</li>
        <li>If all green → optionally run on production</li>
        <li>If any red → triage immediately before demo</li>
      </ol>
    </div>
  </section>

  <section id="creating-specs" class="guide-section">
    <h2>Creating Test Specs</h2>
    <p>Write tests in plain English. The AI generates Playwright code.</p>

    <div class="step-guide">
      <div class="step">
        <div class="step-header">
          <span class="step-num">1</span>
          <h4>Open NL Creator</h4>
        </div>
        <p>Click the <strong>"New Spec"</strong> button in the header. The Natural Language Creator modal opens.</p>
      </div>

      <div class="step">
        <div class="step-header">
          <span class="step-num">2</span>
          <h4>Select Target App</h4>
        </div>
        <p>Choose which app to test:</p>
        <ul>
          <li><code>dash.selify.ai</code> - Customer dashboard</li>
          <li><code>admin.selify.ai</code> - Internal admin</li>
          <li><code>api.selify.ai</code> - Backend API</li>
          <li><code>vr.selify.ai</code> - VR experience</li>
        </ul>
      </div>

      <div class="step">
        <div class="step-header">
          <span class="step-num">3</span>
          <h4>Write Natural Language Spec</h4>
        </div>
        <p>Describe what the test should do in plain English. Be specific about:</p>
        <ul>
          <li>What actions the user takes</li>
          <li>What data to enter</li>
          <li>What to verify at the end</li>
        </ul>
        <div class="example-box">
          <h5>Good Examples</h5>
          <pre>{`"User logs in with email test@example.com and password 'testpass123',
sees the dashboard with their workspace name 'Test Workspace',
and can navigate to the Wardrobe page via sidebar"

"User opens the billing page, clicks 'Add Credits',
enters amount 100, completes Stripe checkout,
and sees the new balance reflected"`}</pre>
        </div>
        <div class="warning-box">
          <h5>Avoid</h5>
          <ul>
            <li>Vague descriptions: "User does stuff"</li>
            <li>Multiple unrelated flows in one spec</li>
            <li>Missing verification steps</li>
          </ul>
        </div>
      </div>

      <div class="step">
        <div class="step-header">
          <span class="step-num">4</span>
          <h4>Generate Code</h4>
        </div>
        <p>Click <strong>"Generate"</strong>. DeepSeek will create Playwright code. This takes 5-15 seconds.</p>
        <p>Review the generated code. You don't need to understand TypeScript, but check that:</p>
        <ul>
          <li>The steps match your description</li>
          <li>There are assertions (expect statements)</li>
          <li>URLs and selectors look reasonable</li>
        </ul>
      </div>

      <div class="step">
        <div class="step-header">
          <span class="step-num">5</span>
          <h4>Configure & Save</h4>
        </div>
        <ul>
          <li><strong>Name:</strong> Short, descriptive name</li>
          <li><strong>Category:</strong> auth, billing, wardrobe, tryon, social, admin, api, other</li>
          <li><strong>Tags:</strong> Add tags like <code>smoke</code>, <code>critical</code>, <code>regression</code></li>
          <li><strong>Run on Push:</strong> Enable if this should run on git pushes</li>
        </ul>
        <p>Click <strong>"Save as Draft"</strong> to save without activating.</p>
      </div>

      <div class="step">
        <div class="step-header">
          <span class="step-num">6</span>
          <h4>Test & Activate</h4>
        </div>
        <p>Open the spec detail, click <strong>"Run on Staging"</strong> to verify it works.</p>
        <p>If it passes, change status to <strong>"Active"</strong> to include it in suites and scheduled runs.</p>
      </div>
    </div>
  </section>

  <section id="managing-suites" class="guide-section">
    <h2>Managing Test Suites</h2>
    <p>Group related tests for efficient execution.</p>

    <div class="info-box">
      <h4>Suite Types</h4>
      <div class="suite-types">
        <div class="suite-type">
          <h5>Static Suite</h5>
          <p>Hand-picked specs. You explicitly add/remove tests.</p>
          <p><em>Use for: Pre-demo, critical path, smoke tests</em></p>
        </div>
        <div class="suite-type">
          <h5>Dynamic Suite</h5>
          <p>Filter-based. Auto-includes specs matching criteria.</p>
          <p><em>Use for: "All auth tests", "All tagged 'regression'"</em></p>
        </div>
      </div>
    </div>

    <h3>Creating a Suite</h3>
    <div class="method-grid">
      <div class="method-card">
        <h4>Method 1: Natural Language</h4>
        <p>Type a description like:</p>
        <pre>"Create smoke suite with login, dashboard, and billing tests"</pre>
        <p>AI matches specs by name and creates static suite.</p>
      </div>
      <div class="method-card">
        <h4>Method 2: Filter-Based</h4>
        <p>Select filters:</p>
        <ul>
          <li>Category: auth</li>
          <li>Tags: critical</li>
          <li>Target: dash.selify.ai</li>
        </ul>
        <p>Creates dynamic suite that auto-updates.</p>
      </div>
      <div class="method-card">
        <h4>Method 3: Manual Selection</h4>
        <p>Browse specs and check boxes to add to suite.</p>
        <p>Most control, requires maintenance.</p>
      </div>
    </div>
  </section>

  <section id="running-tests" class="guide-section">
    <h2>Running Tests</h2>

    <div class="run-options">
      <div class="run-option">
        <h4><Play size={16} /> Run Single Spec</h4>
        <p>Open spec detail → Click "Run on Staging" or "Run on Production"</p>
      </div>
      <div class="run-option">
        <h4><Layers size={16} /> Run Suite</h4>
        <p>Suites tab → Click "Run Suite" on any suite card</p>
      </div>
      <div class="run-option">
        <h4><RefreshCw size={16} /> Run All</h4>
        <p>Header "Run All" button → Runs all active specs</p>
      </div>
    </div>

    <h3>Environment Selection</h3>
    <table class="env-table">
      <thead>
        <tr>
          <th>Environment</th>
          <th>URL</th>
          <th>Use For</th>
          <th>Permission</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><Badge variant="success" size="sm">Staging</Badge></td>
          <td><code>staging.selify.ai</code></td>
          <td>Daily testing, development, nightly runs</td>
          <td>All QA</td>
        </tr>
        <tr>
          <td><Badge variant="error" size="sm">Production</Badge></td>
          <td><code>dash.selify.ai</code></td>
          <td>Post-deploy verification, pre-demo</td>
          <td>Ops only</td>
        </tr>
      </tbody>
    </table>

    <h3>Real-Time Progress</h3>
    <p>When a run starts, you'll see real-time updates:</p>
    <ul>
      <li>Current step in Temporal workflow</li>
      <li>Specs completed / total</li>
      <li>Pass / fail / healed counts updating live</li>
      <li>Estimated time remaining</li>
    </ul>
  </section>

  <section id="triage" class="guide-section">
    <h2>Triage & Debugging</h2>
    <p>When tests fail, the Triage tab helps you investigate.</p>

    <h3>Triage View Features</h3>
    <ul class="feature-list">
      <li>
        <strong>Top Failing (24h)</strong> - Most frequent failures, grouped by error type
      </li>
      <li>
        <strong>Error Categories</strong> - Timeout, Selector not found, 5xx, Data issue
      </li>
      <li>
        <strong>Evidence</strong> - Screenshots, videos, traces for each failure
      </li>
      <li>
        <strong>Rerun Failed</strong> - One-click rerun of just the failed specs
      </li>
      <li>
        <strong>Link to Logs</strong> - Jump to /logs filtered by run timestamp
      </li>
    </ul>

    <h3>Debugging a Failure</h3>
    <ol class="debug-steps">
      <li>
        <strong>Check the error message</strong>
        <p>Is it a selector issue? Timeout? Server error?</p>
      </li>
      <li>
        <strong>View the screenshot</strong>
        <p>What did the page look like when it failed?</p>
      </li>
      <li>
        <strong>Check the video/trace</strong>
        <p>Watch the full test execution to see what happened.</p>
      </li>
      <li>
        <strong>Determine root cause</strong>
        <ul>
          <li><strong>UI changed?</strong> → Let auto-heal try, or regenerate spec</li>
          <li><strong>Real bug?</strong> → Create PM task, link to test run</li>
          <li><strong>Test data issue?</strong> → Fix test data or spec</li>
          <li><strong>Flaky?</strong> → Mark as flaky, investigate timing</li>
        </ul>
      </li>
    </ol>
  </section>

  <section id="flaky-tests" class="guide-section">
    <h2>Handling Flaky Tests</h2>
    <p>Flaky tests pass sometimes, fail sometimes. The system auto-detects them.</p>

    <div class="flaky-flow">
      <div class="flaky-step">
        <h4>1. Detection</h4>
        <p>System tracks pass/fail patterns. If inconsistent, <code>flaky_score</code> increases.</p>
      </div>
      <div class="flaky-step">
        <h4>2. Quarantine</h4>
        <p>When <code>flaky_score > threshold</code>, test is quarantined. Won't block other tests.</p>
      </div>
      <div class="flaky-step">
        <h4>3. Investigation</h4>
        <p>Assign owner. Check if it's timing issues, race conditions, or data problems.</p>
      </div>
      <div class="flaky-step">
        <h4>4. Fix</h4>
        <p>Options: Regenerate with better waits, simplify the test, fix underlying issue.</p>
      </div>
      <div class="flaky-step">
        <h4>5. Unquarantine</h4>
        <p>After 5 consecutive passes, test auto-unquarantines.</p>
      </div>
    </div>

    <div class="tip-box">
      <h4>Common Flaky Causes</h4>
      <ul>
        <li><strong>Timing:</strong> Element not ready when test tries to interact</li>
        <li><strong>Animation:</strong> CSS transitions interfering with clicks</li>
        <li><strong>Network:</strong> API responses slower than expected</li>
        <li><strong>Data:</strong> Test depends on data that changes</li>
      </ul>
    </div>
  </section>

  <section id="scheduling" class="guide-section">
    <h2>Scheduled Runs & Alerts</h2>
    <p>Set up automatic test runs and get notified of issues.</p>

    <h3>Configuring a Schedule</h3>
    <ol>
      <li>Open suite detail → Schedules tab</li>
      <li>Enable "Run on Schedule"</li>
      <li>Set cron expression or use presets:
        <ul>
          <li><code>0 3 * * *</code> - Every day at 3 AM</li>
          <li><code>0 */4 * * *</code> - Every 4 hours</li>
          <li><code>0 9 * * 1-5</code> - Weekdays at 9 AM</li>
        </ul>
      </li>
      <li>Set timezone (default: UTC)</li>
    </ol>

    <h3>Discord Alerts</h3>
    <ol>
      <li>Paste Discord webhook URL</li>
      <li>Set alert threshold (e.g., "Alert if pass rate &lt; 80%")</li>
      <li>Choose alert triggers:
        <ul>
          <li>On failure</li>
          <li>On flaky increase</li>
          <li>On completion (always)</li>
        </ul>
      </li>
    </ol>

    <div class="alert-example">
      <h4>Example Discord Alert</h4>
      <pre>{`🔴 QA Suite Failed: Pre-Demo Smoke
Pass Rate: 67% (target: 80%)
Passed: 8 | Failed: 4 | Healed: 0

Top Failures:
• Login flow - Timeout waiting for selector
• Billing page - Element not visible

View Run: https://admin.selify.ai/qa/runs/123`}</pre>
    </div>
  </section>

  <section id="best-practices" class="guide-section">
    <h2>Best Practices</h2>

    <div class="practices-grid">
      <div class="practice-card good">
        <h4><CheckCircle size={16} /> Do</h4>
        <ul>
          <li>Write atomic tests (one flow per spec)</li>
          <li>Include clear verification steps</li>
          <li>Use descriptive names</li>
          <li>Tag tests appropriately</li>
          <li>Run on staging before activating</li>
          <li>Review auto-heals regularly</li>
          <li>Keep suites focused (5-15 tests)</li>
        </ul>
      </div>
      <div class="practice-card bad">
        <h4><AlertTriangle size={16} /> Avoid</h4>
        <ul>
          <li>Testing multiple flows in one spec</li>
          <li>Hardcoding test data that changes</li>
          <li>Ignoring flaky tests</li>
          <li>Running production tests frequently</li>
          <li>Creating duplicate specs</li>
          <li>Skipping the review step</li>
          <li>Mega-suites with 50+ tests</li>
        </ul>
      </div>
    </div>
  </section>

  <footer class="guide-footer">
    <p>Questions? Ask in <code>#qa-automation</code> on Discord or create a PM task.</p>
    <div class="footer-links">
      <a href="/docs/qa/architecture">Architecture Docs →</a>
      <a href="/docs/qa/troubleshooting">Troubleshooting →</a>
      <a href="/qa">Open QA Dashboard →</a>
    </div>
  </footer>
</div>

<style lang="postcss">
  @reference '$theme';

  .guide-page {
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

  /* TOC */
  .toc {
    @apply bg-base01 border border-base02 rounded-lg p-5 mb-10;
  }

  .toc h2 {
    @apply text-sm font-medium text-base05 uppercase tracking-wider mb-3;
  }

  .toc ol {
    @apply grid grid-cols-2 gap-2;
  }

  .toc li {
    @apply text-sm;
  }

  .toc a {
    @apply text-base04 hover:text-base0D;
  }

  /* Sections */
  .guide-section {
    @apply mb-12 pb-8 border-b border-base02;
  }

  .guide-section h2 {
    @apply text-2xl font-semibold text-base06 mb-4;
  }

  .guide-section h3 {
    @apply text-lg font-medium text-base06 mt-6 mb-3;
  }

  .guide-section p {
    @apply text-base04 mb-4;
  }

  .guide-section ul, .guide-section ol {
    @apply text-base04 mb-4 space-y-2;
  }

  .guide-section li {
    @apply ml-4;
  }

  .guide-section code {
    @apply bg-base02 text-base0E px-1 rounded text-sm;
  }

  /* Workflow Box */
  .workflow-box {
    @apply bg-base01 border border-base02 rounded-lg p-5 mb-4;
  }

  .workflow-box h3 {
    @apply text-base06 font-medium mb-4 mt-0;
  }

  .workflow-steps {
    @apply space-y-3;
  }

  .workflow-steps li {
    @apply ml-0 pl-6 relative;
  }

  .workflow-steps li::before {
    content: counter(list-item);
    @apply absolute left-0 w-5 h-5 bg-base0D text-base00 rounded-full text-xs flex items-center justify-center;
  }

  .workflow-steps li strong {
    @apply text-base06 block;
  }

  .workflow-steps li p {
    @apply text-sm text-base04 mb-0 mt-1;
  }

  /* Step Guide */
  .step-guide {
    @apply space-y-6;
  }

  .step {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .step-header {
    @apply flex items-center gap-3 mb-3;
  }

  .step-num {
    @apply w-8 h-8 rounded-full bg-base0E text-base00 flex items-center justify-center text-sm font-bold;
  }

  .step h4 {
    @apply text-base06 font-medium m-0;
  }

  .step p {
    @apply text-base04 mb-3;
  }

  .step ul {
    @apply mb-0;
  }

  /* Example/Warning Boxes */
  .example-box, .warning-box, .info-box, .tip-box {
    @apply rounded-lg p-4 mt-4;
  }

  .example-box {
    @apply bg-base0B/10 border border-base0B/30;
  }

  .warning-box {
    @apply bg-base08/10 border border-base08/30;
  }

  .info-box {
    @apply bg-base0D/10 border border-base0D/30;
  }

  .tip-box {
    @apply bg-base0A/10 border border-base0A/30;
  }

  .example-box h5, .warning-box h5, .info-box h4, .tip-box h4 {
    @apply text-sm font-medium mb-2;
  }

  .example-box h5 { @apply text-base0B; }
  .warning-box h5 { @apply text-base08; }
  .info-box h4 { @apply text-base0D; }
  .tip-box h4 { @apply text-base0A; }

  .example-box pre {
    @apply bg-base00/50 rounded p-3 text-sm text-base05 whitespace-pre-wrap;
  }

  /* Suite Types */
  .suite-types {
    @apply grid grid-cols-2 gap-4 mt-4;
  }

  .suite-type {
    @apply bg-base00/50 rounded p-4;
  }

  .suite-type h5 {
    @apply text-base06 font-medium mb-2;
  }

  .suite-type p {
    @apply text-sm text-base04 mb-1;
  }

  .suite-type em {
    @apply text-xs text-base04;
  }

  /* Method Grid */
  .method-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4 mt-4;
  }

  .method-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .method-card h4 {
    @apply text-base06 font-medium mb-2;
  }

  .method-card p {
    @apply text-sm text-base04 mb-2;
  }

  .method-card pre {
    @apply bg-base00 rounded p-2 text-xs text-base05 mb-2;
  }

  .method-card ul {
    @apply text-sm mb-0;
  }

  /* Run Options */
  .run-options {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-6;
  }

  .run-option {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .run-option h4 {
    @apply flex items-center gap-2 text-base06 font-medium mb-2;
  }

  .run-option p {
    @apply text-sm text-base04 mb-0;
  }

  /* Env Table */
  .env-table {
    @apply w-full bg-base01 rounded-lg overflow-hidden mb-6;
  }

  .env-table th {
    @apply bg-base02 px-4 py-2 text-left text-sm font-medium text-base05;
  }

  .env-table td {
    @apply px-4 py-3 text-sm text-base04 border-t border-base02;
  }

  /* Feature List */
  .feature-list {
    @apply space-y-2 mb-6;
  }

  .feature-list li {
    @apply ml-0 pl-0;
  }

  .feature-list strong {
    @apply text-base06;
  }

  /* Debug Steps */
  .debug-steps {
    @apply space-y-4;
  }

  .debug-steps > li {
    @apply bg-base01 border border-base02 rounded-lg p-4 ml-0;
  }

  .debug-steps > li strong {
    @apply text-base06 block mb-2;
  }

  .debug-steps > li p {
    @apply text-sm text-base04 mb-2;
  }

  .debug-steps > li ul {
    @apply text-sm mt-2 mb-0;
  }

  /* Flaky Flow */
  .flaky-flow {
    @apply flex flex-wrap gap-4 mb-6;
  }

  .flaky-step {
    @apply flex-1 min-w-[180px] bg-base01 border border-base02 rounded-lg p-4;
  }

  .flaky-step h4 {
    @apply text-base06 font-medium mb-2;
  }

  .flaky-step p {
    @apply text-sm text-base04 mb-0;
  }

  /* Alert Example */
  .alert-example {
    @apply bg-base01 border border-base02 rounded-lg p-4 mt-4;
  }

  .alert-example h4 {
    @apply text-base06 font-medium mb-2;
  }

  .alert-example pre {
    @apply bg-base00 rounded p-3 text-sm text-base05 whitespace-pre-wrap;
  }

  /* Practices Grid */
  .practices-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .practice-card {
    @apply rounded-lg p-5;
  }

  .practice-card.good {
    @apply bg-base0B/10 border border-base0B/30;
  }

  .practice-card.bad {
    @apply bg-base08/10 border border-base08/30;
  }

  .practice-card h4 {
    @apply flex items-center gap-2 font-medium mb-3;
  }

  .practice-card.good h4 { @apply text-base0B; }
  .practice-card.bad h4 { @apply text-base08; }

  .practice-card ul {
    @apply space-y-1 mb-0;
  }

  .practice-card li {
    @apply text-sm text-base04 ml-0;
  }

  /* Footer */
  .guide-footer {
    @apply text-center pt-8;
  }

  .guide-footer p {
    @apply text-base04 mb-4;
  }

  .footer-links {
    @apply flex justify-center gap-6;
  }

  .footer-links a {
    @apply text-base0D hover:underline;
  }
</style>
