<script>
  import {CodeBlock} from '@miozu/jera';
</script>

<div class="page">
  <header class="page-header">
    <h1 class="page-title">Svelte 5 Reactivity Patterns</h1>
    <p class="page-subtitle">
      The definitive guide to state management in SvelteKit applications.
      Based on analysis of SvelteKit source code internals.
    </p>
  </header>

  <!-- Executive Summary -->
  <section class="summary-card">
    <h2>TL;DR - The Rules</h2>
    <div class="rules-grid">
      <div class="rule">
        <span class="rule-do">DO</span>
        <p>Initialize singletons (theme, toast) in <code>+layout.svelte</code>, pass via props</p>
      </div>
      <div class="rule">
        <span class="rule-do">DO</span>
        <p>Fetch data in <code>+layout.server.js</code>, access via <code>data</code> prop</p>
      </div>
      <div class="rule">
        <span class="rule-do">DO</span>
        <p>Create feature state in <code>+page.svelte</code>, pass to children as props</p>
      </div>
      <div class="rule">
        <span class="rule-dont">DON'T</span>
        <p>Initialize singletons in <code>+layout.js</code> (runs every navigation)</p>
      </div>
      <div class="rule">
        <span class="rule-dont">DON'T</span>
        <p>Call <code>getTheme()</code> in every component (receive as prop instead)</p>
      </div>
      <div class="rule">
        <span class="rule-dont">DON'T</span>
        <p>Use context for state that should be explicit (prefer props)</p>
      </div>
    </div>
  </section>

  <!-- SvelteKit Execution Order -->
  <section>
    <h2 class="section-header">SvelteKit Execution Order</h2>
    <p class="section-intro">
      Understanding when code runs is critical for choosing the right pattern.
      This is based on direct analysis of SvelteKit's internal source code (<code>client.js</code>).
    </p>

    <div class="execution-table">
      <div class="exec-row header">
        <span>Phase</span>
        <span>File</span>
        <span>Server</span>
        <span>Client</span>
        <span>Frequency</span>
        <span>Use For</span>
      </div>
      <div class="exec-row">
        <span class="phase">1</span>
        <code>+layout.server.js</code>
        <span class="check">Yes</span>
        <span class="cross">No</span>
        <span>Every request</span>
        <span>Auth, DB queries, secrets</span>
      </div>
      <div class="exec-row">
        <span class="phase">2</span>
        <code>+layout.js</code>
        <span class="check">Yes</span>
        <span class="check">Yes</span>
        <span class="warn">Every navigation</span>
        <span>Data transformation only</span>
      </div>
      <div class="exec-row">
        <span class="phase">3</span>
        <code>+layout.svelte</code>
        <span class="check">Yes</span>
        <span class="check">Yes</span>
        <span>Once on mount</span>
        <span>Singletons, subscriptions</span>
      </div>
      <div class="exec-row">
        <span class="phase">4</span>
        <code>onMount()</code>
        <span class="cross">No</span>
        <span class="check">Yes</span>
        <span>Once, client only</span>
        <span>Browser APIs, hydration</span>
      </div>
    </div>

    <div class="insight-box">
      <h4>Key Insight from SvelteKit Source</h4>
      <p>
        In <code>client.js:684</code>, SvelteKit cascades data:
        <code>data = {'{ ...data, ...node.data }'}</code>
      </p>
      <p>
        The critical difference: <strong>+layout.js runs on EVERY navigation</strong> (client-side routing),
        while <strong>+layout.svelte script runs ONCE</strong> when the component mounts.
      </p>
      <p>
        For singletons like theme state, running initialization on every navigation is wasteful.
        Initialize in +layout.svelte instead.
      </p>
    </div>
  </section>

  <!-- State Classification -->
  <section>
    <h2 class="section-header">State Classification</h2>
    <p class="section-intro">
      Different types of state require different patterns. Here's how to classify and handle each:
    </p>

    <div class="state-cards">
      <div class="state-card singleton">
        <div class="state-header">
          <h3>Singleton State</h3>
          <span class="state-badge">Global, One Instance</span>
        </div>
        <p><strong>Examples:</strong> Theme, Toast, Feature flags</p>
        <p><strong>Initialize:</strong> <code>+layout.svelte</code></p>
        <p><strong>Pass via:</strong> Props to children</p>
        <p><strong>Why:</strong> Module-level singleton ensures single instance; props provide explicit flow</p>
        <CodeBlock
          code={`// +layout.svelte
const themeState = getTheme();  // Singleton
onMount(() => {
  themeState.sync();
  themeState.init();
});

// Pass to children
<Sidebar {themeState} />`}
          lang="svelte"
        />
      </div>

      <div class="state-card data">
        <div class="state-header">
          <h3>Server Data</h3>
          <span class="state-badge">Fetched, Per-Request</span>
        </div>
        <p><strong>Examples:</strong> User profile, permissions, workspace</p>
        <p><strong>Initialize:</strong> <code>+layout.server.js</code></p>
        <p><strong>Pass via:</strong> <code>data</code> prop (automatic)</p>
        <p><strong>Why:</strong> Server-only, secure, automatic cascading to children</p>
        <CodeBlock
          code={`// +layout.server.js
export const load = async ({ locals }) => {
  const user = await getUser(locals.session);
  return { user, capabilities: user.capabilities };
};

// +page.svelte - automatic via data
let { data } = $props();
// data.user, data.capabilities available`}
          lang="javascript"
        />
      </div>

      <div class="state-card feature">
        <div class="state-header">
          <h3>Feature State</h3>
          <span class="state-badge">Page-Scoped, Complex</span>
        </div>
        <p><strong>Examples:</strong> PMBoardState, QAState, MailState</p>
        <p><strong>Initialize:</strong> <code>+page.svelte</code></p>
        <p><strong>Pass via:</strong> Props to child components</p>
        <p><strong>Why:</strong> Scoped to feature, can use server data in constructor</p>
        <CodeBlock
          code={`// +page.svelte
let { data } = $props();

const pmState = new PMBoardReactiveState(
  data.supabase,
  data.initialTasks
);

// Pass to children
<PMBoard {pmState} />
<PMColumn {pmState} status="todo" />`}
          lang="svelte"
        />
      </div>

      <div class="state-card local">
        <div class="state-header">
          <h3>Component-Local State</h3>
          <span class="state-badge">UI Only, Isolated</span>
        </div>
        <p><strong>Examples:</strong> Form inputs, modal open, hover state</p>
        <p><strong>Initialize:</strong> In the component</p>
        <p><strong>Pass via:</strong> N/A (stays local)</p>
        <p><strong>Why:</strong> No external dependencies, simple reactivity</p>
        <CodeBlock
          code={`// Component.svelte
let isOpen = $state(false);
let searchQuery = $state('');
let hoveredItem = $state(null);

// Derived from local state
let filteredItems = $derived(
  items.filter(i => i.name.includes(searchQuery))
);`}
          lang="svelte"
        />
      </div>
    </div>
  </section>

  <!-- Anti-Patterns -->
  <section>
    <h2 class="section-header">Anti-Patterns to Avoid</h2>

    <div class="antipattern-grid">
      <div class="antipattern">
        <h4>Singleton in +layout.js</h4>
        <CodeBlock
          code={`// +layout.js - WRONG!
export const load = () => {
  const themeState = getTheme();
  return { themeState };
};
// Runs on EVERY navigation - wasteful!`}
          lang="javascript"
        />
        <p class="fix">Fix: Initialize in +layout.svelte instead</p>
      </div>

      <div class="antipattern">
        <h4>Calling Singleton Everywhere</h4>
        <CodeBlock
          code={`// ChildComponent.svelte - WRONG!
import { getTheme } from '@miozu/jera';
const theme = getTheme();
// Breaks explicit data flow`}
          lang="svelte"
        />
        <p class="fix">Fix: Receive as prop: <code>let {'{ themeState }'} = $props()</code></p>
      </div>

      <div class="antipattern">
        <h4>Context for Everything</h4>
        <CodeBlock
          code={`// +layout.svelte - WRONG!
setContext('theme', getTheme());
setContext('user', data.user);
setContext('config', config);
// Hidden dependencies, hard to test`}
          lang="svelte"
        />
        <p class="fix">Fix: Use props for explicit flow; context only for deeply nested access</p>
      </div>

      <div class="antipattern">
        <h4>State in Shared Module</h4>
        <CodeBlock
          code={`// lib/state.js - WRONG!
export const globalUser = $state(null);
export const globalWorkspace = $state(null);
// Leaks between requests in SSR!`}
          lang="javascript"
        />
        <p class="fix">Fix: Pass from server via load functions</p>
      </div>
    </div>
  </section>

  <!-- Complete Example -->
  <section>
    <h2 class="section-header">Complete Example: Admin Layout</h2>
    <p class="section-intro">
      Here's how all the patterns come together in a real application:
    </p>

    <CodeBlock
      code={`// +layout.server.js - Server data (Phase 1)
export const load = async ({ locals, cookies }) => {
  const session = await locals.getSession();
  if (!session) throw redirect(303, '/auth/login');

  const teamMember = await getTeamMember(session.user.id);
  const capabilities = await getCapabilities(teamMember.role);

  return {
    teamMember,
    capabilities,
    apiBaseUrl: env.API_BASE_URL
  };
};`}
      lang="javascript"
    />

    <CodeBlock
      code={`<!-- +layout.svelte - Singleton init (Phase 3) -->
<script>
  import { onMount, setContext } from 'svelte';
  import { getTheme } from '@miozu/jera';
  import { getToastState, getAdminState } from '$lib/reactiveStates';

  let { data, children } = $props();

  // Singletons - initialize ONCE here
  const themeState = getTheme();
  const toastState = getToastState();
  const adminState = getAdminState({
    teamMember: data.teamMember,
    capabilities: data.capabilities
  });

  // Client-only initialization (Phase 4)
  onMount(() => {
    themeState.sync();   // Hydrate from DOM
    themeState.init();   // Setup media query listener
  });

  // Context for deeply nested components (use sparingly)
  setContext('toastState', toastState);
</script>

<!-- Pass singletons as props for explicit flow -->
<Sidebar {themeState} teamMember={data.teamMember} />

<main>
  {@render children()}
</main>

<Toaster />`}
      lang="svelte"
    />

    <CodeBlock
      code={`<!-- +page.svelte - Feature state -->
<script>
  import { PMBoardReactiveState } from '$lib/reactiveStates/pm.svelte.js';

  let { data } = $props();

  // Feature state - scoped to this page
  const pmState = new PMBoardReactiveState(
    data.supabase,
    data.tasks,
    data.teamMembers
  );
</script>

<!-- Pass feature state to children -->
<PMBoard {pmState} />

<!-- Or destructure for multiple children -->
{#each pmState.columns as column}
  <PMColumn {pmState} {column} />
{/each}`}
      lang="svelte"
    />
  </section>

  <!-- Benefits -->
  <section>
    <h2 class="section-header">Why These Patterns Matter</h2>

    <div class="benefits-grid">
      <div class="benefit">
        <h4>Performance</h4>
        <ul>
          <li>+layout.svelte runs once; +layout.js runs every navigation</li>
          <li>Props enable fine-grained reactivity tracking</li>
          <li>No wasted re-initialization of singletons</li>
        </ul>
      </div>
      <div class="benefit">
        <h4>Security</h4>
        <ul>
          <li>Server data stays on server (+layout.server.js)</li>
          <li>No state leakage between SSR requests</li>
          <li>Explicit data flow prevents accidental exposure</li>
        </ul>
      </div>
      <div class="benefit">
        <h4>Testability</h4>
        <ul>
          <li>Props can be mocked in tests</li>
          <li>Singletons/context cannot be easily mocked</li>
          <li>Clear input/output boundaries</li>
        </ul>
      </div>
      <div class="benefit">
        <h4>Maintainability</h4>
        <ul>
          <li>Clear ownership: who creates, who consumes</li>
          <li>Explicit dependencies visible in component signature</li>
          <li>Easy to trace data flow through app</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Quick Reference -->
  <section>
    <h2 class="section-header">Quick Reference Table</h2>

    <div class="reference-table">
      <div class="ref-row header">
        <span>State Type</span>
        <span>Initialize In</span>
        <span>Pass Via</span>
        <span>Example</span>
      </div>
      <div class="ref-row">
        <span>Singleton</span>
        <code>+layout.svelte</code>
        <span>Props</span>
        <span>Theme, Toast, FeatureFlags</span>
      </div>
      <div class="ref-row">
        <span>Server Data</span>
        <code>+layout.server.js</code>
        <span>data prop</span>
        <span>User, Capabilities, Config</span>
      </div>
      <div class="ref-row">
        <span>Feature State</span>
        <code>+page.svelte</code>
        <span>Props</span>
        <span>PMState, QAState, MailState</span>
      </div>
      <div class="ref-row">
        <span>Local UI</span>
        <span>Component</span>
        <span>N/A</span>
        <span>isOpen, searchQuery, hover</span>
      </div>
    </div>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .page {
    @apply w-full max-w-5xl mx-auto;
  }

  .page-header {
    @apply mb-8;
  }

  .page-title {
    @apply text-3xl font-bold text-base07 mb-2;
  }

  .page-subtitle {
    @apply text-base04 text-lg;
  }

  section {
    @apply mb-12;
  }

  .section-header {
    @apply text-xl font-semibold text-base06 mb-4 pb-2 border-b border-base02;
  }

  .section-intro {
    @apply text-base04 mb-6;
  }

  /* Summary Card */
  .summary-card {
    @apply bg-base01 rounded-xl p-6 mb-8 border border-base02;
  }

  .summary-card h2 {
    @apply text-lg font-semibold text-base07 mb-4;
  }

  .rules-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-3;
  }

  .rule {
    @apply flex items-start gap-3 p-3 rounded-lg bg-base00;
  }

  .rule-do {
    @apply px-2 py-0.5 rounded text-xs font-bold bg-base0B/20 text-base0B shrink-0;
  }

  .rule-dont {
    @apply px-2 py-0.5 rounded text-xs font-bold bg-base08/20 text-base08 shrink-0;
  }

  .rule p {
    @apply text-sm text-base05;
  }

  .rule code {
    @apply text-base0D text-xs;
  }

  /* Execution Table */
  .execution-table {
    @apply bg-base01 rounded-xl overflow-hidden mb-6;
  }

  .exec-row {
    @apply grid grid-cols-6 gap-4 p-4 border-b border-base02 text-sm;
  }

  .exec-row:last-child {
    @apply border-b-0;
  }

  .exec-row.header {
    @apply bg-base02 font-semibold text-base04 text-xs uppercase tracking-wide;
  }

  .exec-row code {
    @apply text-base0D text-xs;
  }

  .phase {
    @apply font-bold text-base0D;
  }

  .check {
    @apply text-base0B font-medium;
  }

  .cross {
    @apply text-base04;
  }

  .warn {
    @apply text-base09 font-medium;
  }

  /* Insight Box */
  .insight-box {
    @apply bg-base0C/10 border border-base0C/30 rounded-xl p-5;
  }

  .insight-box h4 {
    @apply text-base0C font-semibold mb-3;
  }

  .insight-box p {
    @apply text-sm text-base05 mb-2;
  }

  .insight-box p:last-child {
    @apply mb-0;
  }

  .insight-box code {
    @apply text-base0D text-xs bg-base02 px-1.5 py-0.5 rounded;
  }

  /* State Cards */
  .state-cards {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
  }

  .state-card {
    @apply bg-base01 rounded-xl p-5 border border-base02;
  }

  .state-card.singleton {
    @apply border-l-4 border-l-base0E;
  }

  .state-card.data {
    @apply border-l-4 border-l-base0B;
  }

  .state-card.feature {
    @apply border-l-4 border-l-base0D;
  }

  .state-card.local {
    @apply border-l-4 border-l-base04;
  }

  .state-header {
    @apply flex items-center justify-between mb-3;
  }

  .state-header h3 {
    @apply text-base07 font-semibold;
  }

  .state-badge {
    @apply text-xs px-2 py-0.5 rounded bg-base02 text-base04;
  }

  .state-card p {
    @apply text-sm text-base04 mb-2;
  }

  .state-card p strong {
    @apply text-base05;
  }

  .state-card code {
    @apply text-base0D text-xs;
  }

  /* Anti-patterns */
  .antipattern-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .antipattern {
    @apply bg-base08/5 border border-base08/20 rounded-xl p-5;
  }

  .antipattern h4 {
    @apply text-base08 font-semibold mb-3;
  }

  .fix {
    @apply text-sm text-base0B mt-3 pt-3 border-t border-base02;
  }

  .fix code {
    @apply text-base0D text-xs;
  }

  /* Benefits */
  .benefits-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .benefit {
    @apply bg-base01 rounded-xl p-5 border border-base02;
  }

  .benefit h4 {
    @apply text-base0D font-semibold mb-3;
  }

  .benefit ul {
    @apply space-y-2;
  }

  .benefit li {
    @apply text-sm text-base04 pl-4 relative;
  }

  .benefit li::before {
    content: '';
    @apply absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-base0D;
  }

  /* Reference Table */
  .reference-table {
    @apply bg-base01 rounded-xl overflow-hidden;
  }

  .ref-row {
    @apply grid grid-cols-4 gap-4 p-4 border-b border-base02;
  }

  .ref-row:last-child {
    @apply border-b-0;
  }

  .ref-row.header {
    @apply bg-base02 font-semibold text-base04 text-sm;
  }

  .ref-row span {
    @apply text-sm text-base05;
  }

  .ref-row code {
    @apply text-base0D text-xs;
  }
</style>
