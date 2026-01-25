/**
 * QA Reactive State - Manages AI-first test specifications and runs
 *
 * Integrates with Playwright Test Agents for:
 * - Natural language → Playwright test generation
 * - Auto-healing test maintenance
 * - Visual regression tracking
 */

const TARGET_APPS = ['dash.selify.ai', 'admin.selify.ai', 'api.selify.ai', 'vr.selify.ai'];

// Git repos from custom git-api infrastructure
const GIT_REPOS = ['backend-selify.ai', 'dash.selify.ai', 'admin.selify.ai'];

// Default repo mapping (target app → likely repos that affect it)
const DEFAULT_REPO_MAPPING = {
  'dash.selify.ai': ['dash.selify.ai', 'backend-selify.ai'],
  'admin.selify.ai': ['admin.selify.ai', 'backend-selify.ai'],
  'api.selify.ai': ['backend-selify.ai'],
  'vr.selify.ai': ['backend-selify.ai']
};

const CATEGORIES = [
  {id: 'auth', name: 'Authentication', icon: 'lock'},
  {id: 'billing', name: 'Billing', icon: 'credit-card'},
  {id: 'wardrobe', name: 'Wardrobe', icon: 'shirt'},
  {id: 'tryon', name: 'Try-On', icon: 'camera'},
  {id: 'social', name: 'Social/Bots', icon: 'message-circle'},
  {id: 'admin', name: 'Admin', icon: 'settings'},
  {id: 'api', name: 'API', icon: 'code'},
  {id: 'other', name: 'Other', icon: 'box'}
];

export class QAReactiveState {
  // Core Data
  specs = $state([]);
  runs = $state([]);
  suites = $state([]);
  schedules = $state([]);
  dashboardSummary = $state(null);
  triageSummary = $state(null);

  // UI State
  selectedSpec = $state(null);
  selectedRun = $state(null);
  selectedSuite = $state(null);
  isLoading = $state(true);
  viewMode = $state('specs'); // 'specs' | 'runs' | 'suites' | 'triage' | 'coverage'

  // Filters
  filters = $state({
    search: '',
    targetApp: null,
    category: null,
    status: null,
    tags: [],
    pushEnabled: null
  });

  // NL Test Creator state
  nlCreator = $state({
    isOpen: false,
    targetApp: 'dash.selify.ai',
    nlSpec: '',
    generatedCode: null,
    isGenerating: false,
    error: null
  });

  // Run in progress
  activeRun = $state(null);

  // Toast function reference
  showToast = null;

  // Supabase client reference
  supabase = null;

  // API base URL for DeepSeek generation
  apiBaseUrl = null;

  constructor(initialData = {}) {
    this.specs = initialData.specs || [];
    this.runs = initialData.runs || [];
    this.suites = initialData.suites || [];
    this.schedules = initialData.schedules || [];
    this.dashboardSummary = initialData.dashboardSummary || null;
    this.triageSummary = initialData.triageSummary || null;
    this.showToast = initialData.showToast || null;
    this.supabase = initialData.supabase || null;
    this.apiBaseUrl = initialData.apiBaseUrl || '';
    this.isLoading = false;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get targetApps() {
    return TARGET_APPS;
  }

  get gitRepos() {
    return GIT_REPOS;
  }

  get categories() {
    return CATEGORIES;
  }

  getDefaultReposForApp(targetApp) {
    return DEFAULT_REPO_MAPPING[targetApp] || [];
  }

  get totalSpecs() {
    return this.specs.filter((s) => s.status === 'active').length;
  }

  get passRate() {
    return this.dashboardSummary?.pass_rate || 0;
  }

  get healRate() {
    return this.dashboardSummary?.heal_rate || 0;
  }

  get recentRuns() {
    return this.dashboardSummary?.recent_runs || [];
  }

  get flakySpecs() {
    return this.dashboardSummary?.flaky_specs || [];
  }

  get autoHealedToday() {
    return this.dashboardSummary?.auto_healed_today || 0;
  }

  get pushEnabledSpecs() {
    return this.dashboardSummary?.push_enabled_specs || 0;
  }

  get specsByRepo() {
    return this.dashboardSummary?.specs_by_repo || {};
  }

  get recentPushRuns() {
    return this.dashboardSummary?.recent_push_runs || [];
  }

  get pushPassRate() {
    return this.dashboardSummary?.push_pass_rate || 0;
  }

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  getFilteredSpecs() {
    let filtered = [...this.specs].filter((s) => s.status !== 'archived');

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter((s) => {
        const name = s.name?.toLowerCase() || '';
        const nlSpec = s.nl_spec?.toLowerCase() || '';
        return name.includes(search) || nlSpec.includes(search);
      });
    }

    if (this.filters.targetApp) {
      filtered = filtered.filter((s) => s.target_app === this.filters.targetApp);
    }

    if (this.filters.category) {
      filtered = filtered.filter((s) => s.category === this.filters.category);
    }

    if (this.filters.status) {
      filtered = filtered.filter((s) => s.status === this.filters.status);
    }

    if (this.filters.tags?.length > 0) {
      filtered = filtered.filter((s) => this.filters.tags.some((tag) => s.tags?.includes(tag)));
    }

    if (this.filters.pushEnabled) {
      filtered = filtered.filter((s) => s.run_on_push === true);
    }

    return filtered;
  }

