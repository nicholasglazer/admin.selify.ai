<script>
  /**
   * Add Email Account Modal
   *
   * Modal for adding new email accounts with:
   * - Provider presets (MXroute, Gmail, Outlook, etc.)
   * - Manual configuration option
   * - Connection testing
   */
  import {X, Mail, CheckCircle, CircleX, RefreshCw, ChevronDown} from '$components/icons';
  import {Button} from '@miozu/jera';

  let {open = false, onClose, onSuccess} = $props();

  // Provider presets
  const PROVIDERS = [
    {
      id: 'mxroute',
      name: 'MXroute',
      icon: '📧',
      imapHost: 'shadow.mxrouting.net',
      imapPort: 993,
      smtpHost: 'shadow.mxrouting.net',
      smtpPort: 465
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '📮',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      note: 'Requires App Password (not regular password)'
    },
    {
      id: 'outlook',
      name: 'Outlook / Microsoft 365',
      icon: '📬',
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587
    },
    {
      id: 'yahoo',
      name: 'Yahoo Mail',
      icon: '📪',
      imapHost: 'imap.mail.yahoo.com',
      imapPort: 993,
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: 465,
      note: 'Requires App Password'
    },
    {
      id: 'fastmail',
      name: 'Fastmail',
      icon: '⚡',
      imapHost: 'imap.fastmail.com',
      imapPort: 993,
      smtpHost: 'smtp.fastmail.com',
      smtpPort: 465
    },
    {
      id: 'protonmail',
      name: 'ProtonMail Bridge',
      icon: '🔒',
      imapHost: '127.0.0.1',
      imapPort: 1143,
      smtpHost: '127.0.0.1',
      smtpPort: 1025,
      note: 'Requires ProtonMail Bridge running locally'
    },
    {
      id: 'custom',
      name: 'Custom / Other',
      icon: '⚙️',
      imapHost: '',
      imapPort: 993,
      smtpHost: '',
      smtpPort: 465
    }
  ];

  // Form state
  let selectedProvider = $state('mxroute');
  let showAdvanced = $state(false);

  let formData = $state({
    email: '',
    password: '',
    displayName: '',
    imapHost: PROVIDERS[0].imapHost,
    imapPort: PROVIDERS[0].imapPort,
    smtpHost: PROVIDERS[0].smtpHost,
    smtpPort: PROVIDERS[0].smtpPort,
    color: '#8b5cf6'
  });

  // Status
  let testing = $state(false);
  let testResult = $state(null); // null | 'success' | 'error'
  let testError = $state('');
  let saving = $state(false);
  let saveError = $state('');

  // Update form when provider changes
  $effect(() => {
    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    if (provider) {
      formData.imapHost = provider.imapHost;
      formData.imapPort = provider.imapPort;
      formData.smtpHost = provider.smtpHost;
      formData.smtpPort = provider.smtpPort;

      // Show advanced settings for custom provider
      if (provider.id === 'custom') {
        showAdvanced = true;
      }
    }
  });

  // Get current provider
  let currentProvider = $derived(PROVIDERS.find(p => p.id === selectedProvider));

  // Test connection
  async function testConnection() {
    testing = true;
    testResult = null;
    testError = '';

    try {
      const response = await fetch('/webmail/api/test-connection', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort
        })
      });

      const data = await response.json();

      if (data.success) {
        testResult = 'success';
      } else {
        testResult = 'error';
        testError = data.error || 'Connection failed';
      }
    } catch (error) {
      testResult = 'error';
      testError = 'Network error. Please try again.';
    } finally {
      testing = false;
    }
  }

  // Save account
  async function saveAccount() {
    saving = true;
    saveError = '';

    try {
      const response = await fetch('/webmail/api/accounts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.email.split('@')[0],
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          color: formData.color
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.accountId);
        handleClose();
      } else {
        saveError = data.error || 'Failed to add account';
      }
    } catch (error) {
      saveError = 'Network error. Please try again.';
    } finally {
      saving = false;
    }
  }

  // Handle close
  function handleClose() {
    // Reset form
    formData = {
      email: '',
      password: '',
      displayName: '',
      imapHost: PROVIDERS[0].imapHost,
      imapPort: PROVIDERS[0].imapPort,
      smtpHost: PROVIDERS[0].smtpHost,
      smtpPort: PROVIDERS[0].smtpPort,
      color: '#8b5cf6'
    };
    selectedProvider = 'mxroute';
    showAdvanced = false;
    testResult = null;
    testError = '';
    saveError = '';
    onClose?.();
  }

  // Handle escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Handle backdrop click
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  // Validate form
  let canTest = $derived(
    formData.email && formData.password && formData.imapHost && formData.smtpHost
  );
  let canSave = $derived(canTest && testResult === 'success');
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="0"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e)}
  >
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="add-email-modal-title" onclick={e => e.stopPropagation()} onkeydown={e => e.stopPropagation()}>
      <!-- Header -->
      <header class="modal-header">
        <div class="header-icon">
          <Mail size={24} />
        </div>
        <div class="header-text">
          <h2 id="add-email-modal-title">Add Email Account</h2>
          <p>Connect your email to send and receive messages</p>
        </div>
        <button class="close-btn" onclick={handleClose}>
          <X size={20} />
        </button>
      </header>

      <!-- Content -->
      <div class="modal-content">
        <!-- Provider Selection -->
        <div class="form-section">
          <span class="section-label">Email Provider</span>
          <div class="provider-grid">
            {#each PROVIDERS as provider (provider.id)}
              <button
                type="button"
                class={['provider-card', selectedProvider === provider.id && 'selected']}
                onclick={() => (selectedProvider = provider.id)}
              >
                <span class="provider-icon">{provider.icon}</span>
                <span class="provider-name">{provider.name}</span>
              </button>
            {/each}
          </div>
          {#if currentProvider?.note}
            <p class="provider-note">{currentProvider.note}</p>
          {/if}
        </div>

        <!-- Email & Password -->
        <div class="form-section">
          <div class="form-row">
            <div class="form-field">
              <label for="email">Email Address</label>
              <input
                type="email"
                id="email"
                bind:value={formData.email}
                placeholder="you@example.com"
                autocomplete="email"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                bind:value={formData.password}
                placeholder="Enter your email password"
                autocomplete="current-password"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="displayName">Display Name (optional)</label>
              <input
                type="text"
                id="displayName"
                bind:value={formData.displayName}
                placeholder={formData.email?.split('@')[0] || 'Your name'}
              />
            </div>
            <div class="form-field color-field">
              <label for="color">Color</label>
              <input type="color" id="color" bind:value={formData.color} />
            </div>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="form-section">
          <button
            type="button"
            class="advanced-toggle"
            onclick={() => (showAdvanced = !showAdvanced)}
          >
            <ChevronDown size={16} class={showAdvanced ? 'rotated' : ''} />
            Advanced Settings
          </button>

          {#if showAdvanced}
            <div class="advanced-fields">
              <div class="form-row">
                <div class="form-field">
                  <label for="imapHost">IMAP Host</label>
                  <input
                    type="text"
                    id="imapHost"
                    bind:value={formData.imapHost}
                    placeholder="imap.example.com"
                  />
                </div>
                <div class="form-field port-field">
                  <label for="imapPort">Port</label>
                  <input type="number" id="imapPort" bind:value={formData.imapPort} />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="smtpHost">SMTP Host</label>
                  <input
                    type="text"
                    id="smtpHost"
                    bind:value={formData.smtpHost}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div class="form-field port-field">
                  <label for="smtpPort">Port</label>
                  <input type="number" id="smtpPort" bind:value={formData.smtpPort} />
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Test Result -->
        {#if testResult}
          <div
            class={['test-result', testResult === 'success' && 'success', testResult === 'error' && 'error']}
          >
            {#if testResult === 'success'}
              <CheckCircle size={20} />
              <span>Connection successful! Ready to add account.</span>
            {:else}
              <CircleX size={20} />
              <span>{testError}</span>
            {/if}
          </div>
        {/if}

        <!-- Save Error -->
        {#if saveError}
          <div class="test-result error">
            <CircleX size={20} />
            <span>{saveError}</span>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <footer class="modal-footer">
        <Button variant="secondary" onclick={handleClose}>Cancel</Button>
        <div class="footer-actions">
          <Button variant="secondary" onclick={testConnection} disabled={!canTest || testing}>
            {#if testing}
              <RefreshCw size={16} class="spinning" />
              Testing...
            {:else}
              Test Connection
            {/if}
          </Button>
          <Button variant="primary" onclick={saveAccount} disabled={!canSave || saving}>
            {#if saving}
              <RefreshCw size={16} class="spinning" />
              Adding...
            {:else}
              Add Account
            {/if}
          </Button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style lang="postcss">
  @reference '$theme';

  .modal-backdrop {
    @apply fixed inset-0 z-50 bg-black/50;
    @apply flex items-center justify-center p-4;
  }

  .modal-container {
    @apply bg-base01 rounded-xl shadow-2xl w-full max-w-xl;
    @apply flex flex-col max-h-[90vh];
  }

  .modal-header {
    @apply flex items-start gap-4 px-6 py-5;
    @apply border-b border-border/30;
  }

  .header-icon {
    @apply w-12 h-12 rounded-xl bg-base0D/20 text-base0D;
    @apply flex items-center justify-center flex-shrink-0;
  }

  .header-text {
    @apply flex-1;
  }

  .header-text h2 {
    @apply text-lg font-semibold text-base07 m-0;
  }

  .header-text p {
    @apply text-sm text-base05 mt-1 m-0;
  }

  .close-btn {
    @apply p-2 rounded-lg text-base05 hover:text-base06 hover:bg-base02;
    @apply transition-colors;
  }

  .modal-content {
    @apply flex-1 overflow-y-auto px-6 py-5 space-y-6;
  }

  .form-section {
    @apply space-y-3;
  }

  .section-label {
    @apply block text-sm font-medium text-base06 mb-2;
  }

  .provider-grid {
    @apply grid grid-cols-3 gap-2;
  }

  .provider-card {
    @apply flex flex-col items-center gap-1 p-3 rounded-lg;
    @apply border border-border/40 bg-transparent;
    @apply hover:border-border/60 hover:bg-base02/30;
    @apply transition-all cursor-pointer;
  }

  .provider-card.selected {
    @apply border-base0D bg-base0D/10;
  }

  .provider-icon {
    @apply text-xl;
  }

  .provider-name {
    @apply text-xs text-base06 text-center;
  }

  .provider-note {
    @apply text-xs text-base09 mt-2 p-2 rounded bg-base09/10;
  }

  .form-row {
    @apply flex gap-3;
  }

  .form-field {
    @apply flex-1 flex flex-col gap-1.5;
  }

  .form-field label {
    @apply text-sm font-medium text-base06;
  }

  .form-field input {
    @apply w-full px-3 py-2 bg-transparent border border-border/40 rounded-lg;
    @apply text-sm text-base07 placeholder-base05;
    @apply focus:outline-none focus:ring-2 focus:ring-base0D/30 focus:border-base0D;
    @apply transition-all;
  }

  .form-field input:hover {
    @apply border-border/60;
  }

  .color-field {
    @apply w-20 flex-shrink-0;
  }

  .color-field input[type='color'] {
    @apply h-10 p-1 cursor-pointer;
  }

  .port-field {
    @apply w-24 flex-shrink-0;
  }

  .advanced-toggle {
    @apply flex items-center gap-2 text-sm text-base0D hover:underline;
  }

  .advanced-toggle :global(.rotated) {
    transform: rotate(180deg);
  }

  .advanced-fields {
    @apply space-y-3 pt-3;
  }

  .test-result {
    @apply flex items-center gap-2 p-3 rounded-lg text-sm;
  }

  .test-result.success {
    @apply bg-base0B/10 text-base0B;
  }

  .test-result.error {
    @apply bg-base08/10 text-base08;
  }

  .modal-footer {
    @apply flex items-center justify-between px-6 py-4;
    @apply border-t border-border/30;
  }

  .footer-actions {
    @apply flex items-center gap-2;
  }

  /* Spinner animation */
  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
