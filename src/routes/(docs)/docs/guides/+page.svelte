<script>
  import {BookOpen, ShoppingBag, Instagram, CreditCard, Settings, Code, Server, ExternalLink, FileText} from '@lucide/svelte';
  import {Badge} from '@miozu/jera';

  // Categorized guides from backend-selify.ai/docs/guides/
  const guideCategories = [
    {
      title: 'Shopify Integration',
      icon: ShoppingBag,
      color: 'success',
      guides: [
        {
          title: 'Shopify Integration Implementation',
          file: 'SHOPIFY_INTEGRATION_IMPLEMENTATION.md',
          description: 'Complete guide for Shopify app integration'
        },
        {
          title: 'Product Integration Spec',
          file: 'SHOPIFY_PRODUCT_INTEGRATION_SPEC.md',
          description: 'Product sync and try-on integration specifications'
        },
        {
          title: 'Frontend Shopify Guide',
          file: 'SHOPIFY_FRONTEND_GUIDE.md',
          description: 'Frontend implementation for Shopify features'
        },
        {
          title: 'Sync Status Guide',
          file: 'SHOPIFY_SYNC_STATUS.md',
          description: 'Monitoring and managing Shopify sync status'
        }
      ]
    },
    {
      title: 'Instagram & Social',
      icon: Instagram,
      color: 'error',
      guides: [
        {
          title: 'Instagram Bot Settings Audit',
          file: 'INSTAGRAM_BOT_SETTINGS_AUDIT.md',
          description: 'Bot configuration and settings reference'
        },
        {
          title: 'Instagram Insights API',
          file: 'INSTAGRAM_INSIGHTS_API_GUIDE.md',
          description: 'Working with Instagram Insights and metrics'
        },
        {
          title: 'Multi-Platform Bot Implementation',
          file: 'MULTI_PLATFORM_BOT_IMPLEMENTATION.md',
          description: 'Supporting multiple social platforms'
        },
        {
          title: 'Frontend Bot Config Guide',
          file: 'FRONTEND_BOT_CONFIG_GUIDE.md',
          description: 'Configuring bot settings from frontend'
        }
      ]
    },
    {
      title: 'Billing & Subscriptions',
      icon: CreditCard,
      color: 'warning',
      guides: [
        {
          title: 'Affiliate System Guide',
          file: 'AFFILIATE_SYSTEM_GUIDE.md',
          description: 'Implementing affiliate commission tracking'
        },
        {
          title: 'Subscription Changes Guide',
          file: 'FRONTEND_SUBSCRIPTION_CHANGES_GUIDE.md',
          description: 'Handling subscription upgrades/downgrades'
        },
        {
          title: 'Webhook Cancellation Handler',
          file: 'WEBHOOK_SMART_CANCELLATION_HANDLER.md',
          description: 'Smart handling of subscription cancellations'
        }
      ]
    },
    {
      title: 'Frontend Integration',
      icon: Code,
      color: 'primary',
      guides: [
        {
          title: 'Frontend Integration Guide',
          file: 'FRONTEND_INTEGRATION_GUIDE.md',
          description: 'Complete frontend integration patterns'
        },
        {
          title: 'OAuth Integration Guide',
          file: 'FRONTEND_OAUTH_INTEGRATION_GUIDE.md',
          description: 'OAuth flow implementation for frontend'
        },
        {
          title: 'Backend-Frontend Architecture',
          file: 'BACKEND_FRONTEND_ARCHITECTURE.md',
          description: 'Architecture overview and patterns'
        }
      ]
    },
    {
      title: 'Infrastructure & Ops',
      icon: Server,
      color: 'secondary',
      guides: [
        {
          title: 'Ops Infrastructure Setup',
          file: 'OPS_INFRASTRUCTURE_SETUP.md',
          description: 'Setting up ops infrastructure and monitoring'
        },
        {
          title: 'Implementation Guide',
          file: 'IMPLEMENTATION_GUIDE.md',
          description: 'General implementation patterns and practices'
        },
        {
          title: 'Bot Config Schema Update',
          file: 'BOT_CONFIG_SCHEMA_UPDATE.md',
          description: 'Schema changes for bot configuration'
        }
      ]
    }
  ];

  function getColorClass(color) {
    const colors = {
      success: 'text-base0B',
      error: 'text-base08',
      warning: 'text-base0A',
      primary: 'text-base0D',
      secondary: 'text-base04'
    };
    return colors[color] || colors.secondary;
  }

  function getBgColorClass(color) {
    const colors = {
      success: 'bg-base0B/10',
      error: 'bg-base08/10',
      warning: 'bg-base0A/10',
      primary: 'bg-base0D/10',
      secondary: 'bg-base04/10'
    };
    return colors[color] || colors.secondary;
  }
