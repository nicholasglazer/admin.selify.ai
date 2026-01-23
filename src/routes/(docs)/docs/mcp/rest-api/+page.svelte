<script>
  import {Code, Copy, Check, ArrowLeft, Terminal, Shield, Zap, AlertTriangle} from '@lucide/svelte';

  let copiedCode = $state(null);

  function copyCode(code, id) {
    navigator.clipboard.writeText(code);
    copiedCode = id;
    setTimeout(() => copiedCode = null, 2000);
  }

  const curlSearch = `curl -X POST https://api.selify.ai/v1/tools/call \\
  -H "X-API-Key: sk_live_yourkey_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "search_products",
    "arguments": {
      "query": "blue summer dress",
      "limit": 10,
      "in_stock_only": true
    }
  }'`;

  const responseExample = `{
  "success": true,
  "tool": "search_products",
  "result": {
    "products": [
      {
        "id": "prod_abc123",
        "title": "Ocean Blue Maxi Dress",
        "price_usd": 89.99,
        "in_stock": true,
        "image_url": "https://...",
        "similarity_score": 0.94
      }
    ],
    "total_count": 15,
    "query_embedding_ms": 45
  },
  "usage": {
    "cost_micro_units": 500,
    "remaining_credits": 495000
  }
}`;

  const pythonSdk = `import requests

class SelifyClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.selify.ai/v1"

    def call_tool(self, name: str, arguments: dict) -> dict:
        response = requests.post(
            f"{self.base_url}/tools/call",
            headers={"X-API-Key": self.api_key},
            json={"name": name, "arguments": arguments}
        )
        response.raise_for_status()
        return response.json()

    def search_products(self, query: str, **kwargs) -> dict:
        return self.call_tool("search_products", {"query": query, **kwargs})

    def search_knowledge(self, query: str, **kwargs) -> dict:
        return self.call_tool("search_knowledge", {"query": query, **kwargs})

# Usage
client = SelifyClient("sk_live_yourkey_...")
results = client.search_products("summer dresses", limit=5)`;

  const batchExample = `curl -X POST https://api.selify.ai/v1/tools/batch \\
  -H "X-API-Key: sk_live_yourkey_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "calls": [
      {"name": "get_brand_context", "arguments": {}},
      {"name": "search_products", "arguments": {"query": "summer", "limit": 3}},
      {"name": "get_workspace_stats", "arguments": {}}
    ]
  }'`;

  const endpoints = [
    {method: 'POST', path: '/v1/tools/call', desc: 'Execute a single tool', auth: true},
    {method: 'POST', path: '/v1/tools/batch', desc: 'Execute multiple tools (max 10)', auth: true},
    {method: 'GET', path: '/v1/tools/schema', desc: 'Get OpenAI function schemas', auth: false},
    {method: 'GET', path: '/v1/tools/list', desc: 'List available tools', auth: true},
    {method: 'GET', path: '/mcp/sse', desc: 'MCP SSE connection', auth: true},
    {method: 'POST', path: '/mcp/call', desc: 'MCP tool call', auth: true},
  ];

  const errorCodes = [
    {code: 400, name: 'Bad Request', desc: 'Invalid request body or arguments'},
    {code: 401, name: 'Unauthorized', desc: 'Missing or invalid API key'},
    {code: 402, name: 'Payment Required', desc: 'Insufficient credits'},
    {code: 403, name: 'Forbidden', desc: 'API key lacks required scope'},
    {code: 404, name: 'Not Found', desc: 'Tool does not exist'},
    {code: 429, name: 'Too Many Requests', desc: 'Rate limit exceeded'},
    {code: 500, name: 'Server Error', desc: 'Internal server error'},
  ];
</script>

<svelte:head>
  <title>REST API Reference - MCP | Selify Docs</title>
  <meta name="description" content="Complete REST API reference for Selify MCP integration" />
</svelte:head>

