<script>
  /**
   * Message View
   *
   * Displays the full email content with:
   * - Headers (from, to, date, subject)
   * - HTML/text body (sanitized)
   * - Attachments
   * - Reply/Forward/Archive/Delete actions
   */
  import DOMPurify from 'isomorphic-dompurify';
  import {format} from 'date-fns';
  import {
    Reply,
    ReplyAll,
    Forward,
    Trash,
    Archive,
    Star,
    MoreHorizontal,
    Paperclip,
    Download,
    ChevronLeft,
    Mail
  } from '$components/icons';
  import {Button} from '@miozu/jera';
  import {Badge} from '@miozu/jera';

  let {mail, mobile = null, onReply, class: className = ''} = $props();

  let showAllRecipients = $state(false);

  // Format file size
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Handle reply
  function handleReply(type) {
    onReply?.(type);
  }

  // Handle star
  function handleStar() {
    if (mail.selectedThread) {
      mail.toggleStar(mail.selectedThread.uid);
    }
  }

  // Handle delete
  function handleDelete() {
    if (mail.selectedThread) {
      mail.deleteThreads([mail.selectedThread.uid]);
    }
  }

  // Handle archive
  function handleArchive() {
    if (mail.selectedThread) {
      mail.archiveThreads([mail.selectedThread.uid]);
    }
  }

  // Back button for mobile
  function handleBack() {
    mobile?.back?.();
  }

  // Computed props
  let isStarred = $derived(mail.selectedThread?.flags.includes('\\Flagged') || false);
  let recipients = $derived(mail.selectedMessage?.to || []);
  let ccRecipients = $derived(mail.selectedMessage?.cc || []);
  let hasMoreRecipients = $derived(recipients.length + (ccRecipients?.length || 0) > 3);

  // Sanitize HTML content to prevent XSS
  let sanitizedHtml = $derived(
    mail.selectedMessage?.html ? DOMPurify.sanitize(mail.selectedMessage.html) : ''
  );
</script>

