<script>
  import {page} from '$app/stores';
  import {Book, Database, Route, FileText, Home, Search, Code, ExternalLink, Blocks, BookOpen, Terminal, Zap, Cpu, Shield, FlaskConical, TestTube2, Cog, AlertTriangle} from '@lucide/svelte';

  // Navigation structure with internal/external separation
  const navItems = [
    {
      title: 'Overview',
      href: '/docs',
      icon: Home
    },
    {
      title: 'External (Customers)',
      badge: 'external',
      items: [
        {title: 'MCP Overview', href: '/docs/mcp', icon: Cpu, isNew: true},
        {title: '↳ Claude Desktop', href: '/docs/mcp/claude-desktop', icon: Terminal},
        {title: '↳ OpenAI GPTs', href: '/docs/mcp/openai', icon: Zap},
        {title: '↳ REST API', href: '/docs/mcp/rest-api', icon: Code},
        {title: 'API Reference', href: '/docs/api', icon: Terminal},
        {title: 'Public Schema', href: '/docs/generated/database/public-schema', icon: Database},
        {title: 'Component Library', href: '/docs/components', icon: Blocks},
      ]
    },
    {
      title: 'Internal (Ops)',
      badge: 'internal',
      items: [
        {title: 'Internal Schema', href: '/docs/generated/database/internal-schema', icon: Database},
        {title: 'API Routes (All)', href: '/docs/generated/api/routes', icon: Route},
        {title: 'Backend Guides', href: '/docs/guides', icon: BookOpen},
        {title: 'Workflows', href: '/docs/workflows', icon: Zap},
      ]
    },
    {
      title: 'QA Automation',
      badge: 'qa',
      items: [
        {title: 'Overview', href: '/docs/qa', icon: FlaskConical, isNew: true},
        {title: 'QA Engineer Guide', href: '/docs/qa/guide', icon: TestTube2},
        {title: 'Architecture', href: '/docs/qa/architecture', icon: Cog},
        {title: 'Troubleshooting', href: '/docs/qa/troubleshooting', icon: AlertTriangle},
      ]
    }
  ];

  let searchQuery = $state('');
</script>

<aside class="docs-nav">
  <div class="nav-header">
    <a href="/docs" class="logo">
      <Book size={20} />
      <span>Selify Docs</span>
    </a>
  </div>

  <div class="search-box">
    <Search size={16} class="search-icon" />
    <input
      type="text"
      placeholder="Search docs..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <nav class="nav-sections">
    {#each navItems as section}
      {#if section.href}
        <a
          href={section.href}
          class="nav-link"
          class:active={$page.url.pathname === section.href}
        >
          {#if section.icon}
            <svelte:component this={section.icon} size={16} />
          {/if}
          {section.title}
        </a>
      {:else}
        <div class="nav-section">
          <h3 class="section-title">
            {section.title}
            {#if section.badge}
              <span class="section-badge" class:external={section.badge === 'external'} class:internal={section.badge === 'internal'}>
                {section.badge}
              </span>
            {/if}
          </h3>
          <ul class="section-links">
            {#each section.items as item}
              <li>
                <a
                  href={item.href}
                  class="nav-link"
                  class:active={$page.url.pathname === item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                >
                  {#if item.icon}
                    <svelte:component this={item.icon} size={14} />
                  {/if}
                  <span class="nav-link-text">{item.title}</span>
                  {#if item.isNew}
                    <span class="new-badge">new</span>
                  {/if}
                  {#if item.external}
                    <ExternalLink size={12} class="external-icon" />
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/each}
  </nav>

  <div class="nav-footer">
    <a href="/" class="back-link">
      Back to Admin
    </a>
  </div>
</aside>

<style lang="postcss">
  @reference '$theme';

  .docs-nav {
    @apply w-64 bg-base01 border-r border-base02 flex flex-col h-screen sticky top-0;
  }

  .nav-header {
    @apply p-4 border-b border-base02;
  }

  .logo {
    @apply flex items-center gap-2 text-base06 font-semibold hover:text-base07;
  }

  .search-box {
    @apply p-4 relative;
  }

  .search-icon {
    @apply absolute left-7 top-1/2 -translate-y-1/2 text-base04;
  }

  .search-input {
    @apply w-full bg-base00 border border-base02 rounded px-3 py-2 pl-9
           text-sm text-base05 placeholder-base04
           focus:border-base0D focus:outline-none;
  }

  .nav-sections {
    @apply flex-1 overflow-y-auto px-4 py-2;
  }

  .nav-section {
    @apply mb-4;
  }

  .section-title {
    @apply text-xs uppercase tracking-wider text-base04 font-medium mb-2 px-2 flex items-center gap-2;
  }

  .section-badge {
    @apply text-[10px] px-1.5 py-0.5 rounded font-medium uppercase;
  }

  .section-badge.external {
    @apply bg-base0B/20 text-base0B;
  }

  .section-badge.internal {
    @apply bg-base0A/20 text-base0A;
  }

  .section-badge.qa {
    @apply bg-base0E/20 text-base0E;
  }

  .nav-link-text {
    @apply flex-1;
  }

  :global(.external-icon) {
    @apply text-base04 opacity-60;
  }

  .section-links {
    @apply space-y-1;
  }

  .nav-link {
    @apply flex items-center gap-2 px-2 py-1.5 rounded text-sm text-base04
           hover:bg-base02 hover:text-base06 transition-colors;
  }

  .nav-link.active {
    @apply bg-base02 text-base0D;
  }

  .new-badge {
    @apply text-[10px] px-1.5 py-0.5 rounded bg-base0B/20 text-base0B font-medium uppercase;
  }

  .nav-footer {
    @apply p-4 border-t border-base02;
  }

  .back-link {
    @apply text-sm text-base04 hover:text-base06;
  }
</style>