<div class="page">
  <a href="/docs/mcp" class="back-link">
    <ArrowLeft size={16} />
    Back to MCP Overview
  </a>

  <header class="page-header">
    <div class="header-content">
      <div class="header-icon">
        <Code size={32} />
      </div>
      <div>
        <h1 class="page-title">REST API Reference</h1>
        <p class="page-subtitle">Direct HTTP access to Selify tools</p>
      </div>
    </div>
    <div class="header-badges">
      <span class="badge">Base URL: api.selify.ai</span>
    </div>
  </header>

  <section class="auth-section">
    <h2 class="section-header">
      <Shield size={16} />
      Authentication
    </h2>

    <p class="section-intro">All API requests require an API key passed in the <code>X-API-Key</code> header:</p>

    <div class="auth-example">
      <code>X-API-Key: sk_live_yourworkspace_a1b2c3d4...</code>
    </div>

    <div class="info-box">
      <p>Generate API keys from your workspace's <a href="https://dash.selify.ai" target="_blank" rel="noopener">Integration Hub</a>.</p>
    </div>
  </section>

  <section class="endpoints-section">
    <h2 class="section-header">Endpoints</h2>

    <div class="endpoint-list">
      {#each endpoints as endpoint}
        <div class="endpoint">
          <span class="method" class:get={endpoint.method === 'GET'} class:post={endpoint.method === 'POST'}>
            {endpoint.method}
          </span>
          <code class="path">{endpoint.path}</code>
          <span class="desc">{endpoint.desc}</span>
          {#if endpoint.auth}
            <span class="auth-badge">Auth</span>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <section class="example-section">
    <h2 class="section-header">Search Products</h2>

    <div class="code-block">
      <div class="code-header">
        <span>cURL</span>
        <button class="copy-btn" onclick={() => copyCode(curlSearch, 'curl')}>
          {#if copiedCode === 'curl'}
            <Check size={14} />
          {:else}
            <Copy size={14} />
          {/if}
        </button>
      </div>
      <pre><code>{curlSearch}</code></pre>
    </div>

    <h3 class="response-header">Response</h3>

    <div class="code-block">
      <div class="code-header">
        <span>JSON</span>
        <button class="copy-btn" onclick={() => copyCode(responseExample, 'response')}>
          {#if copiedCode === 'response'}
            <Check size={14} />
          {:else}
            <Copy size={14} />
          {/if}
        </button>
      </div>
      <pre><code>{responseExample}</code></pre>
    </div>
  </section>

  <section class="batch-section">
    <h2 class="section-header">Batch Requests</h2>

    <p class="section-intro">Execute up to 10 tool calls in a single request:</p>

    <div class="code-block">
      <div class="code-header">
        <span>cURL - Batch Call</span>
        <button class="copy-btn" onclick={() => copyCode(batchExample, 'batch')}>
          {#if copiedCode === 'batch'}
            <Check size={14} />
          {:else}
            <Copy size={14} />
          {/if}
        </button>
      </div>
      <pre><code>{batchExample}</code></pre>
    </div>

    <div class="tip-box">
      <Zap size={16} />
      <p>Batch requests are executed in parallel and billed per individual tool call.</p>
    </div>
  </section>

  <section class="sdk-section">
    <h2 class="section-header">Python Client Example</h2>

    <p class="section-intro">A simple Python client for the Selify API:</p>

    <div class="code-block">
      <div class="code-header">
        <span>Python</span>
        <button class="copy-btn" onclick={() => copyCode(pythonSdk, 'python')}>
          {#if copiedCode === 'python'}
            <Check size={14} />
          {:else}
            <Copy size={14} />
          {/if}
        </button>
      </div>
      <pre><code>{pythonSdk}</code></pre>
    </div>
  </section>

  <section class="tools-section">
    <h2 class="section-header">Tool Reference</h2>

    <div class="tool-cards">
      <div class="tool-card">
        <h3><code>search_products</code></h3>
        <p>Semantic search for products using AI embeddings</p>
        <h4>Parameters</h4>
        <table class="params-table">
          <tbody>
            <tr><td><code>query</code></td><td>string</td><td>required</td><td>Search query</td></tr>
            <tr><td><code>limit</code></td><td>integer</td><td>1-50</td><td>Max results (default: 10)</td></tr>
            <tr><td><code>min_price_usd</code></td><td>number</td><td>optional</td><td>Minimum price filter</td></tr>
            <tr><td><code>max_price_usd</code></td><td>number</td><td>optional</td><td>Maximum price filter</td></tr>
            <tr><td><code>in_stock_only</code></td><td>boolean</td><td>optional</td><td>Only in-stock items</td></tr>
          </tbody>
        </table>
        <p class="cost">Cost: 500 micro-units</p>
      </div>

      <div class="tool-card">
        <h3><code>search_knowledge</code></h3>
        <p>RAG search over brand knowledge base</p>
        <h4>Parameters</h4>
        <table class="params-table">
          <tbody>
            <tr><td><code>query</code></td><td>string</td><td>required</td><td>Search query</td></tr>
            <tr><td><code>limit</code></td><td>integer</td><td>1-20</td><td>Max results (default: 5)</td></tr>
            <tr><td><code>source_types</code></td><td>array</td><td>optional</td><td>Filter by source type</td></tr>
          </tbody>
        </table>
        <p class="cost">Cost: 500 micro-units</p>
      </div>

      <div class="tool-card">
        <h3><code>get_product_details</code></h3>
        <p>Get full product information by ID</p>
        <h4>Parameters</h4>
        <table class="params-table">
          <tbody>
            <tr><td><code>product_id</code></td><td>uuid</td><td>required</td><td>Product UUID</td></tr>
          </tbody>
        </table>
        <p class="cost">Cost: 100 micro-units</p>
      </div>

      <div class="tool-card">
        <h3><code>find_similar_products</code></h3>
        <p>Find products similar to a given product</p>
        <h4>Parameters</h4>
        <table class="params-table">
          <tbody>
            <tr><td><code>product_id</code></td><td>uuid</td><td>required</td><td>Reference product</td></tr>
            <tr><td><code>limit</code></td><td>integer</td><td>1-20</td><td>Max results (default: 5)</td></tr>
          </tbody>
        </table>
        <p class="cost">Cost: 500 micro-units</p>
      </div>

      <div class="tool-card">
        <h3><code>get_brand_context</code></h3>
        <p>Get brand voice and style guidelines</p>
        <h4>Parameters</h4>
        <p class="no-params">No parameters required</p>
        <p class="cost">Cost: 100 micro-units</p>
      </div>

      <div class="tool-card">
        <h3><code>get_workspace_stats</code></h3>
        <p>Get product counts and catalog statistics</p>
        <h4>Parameters</h4>
        <p class="no-params">No parameters required</p>
        <p class="cost">Cost: 100 micro-units</p>
      </div>
    </div>
  </section>

  <section class="errors-section">
    <h2 class="section-header">
      <AlertTriangle size={16} />
      Error Codes
    </h2>

    <table class="errors-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {#each errorCodes as err}
          <tr>
            <td><code>{err.code}</code></td>
            <td>{err.name}</td>
            <td>{err.desc}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="headers-section">
    <h2 class="section-header">Response Headers</h2>

    <table class="headers-table">
      <thead>
        <tr>
          <th>Header</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>X-RateLimit-Limit</code></td>
          <td>Requests allowed per minute</td>
        </tr>
        <tr>
          <td><code>X-RateLimit-Remaining</code></td>
          <td>Requests remaining this minute</td>
        </tr>
        <tr>
          <td><code>X-RateLimit-Reset</code></td>
          <td>Unix timestamp when limit resets</td>
        </tr>
        <tr>
          <td><code>X-Request-Id</code></td>
          <td>Unique request ID for debugging</td>
        </tr>
        <tr>
          <td><code>X-Credits-Remaining</code></td>
          <td>Workspace credit balance (micro-units)</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="next-section">
    <h2 class="section-header">Next Steps</h2>

    <div class="next-cards">
      <a href="/docs/mcp/claude-desktop" class="next-card">
        <Terminal size={20} />
        <div>
          <h3>Claude Desktop</h3>
          <p>Set up Claude Desktop with MCP</p>
        </div>
      </a>
      <a href="/docs/mcp/openai" class="next-card">
        <Zap size={20} />
        <div>
          <h3>OpenAI GPTs</h3>
          <p>Integrate with Custom GPTs</p>
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

  .header-badges .badge {
    @apply px-3 py-1 text-xs font-mono bg-base02 text-base05 rounded;
  }

  .section-header {
    @apply text-xs uppercase tracking-wider text-base04 font-medium mb-4 flex items-center gap-2;
  }

  .section-intro {
    @apply text-base05 mb-4;
  }

  .section-intro code {
    @apply bg-base00 px-1.5 py-0.5 rounded text-base0D text-sm;
  }

  .section-intro a {
    @apply text-base0D hover:underline;
  }

  /* Auth section */
  .auth-section {
    @apply mb-10;
  }

  .auth-example {
    @apply bg-base00 border border-base02 rounded p-3 font-mono text-sm text-base05;
  }

  .info-box {
    @apply bg-base0D/10 border border-base0D/30 rounded-lg p-4 text-sm text-base0D mt-4;
  }

  .info-box a {
    @apply underline;
  }

  /* Endpoints */
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

  .endpoint .path {
    @apply text-sm text-base05 font-mono flex-1;
  }

  .endpoint .desc {
    @apply text-sm text-base04;
  }

  .auth-badge {
    @apply text-xs px-1.5 py-0.5 rounded bg-base0A/20 text-base0A;
  }

  /* Code blocks */
  .example-section, .batch-section, .sdk-section {
    @apply mb-10;
  }

  .code-block {
    @apply bg-base00 rounded-lg border border-base02 overflow-hidden;
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

  .response-header {
    @apply text-sm font-medium text-base05 mt-4 mb-2;
  }

  .tip-box {
    @apply flex items-center gap-3 bg-base0B/10 border border-base0B/30 rounded-lg p-4 text-sm text-base0B mt-4;
  }

  /* Tools section */
  .tools-section {
    @apply mb-10;
  }

  .tool-cards {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
  }

  .tool-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .tool-card h3 {
    @apply text-base06 font-medium mb-1;
  }

  .tool-card h3 code {
    @apply text-base0D;
  }

  .tool-card > p {
    @apply text-sm text-base04 mb-3;
  }

  .tool-card h4 {
    @apply text-xs uppercase tracking-wider text-base04 font-medium mb-2;
  }

  .params-table {
    @apply w-full text-xs mb-3;
  }

  .params-table td {
    @apply py-1 pr-2;
  }

  .params-table td:first-child {
    @apply font-mono text-base0D;
  }

  .params-table td:nth-child(2) {
    @apply text-base04;
  }

  .params-table td:nth-child(3) {
    @apply text-base04;
  }

  .no-params {
    @apply text-xs text-base04 italic mb-3;
  }

  .cost {
    @apply text-xs text-base0B bg-base0B/10 px-2 py-1 rounded inline-block;
  }

  /* Error codes */
  .errors-section {
    @apply mb-10;
  }

  .errors-table {
    @apply w-full text-sm;
  }

  .errors-table th {
    @apply text-left text-base04 font-medium py-2 px-3 border-b border-base02;
  }

  .errors-table td {
    @apply py-2 px-3 border-b border-base02/50 text-base05;
  }

  .errors-table code {
    @apply text-base08;
  }

  /* Headers section */
  .headers-section {
    @apply mb-10;
  }

  .headers-table {
    @apply w-full text-sm;
  }

  .headers-table th {
    @apply text-left text-base04 font-medium py-2 px-3 border-b border-base02;
  }

  .headers-table td {
    @apply py-2 px-3 border-b border-base02/50 text-base05;
  }

  .headers-table code {
    @apply bg-base00 px-1.5 py-0.5 rounded text-base0D text-xs;
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
