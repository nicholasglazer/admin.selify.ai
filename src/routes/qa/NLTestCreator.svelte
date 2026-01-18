<script>
  import {getContext} from 'svelte';
  import {Modal, Button, Input} from '@miozu/jera';

  const qaState = getContext('qaState');
  const toastState = getContext('toastState');

  let nlCreator = $derived(qaState.nlCreator);
  let isGenerating = $derived(nlCreator.isGenerating);
  let generatedCode = $derived(nlCreator.generatedCode);
  let error = $derived(nlCreator.error);

  // Form state for saving
  let specName = $state('');
  let selectedCategory = $state('other');
  let tagsInput = $state('');
  let runOnPush = $state(false);

  const targetApps = qaState.targetApps;
  const categories = qaState.categories;
  const gitRepos = qaState.gitRepos;

  // Example prompts for inspiration
  const examplePrompts = [
    'User logs in with email and password, sees dashboard',
    'User creates a new wardrobe item with image upload',
    'User adds item to cart and completes checkout with Stripe',
    'User connects Instagram account via OAuth flow',
    'Admin views service health dashboard and restarts a service'
  ];

  function handleClose() {
    qaState.closeNLCreator();
  }

  async function handleGenerate() {
    await qaState.generateFromNL();
  }

  async function handleSave() {
    if (!specName.trim()) {
      toastState?.show({
        title: 'Name Required',
        message: 'Please enter a name for this test spec',
        type: 'error',
        duration: 3000
      });
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    // Create the spec with push trigger if enabled
    const specData = {
      name: specName,
      nl_spec: nlCreator.nlSpec,
      target_app: nlCreator.targetApp,
      category: selectedCategory,
      tags,
      generated_code: nlCreator.generatedCode,
      generated_by: 'deepseek',
      run_on_push: runOnPush
    };

    const spec = await qaState.createSpec(specData);

    if (spec) {
      qaState.closeNLCreator();
      specName = '';
      selectedCategory = 'other';
      tagsInput = '';
      runOnPush = false;
    }
  }

  function useExample(example) {
    qaState.setNLSpec(example);
  }
</script>

<Modal open={true} onClose={handleClose} size="lg">
  <div class="nl-creator">
    <div class="nl-header">
      <div class="header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </div>
      <div class="header-text">
        <h2>Create Test with Natural Language</h2>
        <p>Describe what you want to test in plain English. DeepSeek will generate Playwright code.</p>
      </div>
    </div>

    <div class="nl-body">
      <!-- Target App Selector -->
      <div class="form-group">
        <label for="target-app">Target Application</label>
        <select
          id="target-app"
          class="select-field"
          value={nlCreator.targetApp}
          onchange={(e) => qaState.setNLTargetApp(e.target.value)}
        >
          {#each targetApps as app}
            <option value={app}>{app}</option>
          {/each}
        </select>
      </div>

      <!-- Natural Language Input -->
      <div class="form-group">
        <label for="nl-spec">Test Description</label>
        <textarea
          id="nl-spec"
          class="nl-textarea"
          placeholder="Describe the test scenario in plain English...

Example: User logs in with valid credentials, navigates to the wardrobe page, uploads a new garment image, and verifies it appears in the grid."
          value={nlCreator.nlSpec}
          oninput={(e) => qaState.setNLSpec(e.target.value)}
          rows="6"
        ></textarea>
      </div>

      <!-- Example Prompts -->
      {#if !generatedCode}
        <div class="examples">
          <span class="examples-label">Try an example:</span>
          <div class="examples-list">
            {#each examplePrompts as example}
              <button class="example-btn" onclick={() => useExample(example)}>
                {example.slice(0, 40)}...
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Error Message -->
      {#if error}
        <div class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <!-- Generate Button -->
      {#if !generatedCode}
        <button
          class="generate-btn"
          onclick={handleGenerate}
          disabled={isGenerating || !nlCreator.nlSpec.trim()}
        >
          {#if isGenerating}
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Generating with DeepSeek...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
            Generate Playwright Code
          {/if}
        </button>
      {/if}

      <!-- Generated Code Preview -->
      {#if generatedCode}
        <div class="generated-section">
          <div class="generated-header">
            <h3>Generated Playwright Code</h3>
            <button
              class="regenerate-btn"
              onclick={handleGenerate}
              disabled={isGenerating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Regenerate
            </button>
          </div>
          <pre class="code-preview"><code>{generatedCode}</code></pre>
        </div>

        <!-- Save Form -->
        <div class="save-section">
          <h3>Save as Test Spec</h3>
          <div class="save-form">
            <div class="form-row">
              <div class="form-group">
                <label for="spec-name">Spec Name</label>
                <input
                  id="spec-name"
                  type="text"
                  class="input-field"
                  placeholder="e.g., Login with valid credentials"
                  bind:value={specName}
                />
              </div>
              <div class="form-group">
                <label for="spec-category">Category</label>
                <select
                  id="spec-category"
                  class="select-field"
                  bind:value={selectedCategory}
                >
                  {#each categories as cat}
                    <option value={cat.id}>{cat.name}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="spec-tags">Tags (comma-separated)</label>
              <input
                id="spec-tags"
                type="text"
                class="input-field"
                placeholder="e.g., smoke, regression, critical"
                bind:value={tagsInput}
              />
            </div>

            <!-- Push Trigger Toggle -->
            <label class="push-toggle">
              <input
                type="checkbox"
                bind:checked={runOnPush}
              />
              <div class="push-toggle-content">
                <span class="push-toggle-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3" />
                    <line x1="3" x2="9" y1="12" y2="12" />
                    <line x1="15" x2="21" y1="12" y2="12" />
                  </svg>
                  Run on Git Push
                </span>
                <span class="push-toggle-hint">Automatically run when code is pushed to repo</span>
              </div>
            </label>
          </div>
        </div>
      {/if}
    </div>

    <div class="nl-footer">
      <button class="cancel-btn" onclick={handleClose}>Cancel</button>
      {#if generatedCode}
        <button class="save-btn" onclick={handleSave}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save Spec
        </button>
      {/if}
    </div>
  </div>
</Modal>

<style lang="postcss">
  @reference '$theme';

  .nl-creator {
    @apply flex flex-col;
  }

  .nl-header {
    @apply flex items-start gap-4 p-6 border-b border-base02;
  }

  .header-icon {
    @apply w-12 h-12 rounded-xl bg-base0D/20 text-base0D;
    @apply flex items-center justify-center flex-shrink-0;
  }

  .header-text h2 {
    @apply text-lg font-semibold text-base06 mb-1;
  }

  .header-text p {
    @apply text-sm text-base04;
  }

  .nl-body {
    @apply p-6 flex flex-col gap-4;
    @apply max-h-[60vh] overflow-y-auto;
  }

  .form-group {
    @apply flex flex-col gap-1.5;
  }

  .form-group label {
    @apply text-sm font-medium text-base05;
  }

  .select-field,
  .input-field {
    @apply w-full px-3 py-2 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06;
    @apply focus:outline-none focus:ring-2 focus:ring-base0D/50 focus:border-base0D;
  }

  .nl-textarea {
    @apply w-full px-4 py-3 bg-base02 border border-base03 rounded-lg;
    @apply text-sm text-base06 resize-none;
    @apply focus:outline-none focus:ring-2 focus:ring-base0D/50 focus:border-base0D;
    @apply placeholder:text-base04;
  }

  .examples {
    @apply flex flex-col gap-2;
  }

  .examples-label {
    @apply text-xs text-base04;
  }

  .examples-list {
    @apply flex flex-wrap gap-2;
  }

  .example-btn {
    @apply px-3 py-1.5 text-xs bg-base02 text-base05 rounded-lg;
    @apply hover:bg-base03 transition-colors;
    @apply truncate max-w-[200px];
  }

  .error-message {
    @apply flex items-center gap-2 p-3 bg-base08/10 border border-base08/30 rounded-lg;
    @apply text-sm text-base08;
  }

  .generate-btn {
    @apply flex items-center justify-center gap-2 w-full py-3;
    @apply bg-base0D text-white rounded-lg font-medium;
    @apply hover:bg-base0D/90 transition-colors;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .generated-section {
    @apply flex flex-col gap-2;
  }

  .generated-header {
    @apply flex justify-between items-center;
  }

  .generated-header h3 {
    @apply text-sm font-medium text-base05;
  }

  .regenerate-btn {
    @apply flex items-center gap-1 px-2 py-1 text-xs text-base04;
    @apply hover:text-base06 transition-colors;
    @apply disabled:opacity-50;
  }

  .code-preview {
    @apply p-4 bg-base00 border border-base02 rounded-lg;
    @apply text-xs font-mono text-base05 overflow-x-auto;
    @apply max-h-[200px] overflow-y-auto;
  }

  .save-section {
    @apply pt-4 border-t border-base02;
  }

  .save-section h3 {
    @apply text-sm font-medium text-base05 mb-3;
  }

  .save-form {
    @apply flex flex-col gap-3;
  }

  .form-row {
    @apply grid grid-cols-2 gap-3;
  }

  .nl-footer {
    @apply flex justify-end gap-3 p-6 border-t border-base02;
  }

  .cancel-btn {
    @apply px-4 py-2 text-sm text-base04 hover:text-base06;
    @apply transition-colors;
  }

  .save-btn {
    @apply flex items-center gap-2 px-4 py-2;
    @apply bg-base0B text-white rounded-lg font-medium;
    @apply hover:bg-base0B/90 transition-colors;
  }

  .push-toggle {
    @apply flex items-start gap-3 p-3 bg-base02/50 rounded-lg;
    @apply cursor-pointer hover:bg-base02 transition-colors;
    @apply col-span-2;
  }

  .push-toggle input {
    @apply w-4 h-4 mt-0.5 accent-base0E;
  }

  .push-toggle-content {
    @apply flex flex-col;
  }

  .push-toggle-label {
    @apply flex items-center gap-2 text-sm text-base05;
  }

  .push-toggle-label svg {
    @apply text-base0E;
  }

  .push-toggle-hint {
    @apply text-xs text-base04 mt-0.5;
  }
</style>
