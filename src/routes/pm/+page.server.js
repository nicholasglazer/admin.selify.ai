import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities for PM board access
  if (!capabilities?.includes('ops.tasks.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. You need ops.tasks.view capability.'});
  }

  // Fetch tasks from internal schema
  const {data: issues, error: tasksError} = await supabase
    .schema('internal')
    .from('tasks')
    .select(
      `
      id,
      issue_number,
      title,
      description,
      status,
      priority,
      issue_type,
      assignee_id,
      reporter_id,
      labels,
      story_points,
      due_date,
      created_at,
      updated_at
    `
    )
    .order('updated_at', {ascending: false});

  if (tasksError) {
    console.error('[PM] Tasks fetch error:', tasksError);
    throw error(500, {message: 'Failed to load tasks'});
  }

  // Map to expected format for the board
  const mappedIssues = (issues || []).map((task) => ({
    ...task,
    key: `TASK-${task.issue_number}`,
    type: task.issue_type
  }));

  // Fetch team members for assignment dropdown
  const {data: teamMembers, error: teamError} = await supabase
    .schema('internal')
    .from('team_members')
    .select('id, full_name, avatar_url, email')
    .eq('status', 'active')
    .order('full_name');

  if (teamError) {
    console.error('[PM] Team fetch error:', teamError);
  }

  // Fetch board summary using RPC function
  const {data: boardSummary, error: summaryError} = await supabase.rpc('get_board_summary');

  if (summaryError) {
    console.error('[PM] Board summary error:', summaryError);
  }

  return {
    issues: mappedIssues,
    teamMembers: teamMembers || [],
    boardSummary: boardSummary || {},
    columns: null
  };
};
