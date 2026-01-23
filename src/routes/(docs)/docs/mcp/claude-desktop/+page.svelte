<script>
  import {Terminal, Copy, Check, AlertTriangle, CheckCircle, ArrowLeft, ExternalLink, Key, Settings} from '@lucide/svelte';

  let copiedCode = $state(null);

  function copyCode(code, id) {
    navigator.clipboard.writeText(code);
    copiedCode = id;
    setTimeout(() => copiedCode = null, 2000);
  }

  const configExample = `{
  "mcpServers": {
    "selify": {
      "url": "https://api.selify.ai/mcp/sse",
      "transport": "sse",
      "headers": {
        "X-API-Key": "sk_live_yourworkspace_..."
      }
    }
  }
}`;

  const configPathMac = `~/Library/Application Support/Claude/claude_desktop_config.json`;
  const configPathWindows = `%APPDATA%\\Claude\\claude_desktop_config.json`;
  const configPathLinux = `~/.config/Claude/claude_desktop_config.json`;

  const examplePrompts = [
    "Search my store for blue summer dresses under $100",
    "What's our return policy?",
    "Find products similar to the floral maxi dress",
    "What are our brand guidelines for social media?",
    "Show me the top 5 products in stock"
  ];
</script>

<svelte:head>
  <title>Claude Desktop Setup - MCP | Selify Docs</title>
  <meta name="description" content="Set up Claude Desktop to access your Selify workspace data via MCP" />
</svelte:head>

