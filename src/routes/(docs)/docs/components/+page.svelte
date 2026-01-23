<script>
  import {Blocks, ExternalLink, Package, Palette, Type, Layout, MousePointer, Loader, Navigation, AlertCircle} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  // Component categories from @miozu/jera
  const componentCategories = [
    {
      title: 'Form Controls',
      icon: MousePointer,
      components: [
        {name: 'Button', description: 'Primary action triggers with variants', status: 'stable'},
        {name: 'Input', description: 'Text input with validation support', status: 'stable'},
        {name: 'Checkbox', description: 'Boolean selection control', status: 'stable'},
        {name: 'Switch', description: 'Toggle on/off states', status: 'stable'},
        {name: 'Select', description: 'Dropdown selection with search', status: 'stable'},
      ]
    },
    {
      title: 'Feedback',
      icon: AlertCircle,
      components: [
        {name: 'Toast', description: 'Notification messages', status: 'stable'},
        {name: 'Badge', description: 'Status indicators and labels', status: 'stable'},
        {name: 'Spinner', description: 'Loading indicator', status: 'stable'},
        {name: 'Skeleton', description: 'Content loading placeholder', status: 'stable'},
        {name: 'ProgressBar', description: 'Progress indication', status: 'stable'},
      ]
    },
    {
      title: 'Overlays',
      icon: Layout,
      components: [
        {name: 'Modal', description: 'Dialog windows with focus trap', status: 'stable'},
        {name: 'Popover', description: 'Contextual floating content', status: 'stable'},
        {name: 'Portal', description: 'Render children outside DOM hierarchy', status: 'stable'},
      ]
    },
    {
      title: 'Navigation',
      icon: Navigation,
      components: [
        {name: 'Tabs', description: 'Tabbed content navigation', status: 'stable'},
        {name: 'Accordion', description: 'Collapsible content sections', status: 'stable'},
      ]
    },
    {
      title: 'Display',
      icon: Blocks,
      components: [
        {name: 'Avatar', description: 'User/entity representation', status: 'stable'},
        {name: 'Divider', description: 'Visual content separator', status: 'stable'},
      ]
    },
    {
      title: 'Utilities',
      icon: Package,
      components: [
        {name: 'cn', description: 'Class name merging utility (clsx + twMerge)', status: 'stable'},
        {name: 'cv', description: 'Class variance utility for component variants', status: 'stable'},
        {name: 'clickOutside', description: 'Svelte action for outside click detection', status: 'stable'},
        {name: 'focusTrap', description: 'Svelte action for focus management', status: 'stable'},
      ]
    }
  ];

  const designTokens = [
    {category: 'Colors', description: 'Base16 color palette with semantic tokens', count: 18},
    {category: 'Typography', description: 'Font families, sizes, and weights', count: 12},
    {category: 'Spacing', description: 'Consistent spacing scale', count: 10},
    {category: 'Theming', description: 'Light/dark theme support', count: 2},
  ];
</script>

<svelte:head>
  <title>Component Library - Selify Docs</title>
  <meta name="description" content="@miozu/jera component library documentation" />
</svelte:head>

