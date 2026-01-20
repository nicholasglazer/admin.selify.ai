import {json, error} from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({request, locals, parent}) {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities
  if (!capabilities?.includes('ops.tasks.edit') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied'});
  }

  try {
    const {task_id, new_position} = await request.json();

    if (!task_id || new_position == null) {
      throw error(400, {message: 'Missing task_id or new_position'});
    }

    // Call the database function to reorder
    const {error: rpcError} = await supabase
      .schema('internal')
      .rpc('reorder_backlog_position', {
        p_task_id: task_id,
        p_new_position: new_position
      });

    if (rpcError) {
      console.error('[PM API] Reorder task error:', rpcError);
      throw error(500, {message: rpcError.message});
    }

    return json({success: true});
  } catch (err) {
    console.error('[PM API] Reorder task error:', err);
    if (err?.status) throw err;
    throw error(500, {message: err?.message || 'Failed to reorder task'});
  }
}
