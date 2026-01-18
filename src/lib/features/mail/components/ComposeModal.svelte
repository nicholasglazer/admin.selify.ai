<script>
  /**
   * Compose Modal
   *
   * Modal for composing new emails, replies, and forwards.
   * Features:
   * - Rich text editor (TipTap-like)
   * - Attachments
   * - Account selector for shared mailboxes
   * - Auto-save drafts
   */
  import DOMPurify from 'isomorphic-dompurify';
  import {X, Paperclip, Send, Trash, Minimize2, Maximize2, ChevronDown} from '$components/icons';
  import {Button} from '@miozu/jera';
  import {Badge} from '@miozu/jera';

  let {mail, onClose, class: className = ''} = $props();

  let minimized = $state(false);
  let maximized = $state(false);
  let toInput = $state('');
  let ccInput = $state('');
  let showCc = $state(false);
  let showBcc = $state(false);
  let bccInput = $state('');
  let attachments = $state([]);
  let fileInput = $state(null);

  // Initialize from draft
  $effect(() => {
    if (mail.composeDraft) {
      toInput = mail.composeDraft.to?.join(', ') || '';
      ccInput = mail.composeDraft.cc?.join(', ') || '';
      bccInput = mail.composeDraft.bcc?.join(', ') || '';
      showCc = (mail.composeDraft.cc?.length || 0) > 0;
      showBcc = (mail.composeDraft.bcc?.length || 0) > 0;
    }
  });

  // Parse email addresses from comma-separated string
  function parseEmails(str) {
    return str
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);
  }

  // Update draft when fields change
  function updateTo() {
    mail.updateDraft({to: parseEmails(toInput)});
  }

  function updateCc() {
    mail.updateDraft({cc: parseEmails(ccInput)});
  }

  function updateBcc() {
    mail.updateDraft({bcc: parseEmails(bccInput)});
  }

  function updateSubject(event) {
    mail.updateDraft({subject: event.target.value});
  }

  function updateBody(event) {
    mail.updateDraft({body: event.target.innerHTML});
  }

  // Handle file selection
  function handleFileSelect(event) {
    const files = Array.from(event.target.files || []);
    attachments = [...attachments, ...files];
    mail.updateDraft({attachments});
    fileInput.value = '';
  }

  function removeAttachment(index) {
    attachments = attachments.filter((_, i) => i !== index);
    mail.updateDraft({attachments});
  }

  // Send email
  async function handleSend() {
    const result = await mail.sendDraft();
    if (result.success) {
      onClose?.();
    } else {
      // Show error - could use toast
      alert(result.error || 'Failed to send email');
    }
  }

  // Discard draft
  function handleDiscard() {
    if (mail.composeDraft?.body || mail.composeDraft?.subject || mail.composeDraft?.to?.length) {
      if (!confirm('Discard this draft?')) return;
    }
    mail.closeCompose();
    onClose?.();
  }

  // Handle keyboard shortcuts
  function handleKeydown(event) {
    // Cmd/Ctrl + Enter to send
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSend();
    }
    // Escape to close (if not typing in a field)
    if (event.key === 'Escape' && !event.target.closest('input, textarea, [contenteditable]')) {
      handleDiscard();
    }
  }

  // Get account info for from field
  let fromAccount = $derived(
    mail.accounts.find(a => a.id === mail.composeDraft?.accountId) || mail.activeAccount
  );

  // Sanitize draft body for display
  let sanitizedBody = $derived(
    mail.composeDraft?.body ? DOMPurify.sanitize(mail.composeDraft.body) : ''
  );
</script>

<svelte:window onkeydown={handleKeydown} />