</script>

<svelte:head>
  <title>Backend Guides - Selify Docs</title>
  <meta name="description" content="Internal backend development and integration guides" />
</svelte:head>

<div class="guides-page">
  <header class="page-header">
    <h1 class="page-title">
      <BookOpen size={28} />
      Backend Guides
    </h1>
    <p class="page-description">
      Internal development guides for integrations, features, and infrastructure.
    </p>
    <div class="header-badges">
      <Badge variant="warning" size="sm">Internal Only</Badge>
      <Badge variant="secondary" size="sm">{guideCategories.reduce((acc, cat) => acc + cat.guides.length, 0)} Guides</Badge>
    </div>
  </header>

  <div class="categories-grid">
    {#each guideCategories as category}
      <section class="category-section">
        <div class="category-header {getBgColorClass(category.color)}">
          <svelte:component this={category.icon} size={20} class={getColorClass(category.color)} />
          <h2>{category.title}</h2>
          <Badge variant="secondary" size="sm">{category.guides.length}</Badge>
        </div>

        <ul class="guides-list">
          {#each category.guides as guide}
            <li>
              <a
                href="https://github.com/nicholasglazer/backend-selify.ai/blob/main/docs/guides/{guide.file}"
                target="_blank"
                rel="noopener noreferrer"
                class="guide-link"
              >
                <div class="guide-info">
                  <FileText size={16} class="guide-icon" />
                  <div>
                    <span class="guide-title">{guide.title}</span>
                    <span class="guide-description">{guide.description}</span>
                  </div>
                </div>
                <ExternalLink size={14} class="external-icon" />
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>

  <section class="local-docs">
    <h2>Additional Documentation</h2>
    <p class="section-description">
      These documents are available in the backend repository root:
    </p>
    <div class="docs-grid">
      <a href="https://github.com/nicholasglazer/backend-selify.ai/blob/main/DATABASE_SCHEMA_DOCUMENTATION.md" target="_blank" rel="noopener" class="doc-card">
        <h3>Database Schema</h3>
        <p>Complete table and column documentation</p>
      </a>
      <a href="https://github.com/nicholasglazer/backend-selify.ai/blob/main/DATABASE_FUNCTIONS_AND_TRIGGERS.md" target="_blank" rel="noopener" class="doc-card">
        <h3>RPC Functions</h3>
        <p>PostgreSQL functions and triggers reference</p>
      </a>
      <a href="https://github.com/nicholasglazer/backend-selify.ai/blob/main/API_ROUTES_DOCUMENTATION.md" target="_blank" rel="noopener" class="doc-card">
        <h3>API Routes</h3>
        <p>Kong gateway endpoint documentation</p>
      </a>
      <a href="https://github.com/nicholasglazer/backend-selify.ai/blob/main/docs/GIT_WORKFLOW.md" target="_blank" rel="noopener" class="doc-card">
        <h3>Git Workflow</h3>
        <p>Git push workflow and deployment guide</p>
      </a>
    </div>
  </section>
</div>

<style lang="postcss">
  @reference '$theme';

  .guides-page {
    @apply max-w-5xl mx-auto p-8;
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

  .categories-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12;
  }

  .category-section {
    @apply bg-base01 border border-base02 rounded-lg overflow-hidden;
  }

  .category-header {
    @apply flex items-center gap-3 p-4 border-b border-base02;
  }

  .category-header h2 {
    @apply flex-1 text-base06 font-semibold text-lg m-0;
  }

  .guides-list {
    @apply divide-y divide-base02;
  }

  .guide-link {
    @apply flex items-center justify-between p-4 hover:bg-base02/50 transition-colors;
  }

  .guide-info {
    @apply flex items-start gap-3;
  }

  .guide-icon {
    @apply text-base04 mt-0.5 flex-shrink-0;
  }

  .guide-title {
    @apply block text-base05 font-medium;
  }

  .guide-description {
    @apply block text-sm text-base04 mt-0.5;
  }

  .external-icon {
    @apply text-base04 opacity-50 flex-shrink-0;
  }

  .local-docs {
    @apply border-t border-base02 pt-8;
  }

  .local-docs h2 {
    @apply text-xl font-semibold text-base06 mb-2;
  }

  .section-description {
    @apply text-base04 mb-4;
  }

  .docs-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .doc-card {
    @apply bg-base01 border border-base02 rounded-lg p-4 hover:border-base0D transition-colors;
  }

  .doc-card h3 {
    @apply text-base06 font-medium mb-1;
  }

  .doc-card p {
    @apply text-sm text-base04;
  }
</style>
