import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {supabase} = locals;
  const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';

  if (!supabase) {
    return {
      issues: [],
      teamMembers: [],
      boardSummary: {},
      columns: null,
      apiBaseUrl
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
        backlog_position,
        created_at,
        updated_at
      `)
      .is('deleted_at', null)
      .order('created_at', {ascending: false});

    // Fetch hierarchy data (children count and parent info)
    const {data: hierarchyData, error: hierarchyError} = await supabase
      .schema('internal')
      .rpc('get_tasks_with_hierarchy');

    if (hierarchyError) {
      console.error('[PM Board] Failed to load hierarchy data:', hierarchyError.message);
    }

    // Create lookup map for hierarchy info
    const hierarchyMap = new Map();
    if (hierarchyData) {
      for (const h of hierarchyData) {
        hierarchyMap.set(h.id, {
          children_count: h.children_count || 0,
          parent_title: h.parent_title || null,
          parent_issue_number: h.parent_issue_number || null
        });
      }
    }

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

    // Map tasks to include task_number, assignee info, and hierarchy data
    const issues = (tasks || []).map(task => {
      const assignee = teamMembers?.find(m => m.id === task.assignee_id);
      const hierarchy = hierarchyMap.get(task.id) || {};
      return {
        ...task,
        task_number: task.issue_number,
        assignee: assignee?.display_name || assignee?.full_name || null,
        assignee_avatar: assignee?.avatar_url || null,
        children_count: hierarchy.children_count || 0,
        parent_title: hierarchy.parent_title || null,
        parent_issue_number: hierarchy.parent_issue_number || null
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
      columns: null, // Use defaults from pmState
      apiBaseUrl
    };
  } catch (err) {
    console.error('[PM Board] Unexpected error:', err);
    return {
      issues: [],
      teamMembers: [],
      boardSummary: {},
      columns: null,
      apiBaseUrl
    };
  }
};