<div class="components-page">
  <header class="page-header">
    <div class="header-content">
      <h1>
        <Blocks size={28} />
        Component Library
      </h1>
      <p class="subtitle">@miozu/jera - Svelte 5 component library with Base16 theming</p>
    </div>
    <div class="header-actions">
      <a href="https://www.npmjs.com/package/@miozu/jera" target="_blank" rel="noopener noreferrer" class="npm-link">
        <Package size={16} />
        npm
        <ExternalLink size={12} />
      </a>
    </div>
  </header>

  <section class="quick-start">
    <h2>Quick Start</h2>
    <div class="code-block">
      <code>pnpm add @miozu/jera</code>
    </div>
    <div class="code-block">
      <pre><code>{`<script>
  import { Button, Modal, Input, Badge, Toast } from '@miozu/jera';
</script>

<Button variant="primary">Click me</Button>
<Badge variant="success">Active</Badge>`}</code></pre>
    </div>
  </section>

  <section class="design-tokens">
    <h2>
      <Palette size={20} />
      Design Tokens
    </h2>
    <div class="tokens-grid">
      {#each designTokens as token}
        <div class="token-card">
          <h3>{token.category}</h3>
          <p>{token.description}</p>
          <Badge variant="secondary" size="sm">{token.count} tokens</Badge>
        </div>
      {/each}
    </div>
  </section>

  <section class="components">
    <h2>
      <Blocks size={20} />
      Components
    </h2>

    {#each componentCategories as category}
      <div class="category">
        <h3>
          <svelte:component this={category.icon} size={16} />
          {category.title}
        </h3>
        <div class="component-grid">
          {#each category.components as component}
            <div class="component-card">
              <div class="component-header">
                <span class="component-name">{component.name}</span>
                <Badge variant={component.status === 'stable' ? 'success' : 'warning'} size="sm">
                  {component.status}
                </Badge>
              </div>
              <p class="component-description">{component.description}</p>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </section>

  <section class="usage-notes">
    <h2>Usage in Selify</h2>
    <div class="note-card">
      <h3>Theme Integration</h3>
      <p>Both <code>dash.selify.ai</code> and <code>admin.selify.ai</code> use the <code>miozu-dark</code> theme with Base16 color tokens. Components automatically inherit the correct styling.</p>
    </div>
    <div class="note-card">
      <h3>When to Use</h3>
      <ul>
        <li><strong>Use jera for:</strong> Generic UI (Modal, Toast, Tabs, forms, badges)</li>
        <li><strong>Use local for:</strong> Domain-specific components (Sidebar, PMBoard, IssueCard)</li>
      </ul>
    </div>
    <div class="note-card">
      <h3>Icons</h3>
      <p>Use <code>@lucide/svelte</code> for icons, not inline SVGs. Import only what you need for tree-shaking.</p>
    </div>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .components-page {
    @apply p-6 max-w-5xl;
  }

  .page-header {
    @apply flex items-start justify-between mb-8 pb-6 border-b border-base02;
  }

  .page-header h1 {
    @apply flex items-center gap-3 text-2xl font-bold text-base07 m-0;
  }

  .subtitle {
    @apply text-base04 mt-2 m-0;
  }

  .npm-link {
    @apply flex items-center gap-2 px-3 py-1.5 rounded bg-base02 text-base05;
    @apply hover:bg-base03 hover:text-base07 transition-colors text-sm;
  }

  section {
    @apply mb-10;
  }

  section > h2 {
    @apply flex items-center gap-2 text-lg font-semibold text-base06 mb-4;
  }

  .quick-start .code-block {
    @apply bg-base01 border border-base02 rounded-lg p-4 mb-3 overflow-x-auto;
  }

  .quick-start code {
    @apply text-sm text-base0E font-mono;
  }

  .quick-start pre {
    @apply m-0;
  }

  .tokens-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .token-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .token-card h3 {
    @apply text-base06 font-medium mb-1;
  }

  .token-card p {
    @apply text-sm text-base04 mb-2;
  }

  .category {
    @apply mb-6;
  }

  .category > h3 {
    @apply flex items-center gap-2 text-sm uppercase tracking-wider text-base04 font-medium mb-3;
  }

  .component-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3;
  }

  .component-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
    @apply hover:border-base03 transition-colors;
  }

  .component-header {
    @apply flex items-center justify-between mb-2;
  }

  .component-name {
    @apply font-mono text-base0D font-medium;
  }

  .component-description {
    @apply text-sm text-base04 m-0;
  }

  .usage-notes {
    @apply space-y-4;
  }

  .note-card {
    @apply bg-base01 border border-base02 rounded-lg p-4;
  }

  .note-card h3 {
    @apply text-base06 font-medium mb-2;
  }

  .note-card p {
    @apply text-sm text-base04 m-0;
  }

  .note-card code {
    @apply bg-base02 px-1.5 py-0.5 rounded text-base0E text-xs font-mono;
  }

  .note-card ul {
    @apply text-sm text-base04 m-0 pl-5 space-y-1;
  }

  .note-card li {
    @apply list-disc;
  }
</style>