<article class="message-view {className}">
  {#if mail.loading.message}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <span>Loading message...</span>
    </div>
  {:else if mail.selectedMessage}
    <!-- Header -->
    <header class="message-header">
      <div class="header-top">
        {#if mobile?.isMobile}
          <button class="back-btn" onclick={handleBack}>
            <ChevronLeft size={20} />
          </button>
        {/if}

        <h1 class="message-subject">{mail.selectedMessage.subject || '(No subject)'}</h1>

        <button class={['star-btn', isStarred && 'starred']} onclick={handleStar}>
          <Star size={20} />
        </button>
      </div>

      <!-- From -->
      <div class="message-from">
        <div class="from-avatar">
          {(mail.selectedMessage.from?.name || mail.selectedMessage.from?.address || 'U')
            .charAt(0)
            .toUpperCase()}
        </div>
        <div class="from-info">
          <span class="from-name">
            {mail.selectedMessage.from?.name || mail.selectedMessage.from?.address}
          </span>
          {#if mail.selectedMessage.from?.name}
            <span class="from-address">&lt;{mail.selectedMessage.from?.address}&gt;</span>
          {/if}
        </div>
        <time class="message-date">
          {format(new Date(mail.selectedMessage.date), 'PPp')}
        </time>
      </div>

      <!-- To/CC -->
      <div class="message-recipients">
        <span class="recipients-label">To:</span>
        <span class="recipients-list">
          {#if showAllRecipients || !hasMoreRecipients}
            {recipients.map(r => r.name || r.address).join(', ')}
            {#if ccRecipients?.length}
              <br /><span class="recipients-label">Cc:</span>
              {ccRecipients.map(r => r.name || r.address).join(', ')}
            {/if}
          {:else}
            {recipients
              .slice(0, 2)
              .map(r => r.name || r.address)
              .join(', ')}
            <button class="show-more" onclick={() => (showAllRecipients = true)}>
              +{recipients.length + (ccRecipients?.length || 0) - 2} more
            </button>
          {/if}
        </span>
      </div>

      <!-- Actions -->
      <div class="message-actions">
        <Button variant="secondary sm" onclick={() => handleReply('reply')}>
          <Reply size={16} />
          Reply
        </Button>
        <Button variant="secondary sm" onclick={() => handleReply('replyAll')}>
          <ReplyAll size={16} />
          Reply All
        </Button>
        <Button variant="secondary sm" onclick={() => handleReply('forward')}>
          <Forward size={16} />
          Forward
        </Button>
        <div class="actions-divider"></div>
        <Button variant="ghost sm" onclick={handleArchive} title="Archive">
          <Archive size={16} />
        </Button>
        <Button variant="ghost sm" onclick={handleDelete} title="Delete">
          <Trash size={16} />
        </Button>
      </div>
    </header>

    <!-- Attachments -->
    {#if mail.selectedMessage.attachments?.length > 0}
      <div class="attachments-bar">
        <Paperclip size={16} class="attachments-icon" />
        <span class="attachments-label">
          {mail.selectedMessage.attachments.length} attachment{(
            mail.selectedMessage.attachments.length > 1
          ) ?
            's'
          : ''}
        </span>
        <div class="attachments-list">
          {#each mail.selectedMessage.attachments as attachment}
            <button class="attachment-chip">
              <span class="attachment-name">{attachment.filename}</span>
              <span class="attachment-size">({formatSize(attachment.size)})</span>
              <Download size={14} />
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Body -->
    <div class="message-body">
      {#if mail.selectedMessage.html}
        <div class="body-html">
          {@html sanitizedHtml}
        </div>
      {:else if mail.selectedMessage.text}
        <pre class="body-text">{mail.selectedMessage.text}</pre>
      {:else}
        <p class="body-empty">No content</p>
      {/if}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="empty-state">
      <Mail size={48} class="empty-icon" />
      <p class="empty-title">Select an email to read</p>
      <span class="empty-hint">
        Press <kbd>j</kbd>/<kbd>k</kbd> to navigate, <kbd>o</kbd> to open
      </span>
    </div>
  {/if}
</article>

<style lang="postcss">
  @reference '$theme';

  .message-view {
    @apply flex-1 flex flex-col h-full overflow-hidden;
    @apply bg-base01;
  }

  .loading-state {
    @apply flex-1 flex flex-col items-center justify-center gap-3;
    @apply text-sm text-base05;
  }

  .loading-spinner {
    @apply w-6 h-6 border-2 border-base04 border-t-base0D rounded-full;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .message-header {
    @apply flex flex-col gap-3 p-6 border-b border-border/20;
  }

  .header-top {
    @apply flex items-start gap-3;
  }

  .back-btn {
    @apply p-1 -ml-2 text-base05 hover:text-base06 transition-colors;
  }

  .message-subject {
    @apply flex-1 text-xl font-semibold text-base07 leading-tight;
  }

  .star-btn {
    @apply p-1 text-base04 hover:text-base09 transition-colors;
  }

  .star-btn.starred {
    @apply text-base09;
  }

  .message-from {
    @apply flex items-center gap-3;
  }

  .from-avatar {
    @apply w-10 h-10 rounded-full bg-base0D/20 text-base0D;
    @apply flex items-center justify-center font-semibold;
  }

  .from-info {
    @apply flex-1 min-w-0;
  }

  .from-name {
    @apply text-sm font-medium text-base07;
  }

  .from-address {
    @apply text-sm text-base05 ml-1;
  }

  .message-date {
    @apply text-xs text-base05;
  }

  .message-recipients {
    @apply text-xs text-base05;
  }

  .recipients-label {
    @apply text-base05 font-medium;
  }

  .recipients-list {
    @apply text-base06;
  }

  .show-more {
    @apply text-base0D hover:underline ml-1;
  }

  .message-actions {
    @apply flex items-center gap-2 pt-2 flex-wrap;
  }

  .actions-divider {
    @apply w-px h-6 bg-border/40 mx-1;
  }

  .attachments-bar {
    @apply flex items-center gap-3 px-6 py-3 border-b border-border/20;
    @apply bg-base02/20;
  }

  .attachments-icon {
    @apply text-base05;
  }

  .attachments-label {
    @apply text-sm text-base06;
  }

  .attachments-list {
    @apply flex items-center gap-2 flex-wrap flex-1;
  }

  .attachment-chip {
    @apply flex items-center gap-1.5 px-3 py-1.5 rounded-lg;
    @apply bg-base01 border border-border/40 text-sm text-base06;
    @apply hover:border-base0D transition-colors;
  }

  .attachment-name {
    @apply truncate max-w-32;
  }

  .attachment-size {
    @apply text-xs text-base05;
  }

  .message-body {
    @apply flex-1 overflow-y-auto p-6;
  }

  .body-html {
    @apply text-sm text-base06 leading-relaxed;
    /* Typography styles for rendered HTML email content */
    max-width: none;
  }

  .body-html :global(p) {
    @apply my-3;
  }

  .body-html :global(h1),
  .body-html :global(h2),
  .body-html :global(h3) {
    @apply font-semibold text-base07 mt-4 mb-2;
  }

  .body-html :global(ul),
  .body-html :global(ol) {
    @apply pl-6 my-3;
  }

  .body-html :global(li) {
    @apply my-1;
  }

  .body-html :global(blockquote) {
    @apply border-l-2 border-base03 pl-4 italic text-base05 my-3;
  }

  .body-html :global(a) {
    @apply text-base0D hover:underline;
  }

  .body-html :global(img) {
    @apply max-w-full h-auto;
  }

  .body-text {
    @apply whitespace-pre-wrap font-sans text-sm text-base06 leading-relaxed;
  }

  .body-empty {
    @apply text-sm text-base05 italic;
  }

  .empty-state {
    @apply flex-1 flex flex-col items-center justify-center gap-4;
  }

  .empty-icon {
    @apply text-base04;
  }

  .empty-title {
    @apply text-lg font-medium text-base06;
  }

  .empty-hint {
    @apply text-xs text-base05;
  }

  .empty-hint kbd {
    @apply px-1.5 py-0.5 bg-base02 rounded text-base06 font-mono;
  }
</style>
