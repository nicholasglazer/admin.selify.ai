<script>
  import {getContext} from 'svelte';
  import {enhance} from '$app/forms';
  import {PageHeader, Card, Button, Input, Badge} from '$components';

  let {data, form} = $props();
  const {roles} = data;

  // Get toast state from context
  const toastState = getContext('toastState');

  // Form state using reactive class pattern
  let formState = $state({
    fullName: form?.fullName || '',
    personalEmail: form?.personalEmail || '',
    roleName: form?.roleName || ''
  });

  // UI state
  let isSubmitting = $state(false);

  // Derived: Form validation
  let isValid = $derived(
    formState.fullName.trim().length >= 2 &&
    formState.personalEmail.includes('@') &&
    formState.roleName !== ''
  );

  // Derived: Has changes from initial
  let hasChanges = $derived(
    formState.fullName !== '' ||
    formState.personalEmail !== '' ||
    formState.roleName !== ''
  );

  // Handle form submission with SvelteKit enhance
  function handleSubmit() {
    return async ({result, update}) => {
      isSubmitting = true;

      if (result.type === 'redirect') {
        // Success - show toast and let redirect happen
        toastState?.success('Team member onboarded!', 'Workflow started successfully');
      } else if (result.type === 'failure') {
        // Error - show toast with error message
        toastState?.error('Onboarding failed', result.data?.error || 'Unknown error');
        isSubmitting = false;
      } else {
        isSubmitting = false;
      }

      await update();
    };
  }

  // Sync form state when server returns error with values
  $effect(() => {
    if (form) {
      formState.fullName = form.fullName || '';
      formState.personalEmail = form.personalEmail || '';
      formState.roleName = form.roleName || '';
    }
  });
</script>

<svelte:head>
  <title>Onboard Team Member | Selify Admin</title>
</svelte:head>

<a href="/team" class="back-link">
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
  </svg>
  Back to Team
</a>

<PageHeader
  title="Onboard Team Member"
  subtitle="Create a new @selify.ai email account and credentials. The new member will receive an email with login instructions."
/>

{#if form?.error}
  <div class="error-banner" role="alert">
    <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    <span>{form.error}</span>
  </div>
{/if}

<Card>
  <form method="POST" class="form" use:enhance={handleSubmit}>
    <div class="form-section">
      <h2 class="section-title">Personal Information</h2>

      <div class="form-group">
        <label for="full_name" class="form-label">Full Name</label>
        <Input
          id="full_name"
          name="full_name"
          placeholder="John Doe"
          bind:value={formState.fullName}
          required
          disabled={isSubmitting}
          minlength="2"
        />
        <p class="form-hint">This will be used for their @selify.ai email (e.g., john.doe@selify.ai)</p>
      </div>

      <div class="form-group">
        <label for="personal_email" class="form-label">Personal Email</label>
        <Input
          type="email"
          id="personal_email"
          name="personal_email"
          placeholder="john@gmail.com"
          bind:value={formState.personalEmail}
          required
          disabled={isSubmitting}
        />
        <p class="form-hint">Credentials will be sent here</p>
      </div>
    </div>

    <div class="form-section">
      <h2 class="section-title">Role & Permissions</h2>

      <div class="role-grid">
        {#each roles as role}
          <label class="role-card" class:selected={formState.roleName === role.name}>
            <input
              type="radio"
              name="role_name"
              value={role.name}
              bind:group={formState.roleName}
              disabled={isSubmitting}
              required
            />
            <div class="role-content">
              <div class="role-name">{role.label}</div>
              <div class="role-desc">{role.description}</div>
            </div>
          </label>
        {/each}
      </div>
    </div>

    <div class="form-actions">
      <Button href="/team" variant="ghost" disabled={isSubmitting}>Cancel</Button>
      <Button type="submit" variant="primary" disabled={isSubmitting || !isValid}>
        {#if isSubmitting}
          <span class="spinner"></span>
          Onboarding...
        {:else}
          Start Onboarding
        {/if}
      </Button>
    </div>
  </form>
</Card>

<Card class="workflow-info">
  <h3 class="info-title">What happens next?</h3>
  <ol class="info-list">
    <li>A unique @selify.ai email and password are generated</li>
    <li>MXRoute email account is created</li>
    <li>Supabase auth user is created</li>
    <li>Team member record is added with role permissions</li>
    <li>Onboarding email is sent to personal email</li>
    <li>Audit log entry is recorded</li>
  </ol>
</Card>

<style lang="postcss">
  @reference '$theme';

  .back-link {
    @apply inline-flex items-center gap-2;
    @apply text-sm text-base04 mb-4;
    @apply hover:text-base05 transition-colors;
  }

  .error-banner {
    @apply flex items-center gap-3;
    @apply bg-base08/15 border border-base08/30 text-base08;
    @apply px-4 py-3 rounded-lg mb-6 text-sm;
  }

  .form {
    @apply space-y-8;
  }

  .form-section {
    @apply space-y-4;
  }

  .section-title {
    @apply text-base font-medium text-base05;
    @apply pb-3 border-b border-border;
  }

  .form-group {
    @apply space-y-2;
  }

  .form-label {
    @apply block text-sm font-medium text-base05;
  }

  .form-hint {
    @apply text-xs text-base04;
  }

  .role-grid {
    @apply grid gap-3;
  }

  @media (min-width: 640px) {
    .role-grid {
      @apply grid-cols-2;
    }
  }

  .role-card {
    @apply flex items-start gap-3;
    @apply p-4 bg-base00 border border-border rounded-lg;
    @apply cursor-pointer transition-all duration-150;
  }

  .role-card:hover:not(:has(input:disabled)) {
    @apply border-base03 bg-base02/30;
  }

  .role-card.selected {
    @apply border-base0D bg-base0D/5;
  }

  .role-card input {
    @apply mt-0.5 accent-base0D;
  }

  .role-card:has(input:disabled) {
    @apply opacity-60 cursor-not-allowed;
  }

  .role-content {
    @apply flex-1;
  }

  .role-name {
    @apply font-medium text-base06 mb-1;
  }

  .role-desc {
    @apply text-xs text-base04;
  }

  .form-actions {
    @apply flex justify-end gap-3;
    @apply pt-6 border-t border-border;
  }

  .spinner {
    @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  :global(.workflow-info) {
    @apply mt-6;
  }

  .info-title {
    @apply text-sm font-medium text-base04 mb-4;
  }

  .info-list {
    @apply pl-5 text-sm text-base04 space-y-2;
    list-style-type: decimal;
  }

  .info-list li {
    @apply pl-1;
  }
</style>
