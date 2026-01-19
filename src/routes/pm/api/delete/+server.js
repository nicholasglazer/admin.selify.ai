import {json, error} from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({request, locals, parent}) {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities
  if (!capabilities?.includes('ops.tasks.delete') && !capabilities?.includes('ops.tasks.edit') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied'});
  }

  try {
    const {issueId} = await request.json();

    if (!issueId) {
      throw error(400, {message: 'Missing issueId'});
    }

    // Soft delete by setting deleted_at
    const {error: deleteError} = await supabase
      .schema('internal')
      .from('tasks')
      .update({deleted_at: new Date().toISOString()})
      .eq('id', issueId);

    if (deleteError) {
      console.error('[PM API] Delete task error:', deleteError);
      throw error(500, {message: deleteError.message});
    }

    return json({success: true});
  } catch (err) {
    console.error('[PM API] Delete task error:', err);
    if (err?.status) throw err;
    throw error(500, {message: err?.message || 'Failed to delete task'});
  }
}
