/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {supabase} = locals;

  if (!supabase) {
    return {
      issues: [],
      teamMembers: [],
      boardSummary: {},
      columns: null
    };
  }

  try {
    // Fetch tasks from internal schema
    const {data: tasks, error: tasksError} = await supabase
      .schema('internal')
      .from('tasks')
      .select(`
        id,
        issue_number,
        title,
        description,
        status,
        priority,
        issue_type,
        labels,
        assignee_id,
        parent_id,
        source,
        ai_analysis,
        ai_confidence,
        ai_automatable,
        created_at,
        updated_at
      `)
      .is('deleted_at', null)
      .order('created_at', {ascending: false});

    if (tasksError) {
      console.error('[PM Board] Failed to load tasks:', tasksError.message);
    }

    // Fetch team members for assignee dropdown
    const {data: teamMembers, error: teamError} = await supabase
      .schema('internal')
      .from('team_members')
      .select('id, full_name, display_name, email, avatar_url')
      .eq('status', 'active');

    if (teamError) {
      console.error('[PM Board] Failed to load team members:', teamError.message);
    }

    // Map tasks to include task_number and assignee info
    const issues = (tasks || []).map(task => {
      const assignee = teamMembers?.find(m => m.id === task.assignee_id);
      return {
        ...task,
        task_number: task.issue_number,
        assignee: assignee?.display_name || assignee?.full_name || null,
        assignee_avatar: assignee?.avatar_url || null
      };
    });

    return {
      issues,
      teamMembers: teamMembers || [],
      boardSummary: {
        totalTasks: issues.length,
        byStatus: issues.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {})
      },
      columns: null // Use defaults from pmState
    };
  } catch (err) {
    console.error('[PM Board] Unexpected error:', err);
    return {
      issues: [],
      teamMembers: [],
      boardSummary: {},
      columns: null
    };
  }
};