{#if mail.composeOpen}
  <div
    class={[`compose-modal ${className}`, minimized && 'minimized', maximized && 'maximized']}
    role="dialog"
    aria-labelledby="compose-title"
  >
    <!-- Header -->
    <header class="compose-header">
      <h2 id="compose-title" class="compose-title">
        {#if mail.composeDraft?.replyTo}
          {mail.composeDraft.replyTo.type === 'forward' ? 'Forward' : 'Reply'}
        {:else}
          New Message
        {/if}
      </h2>
      <div class="header-actions">
        <button
          class="header-btn"
          onclick={() => (minimized = !minimized)}
          title={minimized ? 'Expand' : 'Minimize'}
        >
          <Minimize2 size={16} />
        </button>
        <button
          class="header-btn"
          onclick={() => (maximized = !maximized)}
          title={maximized ? 'Restore' : 'Maximize'}
        >
          <Maximize2 size={16} />
        </button>
        <button class="header-btn close-btn" onclick={handleDiscard} title="Close">
          <X size={16} />
        </button>
      </div>
    </header>

    {#if !minimized}
      <!-- From (for shared accounts) -->
      {#if mail.accounts.length > 1}
        <div class="compose-field from-field">
          <label class="field-label">From</label>
          <select
            class="from-select"
            value={mail.composeDraft?.accountId}
            onchange={e => mail.updateDraft({accountId: e.target.value})}
          >
            {#each mail.accounts as account (account.id)}
              <option value={account.id}>
                {account.displayName}
                {account.type === 'shared' ? '(Team)' : ''}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- To -->
      <div class="compose-field">
        <label class="field-label">To</label>
        <input
          type="text"
          class="field-input"
          bind:value={toInput}
          onblur={updateTo}
          placeholder="recipient@example.com"
        />
        {#if !showCc || !showBcc}
          <div class="field-extras">
            {#if !showCc}
              <button class="extra-btn" onclick={() => (showCc = true)}>Cc</button>
            {/if}
            {#if !showBcc}
              <button class="extra-btn" onclick={() => (showBcc = true)}>Bcc</button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- CC -->
      {#if showCc}
        <div class="compose-field">
          <label class="field-label">Cc</label>
          <input
            type="text"
            class="field-input"
            bind:value={ccInput}
            onblur={updateCc}
            placeholder="cc@example.com"
          />
        </div>
      {/if}

      <!-- BCC -->
      {#if showBcc}
        <div class="compose-field">
          <label class="field-label">Bcc</label>
          <input
            type="text"
            class="field-input"
            bind:value={bccInput}
            onblur={updateBcc}
            placeholder="bcc@example.com"
          />
        </div>
      {/if}

      <!-- Subject -->
      <div class="compose-field">
        <label class="field-label">Subject</label>
        <input
          type="text"
          class="field-input"
          value={mail.composeDraft?.subject || ''}
          oninput={updateSubject}
          placeholder="Subject"
        />
      </div>

      <!-- Body -->
      <div class="compose-body">
        <div
          class="body-editor"
          contenteditable="true"
          oninput={updateBody}
          role="textbox"
          aria-multiline="true"
          aria-label="Email body"
          data-placeholder="Write your message..."
        >
          {@html sanitizedBody}
        </div>
      </div>

      <!-- Attachments -->
      {#if attachments.length > 0}
        <div class="attachments-section">
          {#each attachments as file, index (file.name + index)}
            <div class="attachment-item">
              <Paperclip size={14} />
              <span class="attachment-name">{file.name}</span>
              <span class="attachment-size">({Math.round(file.size / 1024)} KB)</span>
              <button class="remove-attachment" onclick={() => removeAttachment(index)}>
                <X size={14} />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Footer -->
      <footer class="compose-footer">
        <div class="footer-left">
          <Button
            variant="primary md"
            onclick={handleSend}
            disabled={mail.loading.sending || !toInput.trim()}
          >
            <Send size={16} />
            {mail.loading.sending ? 'Sending...' : 'Send'}
          </Button>
        </div>

        <div class="footer-right">
          <input
            bind:this={fileInput}
            type="file"
            multiple
            class="hidden"
            onchange={handleFileSelect}
          />
          <button class="footer-btn" onclick={() => fileInput?.click()} title="Attach files">
            <Paperclip size={18} />
          </button>
          <button class="footer-btn danger" onclick={handleDiscard} title="Discard">
            <Trash size={18} />
          </button>
        </div>
      </footer>
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .compose-modal {
    @apply fixed bottom-0 right-6 w-[560px] max-w-[calc(100vw-48px)];
    @apply bg-base01 border border-border/40 rounded-t-xl shadow-2xl;
    @apply flex flex-col z-50;
    max-height: 80vh;
  }

  .compose-modal.minimized {
    @apply h-auto;
  }

  .compose-modal.maximized {
    @apply inset-4 w-auto max-w-none rounded-xl;
    max-height: none;
  }

  .compose-header {
    @apply flex items-center justify-between px-4 py-3;
    @apply bg-base02/50 rounded-t-xl border-b border-border/20;
  }

  .compose-title {
    @apply text-sm font-semibold text-base07;
  }

  .header-actions {
    @apply flex items-center gap-1;
  }

  .header-btn {
    @apply p-1.5 rounded text-base05 hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .header-btn.close-btn:hover {
    @apply bg-base08/20 text-base08;
  }

  .compose-field {
    @apply flex items-center gap-3 px-4 py-2 border-b border-border/10;
  }

  .compose-field.from-field {
    @apply bg-base02/20;
  }

  .field-label {
    @apply text-sm text-base05 w-12 flex-shrink-0;
  }

  .field-input {
    @apply flex-1 bg-transparent border-none text-sm text-base07;
    @apply placeholder-base05 focus:outline-none;
  }

  .from-select {
    @apply flex-1 bg-transparent border-none text-sm text-base07;
    @apply focus:outline-none cursor-pointer;
  }

  .field-extras {
    @apply flex items-center gap-2;
  }

  .extra-btn {
    @apply text-xs text-base0D hover:underline;
  }

  .compose-body {
    @apply flex-1 min-h-[200px] overflow-y-auto;
  }

  .body-editor {
    @apply p-4 min-h-full text-sm text-base07 leading-relaxed;
    @apply focus:outline-none;
  }

  .body-editor:empty::before {
    content: attr(data-placeholder);
    @apply text-base05;
  }

  .body-editor :global(a) {
    @apply text-base0D hover:underline;
  }

  .attachments-section {
    @apply flex flex-wrap gap-2 px-4 py-3 border-t border-border/20 bg-base02/20;
  }

  .attachment-item {
    @apply flex items-center gap-1.5 px-2 py-1 rounded;
    @apply bg-base01 border border-border/40 text-xs text-base06;
  }

  .attachment-name {
    @apply truncate max-w-24;
  }

  .attachment-size {
    @apply text-base05;
  }

  .remove-attachment {
    @apply p-0.5 rounded text-base05 hover:text-base08 hover:bg-base08/10;
  }

  .compose-footer {
    @apply flex items-center justify-between px-4 py-3 border-t border-border/20;
  }

  .footer-left {
    @apply flex items-center gap-2;
  }

  .footer-right {
    @apply flex items-center gap-1;
  }

  .footer-btn {
    @apply p-2 rounded text-base05 hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .footer-btn.danger:hover {
    @apply bg-base08/10 text-base08;
  }

  .hidden {
    @apply sr-only;
  }
</style>
