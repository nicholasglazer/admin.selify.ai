import {json, error} from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({request, locals, parent}) {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities
  if (!capabilities?.includes('ops.tasks.edit') && !capabilities?.includes('ops.tasks.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied'});
  }

  try {
    const {issueId, toColumnId} = await request.json();

    if (!issueId || !toColumnId) {
      throw error(400, {message: 'Missing issueId or toColumnId'});
    }

    // Update task status using server's supabase client (has access to internal schema)
    const {data, error: updateError} = await supabase
      .schema('internal')
      .from('tasks')
      .update({status: toColumnId, updated_at: new Date().toISOString()})
      .eq('id', issueId)
      .select()
      .single();

    if (updateError) {
      console.error('[PM API] Move task error:', updateError);
      throw error(500, {message: updateError.message});
    }

    return json({success: true, task: data});
  } catch (err) {
    console.error('[PM API] Move task error:', err);
    if (err?.status) throw err;
    throw error(500, {message: err?.message || 'Failed to move task'});
  }
}