<div class="page">
  <a href="/docs/mcp" class="back-link">
    <ArrowLeft size={16} />
    Back to MCP Overview
  </a>

  <header class="page-header">
    <div class="header-content">
      <div class="header-icon">
        <Terminal size={32} />
      </div>
      <div>
        <h1 class="page-title">Claude Desktop Setup</h1>
        <p class="page-subtitle">Connect Claude Desktop to your Selify workspace</p>
      </div>
    </div>
  </header>

  <section class="prereqs-section">
    <h2 class="section-header">Prerequisites</h2>

    <div class="prereq-list">
      <div class="prereq-item">
        <CheckCircle size={18} />
        <div>
          <strong>Claude Desktop</strong>
          <p>Version 0.7.0 or later with MCP support. <a href="https://claude.ai/download" target="_blank" rel="noopener">Download Claude Desktop</a></p>
        </div>
      </div>
      <div class="prereq-item">
        <CheckCircle size={18} />
        <div>
          <strong>Selify API Key</strong>
          <p>Generate from your workspace's Integration Hub. <a href="https://dash.selify.ai" target="_blank" rel="noopener">Go to Dashboard</a></p>
        </div>
      </div>
    </div>
  </section>

  <section class="steps-section">
    <h2 class="section-header">Setup Steps</h2>

    <div class="step">
      <div class="step-number">1</div>
      <div class="step-content">
        <h3>Generate an API Key</h3>
        <ol class="step-instructions">
          <li>Go to <a href="https://dash.selify.ai" target="_blank" rel="noopener">dash.selify.ai</a> and sign in</li>
          <li>Navigate to <strong>Organization → Integrations</strong></li>
          <li>Click <strong>"Connect Integration"</strong></li>
          <li>Select <strong>"MCP (AI Agents)"</strong></li>
          <li>Name your key (e.g., "Claude Desktop")</li>
          <li>Select scopes: <code>workspace:read</code>, <code>products:search</code>, <code>knowledge:search</code></li>
          <li>Click <strong>"Generate API Key"</strong> and copy it immediately</li>
        </ol>

        <div class="warning-box">
          <AlertTriangle size={18} />
          <p>The API key is only shown once. Store it securely before proceeding.</p>
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-number">2</div>
      <div class="step-content">
        <h3>Locate Config File</h3>
        <p>Find your Claude Desktop configuration file:</p>

        <div class="platform-paths">
          <div class="path-item">
            <strong>macOS</strong>
            <code>{configPathMac}</code>
          </div>
          <div class="path-item">
            <strong>Windows</strong>
            <code>{configPathWindows}</code>
          </div>
          <div class="path-item">
            <strong>Linux</strong>
            <code>{configPathLinux}</code>
          </div>
        </div>

        <p class="tip">If the file doesn't exist, create it. The directory should exist after installing Claude Desktop.</p>
      </div>
    </div>

    <div class="step">
      <div class="step-number">3</div>
      <div class="step-content">
        <h3>Add MCP Configuration</h3>
        <p>Add the Selify MCP server to your config file:</p>

        <div class="code-block">
          <div class="code-header">
            <span>claude_desktop_config.json</span>
            <button class="copy-btn" onclick={() => copyCode(configExample, 'config')}>
              {#if copiedCode === 'config'}
                <Check size={14} />
              {:else}
                <Copy size={14} />
              {/if}
            </button>
          </div>
          <pre><code>{configExample}</code></pre>
        </div>

        <div class="important-box">
          <Key size={18} />
          <p>Replace <code>sk_live_yourworkspace_...</code> with your actual API key.</p>
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-number">4</div>
      <div class="step-content">
        <h3>Restart Claude Desktop</h3>
        <p>Completely quit and reopen Claude Desktop for the changes to take effect.</p>

        <div class="verify-section">
          <h4>Verify Connection</h4>
          <p>After restarting, you should see "selify" in Claude's available tools. Try asking:</p>
          <div class="example-prompt">
            "Search my store for blue dresses"
          </div>
          <p>If Claude uses the <code>search_products</code> tool, you're connected!</p>
        </div>
      </div>
    </div>
  </section>

  <section class="examples-section">
    <h2 class="section-header">Example Prompts</h2>

    <p class="section-intro">Once connected, try these prompts with Claude:</p>

    <div class="prompts-grid">
      {#each examplePrompts as prompt}
        <div class="prompt-card">
          <span class="prompt-text">"{prompt}"</span>
        </div>
      {/each}
    </div>
  </section>

  <section class="tools-section">
    <h2 class="section-header">Available Tools</h2>

    <p class="section-intro">Claude will have access to these tools based on your API key scopes:</p>

    <table class="tools-table">
      <thead>
        <tr>
          <th>Tool</th>
          <th>Description</th>
          <th>Scope Required</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>search_products</code></td>
          <td>Semantic search for products by natural language</td>
          <td><span class="scope-badge">products:search</span></td>
        </tr>
        <tr>
          <td><code>search_knowledge</code></td>
          <td>Search brand knowledge base (FAQs, policies)</td>
          <td><span class="scope-badge">knowledge:search</span></td>
        </tr>
        <tr>
          <td><code>get_product_details</code></td>
          <td>Get full product info by ID</td>
          <td><span class="scope-badge">products:read</span></td>
        </tr>
        <tr>
          <td><code>find_similar_products</code></td>
          <td>Find products similar to a given product</td>
          <td><span class="scope-badge">products:search</span></td>
        </tr>
        <tr>
          <td><code>get_brand_context</code></td>
          <td>Get brand voice and style guidelines</td>
          <td><span class="scope-badge">workspace:read</span></td>
        </tr>
        <tr>
          <td><code>get_workspace_stats</code></td>
          <td>Get product counts and catalog stats</td>
          <td><span class="scope-badge">workspace:read</span></td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="troubleshooting-section">
    <h2 class="section-header">Troubleshooting</h2>

    <div class="trouble-cards">
      <div class="trouble-card">
        <h3>Tools not appearing</h3>
        <ul>
          <li>Ensure Claude Desktop is version 0.7.0+</li>
          <li>Verify the config file path is correct</li>
          <li>Check JSON syntax (no trailing commas)</li>
          <li>Restart Claude Desktop completely</li>
        </ul>
      </div>

      <div class="trouble-card">
        <h3>Authentication errors</h3>
        <ul>
          <li>Verify API key is correct (starts with <code>sk_live_</code>)</li>
          <li>Check the key hasn't been revoked</li>
          <li>Ensure key has required scopes</li>
        </ul>
      </div>

      <div class="trouble-card">
        <h3>Connection timeout</h3>
        <ul>
          <li>Check your internet connection</li>
          <li>Verify <code>api.selify.ai</code> is accessible</li>
          <li>Try regenerating a new API key</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="next-section">
    <h2 class="section-header">Next Steps</h2>

    <div class="next-cards">
      <a href="/docs/mcp" class="next-card">
        <Terminal size={20} />
        <div>
          <h3>MCP Overview</h3>
          <p>Learn about all MCP features and capabilities</p>
        </div>
      </a>
      <a href="/docs/mcp/rest-api" class="next-card">
        <Settings size={20} />
        <div>
          <h3>REST API</h3>
          <p>Direct API access for custom integrations</p>
        </div>
      </a>
    </div>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .page {
    @apply w-full;
  }

  .back-link {
    @apply inline-flex items-center gap-2 text-sm text-base04 hover:text-base06 mb-6;
  }

  .page-header {
    @apply mb-8;
  }

  .header-content {
    @apply flex items-center gap-4;
  }

  .header-icon {
    @apply w-12 h-12 rounded-lg bg-base0E/20 text-base0E flex items-center justify-center;
  }

  .page-title {
    @apply text-2xl font-semibold text-base06;
  }

  .page-subtitle {
    @apply text-base04 mt-1;
  }

  .section-header {
    @apply text-xs uppercase tracking-wider text-base04 font-medium mb-4;
  }

  .section-intro {
    @apply text-base05 mb-4;
  }

  /* Prerequisites */
  .prereqs-section {
    @apply mb-10;
  }

  .prereq-list {
    @apply space-y-3;
  }

  .prereq-item {
    @apply flex items-start gap-3 bg-base01 border border-base02 rounded-lg p-4;
  }

  .prereq-item :global(svg) {
    @apply text-base0B flex-shrink-0 mt-0.5;
  }

  .prereq-item strong {
    @apply text-base06 block;
  }

  .prereq-item p {
    @apply text-sm text-base04 mt-1;
  }

  .prereq-item a {
    @apply text-base0D hover:underline;
  }

  /* Steps */
  .steps-section {
    @apply mb-10;
  }

  .step {
    @apply flex gap-4 mb-8;
  }

  .step-number {
    @apply w-8 h-8 rounded-full bg-base0D text-white flex items-center justify-center text-sm font-medium flex-shrink-0;
  }

  .step-content {
    @apply flex-1;
  }

  .step-content h3 {
    @apply text-lg font-semibold text-base06 mb-3;
  }

  .step-instructions {
    @apply list-decimal list-inside text-sm text-base05 space-y-2 mb-4;
  }

  .step-instructions code {
    @apply bg-base00 px-1.5 py-0.5 rounded text-base0D text-xs;
  }

  .step-instructions a {
    @apply text-base0D hover:underline;
  }

  .warning-box {
    @apply flex items-start gap-3 bg-base0A/10 border border-base0A/30 rounded-lg p-4 text-sm text-base0A;
  }

  .important-box {
    @apply flex items-start gap-3 bg-base0D/10 border border-base0D/30 rounded-lg p-4 text-sm text-base0D mt-4;
  }

  .important-box code {
    @apply bg-base00 px-1.5 py-0.5 rounded;
  }

  /* Platform paths */
  .platform-paths {
    @apply space-y-2 my-4;
  }

  .path-item {
    @apply bg-base00 border border-base02 rounded p-3;
  }

  .path-item strong {
    @apply text-xs text-base04 block mb-1;
  }

  .path-item code {
    @apply text-sm text-base05 font-mono;
  }

  .tip {
    @apply text-sm text-base04 mt-3;
  }

  /* Code block */
  .code-block {
    @apply bg-base00 rounded-lg border border-base02 overflow-hidden my-4;
  }

  .code-header {
    @apply flex items-center justify-between bg-base02/50 px-4 py-2 text-xs text-base04 border-b border-base02;
  }

  .copy-btn {
    @apply p-1.5 rounded hover:bg-base02 text-base04 hover:text-base06 transition-colors;
  }

  .code-block pre {
    @apply p-4 overflow-x-auto;
  }

  .code-block code {
    @apply text-sm text-base05 font-mono;
  }

  /* Verify section */
  .verify-section {
    @apply bg-base01 border border-base02 rounded-lg p-4 mt-4;
  }

  .verify-section h4 {
    @apply text-sm font-medium text-base06 mb-2;
  }

  .verify-section p {
    @apply text-sm text-base04;
  }

  .example-prompt {
    @apply bg-base00 border border-base02 rounded px-3 py-2 text-sm text-base05 italic my-2;
  }

  /* Example prompts */
  .examples-section {
    @apply mb-10;
  }

  .prompts-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-3;
  }

  .prompt-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .prompt-text {
    @apply text-sm text-base05 italic;
  }

  /* Tools table */
  .tools-section {
    @apply mb-10;
  }

  .tools-table {
    @apply w-full text-sm;
  }

  .tools-table th {
    @apply text-left text-base04 font-medium py-2 px-3 border-b border-base02;
  }

  .tools-table td {
    @apply py-3 px-3 border-b border-base02/50 text-base05;
  }

  .tools-table code {
    @apply bg-base00 px-1.5 py-0.5 rounded text-base0D text-xs;
  }

  .scope-badge {
    @apply inline-block bg-base0E/20 text-base0E px-2 py-0.5 rounded text-xs;
  }

  /* Troubleshooting */
  .troubleshooting-section {
    @apply mb-10;
  }

  .trouble-cards {
    @apply grid grid-cols-1 lg:grid-cols-3 gap-4;
  }

  .trouble-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .trouble-card h3 {
    @apply text-sm font-medium text-base06 mb-3;
  }

  .trouble-card ul {
    @apply text-sm text-base04 space-y-1;
  }

  .trouble-card code {
    @apply text-base0D;
  }

  /* Next steps */
  .next-section {
    @apply mb-10;
  }

  .next-cards {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .next-card {
    @apply flex items-center gap-4 bg-base01 border border-base02 rounded-lg p-4
           hover:border-base0D transition-colors;
  }

  .next-card :global(svg) {
    @apply text-base04;
  }

  .next-card h3 {
    @apply text-sm font-medium text-base06;
  }

  .next-card p {
    @apply text-xs text-base04;
  }
</style>
