<script>
  /**
   * Mailbox Sidebar
   *
   * Shows folder list with unread counts, account switcher, and compose button.
   */
  import {
    InboxIcon,
    Send,
    FileText,
    Trash,
    Archive,
    AlertCircle,
    Folder,
    Plus,
    ChevronRight
  } from '$components/icons';
  import {Button} from '@miozu/jera';
  import {Badge} from '@miozu/jera';

  let {mail, class: className = ''} = $props();

  // Map special use to icons
  const specialUseIcons = {
    '\\Inbox': InboxIcon,
    '\\Sent': Send,
    '\\Drafts': FileText,
    '\\Trash': Trash,
    '\\Archive': Archive,
    '\\Junk': AlertCircle
  };

  // Map special use to display names
  const specialUseNames = {
    '\\Inbox': 'Inbox',
    '\\Sent': 'Sent',
    '\\Drafts': 'Drafts',
    '\\Trash': 'Trash',
    '\\Archive': 'Archive',
    '\\Junk': 'Spam'
  };

  let customFoldersExpanded = $state(true);

  function getIcon(mailbox) {
    return mailbox.specialUse ? specialUseIcons[mailbox.specialUse] || Folder : Folder;
  }

  function getName(mailbox) {
    return mailbox.specialUse ? specialUseNames[mailbox.specialUse] || mailbox.name : mailbox.name;
  }
</script>

<aside class="mailbox-sidebar {className}">
  <!-- Compose Button -->
  <div class="compose-section">
    <Button variant="primary md" class="compose-btn" onclick={() => mail.openCompose()}>
      <Plus size={18} />
      Compose
    </Button>
  </div>

  <!-- Special Folders -->
  <nav class="mailbox-list">
    {#each mail.specialMailboxes as mailbox (mailbox.path)}
      {@const Icon = getIcon(mailbox)}
      {@const isActive = mailbox.path === mail.currentMailbox}
      <button
        class={['mailbox-item', isActive && 'active']}
        onclick={() => mail.selectMailbox(mailbox.path)}
      >
        <Icon size={18} class="mailbox-icon" />
        <span class="mailbox-name">{getName(mailbox)}</span>
        {#if mailbox.unseenCount && mailbox.unseenCount > 0}
          <Badge variant={mailbox.specialUse === '\\Inbox' ? 'primary' : 'secondary'} size="xs">
            {mailbox.unseenCount}
          </Badge>
        {/if}
      </button>
    {/each}
  </nav>

  <!-- Custom Folders -->
  {#if mail.customMailboxes.length > 0}
    <div class="custom-folders">
      <button
        class="folders-header"
        onclick={() => (customFoldersExpanded = !customFoldersExpanded)}
      >
        <ChevronRight size={16} class={`expand-icon ${customFoldersExpanded ? 'expanded' : ''}`} />
        <span>Folders</span>
        <Badge variant="secondary" size="xs">{mail.customMailboxes.length}</Badge>
      </button>

      {#if customFoldersExpanded}
        <nav class="custom-list">
          {#each mail.customMailboxes as mailbox (mailbox.path)}
            {@const isActive = mailbox.path === mail.currentMailbox}
            <button
              class={['mailbox-item nested', isActive && 'active']}
              onclick={() => mail.selectMailbox(mailbox.path)}
            >
              <Folder size={16} class="mailbox-icon" />
              <span class="mailbox-name">{mailbox.name}</span>
              {#if mailbox.unseenCount && mailbox.unseenCount > 0}
                <Badge variant="secondary" size="xs">{mailbox.unseenCount}</Badge>
              {/if}
            </button>
          {/each}
        </nav>
      {/if}
    </div>
  {/if}

  <!-- Keyboard hint -->
  <div class="keyboard-hint">
    Press <kbd>?</kbd> for shortcuts
  </div>
</aside>

<style lang="postcss">
  @reference '$theme';

  .mailbox-sidebar {
    @apply flex flex-col w-60 flex-shrink-0;
    @apply bg-base01 border-r border-border/30;
    @apply h-full overflow-hidden;
  }

  .compose-section {
    @apply p-3;
  }

  .compose-section :global(.compose-btn) {
    @apply w-full justify-center gap-2;
  }

  .mailbox-list {
    @apply flex flex-col py-2;
  }

  .mailbox-item {
    @apply flex items-center gap-3 px-4 py-2 mx-2 rounded-lg;
    @apply text-sm text-base06 hover:bg-base02/50 transition-colors;
    @apply cursor-pointer;
  }

  .mailbox-item.active {
    @apply bg-base0D/10 text-base0D font-medium;
  }

  .mailbox-item.active .mailbox-icon {
    @apply text-base0D;
  }

  .mailbox-item.nested {
    @apply pl-6;
  }

  .mailbox-icon {
    @apply text-base05 flex-shrink-0;
  }

  .mailbox-name {
    @apply flex-1 truncate text-left;
  }

  .custom-folders {
    @apply mt-2 pt-2 border-t border-border/20;
  }

  .folders-header {
    @apply flex items-center gap-2 px-4 py-2 w-full;
    @apply text-xs font-medium text-base05 uppercase tracking-wide;
    @apply hover:text-base06 transition-colors;
  }

  .expand-icon {
    @apply transition-transform duration-200;
  }

  .expand-icon.expanded {
    @apply rotate-90;
  }

  .custom-list {
    @apply flex flex-col py-1;
  }

  .keyboard-hint {
    @apply mt-auto p-4 text-xs text-base05 text-center;
    @apply border-t border-border/20;
  }

  .keyboard-hint kbd {
    @apply px-1.5 py-0.5 bg-base02 rounded text-base06 font-mono;
  }
</style>
