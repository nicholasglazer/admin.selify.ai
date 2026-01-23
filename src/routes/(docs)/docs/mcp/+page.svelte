<script>
  import {Code, Shield, Zap, Key, Terminal, ExternalLink, Copy, Check, AlertTriangle, Lock, Database, Cpu} from '@lucide/svelte';

  let copiedCode = $state(null);

  function copyCode(code, id) {
    navigator.clipboard.writeText(code);
    copiedCode = id;
    setTimeout(() => copiedCode = null, 2000);
  }

  const curlExample = `curl -X POST https://api.selify.ai/v1/tools/call \\
  -H "X-API-Key: sk_live_yourkey_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "search_products",
    "arguments": {
      "query": "blue summer dress",
      "limit": 10
    }
  }'`;

  const pythonExample = `import requests

SELIFY_API_KEY = "sk_live_yourkey_..."

# Get function schemas for OpenAI
schemas = requests.get(
    "https://api.selify.ai/v1/tools/schema",
    headers={"X-API-Key": SELIFY_API_KEY}
).json()

# Call a tool
result = requests.post(
    "https://api.selify.ai/v1/tools/call",
    headers={"X-API-Key": SELIFY_API_KEY},
    json={
        "name": "search_products",
        "arguments": {"query": "casual jacket", "limit": 5}
    }
).json()`;

  const claudeDesktopConfig = `{
  "mcpServers": {
    "my-store": {
      "url": "https://api.selify.ai/mcp/sse",
      "transport": "sse"
    }
  }
}`;

  const langchainExample = `from selify_mcp import SelifyToolkit
from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic

# Initialize toolkit
toolkit = SelifyToolkit(api_key="sk_live_yourkey_...")

# Create agent with Selify tools
agent = create_react_agent(
    ChatAnthropic(model="claude-sonnet-4-20250514"),
    tools=toolkit.get_tools()
)

# Run agent
result = await agent.ainvoke({
    "messages": [{"role": "user", "content": "Find blue dresses under $100"}]
})`;
</script>

<svelte:head>
  <title>MCP API - Selify Docs</title>
  <meta name="description" content="Connect your AI agents to Selify workspace data via MCP, OpenAI, or REST APIs" />
</svelte:head>

