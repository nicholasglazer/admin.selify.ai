<script>
  import {Zap, Copy, Check, AlertTriangle, ArrowLeft, ExternalLink, Key, Code} from '@lucide/svelte';

  let copiedCode = $state(null);

  function copyCode(code, id) {
    navigator.clipboard.writeText(code);
    copiedCode = id;
    setTimeout(() => copiedCode = null, 2000);
  }

  const openaiSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Selify Store API",
    "version": "1.0.0"
  },
  "servers": [
    {"url": "https://api.selify.ai/v1"}
  ],
  "paths": {
    "/tools/call": {
      "post": {
        "operationId": "callTool",
        "summary": "Execute a Selify tool",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "arguments": {"type": "object"}
                },
                "required": ["name", "arguments"]
              }
            }
          }
        },
        "responses": {
          "200": {"description": "Tool result"}
        }
      }
    }
  }
}`;

  const pythonExample = `import openai

client = openai.OpenAI()

# Define Selify tools for your assistant
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search store products by natural language query",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": ["query"]
            }
        }
    }
]

# Create assistant with Selify tools
assistant = client.beta.assistants.create(
    name="Store Assistant",
    instructions="You help customers find products.",
    tools=tools,
    model="gpt-4-turbo"
)`;

  const functionCallExample = `import requests

SELIFY_API_KEY = "sk_live_yourworkspace_..."

def handle_function_call(name, arguments):
    """Execute Selify tool and return result"""
    response = requests.post(
        "https://api.selify.ai/v1/tools/call",
        headers={"X-API-Key": SELIFY_API_KEY},
        json={"name": name, "arguments": arguments}
    )
    return response.json()

