<script>
  import {Terminal, Copy, Check, ExternalLink, Lock, Zap, Globe} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  let copiedIndex = $state(null);

  const baseUrl = 'https://api.selify.ai';

  // API Endpoint examples
  const endpoints = [
    {
      category: 'Authentication',
      items: [
        {
          method: 'POST',
          path: '/auth/v1/token',
          description: 'Get access token using API key',
          auth: 'API Key',
          example: {
            curl: `curl -X POST '${baseUrl}/auth/v1/token?grant_type=password' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "user@example.com", "password": "password123"}'`,
            js: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient('${baseUrl}', 'YOUR_ANON_KEY')

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})`,
            python: `from supabase import create_client

supabase = create_client('${baseUrl}', 'YOUR_ANON_KEY')

response = supabase.auth.sign_in_with_password({
  "email": "user@example.com",
  "password": "password123"
})`
          }
        }
      ]
    },
    {
      category: 'Products',
      items: [
        {
          method: 'GET',
          path: '/rest/v1/shopify_products',
          description: 'List products with variants and images',
          auth: 'Bearer Token',
          example: {
            curl: `curl '${baseUrl}/rest/v1/shopify_products?select=id,title,body_html,price_min_cents,variants:shopify_product_variants(*)' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'`,
            js: `const { data, error } = await supabase
  .from('shopify_products')
  .select(\`
    id, title, body_html, price_min_cents,
    variants:shopify_product_variants(*)
  \`)
  .eq('workspace_id', workspaceId)
  .limit(50)`,
            python: `response = supabase.table('shopify_products') \\
  .select('id, title, body_html, price_min_cents, variants:shopify_product_variants(*)') \\
  .eq('workspace_id', workspace_id) \\
  .limit(50) \\
  .execute()`
          }
        }
      ]
    },
    {
      category: 'Wardrobe',
      items: [
        {
          method: 'POST',
          path: '/rest/v1/wardrobe_garments',
          description: 'Add garment to wardrobe',
          auth: 'Bearer Token',
          example: {
            curl: `curl -X POST '${baseUrl}/rest/v1/wardrobe_garments' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "workspace_id": "uuid",
    "name": "Blue Summer Dress",
    "category": "dresses",
    "original_image_url": "https://..."
  }'`,
            js: `const { data, error } = await supabase
  .from('wardrobe_garments')
  .insert({
    workspace_id: workspaceId,
    name: 'Blue Summer Dress',
    category: 'dresses',
    original_image_url: 'https://...'
  })
  .select()
  .single()`,
            python: `response = supabase.table('wardrobe_garments') \\
  .insert({
    'workspace_id': workspace_id,
    'name': 'Blue Summer Dress',
    'category': 'dresses',
    'original_image_url': 'https://...'
  }) \\
  .execute()`
          }
        }
      ]
    },
    {
      category: 'Try-On Generation',
      items: [
        {
          method: 'POST',
          path: '/inference/tryon/generate',
          description: 'Generate virtual try-on image',
          auth: 'Bearer Token',
          note: 'Requires credits - charges workspace balance',
          example: {
            curl: `curl -X POST '${baseUrl}/inference/tryon/generate' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "workspace_id": "uuid",
    "person_image_url": "https://...",
    "garment_image_url": "https://...",
    "category": "upper_body"
  }'`,
            js: `const response = await fetch('${baseUrl}/inference/tryon/generate', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workspace_id: workspaceId,
    person_image_url: personUrl,
    garment_image_url: garmentUrl,
    category: 'upper_body' // upper_body, lower_body, full_body
  })
})

const { result_url, credits_charged } = await response.json()`,
            python: `import httpx

response = httpx.post(
  f'{base_url}/inference/tryon/generate',
  headers={'Authorization': f'Bearer {access_token}'},
  json={
    'workspace_id': workspace_id,
    'person_image_url': person_url,
    'garment_image_url': garment_url,
    'category': 'upper_body'
  }
)
result = response.json()`
          }
        }
      ]
    },
    {
      category: 'Billing',
      items: [
        {
          method: 'GET',
          path: '/rest/v1/rpc/get_workspace_balance',
          description: 'Get current workspace credit balance',
          auth: 'Bearer Token',
          example: {
            curl: `curl -X POST '${baseUrl}/rest/v1/rpc/get_workspace_balance' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"p_workspace_id": "uuid"}'`,
            js: `const { data, error } = await supabase
  .rpc('get_workspace_balance', {
    p_workspace_id: workspaceId
  })

// Returns: { balance_cents: 5000, currency: 'usd' }`,
            python: `response = supabase.rpc(
  'get_workspace_balance',
  {'p_workspace_id': workspace_id}
).execute()

# Returns: {'balance_cents': 5000, 'currency': 'usd'}`
          }
        }
      ]
    }
  ];

  let activeTab = $state('curl');
  const tabs = ['curl', 'js', 'python'];

  async function copyCode(code, index) {
    await navigator.clipboard.writeText(code);
    copiedIndex = index;
    setTimeout(() => copiedIndex = null, 2000);
  }

  function getMethodColor(method) {
    switch(method) {
      case 'GET': return 'success';
      case 'POST': return 'primary';
      case 'PUT': return 'warning';
      case 'DELETE': return 'error';
      default: return 'secondary';
    }
  }