<div class="page">
  <header class="page-header">
    <div class="header-content">
      <div class="header-icon">
        <Cpu size={32} />
      </div>
      <div>
        <h1 class="page-title">MCP API</h1>
        <p class="page-subtitle">Connect AI agents to your workspace data</p>
      </div>
    </div>
    <div class="header-badges">
      <span class="badge badge-new">New</span>
      <span class="badge badge-version">v1.0.0</span>
    </div>
  </header>

  <section class="intro-section">
    <p class="intro-text">
      The Selify MCP API enables your AI agents to access workspace data including products,
      knowledge bases, and brand context. Supports <strong>MCP Protocol</strong> (Claude),
      <strong>OpenAI Function Calling</strong>, and <strong>REST API</strong>.
    </p>
  </section>

  <section class="protocols-section">
    <h2 class="section-header">Supported Protocols</h2>

    <div class="protocol-cards">
      <div class="protocol-card">
        <div class="protocol-icon mcp">
          <Terminal size={24} />
        </div>
        <h3>MCP Protocol</h3>
        <p>For Claude Desktop, Cursor, and MCP-compatible clients</p>
        <code>/mcp/sse</code>
      </div>

      <div class="protocol-card">
        <div class="protocol-icon openai">
          <Zap size={24} />
        </div>
        <h3>OpenAI Compatible</h3>
        <p>Function schemas for GPT-4/5 and Assistants API</p>
        <code>/v1/tools/schema</code>
      </div>

      <div class="protocol-card">
        <div class="protocol-icon rest">
          <Code size={24} />
        </div>
        <h3>REST API</h3>
        <p>Direct JSON endpoints for any client</p>
        <code>/v1/workspace/*</code>
      </div>
    </div>
  </section>

  <section class="auth-section">
    <h2 class="section-header">Authentication</h2>

    <div class="auth-methods">
      <div class="auth-method">
        <div class="auth-header">
          <Key size={20} />
          <h3>API Keys</h3>
          <span class="badge badge-primary">Recommended</span>
        </div>
        <p>Generate API keys from your workspace settings. Keys are scoped to specific permissions and rate limits.</p>

        <div class="code-block">
          <div class="code-header">
            <span>Header</span>
          </div>
          <pre><code>X-API-Key: sk_live_yourworkspace_a1b2c3d4...</code></pre>
        </div>

        <div class="key-format">
          <h4>Key Format</h4>
          <code>sk_live_&lt;workspace&gt;_&lt;random&gt;</code>
          <ul>
            <li><code>sk_live_</code> - Prefix indicating live key</li>
            <li><code>&lt;workspace&gt;</code> - First 8 chars of workspace slug</li>
            <li><code>&lt;random&gt;</code> - 32 random characters</li>
          </ul>
        </div>
      </div>

      <div class="auth-method">
        <div class="auth-header">
          <Lock size={20} />
          <h3>OAuth 2.1</h3>
          <span class="badge badge-secondary">MCP Clients</span>
        </div>
        <p>MCP clients like Claude Desktop use OAuth 2.1 with PKCE for secure authentication. Discovery via RFC 9728.</p>

        <div class="code-block">
          <div class="code-header">
            <span>Discovery Endpoint</span>
          </div>
          <pre><code>GET /.well-known/oauth-protected-resource</code></pre>
        </div>
      </div>
    </div>
  </section>

  <section class="tools-section">
    <h2 class="section-header">Available Tools</h2>

    <div class="tools-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Description</th>
            <th>Scope</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>search_products</code></td>
            <td>Semantic search using AI embeddings</td>
            <td><span class="scope-badge">products:search</span></td>
            <td>500 <span class="micro">micro</span></td>
          </tr>
          <tr>
            <td><code>search_knowledge</code></td>
            <td>RAG search over brand knowledge base</td>
            <td><span class="scope-badge">knowledge:search</span></td>
            <td>500 <span class="micro">micro</span></td>
          </tr>
          <tr>
            <td><code>get_product_details</code></td>
            <td>Full product with variants and pricing</td>
            <td><span class="scope-badge">products:read</span></td>
            <td>100 <span class="micro">micro</span></td>
          </tr>
          <tr>
            <td><code>find_similar_products</code></td>
            <td>Find similar products via embeddings</td>
            <td><span class="scope-badge">products:search</span></td>
            <td>500 <span class="micro">micro</span></td>
          </tr>
          <tr>
            <td><code>get_brand_context</code></td>
            <td>Brand voice and style guidelines</td>
            <td><span class="scope-badge">workspace:read</span></td>
            <td>100 <span class="micro">micro</span></td>
          </tr>
          <tr>
            <td><code>get_workspace_stats</code></td>
            <td>Product counts and knowledge stats</td>
            <td><span class="scope-badge">workspace:read</span></td>
            <td>100 <span class="micro">micro</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="examples-section">
    <h2 class="section-header">Quick Start</h2>

    <div class="example-tabs">
      <div class="example-card">
        <div class="example-header">
          <Terminal size={18} />
          <h3>cURL</h3>
          <button class="copy-btn" onclick={() => copyCode(curlExample, 'curl')}>
            {#if copiedCode === 'curl'}
              <Check size={14} />
            {:else}
              <Copy size={14} />
            {/if}
          </button>
        </div>
        <div class="code-block">
          <pre><code>{curlExample}</code></pre>
        </div>
      </div>

      <div class="example-card">
        <div class="example-header">
          <Code size={18} />
          <h3>Python</h3>
          <button class="copy-btn" onclick={() => copyCode(pythonExample, 'python')}>
            {#if copiedCode === 'python'}
              <Check size={14} />
            {:else}
              <Copy size={14} />
            {/if}
          </button>
        </div>
        <div class="code-block">
          <pre><code>{pythonExample}</code></pre>
        </div>
      </div>

      <div class="example-card">
        <div class="example-header">
          <Terminal size={18} />
          <h3>Claude Desktop</h3>
          <button class="copy-btn" onclick={() => copyCode(claudeDesktopConfig, 'claude')}>
            {#if copiedCode === 'claude'}
              <Check size={14} />
            {:else}
              <Copy size={14} />
            {/if}
          </button>
        </div>
        <p class="example-note">Add to <code>claude_desktop_config.json</code></p>
        <div class="code-block">
          <pre><code>{claudeDesktopConfig}</code></pre>
        </div>
      </div>

      <div class="example-card">
        <div class="example-header">
          <Zap size={18} />
          <h3>LangChain / LangGraph</h3>
          <button class="copy-btn" onclick={() => copyCode(langchainExample, 'langchain')}>
            {#if copiedCode === 'langchain'}
              <Check size={14} />
            {:else}
              <Copy size={14} />
            {/if}
          </button>
        </div>
        <div class="code-block">
          <pre><code>{langchainExample}</code></pre>
        </div>
      </div>
    </div>
  </section>

  <section class="security-section">
    <h2 class="section-header">
      <Shield size={18} />
      Security
    </h2>

    <div class="security-grid">
      <div class="security-card">
        <h3>Defense in Depth</h3>
        <ul>
          <li><strong>Transport:</strong> TLS 1.3 only</li>
          <li><strong>Auth:</strong> OAuth 2.1 + PKCE / API Keys</li>
          <li><strong>Input:</strong> Prompt injection sanitization</li>
          <li><strong>Rate Limiting:</strong> Per-workspace limits</li>
          <li><strong>Audit:</strong> Every tool call logged</li>
        </ul>
      </div>

      <div class="security-card warning">
        <div class="warning-header">
          <AlertTriangle size={18} />
          <h3>Known Attack Vectors</h3>
        </div>
        <p>Our security model protects against:</p>
        <ul>
          <li><strong>Tool Poisoning:</strong> Static registry, no dynamic loading</li>
          <li><strong>Prompt Injection:</strong> Input sanitization + logging</li>
          <li><strong>Rug Pull:</strong> Immutable tool definitions</li>
          <li><strong>Token Theft:</strong> Audience-bound tokens</li>
        </ul>
      </div>

      <div class="security-card">
        <h3>Billing Protection</h3>
        <ul>
          <li><strong>Pre-charge:</strong> Credits deducted before execution</li>
          <li><strong>DoW Protection:</strong> Prevents denial-of-wallet attacks</li>
          <li><strong>Usage Tracking:</strong> Per-tool cost monitoring</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="rate-limits-section">
    <h2 class="section-header">Rate Limits</h2>

    <table class="data-table">
      <thead>
        <tr>
          <th>Tier</th>
          <th>Per Minute</th>
          <th>Per Hour</th>
          <th>Per Day</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Free</td>
          <td>20</td>
          <td>200</td>
          <td>1,000</td>
        </tr>
        <tr>
          <td>Starter</td>
          <td>60</td>
          <td>1,000</td>
          <td>10,000</td>
        </tr>
        <tr>
          <td>Pro</td>
          <td>200</td>
          <td>5,000</td>
          <td>50,000</td>
        </tr>
        <tr>
          <td>Enterprise</td>
          <td colspan="3">Custom limits</td>
        </tr>
      </tbody>
    </table>

    <p class="rate-note">Rate limit headers included in every response: <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code></p>
  </section>

  <section class="endpoints-section">
    <h2 class="section-header">API Endpoints</h2>

    <div class="endpoint-list">
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/.well-known/oauth-protected-resource</code>
        <span class="desc">OAuth 2.1 resource metadata</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/mcp/sse</code>
        <span class="desc">MCP SSE connection</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/mcp/call</code>
        <span class="desc">Call MCP tool</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/v1/tools/schema</code>
        <span class="desc">OpenAI function schemas</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/v1/tools/call</code>
        <span class="desc">Execute tool (OpenAI compatible)</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/v1/tools/batch</code>
        <span class="desc">Batch execute tools (max 10)</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/v1/workspace/products/search</code>
        <span class="desc">REST product search</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/v1/workspace/knowledge/search</code>
        <span class="desc">REST knowledge search</span>
      </div>
    </div>
  </section>

  <section class="resources-section">
    <h2 class="section-header">Resources</h2>

    <div class="resource-cards">
      <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener" class="resource-card">
        <Terminal size={20} />
        <div>
          <h3>MCP Specification</h3>
          <p>Official Model Context Protocol docs</p>
        </div>
        <ExternalLink size={14} />
      </a>

      <a href="https://platform.openai.com/docs/guides/function-calling" target="_blank" rel="noopener" class="resource-card">
        <Zap size={20} />
        <div>
          <h3>OpenAI Function Calling</h3>
          <p>GPT function calling guide</p>
        </div>
        <ExternalLink size={14} />
      </a>

      <a href="/docs/api" class="resource-card">
        <Code size={20} />
        <div>
          <h3>API Reference</h3>
          <p>Full Selify API documentation</p>
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

  .page-header {
    @apply flex justify-between items-start mb-8;
  }

  .header-content {
    @apply flex items-center gap-4;
  }

  .header-icon {
    @apply w-12 h-12 rounded-lg bg-base0D/20 text-base0D flex items-center justify-center;
  }

  .page-title {
    @apply text-2xl font-semibold text-base06;
  }

  .page-subtitle {
    @apply text-base04 mt-1;
  }

  .header-badges {
    @apply flex gap-2;
  }

  .badge {
    @apply px-2 py-1 text-xs font-medium rounded;
  }

  .badge-new {
    @apply bg-base0B/20 text-base0B;
  }

  .badge-version {
    @apply bg-base02 text-base04;
  }

  .badge-primary {
    @apply bg-base0D/20 text-base0D;
  }

  .badge-secondary {
    @apply bg-base02 text-base04;
  }

  .intro-section {
    @apply mb-8;
  }

  .intro-text {
    @apply text-base05 text-lg leading-relaxed;
  }

  .section-header {
    @apply text-xs uppercase tracking-wider text-base04 font-medium mb-4 flex items-center gap-2;
  }

  .protocols-section {
    @apply mb-10;
  }

  .protocol-cards {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .protocol-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .protocol-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center mb-3;
  }

  .protocol-icon.mcp {
    @apply bg-base0E/20 text-base0E;
  }

  .protocol-icon.openai {
    @apply bg-base0B/20 text-base0B;
  }

  .protocol-icon.rest {
    @apply bg-base0D/20 text-base0D;
  }

  .protocol-card h3 {
    @apply text-base06 font-medium mb-1;
  }

  .protocol-card p {
    @apply text-sm text-base04 mb-3;
  }

  .protocol-card code {
    @apply text-sm bg-base00 px-2 py-1 rounded text-base0D;
  }

  .auth-section {
    @apply mb-10;
  }

  .auth-methods {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
  }

  .auth-method {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .auth-header {
    @apply flex items-center gap-2 mb-3;
  }

  .auth-header h3 {
    @apply text-base06 font-medium;
  }

  .auth-method > p {
    @apply text-sm text-base04 mb-4;
  }

  .code-block {
    @apply bg-base00 rounded border border-base02 overflow-hidden;
  }

  .code-header {
    @apply bg-base02/50 px-3 py-1.5 text-xs text-base04 border-b border-base02;
  }

  .code-block pre {
    @apply p-3 overflow-x-auto;
  }

  .code-block code {
    @apply text-sm text-base05 font-mono;
  }

  .key-format {
    @apply mt-4 pt-4 border-t border-base02;
  }

  .key-format h4 {
    @apply text-sm text-base05 font-medium mb-2;
  }

  .key-format > code {
    @apply block bg-base00 px-3 py-2 rounded text-sm text-base0D mb-3;
  }

  .key-format ul {
    @apply text-sm text-base04 space-y-1;
  }

  .key-format code {
    @apply text-base0D;
  }

  .tools-section {
    @apply mb-10;
  }

  .tools-table-container {
    @apply overflow-x-auto;
  }

  .data-table {
    @apply w-full text-sm;
  }

  .data-table th {
    @apply text-left text-base04 font-medium py-2 px-3 border-b border-base02;
  }

  .data-table td {
    @apply py-3 px-3 border-b border-base02/50 text-base05;
  }

  .data-table code {
    @apply bg-base00 px-1.5 py-0.5 rounded text-base0D text-xs;
  }

  .scope-badge {
    @apply inline-block bg-base0E/20 text-base0E px-2 py-0.5 rounded text-xs;
  }

  .micro {
    @apply text-base04 text-xs;
  }

  .examples-section {
    @apply mb-10;
  }

  .example-tabs {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
  }

  .example-card {
    @apply bg-base01 border border-base02 rounded-lg overflow-hidden;
  }

  .example-header {
    @apply flex items-center gap-2 px-4 py-2 bg-base02/50 border-b border-base02;
  }

  .example-header h3 {
    @apply text-sm text-base05 font-medium flex-1;
  }

  .copy-btn {
    @apply p-1.5 rounded hover:bg-base02 text-base04 hover:text-base06 transition-colors;
  }

  .example-note {
    @apply text-xs text-base04 px-4 py-2;
  }

  .example-card .code-block {
    @apply rounded-none border-0;
  }

  .security-section {
    @apply mb-10;
  }

  .security-grid {
    @apply grid grid-cols-1 lg:grid-cols-3 gap-4;
  }

  .security-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .security-card h3 {
    @apply text-base06 font-medium mb-3;
  }

  .security-card ul {
    @apply text-sm text-base04 space-y-2;
  }

  .security-card.warning {
    @apply border-base0A/50 bg-base0A/5;
  }

  .warning-header {
    @apply flex items-center gap-2 mb-3 text-base0A;
  }

  .warning-header h3 {
    @apply text-base0A;
  }

  .rate-limits-section {
    @apply mb-10;
  }

  .rate-note {
    @apply text-sm text-base04 mt-3;
  }

  .endpoints-section {
    @apply mb-10;
  }

  .endpoint-list {
    @apply space-y-2;
  }

  .endpoint {
    @apply flex items-center gap-3 bg-base01 border border-base02 rounded px-4 py-2.5;
  }

  .method {
    @apply text-xs font-medium px-2 py-1 rounded;
  }

  .method.get {
    @apply bg-base0B/20 text-base0B;
  }

  .method.post {
    @apply bg-base0D/20 text-base0D;
  }

  .endpoint code {
    @apply text-sm text-base05 font-mono flex-1;
  }

  .endpoint .desc {
    @apply text-sm text-base04;
  }

  .resources-section {
    @apply mb-10;
  }

  .resource-cards {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .resource-card {
    @apply flex items-center gap-3 bg-base01 border border-base02 rounded-lg p-4
           hover:border-base0D transition-colors;
  }

  .resource-card h3 {
    @apply text-sm text-base06 font-medium;
  }

  .resource-card p {
    @apply text-xs text-base04;
  }

  .resource-card > div {
    @apply flex-1;
  }

  :global(.resource-card svg:first-child) {
    @apply text-base04;
  }

  :global(.resource-card svg:last-child) {
    @apply text-base04;
  }
</style>
