import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities for PM board access
  if (!capabilities?.includes('ops.tasks.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. You need ops.tasks.view capability.'});
  }

  // Fetch tasks from internal schema with team member info
  const {data: tasks, error: tasksError} = await supabase
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
      labels,
      assignee_id,
      reporter_id,
      source,
      source_id,
      parent_id,
      ai_analysis,
      ai_confidence,
      ai_automatable,
      ai_attempts,
      metadata,
      created_at,
      updated_at
    `
    )
    .is('deleted_at', null)
    .order('updated_at', {ascending: false});

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
    throw error(500, {message: 'Failed to load tasks'});
  }

  // Fetch team members for assignee display
  const {data: teamMembers, error: teamError} = await supabase
    .schema('internal')
    .from('team_members')
    .select('id, display_name, avatar_url, user_id')
    .eq('status', 'active');

  if (teamError) {
    console.error('Error fetching team members:', teamError);
  }

  // Create team member lookup
  const teamLookup = (teamMembers || []).reduce((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});

  // Transform tasks for the board
  const issues = (tasks || []).map((task) => ({
    id: task.id,
    task_number: task.issue_number,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    issue_type: task.issue_type,
    labels: task.labels || [],
    assignee_id: task.assignee_id,
    assignee: task.assignee_id ? teamLookup[task.assignee_id]?.display_name : null,
    assignee_avatar: task.assignee_id ? teamLookup[task.assignee_id]?.avatar_url : null,
    reporter_id: task.reporter_id,
    source: task.source,
    source_id: task.source_id,
    parent_id: task.parent_id,
    ai_analysis: task.ai_analysis,
    ai_confidence: task.ai_confidence,
    ai_automatable: task.ai_automatable,
    ai_attempts: task.ai_attempts,
    metadata: task.metadata,
    created_at: task.created_at,
    updated_at: task.updated_at
  }));

  // Get board summary for stats
  const {data: summary} = await supabase.rpc('get_board_summary');

  return {
    issues,
    teamMembers: teamMembers || [],
    boardSummary: summary || {},
    columns: null // Will use defaults from reactive state
  };
};
