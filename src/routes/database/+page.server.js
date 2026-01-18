import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities} = await parent();

  // Check capability - require ops.metrics.view or super admin
  if (!capabilities?.includes('ops.metrics.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing ops.metrics.view capability.'});
  }

  const supabase = locals.supabase;

  // Call the database health function
  const {data: healthData, error: healthError} = await supabase.schema('internal').rpc('get_database_health');

  if (healthError) {
    console.error('Failed to fetch database health:', healthError);
    return {
      health: null,
      error: healthError.message
    };
  }

  return {
    health: healthData,
    error: null
  };
};
