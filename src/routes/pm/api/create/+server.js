import {json, error} from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({request, locals, parent}) {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities
  if (!capabilities?.includes('ops.tasks.create') && !capabilities?.includes('ops.tasks.edit') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied'});
  }

  try {
    const taskData = await request.json();

    const newTask = {
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      status: taskData.status || 'backlog',
      priority: taskData.priority || 'medium',
      issue_type: taskData.issue_type || 'task',
      labels: taskData.labels || [],
      assignee_id: taskData.assignee_id || null,
      source: taskData.source || 'manual'
    };

    const {data, error: insertError} = await supabase
      .schema('internal')
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (insertError) {
      console.error('[PM API] Create task error:', insertError);
      throw error(500, {message: insertError.message});
    }

    return json({success: true, task: data});
  } catch (err) {
    console.error('[PM API] Create task error:', err);
    if (err?.status) throw err;
    throw error(500, {message: err?.message || 'Failed to create task'});
  }
}