</script>

<svelte:head>
  <title>API Reference - Selify Docs</title>
  <meta name="description" content="Selify API documentation with code examples" />
</svelte:head>

<div class="api-page">
  <header class="page-header">
    <h1 class="page-title">
      <Terminal size={28} />
      API Reference
    </h1>
    <p class="page-description">
      Complete API documentation with examples in cURL, JavaScript, and Python.
    </p>
    <div class="header-badges">
      <Badge variant="success" size="sm">REST API</Badge>
      <Badge variant="secondary" size="sm">Supabase</Badge>
      <Badge variant="secondary" size="sm">OpenAPI Compatible</Badge>
    </div>
  </header>

  <section class="quick-start">
    <h2>Quick Start</h2>
    <div class="quick-start-grid">
      <div class="quick-card">
        <Lock size={20} />
        <h3>Authentication</h3>
        <p>Use your API key in the <code>apikey</code> header and access token in <code>Authorization</code>.</p>
      </div>
      <div class="quick-card">
        <Globe size={20} />
        <h3>Base URL</h3>
        <p><code>{baseUrl}</code></p>
      </div>
      <div class="quick-card">
        <Zap size={20} />
        <h3>Rate Limits</h3>
        <p>1000 requests/minute for authenticated users. Billing endpoints are metered.</p>
      </div>
    </div>
  </section>

  <section class="language-tabs">
    <div class="tab-buttons">
      {#each tabs as tab}
        <button
          class="tab-btn"
          class:active={activeTab === tab}
          onclick={() => activeTab = tab}
        >
          {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JavaScript' : 'Python'}
        </button>
      {/each}
    </div>
  </section>

  {#each endpoints as category, catIndex}
    <section class="endpoint-category">
      <h2>{category.category}</h2>

      {#each category.items as endpoint, endIndex}
        {@const codeIndex = `${catIndex}-${endIndex}`}
        <div class="endpoint-card">
          <div class="endpoint-header">
            <Badge variant={getMethodColor(endpoint.method)} size="sm">{endpoint.method}</Badge>
            <code class="endpoint-path">{endpoint.path}</code>
            {#if endpoint.note}
              <Badge variant="warning" size="sm">{endpoint.note}</Badge>
            {/if}
          </div>
          <p class="endpoint-description">{endpoint.description}</p>
          <div class="endpoint-meta">
            <span class="meta-item">
              <Lock size={14} />
              {endpoint.auth}
            </span>
          </div>

          <div class="code-block">
            <div class="code-header">
              <span class="code-lang">{activeTab === 'curl' ? 'cURL' : activeTab === 'js' ? 'JavaScript' : 'Python'}</span>
              <button class="copy-btn" onclick={() => copyCode(endpoint.example[activeTab], codeIndex)}>
                {#if copiedIndex === codeIndex}
                  <Check size={14} />
                  Copied
                {:else}
                  <Copy size={14} />
                  Copy
                {/if}
              </button>
            </div>
            <pre><code>{endpoint.example[activeTab]}</code></pre>
          </div>
        </div>
      {/each}
    </section>
  {/each}

  <section class="more-resources">
    <h2>More Resources</h2>
    <div class="resource-grid">
      <a href="/docs/generated/database/public-schema" class="resource-card">
        <h3>Database Schema</h3>
        <p>Full table and column reference</p>
      </a>
      <a href="/docs/generated/api/routes" class="resource-card">
        <h3>All API Routes</h3>
        <p>Complete endpoint listing from Kong</p>
      </a>
      <a href="https://miozu.com/design-system/docs" target="_blank" rel="noopener" class="resource-card">
        <h3>Component Library</h3>
        <p>UI components for building integrations</p>
        <ExternalLink size={14} />
      </a>
    </div>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .api-page {
    @apply max-w-4xl mx-auto p-8;
  }

  .page-header {
    @apply mb-8;
  }

  .page-title {
    @apply flex items-center gap-3 text-3xl font-bold text-base07 mb-3;
  }

  .page-description {
    @apply text-base04 text-lg mb-4;
  }

  .header-badges {
    @apply flex gap-2;
  }

  .quick-start {
    @apply mb-10;
  }

  .quick-start h2 {
    @apply text-xl font-semibold text-base06 mb-4;
  }

  .quick-start-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .quick-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .quick-card :global(svg) {
    @apply text-base0D mb-2;
  }

  .quick-card h3 {
    @apply text-base06 font-medium mb-1;
  }

  .quick-card p {
    @apply text-sm text-base04;
  }

  .quick-card code {
    @apply bg-base02 px-1.5 py-0.5 rounded text-base0E text-xs;
  }

  .language-tabs {
    @apply mb-6 sticky top-0 bg-base00 py-3 z-10;
  }

  .tab-buttons {
    @apply flex gap-1 bg-base01 p-1 rounded-lg w-fit;
  }

  .tab-btn {
    @apply px-4 py-1.5 rounded text-sm text-base04 transition-colors;
  }

  .tab-btn.active {
    @apply bg-base02 text-base06;
  }

  .endpoint-category {
    @apply mb-10;
  }

  .endpoint-category h2 {
    @apply text-xl font-semibold text-base06 mb-4 pb-2 border-b border-base02;
  }

  .endpoint-card {
    @apply bg-base01 border border-base02 rounded-lg p-5 mb-4;
  }

  .endpoint-header {
    @apply flex items-center gap-3 mb-2 flex-wrap;
  }

  .endpoint-path {
    @apply text-base05 font-mono text-sm;
  }

  .endpoint-description {
    @apply text-base04 mb-3;
  }

  .endpoint-meta {
    @apply flex gap-4 text-sm text-base04 mb-4;
  }

  .meta-item {
    @apply flex items-center gap-1.5;
  }

  .code-block {
    @apply bg-base00 border border-base02 rounded-lg overflow-hidden;
  }

  .code-header {
    @apply flex justify-between items-center px-4 py-2 bg-base02/50 border-b border-base02;
  }

  .code-lang {
    @apply text-xs font-medium text-base04;
  }

  .copy-btn {
    @apply flex items-center gap-1.5 text-xs text-base04 hover:text-base06 transition-colors;
  }

  .code-block pre {
    @apply p-4 overflow-x-auto;
  }

  .code-block code {
    @apply text-sm text-base05 font-mono whitespace-pre;
  }

  .more-resources {
    @apply mt-12 pt-8 border-t border-base02;
  }

  .more-resources h2 {
    @apply text-xl font-semibold text-base06 mb-4;
  }

  .resource-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  .resource-card {
    @apply bg-base01 border border-base02 rounded-lg p-4 hover:border-base0D transition-colors;
  }

  .resource-card h3 {
    @apply text-base06 font-medium mb-1;
  }

  .resource-card p {
    @apply text-sm text-base04;
  }

  .resource-card :global(svg) {
    @apply text-base04 mt-2;
  }
</style>
