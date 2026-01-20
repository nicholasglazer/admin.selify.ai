<script>
  import {page} from '$app/stores';
  import {Book, Database, Route, FileText, Home, Search} from '@lucide/svelte';

  // Navigation structure
  const navItems = [
    {
      title: 'Overview',
      href: '/docs',
      icon: Home
    },
    {
      title: 'Generated',
      items: [
        {title: 'Database Schema', href: '/docs/generated/database/public-schema', icon: Database},
        {title: 'API Routes', href: '/docs/generated/api/routes', icon: Route},
      ]
    },
    {
      title: 'Guides',
      items: [
        {title: 'Architecture', href: '/docs/guides/architecture', icon: FileText},
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
          <h3 class="section-title">{section.title}</h3>
          <ul class="section-links">
            {#each section.items as item}
              <li>
                <a
                  href={item.href}
                  class="nav-link"
                  class:active={$page.url.pathname === item.href}
                >
                  {#if item.icon}
                    <svelte:component this={item.icon} size={14} />
                  {/if}
                  {item.title}
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
    @apply text-xs uppercase tracking-wider text-base04 font-medium mb-2 px-2;
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

  .nav-footer {
    @apply p-4 border-t border-base02;
  }

  .back-link {
    @apply text-sm text-base04 hover:text-base06;
  }
</style>
