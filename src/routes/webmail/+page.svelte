<script>
  /**
   * Webmail Main Page
   *
   * The primary webmail interface with:
   * - 3-pane layout (sidebar, threads, message)
   * - Multi-account support
   * - Keyboard navigation
   * - Compose modal
   *
   * Supports both:
   * - dash.selify.ai/webmail (standard path)
   * - webmail.selify.ai (subdomain, internally rewrites to /webmail)
   */
  import {browser} from '$app/environment';
  import {onMount} from 'svelte';
  import {invalidateAll} from '$app/navigation';
  import {createMailState} from '$features/mail/state/mailState.svelte.js';
  import {useKeyboardNav} from '$features/mail/state/useKeyboardNav.svelte.js';
  import {Plus} from '$components/icons';
  import {Button} from '@miozu/jera';
  import AddEmailAccountModal from '$features/mail/components/AddEmailAccountModal.svelte';

  /**
   * Mail interface components loaded dynamically on mount.
   * Using dynamic imports avoids SSR issues with the mail components barrel export.
   * The components use runes and effects that can cause issues during SSR.
   */
  let MailboxSidebar = $state(null);
  let ThreadList = $state(null);
  let MessageView = $state(null);
  let ComposeModal = $state(null);
  let KeyboardShortcutsModal = $state(null);
  let AccountSwitcher = $state(null);
  let componentsLoaded = $state(false);

  let {data} = $props();

  // Check if we're on the webmail subdomain (for link generation)
  let isSubdomain = $derived(data?.isWebmailSubdomain || false);

  // Team member email for auto-provisioning
  let teamMemberEmail = $derived(data?.teamMemberEmail || '');

  // Create reactive mail state - deferred initialization
  let mail = $state(null);

  // Keyboard shortcuts state
  let showShortcuts = $state(false);

  // Add account modal (for subdomain where we can't navigate to settings)
  let showAddAccount = $state(false);

  // Mobile view state
  let isMobileView = $state(false);
  let mobilePane = $state('list'); // 'list' | 'message'

  // Initialize mail state and keyboard navigation on mount
  onMount(async () => {
    if (!browser) return;

    // Load mail interface components dynamically to avoid SSR issues
    const [
      {default: AccountSwitcherComponent},
      {default: MailboxSidebarComponent},
      {default: ThreadListComponent},
      {default: MessageViewComponent},
      {default: ComposeModalComponent},
      {default: KeyboardShortcutsModalComponent}
    ] = await Promise.all([
      import('$features/mail/components/AccountSwitcher.svelte'),
      import('$features/mail/components/MailboxSidebar.svelte'),
      import('$features/mail/components/ThreadList.svelte'),
      import('$features/mail/components/MessageView.svelte'),
      import('$features/mail/components/ComposeModal.svelte'),
      import('$features/mail/components/KeyboardShortcutsModal.svelte')
    ]);

    AccountSwitcher = AccountSwitcherComponent;
    MailboxSidebar = MailboxSidebarComponent;
    ThreadList = ThreadListComponent;
    MessageView = MessageViewComponent;
    ComposeModal = ComposeModalComponent;
    KeyboardShortcutsModal = KeyboardShortcutsModalComponent;
    componentsLoaded = true;

    // Initialize mail state client-side only
    mail = createMailState(data?.accounts ?? []);

    // Check viewport
    const checkViewport = () => {
      isMobileView = window.innerWidth < 1024;
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);

    // Setup keyboard navigation
    const cleanup = useKeyboardNav(mail, {
      onShowHelp: () => (showShortcuts = true)
    });

    // Load initial data if we have accounts
    if (mail.accounts.length > 0) {
      mail.loadMailboxes();
      mail.loadThreads();
    }

    return () => {
      cleanup();
      window.removeEventListener('resize', checkViewport);
    };
  });

  // Handle mobile navigation
  function handleThreadSelect() {
    if (isMobileView) {
      mobilePane = 'message';
    }
  }

  function handleMobileBack() {
    mobilePane = 'list';
  }

  // Handle reply actions
  function handleReply(type) {
    if (mail?.selectedMessage) {
      mail.openCompose(type, mail.selectedMessage);
    }
  }

  // Derived states - handle null mail during SSR
  let hasAccounts = $derived(mail?.accounts?.length > 0);
</script>

