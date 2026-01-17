import {error} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities for QA access
  if (!capabilities?.includes('ops.qa.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. You need ops.qa.view capability.'});
  }

  // Fetch test specs
  const {data: specs, error: specsError} = await supabase
    .from('qa_test_specs')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', {ascending: false});

  if (specsError) {
    console.error('[QA] Specs fetch error:', specsError);
  }

  // Fetch recent runs
  const {data: runs, error: runsError} = await supabase
    .from('qa_test_runs')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(20);

  if (runsError) {
    console.error('[QA] Runs fetch error:', runsError);
  }

  // Fetch dashboard summary
  const {data: dashboardSummary, error: summaryError} = await supabase.rpc(
    'qa_get_dashboard_summary'
  );

  if (summaryError) {
    console.error('[QA] Dashboard summary error:', summaryError);
  }

  return {
    specs: specs || [],
    runs: runs || [],
    dashboardSummary: dashboardSummary || null,
    apiBaseUrl: env.API_BASE_URL || ''
  };
};
