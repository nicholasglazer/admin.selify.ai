<script>
  /**
   * Add Email Account Modal
   *
   * Modal for adding new email accounts with:
   * - Provider presets (MXroute, Gmail, Outlook, etc.)
   * - Manual configuration option
   * - Connection testing
   */
  import {Mail, ChevronDown} from '$components/icons';
  import {Modal, Button, Input, Alert, Spinner} from '@miozu/jera';

  let {open = false, onClose, onSuccess, teamMemberEmail = ''} = $props();

  // Track if team email was pre-filled (for showing helpful message)
  let isTeamEmailPrefilled = $derived(teamMemberEmail && teamMemberEmail.endsWith('@selify.ai'));

  // Provider presets
  const PROVIDERS = [
    {
      id: 'mxroute',
      name: 'MXroute',
      icon: '📧',
      imapHost: 'shadow.mxrouting.net',
      imapPort: 993,
      smtpHost: 'shadow.mxrouting.net',
      smtpPort: 2525
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

  // Pre-fill team member email when modal opens
  $effect(() => {
    if (open && teamMemberEmail && teamMemberEmail.endsWith('@selify.ai')) {
      formData.email = teamMemberEmail;
      formData.displayName = teamMemberEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
      selectedProvider = 'mxroute'; // MXRoute is the provider for @selify.ai
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

  // Validate form
  let canTest = $derived(
    formData.email && formData.password && formData.imapHost && formData.smtpHost
  );
  let canSave = $derived(canTest && testResult === 'success');
</script>

<Modal
  bind:open={open}
  title="Add Email Account"
  size="lg"
  onclose={handleClose}
>
  {#snippet icon()}
    <Mail size={24} />
  {/snippet}

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
        <Alert variant="warning" size="sm">{currentProvider.note}</Alert>
      {/if}
    </div>

    <!-- Team member info banner -->
    {#if isTeamEmailPrefilled}
      <Alert variant="info">
        <span class="team-badge">Team Account</span>
        Your @selify.ai email is pre-configured. Enter the password from your onboarding email.
      </Alert>
    {/if}

    <!-- Email & Password -->
    <div class="form-section">
      <Input
        type="email"
        label="Email Address"
        bind:value={formData.email}
        placeholder="you@example.com"
        disabled={isTeamEmailPrefilled}
      />

      <Input
        type="password"
        label="Password"
        bind:value={formData.password}
        placeholder={isTeamEmailPrefilled ? "Password from onboarding email" : "Enter your email password"}
      />

      <div class="form-row">
        <Input
          type="text"
          label="Display Name (optional)"
          bind:value={formData.displayName}
          placeholder={formData.email?.split('@')[0] || 'Your name'}
        />
        <div class="color-field">
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
            <Input
              type="text"
              label="IMAP Host"
              bind:value={formData.imapHost}
              placeholder="imap.example.com"
            />
            <Input
              type="number"
              label="Port"
              bind:value={formData.imapPort}
              class="port-input"
            />
          </div>

          <div class="form-row">
            <Input
              type="text"
              label="SMTP Host"
              bind:value={formData.smtpHost}
              placeholder="smtp.example.com"
            />
            <Input
              type="number"
              label="Port"
              bind:value={formData.smtpPort}
              class="port-input"
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- Test Result -->
    {#if testResult === 'success'}
      <Alert variant="success">Connection successful! Ready to add account.</Alert>
    {:else if testResult === 'error'}
      <Alert variant="error">{testError}</Alert>
    {/if}

    <!-- Save Error -->
    {#if saveError}
      <Alert variant="error">{saveError}</Alert>
    {/if}
  </div>

  {#snippet footer()}
    <div class="footer-left">
      <Button variant="ghost" onclick={handleClose}>Cancel</Button>
    </div>
    <div class="footer-right">
      <Button variant="secondary" onclick={testConnection} disabled={!canTest || testing}>
        {#if testing}
          <Spinner size="sm" />
          Testing...
        {:else}
          Test Connection
        {/if}
      </Button>
      <Button variant="primary" onclick={saveAccount} disabled={!canSave || saving}>
        {#if saving}
          <Spinner size="sm" />
          Adding...
        {:else}
          Add Account
        {/if}
      </Button>
    </div>
  {/snippet}
</Modal>

<style lang="postcss">
  @reference '$theme';

  .modal-content {
    @apply space-y-6;
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

  .team-badge {
    @apply px-2 py-0.5 text-xs font-medium rounded-full;
    @apply bg-base0D text-white mr-2;
  }

  .form-row {
    @apply flex gap-3;
  }

  .color-field {
    @apply w-20 flex-shrink-0 flex flex-col gap-1.5;
  }

  .color-field label {
    @apply text-sm font-medium text-base06;
  }

  .color-field input[type='color'] {
    @apply w-full h-10 p-1 cursor-pointer rounded border border-border/40;
  }

  :global(.port-input) {
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

  .footer-left {
    @apply flex items-center;
  }

  .footer-right {
    @apply flex items-center gap-2;
  }
</style>