<div class="webmail-container">
  {#if !hasAccounts}
    <!-- Empty State: No Accounts -->
    <div class="empty-accounts">
      <div class="empty-content">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h2 class="empty-title">Welcome to Webmail</h2>
        <p class="empty-desc">
          Connect your email accounts to get started. You can add personal accounts or shared team
          mailboxes.
        </p>
        <Button variant="primary" onclick={() => (showAddAccount = true)}>
            <Plus size={18} />
            Add Email Account
          </Button>
      </div>
    </div>
  {:else if componentsLoaded && mail}
    <!-- Main Webmail Interface -->
    <header class="webmail-header">
      <AccountSwitcher {mail} />
      <div class="header-actions">
        <button
          class="header-btn"
          onclick={() => (showShortcuts = true)}
          title="Keyboard shortcuts"
        >
          <kbd>?</kbd>
        </button>
        <Button variant="ghost sm" onclick={() => (showAddAccount = true)} title="Add account">
            <Plus size={18} />
          </Button>
      </div>
    </header>

    <div class={['webmail-main', isMobileView && 'mobile']}>
      <!-- Sidebar -->
      <aside class={['sidebar-pane', isMobileView && mobilePane !== 'list' && 'hidden']}>
        <MailboxSidebar {mail} />
      </aside>

      <!-- Thread List -->
      <section class={['threads-pane', isMobileView && mobilePane !== 'list' && 'hidden']}>
        <ThreadList {mail} onSelect={handleThreadSelect} />
      </section>

      <!-- Message View -->
      <section class={['message-pane', isMobileView && mobilePane !== 'message' && 'hidden']}>
        <MessageView
          {mail}
          mobile={isMobileView ? {isMobile: true, back: handleMobileBack} : null}
          onReply={handleReply}
        />
      </section>
    </div>

    <!-- Compose Modal -->
    <ComposeModal {mail} onClose={() => mail.closeCompose()} />

    <!-- Keyboard Shortcuts Modal -->
    <KeyboardShortcutsModal
      open={showShortcuts}
      onClose={() => (showShortcuts = false)}
    />
  {:else}
    <!-- Loading state while components are being loaded -->
    <div class="empty-accounts">
      <div class="empty-content">
        <p class="empty-desc">Loading...</p>
      </div>
    </div>
  {/if}

  <!-- Add Account Modal -->
  <AddEmailAccountModal
    open={showAddAccount}
    onClose={() => (showAddAccount = false)}
    onSuccess={async () => {
      showAddAccount = false;
      // Reload accounts using SvelteKit's invalidation
      await invalidateAll();
    }}
    {teamMemberEmail}
  />
</div>

<style lang="postcss">
  @reference '$theme';

  .webmail-container {
    @apply flex flex-col h-full;
  }

  /* Empty State */
  .empty-accounts {
    @apply flex-1 flex items-center justify-center p-8;
  }

  .empty-content {
    @apply flex flex-col items-center text-center max-w-md;
  }

  .empty-icon {
    @apply w-20 h-20 mb-6 text-base04;
  }

  .empty-icon svg {
    @apply w-full h-full;
  }

  .empty-title {
    @apply text-2xl font-semibold text-base07 mb-3;
  }

  .empty-desc {
    @apply text-base text-base05 mb-6 leading-relaxed;
  }

  /* Header */
  .webmail-header {
    @apply flex items-center justify-between px-4 py-2;
    @apply border-b border-border/20 bg-base01;
  }

  .header-actions {
    @apply flex items-center gap-2;
  }

  .header-btn {
    @apply p-2 rounded text-base05 hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .header-btn kbd {
    @apply px-2 py-1 bg-base02 border border-border/40 rounded;
    @apply text-xs font-mono text-base06;
  }

  /* Main Layout */
  .webmail-main {
    @apply flex-1 flex overflow-hidden;
  }

  .sidebar-pane {
    @apply w-56 flex-shrink-0 border-r border-border/20;
    @apply bg-base01 overflow-y-auto;
  }

  .threads-pane {
    @apply w-80 flex-shrink-0 border-r border-border/20;
    @apply bg-base01 overflow-hidden flex flex-col;
  }

  .message-pane {
    @apply flex-1 overflow-hidden;
  }

  /* Mobile adjustments */
  .webmail-main.mobile .sidebar-pane {
    @apply hidden;
  }

  .webmail-main.mobile .threads-pane {
    @apply w-full;
  }

  .webmail-main.mobile .message-pane {
    @apply w-full;
  }

  .webmail-main.mobile .threads-pane.hidden,
  .webmail-main.mobile .message-pane.hidden {
    @apply hidden;
  }

  /* Responsive: tablet shows sidebar collapsed */
  @media (max-width: 1279px) and (min-width: 1024px) {
    .sidebar-pane {
      @apply w-48;
    }

    .threads-pane {
      @apply w-72;
    }
  }
</style>
