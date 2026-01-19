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
    const {issueId, updates} = await request.json();

    if (!issueId) {
      throw error(400, {message: 'Missing issueId'});
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'issue_type',
      'labels',
      'assignee_id',
      'parent_id'
    ];

    const dbUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        dbUpdates[field] = updates[field];
      }
    }

    dbUpdates.updated_at = new Date().toISOString();

    const {data, error: updateError} = await supabase
      .schema('internal')
      .from('tasks')
      .update(dbUpdates)
      .eq('id', issueId)
      .select()
      .single();

    if (updateError) {
      console.error('[PM API] Update task error:', updateError);
      throw error(500, {message: updateError.message});
    }

    return json({success: true, task: data});
  } catch (err) {
    console.error('[PM API] Update task error:', err);
    if (err?.status) throw err;
    throw error(500, {message: err?.message || 'Failed to update task'});
  }
}