  getSpecsByTarget() {
    const grouped = {};
    for (const app of TARGET_APPS) {
      grouped[app] = this.specs.filter((s) => s.target_app === app && s.status === 'active');
    }
    return grouped;
  }

  // ============================================================================
  // SPEC CRUD
  // ============================================================================

  async createSpec(specData) {
    const targetApp = specData.target_app || 'dash.selify.ai';
    const newSpec = {
      name: specData.name || 'New Test Spec',
      nl_spec: specData.nl_spec || '',
      target_app: targetApp,
      category: specData.category || 'other',
      tags: specData.tags || [],
      status: 'draft',
      generated_code: specData.generated_code || null,
      generated_by: specData.generated_by || null,
      // Git push trigger settings
      run_on_push: specData.run_on_push ?? false,
      trigger_on_repos: specData.trigger_on_repos || this.getDefaultReposForApp(targetApp),
      push_priority: specData.push_priority || 100,
      push_timeout_ms: specData.push_timeout_ms || 60000
    };

    try {
      if (this.supabase) {
        const {data: inserted, error} = await this.supabase
          .from('qa_test_specs')
          .insert(newSpec)
          .select()
          .single();

        if (error) throw error;

        this.specs = [inserted, ...this.specs];

        if (this.showToast) {
          this.showToast({
            title: 'Spec Created',
            message: `"${inserted.name}" added`,
            type: 'success',
            duration: 3000
          });
        }

        return inserted;
      }
    } catch (error) {
      console.error('Failed to create spec:', error);
      if (this.showToast) {
        this.showToast({
          title: 'Creation Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return null;
    }
  }

  async updateSpec(specId, updates) {
    const index = this.specs.findIndex((s) => s.id === specId);
    if (index === -1) return false;

    const oldSpec = {...this.specs[index]};

    // Optimistic update
    this.specs[index] = {...this.specs[index], ...updates};
    this.specs = [...this.specs];

    try {
      if (this.supabase) {
        const {error} = await this.supabase
          .from('qa_test_specs')
          .update(updates)
          .eq('id', specId);

        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Failed to update spec:', error);
      // Rollback
      this.specs[index] = oldSpec;
      this.specs = [...this.specs];

      if (this.showToast) {
        this.showToast({
          title: 'Update Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return false;
    }
  }

  async deleteSpec(specId) {
    const spec = this.specs.find((s) => s.id === specId);
    if (!spec) return false;

    // Optimistic removal (soft delete)
    this.specs = this.specs.map((s) =>
      s.id === specId ? {...s, status: 'archived', deleted_at: new Date().toISOString()} : s
    );

    try {
      if (this.supabase) {
        const {error} = await this.supabase
          .from('qa_test_specs')
          .update({deleted_at: new Date().toISOString(), status: 'archived'})
          .eq('id', specId);

        if (error) throw error;
      }

      if (this.showToast) {
        this.showToast({
          title: 'Spec Archived',
          message: `"${spec.name}" has been archived`,
          type: 'info',
          duration: 3000
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to delete spec:', error);
      // Rollback
      this.specs = this.specs.map((s) => (s.id === specId ? spec : s));

      if (this.showToast) {
        this.showToast({
          title: 'Delete Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return false;
    }
  }

  // ============================================================================
  // PUSH TRIGGER SETTINGS
  // ============================================================================

  async togglePushTrigger(specId, enabled) {
    return this.updateSpec(specId, {run_on_push: enabled});
  }

  async updatePushRepos(specId, repos) {
    return this.updateSpec(specId, {trigger_on_repos: repos});
  }

  async updatePushPriority(specId, priority) {
    return this.updateSpec(specId, {push_priority: priority});
  }

  // ============================================================================
  // NL TEST GENERATION (DeepSeek Integration)
  // ============================================================================

  openNLCreator(targetApp = 'dash.selify.ai') {
    this.nlCreator = {
      isOpen: true,
      targetApp,
      nlSpec: '',
      generatedCode: null,
      isGenerating: false,
      error: null
    };
  }

  closeNLCreator() {
    this.nlCreator = {
      ...this.nlCreator,
      isOpen: false
    };
  }

  setNLSpec(spec) {
    this.nlCreator = {...this.nlCreator, nlSpec: spec, error: null};
  }

  setNLTargetApp(app) {
    this.nlCreator = {...this.nlCreator, targetApp: app};
  }

  async generateFromNL() {
    if (!this.nlCreator.nlSpec.trim()) {
      this.nlCreator = {...this.nlCreator, error: 'Please enter a test description'};
      return null;
    }

    this.nlCreator = {...this.nlCreator, isGenerating: true, error: null};

    try {
      // Get auth token from supabase session
      let authHeaders = {'Content-Type': 'application/json'};
      if (this.supabase) {
        const {data: {session}} = await this.supabase.auth.getSession();
        if (session?.access_token) {
          authHeaders['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      // Call DeepSeek API to generate Playwright code
      const response = await fetch(`${this.apiBaseUrl}/api/qa/generate-test`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          nl_spec: this.nlCreator.nlSpec,
          target_app: this.nlCreator.targetApp
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Generation failed');
      }

      const data = await response.json();

      this.nlCreator = {
        ...this.nlCreator,
        generatedCode: data.generated_code,
        isGenerating: false
      };

      return data.generated_code;
    } catch (error) {
      console.error('NL generation failed:', error);
      this.nlCreator = {
        ...this.nlCreator,
        isGenerating: false,
        error: error.message
      };
      return null;
    }
  }

  async saveGeneratedSpec(name, category = 'other', tags = []) {
    if (!this.nlCreator.generatedCode) return null;

    const spec = await this.createSpec({
      name,
      nl_spec: this.nlCreator.nlSpec,
      target_app: this.nlCreator.targetApp,
      category,
      tags,
      generated_code: this.nlCreator.generatedCode,
      generated_by: 'deepseek',
      status: 'draft'
    });

    if (spec) {
      this.closeNLCreator();
    }

    return spec;
  }

  // ============================================================================
  // TEST RUNS
  // ============================================================================

  async startRun(options = {}) {
    const runData = {
      target_app: options.targetApp || null,
      spec_ids: options.specIds || null,
      tags: options.tags || null,
      environment: options.environment || 'staging',
      trigger_type: 'manual'
    };

    try {
      if (this.supabase) {
        const {data: run, error} = await this.supabase
          .from('qa_test_runs')
          .insert(runData)
          .select()
          .single();

        if (error) throw error;

        this.runs = [run, ...this.runs];
        this.activeRun = run;

        if (this.showToast) {
          this.showToast({
            title: 'Test Run Started',
            message: `Run #${run.run_number} queued`,
            type: 'info',
            duration: 3000
          });
        }

        // Trigger actual execution via API
        this.executeRun(run.id);

        return run;
      }
    } catch (error) {
      console.error('Failed to start run:', error);
      if (this.showToast) {
        this.showToast({
          title: 'Run Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return null;
    }
  }

  async executeRun(runId) {
    // Call backend to actually execute Playwright tests
    try {
      // Get auth token from supabase session
      let authHeaders = {'Content-Type': 'application/json'};
      if (this.supabase) {
        const {data: {session}} = await this.supabase.auth.getSession();
        if (session?.access_token) {
          authHeaders['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(`${this.apiBaseUrl}/api/qa/execute-run`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({run_id: runId})
      });

      if (!response.ok) {
        console.error('Execute run API failed');
      }
    } catch (error) {
      console.error('Failed to execute run:', error);
    }
  }

  async cancelRun(runId) {
    try {
      if (this.supabase) {
        const {error} = await this.supabase
          .from('qa_test_runs')
          .update({status: 'cancelled'})
          .eq('id', runId);

        if (error) throw error;

        this.runs = this.runs.map((r) => (r.id === runId ? {...r, status: 'cancelled'} : r));

        if (this.activeRun?.id === runId) {
          this.activeRun = null;
        }

        if (this.showToast) {
          this.showToast({
            title: 'Run Cancelled',
            message: 'Test run has been cancelled',
            type: 'info',
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error('Failed to cancel run:', error);
    }
  }

  // ============================================================================
  // SELECTION & UI
  // ============================================================================

  selectSpec(spec) {
    this.selectedSpec = spec;
  }

  closeSpec() {
    this.selectedSpec = null;
  }

  selectRun(run) {
    this.selectedRun = run;
  }

  closeRun() {
    this.selectedRun = null;
  }

  setViewMode(mode) {
    this.viewMode = mode;
  }

  setFilter(key, value) {
    this.filters = {...this.filters, [key]: value};
  }

  clearFilters() {
    this.filters = {
      search: '',
      targetApp: null,
      category: null,
      status: null,
      tags: [],
      pushEnabled: null
    };
  }

  // ============================================================================
  // DATA REFRESH
  // ============================================================================

  async refreshDashboard() {
    if (!this.supabase) return;

    try {
      const {data, error} = await this.supabase.rpc('qa_get_dashboard_summary');
      if (error) throw error;
      this.dashboardSummary = data;
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }

  async refreshSpecs() {
    if (!this.supabase) return;

    try {
      const {data, error} = await this.supabase
        .from('qa_test_specs')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', {ascending: false});

      if (error) throw error;
      this.specs = data || [];
    } catch (error) {
      console.error('Failed to refresh specs:', error);
    }
  }

  async refreshRuns() {
    if (!this.supabase) return;

    try {
      const {data, error} = await this.supabase
        .from('qa_test_runs')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(50);

      if (error) throw error;
      this.runs = data || [];
    } catch (error) {
      console.error('Failed to refresh runs:', error);
    }
  }

  // ============================================================================
  // SUITES
  // ============================================================================

  get totalSuites() {
    return this.suites.length;
  }

  get quarantinedSpecs() {
    return this.triageSummary?.quarantined_specs || [];
  }

  get pendingTriageCount() {
    return this.triageSummary?.stats?.pending_triage_count || 0;
  }

  async loadSuites() {
    if (!this.supabase) return;

    try {
      const {data, error} = await this.supabase
        .schema('internal')
        .from('qa_test_suites')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      this.suites = data || [];
    } catch (error) {
      console.error('Failed to load suites:', error);
    }
  }

  async createSuite(suiteData) {
    const newSuite = {
      name: suiteData.name,
      description: suiteData.description || null,
      suite_type: suiteData.suite_type || 'static',
      spec_ids: suiteData.spec_ids || [],
      filter_tags: suiteData.filter_tags || [],
      filter_category: suiteData.filter_category || null,
      filter_target_app: suiteData.filter_target_app || null,
      parallel: suiteData.parallel || false,
      fail_fast: suiteData.fail_fast || false,
      tags: suiteData.tags || []
    };

    try {
      if (this.supabase) {
        const {data: inserted, error} = await this.supabase
          .schema('internal')
          .from('qa_test_suites')
          .insert(newSuite)
          .select()
          .single();

        if (error) throw error;

        this.suites = [inserted, ...this.suites];

        if (this.showToast) {
          this.showToast({
            title: 'Suite Created',
            message: `"${inserted.name}" added`,
            type: 'success',
            duration: 3000
          });
        }

        return inserted;
      }
    } catch (error) {
      console.error('Failed to create suite:', error);
      if (this.showToast) {
        this.showToast({
          title: 'Creation Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return null;
    }
  }

  async runSuite(suiteId, environment = 'staging') {
    try {
      // Get auth token
      let authHeaders = {'Content-Type': 'application/json'};
      if (this.supabase) {
        const {data: {session}} = await this.supabase.auth.getSession();
        if (session?.access_token) {
          authHeaders['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      // Call API to start suite run (triggers Temporal workflow)
      const response = await fetch(`${this.apiBaseUrl}/api/qa/run-suite`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({suite_id: suiteId, environment})
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to start suite run');
      }

      const data = await response.json();

      if (this.showToast) {
        this.showToast({
          title: 'Suite Run Started',
          message: `Running on ${environment}`,
          type: 'success',
          duration: 3000
        });
      }

      // Refresh runs
      await this.refreshRuns();

      return data;
    } catch (error) {
      console.error('Failed to run suite:', error);
      if (this.showToast) {
        this.showToast({
          title: 'Run Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return null;
    }
  }

  selectSuite(suite) {
    this.selectedSuite = suite;
  }

  closeSuite() {
    this.selectedSuite = null;
  }

  // ============================================================================
  // TRIAGE
  // ============================================================================

  async loadTriageSummary() {
    if (!this.supabase) return;

    try {
      const {data, error} = await this.supabase.rpc('qa_get_triage_summary');
      if (error) throw error;
      this.triageSummary = data;
    } catch (error) {
      console.error('Failed to load triage summary:', error);
    }
  }

  async triageRun(runId, status, notes = null) {
    try {
      if (this.supabase) {
        const {data: {user}} = await this.supabase.auth.getUser();

        const {error} = await this.supabase.rpc('qa_triage_run', {
          p_run_id: runId,
          p_status: status,
          p_notes: notes,
          p_triaged_by: user?.id
        });

        if (error) throw error;

        if (this.showToast) {
          this.showToast({
            title: 'Run Triaged',
            message: `Marked as ${status}`,
            type: 'success',
            duration: 3000
          });
        }

        // Refresh triage summary
        await this.loadTriageSummary();
        return true;
      }
    } catch (error) {
      console.error('Failed to triage run:', error);
      if (this.showToast) {
        this.showToast({
          title: 'Triage Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return false;
    }
  }

  async quarantineSpec(specId, reason) {
    try {
      if (this.supabase) {
        const {error} = await this.supabase.rpc('qa_quarantine_spec', {
          p_spec_id: specId,
          p_reason: reason,
          p_expires_in_days: 7
        });

        if (error) throw error;

        if (this.showToast) {
          this.showToast({
            title: 'Spec Quarantined',
            message: 'Test will be skipped in suite runs',
            type: 'warning',
            duration: 3000
          });
        }

        await this.refreshSpecs();
        await this.loadTriageSummary();
        return true;
      }
    } catch (error) {
      console.error('Failed to quarantine spec:', error);
      return false;
    }
  }

  async unquarantineSpec(specId) {
    try {
      if (this.supabase) {
        const {error} = await this.supabase.rpc('qa_unquarantine_spec', {
          p_spec_id: specId
        });

        if (error) throw error;

        if (this.showToast) {
          this.showToast({
            title: 'Spec Unquarantined',
            message: 'Test will now run in suite runs',
            type: 'success',
            duration: 3000
          });
        }

        await this.refreshSpecs();
        await this.loadTriageSummary();
        return true;
      }
    } catch (error) {
      console.error('Failed to unquarantine spec:', error);
      return false;
    }
  }

  // ============================================================================
  // SCHEDULES
  // ============================================================================

  async loadSchedules() {
    if (!this.supabase) return;

    try {
      const {data, error} = await this.supabase
        .schema('internal')
        .from('qa_schedules')
        .select('*, suite:qa_test_suites(name)')
        .order('next_run_at');

      if (error) throw error;
      this.schedules = data || [];
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }

  async createSchedule(scheduleData) {
    try {
      if (this.supabase) {
        const {data: inserted, error} = await this.supabase
          .schema('internal')
          .from('qa_schedules')
          .insert(scheduleData)
          .select()
          .single();

        if (error) throw error;

        this.schedules = [inserted, ...this.schedules];

        if (this.showToast) {
          this.showToast({
            title: 'Schedule Created',
            message: `"${inserted.name}" scheduled`,
            type: 'success',
            duration: 3000
          });
        }

        return inserted;
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      if (this.showToast) {
        this.showToast({
          title: 'Creation Failed',
          message: error.message,
          type: 'error',
          duration: 5000
        });
      }
      return null;
    }
  }

  async toggleSchedule(scheduleId, enabled) {
    try {
      if (this.supabase) {
        const {error} = await this.supabase
          .schema('internal')
          .from('qa_schedules')
          .update({enabled})
          .eq('id', scheduleId);

        if (error) throw error;

        this.schedules = this.schedules.map(s =>
          s.id === scheduleId ? {...s, enabled} : s
        );

        return true;
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      return false;
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  cleanup() {
    // Nothing to clean up for now
  }
}

// Singleton instance
let qaState = null;

/**
 * Get or create the QA state singleton
 * @param {Object} [initialData] - Initial data from server
 * @returns {QAReactiveState}
 */
export function getQAState(initialData = {}) {
  if (!qaState) {
    qaState = new QAReactiveState(initialData);
  } else if (Object.keys(initialData).length > 0) {
    if (initialData.specs) qaState.specs = initialData.specs;
    if (initialData.runs) qaState.runs = initialData.runs;
    if (initialData.dashboardSummary) qaState.dashboardSummary = initialData.dashboardSummary;
    if (initialData.showToast) qaState.showToast = initialData.showToast;
    if (initialData.supabase) qaState.supabase = initialData.supabase;
    if (initialData.apiBaseUrl) qaState.apiBaseUrl = initialData.apiBaseUrl;
  }
  return qaState;
}

/**
 * Reset the singleton (useful for testing or logout)
 */
export function resetQAState() {
  if (qaState) {
    qaState.cleanup();
  }
  qaState = null;
}
