<script>
  import {Database, Route, FileText, Zap, RefreshCw} from '@lucide/svelte';

  let {data} = $props();

  const sections = [
    {
      title: 'Generated Documentation',
      description: 'Auto-generated from live sources. Updated on triggers.',
      items: [
        {
          title: 'Database Schema',
          description: 'PostgreSQL tables, columns, indexes, and RLS policies.',
          href: '/docs/generated/database/public-schema',
          icon: Database,
          badge: 'Auto'
        },
        {
          title: 'API Routes',
          description: 'Kong Gateway endpoints and service mappings.',
          href: '/docs/generated/api/routes',
          icon: Route,
          badge: 'Auto'
        }
      ]
    },
    {
      title: 'Guides',
      description: 'Hand-written documentation and architecture decisions.',
      items: [
        {
          title: 'Architecture Overview',
          description: 'System design and component relationships.',
          href: '/docs/guides/architecture',
          icon: FileText,
          badge: null
        }
      ]
    }
  ];
</script>

<svelte:head>
  <title>Selify Docs</title>
  <meta name="description" content="Internal documentation for Selify platform" />
</svelte:head>

<article class="docs-page">
  <header class="page-header">
    <h1>Selify Documentation</h1>
    <p class="lead">
      AI-first documentation for the Selify platform. Generated docs stay
      in sync with live sources via Temporal workflows.
    </p>
  </header>

  <section class="features">
    <div class="feature">
      <RefreshCw size={20} />
      <div>
        <h3>Self-Healing</h3>
        <p>Auto-updates on schema changes, Kong config updates, and git pushes.</p>
      </div>
    </div>
    <div class="feature">
      <Zap size={20} />
      <div>
        <h3>AI-First</h3>
        <p>Embedded for semantic search. Follows llms.txt standard for AI context.</p>
      </div>
    </div>
  </section>

  {#each sections as section}
    <section class="doc-section">
      <h2>{section.title}</h2>
      <p class="section-desc">{section.description}</p>

      <div class="card-grid">
        {#each section.items as item}
          <a href={item.href} class="doc-card">
            <div class="card-icon">
              <svelte:component this={item.icon} size={24} />
            </div>
            <div class="card-content">
              <h3>
                {item.title}
                {#if item.badge}
                  <span class="badge">{item.badge}</span>
                {/if}
              </h3>
              <p>{item.description}</p>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/each}
</article>

<style lang="postcss">
  @reference '$theme';

  .docs-page {
    @apply py-8;
  }

  .page-header {
    @apply mb-12;
  }

  .page-header h1 {
    @apply text-4xl font-bold text-base07 mb-4;
  }

  .lead {
    @apply text-lg text-base04 max-w-2xl;
  }

  .features {
    @apply grid grid-cols-2 gap-4 mb-12;
  }

  .feature {
    @apply flex gap-3 p-4 bg-base01 rounded-lg border border-base02;
  }

  .feature :global(svg) {
    @apply text-base0D flex-shrink-0 mt-1;
  }

  .feature h3 {
    @apply text-base06 font-medium mb-1;
  }

  .feature p {
    @apply text-sm text-base04;
  }

  .doc-section {
    @apply mb-12;
  }

  .doc-section h2 {
    @apply text-xl font-semibold text-base06 mb-2;
  }

  .section-desc {
    @apply text-base04 mb-6;
  }

  .card-grid {
    @apply grid grid-cols-2 gap-4;
  }

  .doc-card {
    @apply flex gap-4 p-5 bg-base01 rounded-lg border border-base02
           hover:border-base0D hover:bg-base02 transition-colors;
  }

  .card-icon {
    @apply text-base0D flex-shrink-0;
  }

  .card-content h3 {
    @apply text-base06 font-medium mb-1 flex items-center gap-2;
  }

  .card-content p {
    @apply text-sm text-base04;
  }

  .badge {
    @apply text-xs px-1.5 py-0.5 rounded bg-base0D/20 text-base0D;
  }
</style>