# In your OpenAI function calling handler:
if tool_call.function.name == "search_products":
    result = handle_function_call(
        "search_products",
        json.loads(tool_call.function.arguments)
    )`;
</script>

<svelte:head>
  <title>OpenAI GPTs Integration - MCP | Selify Docs</title>
  <meta name="description" content="Integrate Selify with OpenAI GPTs and Assistants API" />
</svelte:head>

<div class="page">
  <a href="/docs/mcp" class="back-link">
    <ArrowLeft size={16} />
    Back to MCP Overview
  </a>

  <header class="page-header">
    <div class="header-content">
      <div class="header-icon">
        <Zap size={32} />
      </div>
      <div>
        <h1 class="page-title">OpenAI GPTs Integration</h1>
        <p class="page-subtitle">Use Selify tools with Custom GPTs and Assistants</p>
      </div>
    </div>
  </header>

  <section class="intro-section">
    <p class="intro-text">
      Selify provides OpenAI-compatible function schemas that work with Custom GPTs, the Assistants API,
      and any application using OpenAI's function calling feature.
    </p>
  </section>

  <section class="options-section">
    <h2 class="section-header">Integration Options</h2>

    <div class="option-cards">
      <div class="option-card">
        <div class="option-icon gpt">
          <Zap size={24} />
        </div>
        <h3>Custom GPTs (Actions)</h3>
        <p>Add Selify as an Action in your Custom GPT using our OpenAPI spec</p>
        <span class="badge">No-code</span>
      </div>

      <div class="option-card">
        <div class="option-icon api">
          <Code size={24} />
        </div>
        <h3>Assistants API</h3>
        <p>Register Selify tools with your OpenAI Assistant programmatically</p>
        <span class="badge">Code</span>
      </div>

      <div class="option-card">
        <div class="option-icon function">
          <Key size={24} />
        </div>
        <h3>Function Calling</h3>
        <p>Use Selify tools directly with chat completions function calling</p>
        <span class="badge">Code</span>
      </div>
    </div>
  </section>

  <section class="gpt-section">
    <h2 class="section-header">Custom GPT Setup (Actions)</h2>

    <div class="steps">
      <div class="step">
        <span class="step-num">1</span>
        <div class="step-content">
          <h3>Generate API Key</h3>
          <p>Create an API key from your <a href="https://dash.selify.ai" target="_blank" rel="noopener">Selify dashboard</a> Integration Hub.</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">2</span>
        <div class="step-content">
          <h3>Open GPT Editor</h3>
          <p>Go to <a href="https://chatgpt.com/gpts/editor" target="_blank" rel="noopener">ChatGPT GPT Editor</a> and create or edit your GPT.</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">3</span>
        <div class="step-content">
          <h3>Add Action</h3>
          <p>In the Configure tab, scroll to "Actions" and click "Create new action".</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">4</span>
        <div class="step-content">
          <h3>Import Schema</h3>
          <p>Click "Import from URL" and enter:</p>
          <div class="url-box">
            <code>https://api.selify.ai/v1/tools/schema?format=openai</code>
            <button class="copy-btn" onclick={() => copyCode('https://api.selify.ai/v1/tools/schema?format=openai', 'schema-url')}>
              {#if copiedCode === 'schema-url'}
                <Check size={14} />
              {:else}
                <Copy size={14} />
              {/if}
            </button>
          </div>
        </div>
      </div>

      <div class="step">
        <span class="step-num">5</span>
        <div class="step-content">
          <h3>Configure Authentication</h3>
          <p>Set authentication to "API Key" with:</p>
          <ul class="auth-settings">
            <li><strong>Auth Type:</strong> API Key</li>
            <li><strong>API Key:</strong> Your <code>sk_live_...</code> key</li>
            <li><strong>Header Name:</strong> X-API-Key</li>
          </ul>
        </div>
      </div>

      <div class="step">
        <span class="step-num">6</span>
        <div class="step-content">
          <h3>Save and Test</h3>
          <p>Save your GPT and test by asking "Search for blue dresses in my store".</p>
        </div>
      </div>
    </div>
  </section>

  <section class="assistants-section">
    <h2 class="section-header">Assistants API Integration</h2>

    <p class="section-intro">Register Selify tools with your OpenAI Assistant:</p>

    <div class="code-block">
      <div class="code-header">
        <span>Python - Create Assistant with Selify Tools</span>
        <button class="copy-btn" onclick={() => copyCode(pythonExample, 'python')}>
          {#if copiedCode === 'python'}
            <Check size={14} />
          {:else}
            <Copy size={14} />
          {/if}
        </button>
      </div>
      <pre><code>{pythonExample}</code></pre>
    </div>

    <div class="info-box">
      <AlertTriangle size={18} />
      <p>When the assistant calls a Selify function, you need to execute it against the Selify API and return the result.</p>
    </div>
  </section>

  <section class="function-section">
    <h2 class="section-header">Function Calling Handler</h2>

    <p class="section-intro">Handle Selify function calls in your application:</p>

    <div class="code-block">
      <div class="code-header">
        <span>Python - Handle Function Calls</span>
        <button class="copy-btn" onclick={() => copyCode(functionCallExample, 'function')}>
          {#if copiedCode === 'function'}
            <Check size={14} />
          {:else}
            <Copy size={14} />
          {/if}
        </button>
      </div>
      <pre><code>{functionCallExample}</code></pre>
    </div>
  </section>

  <section class="tools-section">
    <h2 class="section-header">Available Functions</h2>

    <table class="tools-table">
      <thead>
        <tr>
          <th>Function</th>
          <th>Description</th>
          <th>Parameters</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>search_products</code></td>
          <td>Semantic search for products</td>
          <td><code>query</code>, <code>limit</code>, <code>min_price_usd</code>, <code>max_price_usd</code></td>
        </tr>
        <tr>
          <td><code>search_knowledge</code></td>
          <td>Search brand knowledge base</td>
          <td><code>query</code>, <code>limit</code>, <code>source_types</code></td>
        </tr>
        <tr>
          <td><code>get_product_details</code></td>
          <td>Get full product information</td>
          <td><code>product_id</code></td>
        </tr>
        <tr>
          <td><code>find_similar_products</code></td>
          <td>Find similar products</td>
          <td><code>product_id</code>, <code>limit</code></td>
        </tr>
        <tr>
          <td><code>get_brand_context</code></td>
          <td>Get brand guidelines</td>
          <td><em>none</em></td>
        </tr>
        <tr>
          <td><code>get_workspace_stats</code></td>
          <td>Get catalog statistics</td>
          <td><em>none</em></td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="next-section">
    <h2 class="section-header">Next Steps</h2>

    <div class="next-cards">
      <a href="/docs/mcp/rest-api" class="next-card">
        <Code size={20} />
        <div>
          <h3>REST API Reference</h3>
          <p>Full API documentation with examples</p>
        </div>
      </a>
      <a href="/docs/mcp" class="next-card">
        <Zap size={20} />
        <div>
          <h3>MCP Overview</h3>
          <p>Learn about all integration options</p>
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
    @apply w-12 h-12 rounded-lg bg-base0B/20 text-base0B flex items-center justify-center;
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

  .intro-section {
    @apply mb-8;
  }

  .intro-text {
    @apply text-base05 text-lg leading-relaxed;
  }

  /* Options */
  .options-section {
    @apply mb-10;
  }

  .option-cards {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .option-card {
    @apply bg-base01 border border-base02 rounded-lg p-5;
  }

  .option-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center mb-3;
  }

  .option-icon.gpt {
    @apply bg-base0B/20 text-base0B;
  }

  .option-icon.api {
    @apply bg-base0D/20 text-base0D;
  }

  .option-icon.function {
    @apply bg-base0E/20 text-base0E;
  }

  .option-card h3 {
    @apply text-base06 font-medium mb-1;
  }

  .option-card p {
    @apply text-sm text-base04 mb-3;
  }

  .badge {
    @apply text-xs px-2 py-0.5 rounded bg-base02 text-base04;
  }

  /* Steps */
  .gpt-section {
    @apply mb-10;
  }

  .steps {
    @apply space-y-4;
  }

  .step {
    @apply flex gap-4 bg-base01 border border-base02 rounded-lg p-4;
  }

  .step-num {
    @apply w-7 h-7 rounded-full bg-base0D text-white flex items-center justify-center text-sm font-medium flex-shrink-0;
  }

  .step-content h3 {
    @apply text-sm font-medium text-base06 mb-1;
  }

  .step-content p {
    @apply text-sm text-base04;
  }

  .step-content a {
    @apply text-base0D hover:underline;
  }

  .url-box {
    @apply flex items-center gap-2 bg-base00 border border-base02 rounded px-3 py-2 mt-2;
  }

  .url-box code {
    @apply flex-1 text-sm text-base05 font-mono;
  }

  .copy-btn {
    @apply p-1.5 rounded hover:bg-base02 text-base04 hover:text-base06 transition-colors;
  }

  .auth-settings {
    @apply text-sm text-base04 space-y-1 mt-2;
  }

  .auth-settings code {
    @apply text-base0D;
  }

  /* Code blocks */
  .assistants-section, .function-section {
    @apply mb-10;
  }

  .code-block {
    @apply bg-base00 rounded-lg border border-base02 overflow-hidden;
  }

  .code-header {
    @apply flex items-center justify-between bg-base02/50 px-4 py-2 text-xs text-base04 border-b border-base02;
  }

  .code-block pre {
    @apply p-4 overflow-x-auto;
  }

  .code-block code {
    @apply text-sm text-base05 font-mono;
  }

  .info-box {
    @apply flex items-start gap-3 bg-base0A/10 border border-base0A/30 rounded-lg p-4 text-sm text-base0A mt-4;
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
