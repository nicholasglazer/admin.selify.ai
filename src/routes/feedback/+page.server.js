import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities, supabase} = await parent();

  // Check capabilities for feedback access
  if (!capabilities?.includes('ops.feedback.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. You need ops.feedback.view capability.'});
  }

  // Fetch user feedback from public schema (customer-facing data)
  const {data: feedback, error: feedbackError} = await supabase
    .from('user_feedback')
    .select(
      `
      id,
      user_id,
      user_email,
      title,
      description,
      category,
      affected_area,
      steps_to_reproduce,
      expected_behavior,
      actual_behavior,
      screenshots,
      metadata,
      status,
      source,
      task_id,
      created_at,
      updated_at
    `
    )
    .order('created_at', {ascending: false})
    .limit(100);

  if (feedbackError) {
    console.error('Error fetching feedback:', feedbackError);
    throw error(500, {message: 'Failed to load feedback'});
  }

  // Get counts by status
  const statusCounts = (feedback || []).reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  return {
    feedback: feedback || [],
    statusCounts
  };
};
