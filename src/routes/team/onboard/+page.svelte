<script>
  import {enhance} from '$app/forms';
  import {PageHeader, Card, Button, Badge} from '$components';

  let {data, form} = $props();
  const {roles} = data;

  let isSubmitting = $state(false);
  let selectedRole = $state(form?.roleName || 'developer');

  // Generate suggested @selify.ai email from full name
  function generateSelifyEmail(fullName) {
    if (!fullName) return '';
    return fullName.toLowerCase().replace(/\s+/g, '.') + '@selify.ai';
  }

  let fullName = $state(form?.fullName || '');
  let suggestedEmail = $derived(generateSelifyEmail(fullName));
</script>

<svelte:head>
  <title>Onboard Team Member | Selify Admin</title>
</svelte:head>

<PageHeader title="Onboard Team Member" subtitle="Add a new member to the Selify team">
  {#snippet actions()}
    <Button href="/team" variant="ghost">Cancel</Button>
  {/snippet}
</PageHeader>

<div class="onboard-container">
  <Card class="onboard-card">
    <form
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({update}) => {
          isSubmitting = false;
          await update();
        };
      }}
    >
      {#if form?.error}
        <div class="error-banner">
          {form.error}
        </div>
      {/if}

      <div class="form-section">
        <h3 class="section-title">Personal Information</h3>
        <p class="section-desc">The onboarding email will be sent to their personal email with credentials.</p>

        <div class="form-group">
          <label for="full_name">Full Name <span class="required">*</span></label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            placeholder="John Doe"
            required
            bind:value={fullName}
          />
          {#if suggestedEmail}
            <p class="input-hint">Will create: <code>{suggestedEmail}</code></p>
          {/if}
        </div>

        <div class="form-group">
          <label for="personal_email">Personal Email <span class="required">*</span></label>
          <input
            type="email"
            id="personal_email"
            name="personal_email"
            placeholder="john@gmail.com"
            required
            value={form?.personalEmail || ''}
          />
          <p class="input-hint">Credentials will be sent to this email</p>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">Role & Access</h3>
        <p class="section-desc">Select the role that matches their responsibilities.</p>

        <div class="role-grid">
          {#each roles as role}
            <label class="role-card" class:selected={selectedRole === role.name}>
              <input
                type="radio"
                name="role_name"
                value={role.name}
                bind:group={selectedRole}
                class="sr-only"
              />
              <div class="role-header">
                <span class="role-name">{role.label}</span>
                <Badge variant={role.name === 'super_admin' ? 'warning' : 'default'} size="sm">
                  {role.name}
                </Badge>
              </div>
              <p class="role-desc">{role.description}</p>
            </label>
          {/each}
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">What Happens Next</h3>
        <ol class="checklist">
          <li>MXRoute email account will be created ({suggestedEmail || 'firstname.lastname@selify.ai'})</li>
          <li>Supabase auth user will be created</li>
          <li>Team member record will be added</li>
          <li>Webmail will be auto-configured</li>
          <li>Welcome email with credentials sent to personal email</li>
        </ol>
      </div>

      <div class="form-actions">
        <Button href="/team" variant="ghost">Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Starting Onboarding...' : 'Start Onboarding'}
        </Button>
      </div>
    </form>
  </Card>
</div>

<style lang="postcss">
  @reference '$theme';

  .onboard-container {
    @apply max-w-2xl;
  }

  :global(.onboard-card) {
    @apply p-0;
  }

  form {
    @apply p-6;
  }

  .error-banner {
    @apply p-4 mb-6 rounded-lg;
    @apply bg-base08/10 text-base08 border border-base08/20;
    @apply text-sm font-medium;
  }

  .form-section {
    @apply mb-8 pb-8 border-b border-border;
  }

  .form-section:last-of-type {
    @apply border-b-0 mb-6 pb-0;
  }

  .section-title {
    @apply text-base font-semibold text-base06 mb-1;
  }

  .section-desc {
    @apply text-sm text-base04 mb-4;
  }

  .form-group {
    @apply mb-4;
  }

  label {
    @apply block text-sm font-medium text-base05 mb-2;
  }

  .required {
    @apply text-base08;
  }

  input[type='text'],
  input[type='email'] {
    @apply w-full px-4 py-3 rounded-lg;
    @apply bg-base01 border border-border;
    @apply text-base05 placeholder-base04;
    @apply transition-colors duration-150;
    @apply focus:outline-none focus:border-base0D focus:ring-1 focus:ring-base0D/30;
  }

  .input-hint {
    @apply mt-2 text-xs text-base04;
  }

  .input-hint code {
    @apply px-1.5 py-0.5 rounded bg-base02 text-base0D font-mono text-xs;
  }

  .role-grid {
    @apply grid gap-3;
  }

  .role-card {
    @apply block p-4 rounded-lg cursor-pointer;
    @apply bg-base01 border-2 border-transparent;
    @apply transition-all duration-150;
  }

  .role-card:hover {
    @apply border-base03;
  }

  .role-card.selected {
    @apply border-base0D bg-base0D/5;
  }

  .role-header {
    @apply flex items-center justify-between mb-1;
  }

  .role-name {
    @apply font-medium text-base05;
  }

  .role-desc {
    @apply text-sm text-base04;
  }

  .checklist {
    @apply list-decimal list-inside space-y-2 text-sm text-base04;
  }

  .checklist li {
    @apply pl-2;
  }

  .form-actions {
    @apply flex justify-end gap-3 pt-4 border-t border-border;
  }

  .sr-only {
    @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
    clip: rect(0, 0, 0, 0);
  }
</style>
