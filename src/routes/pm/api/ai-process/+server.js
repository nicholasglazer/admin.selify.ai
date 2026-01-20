import {json, error} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({request, locals, parent}) {
  const {capabilities} = await parent();
  const {supabase} = locals;

  // Check capabilities - need task edit permissions
  if (!capabilities?.includes('ops.tasks.edit') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied'});
  }

  try {
    const {task_id, task_title, task_description, task_number, priority, labels} = await request.json();

    if (!task_id || !task_title) {
      throw error(400, {message: 'Missing task_id or task_title'});
    }

    // Update task status to show it's being processed
    const {error: updateError} = await supabase
      .schema('internal')
      .from('tasks')
      .update({status: 'ai_queue', updated_at: new Date().toISOString()})
      .eq('id', task_id);

    if (updateError) {
      console.error('[PM API] Failed to update task status:', updateError);
    }

    // Start the Temporal workflow via agent-api
    const agentApiUrl = env.AGENT_API_URL || 'http://selify-agent-api:8001';
    const workflowId = `ai-queue-${task_id.slice(0, 8)}-${Date.now()}`;

    const workflowResponse = await fetch(`${agentApiUrl}/api/workflows/ai-queue/start`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        workflow_id: workflowId,
        task_queue: 'internal-ops-queue',
        input: {
          task_id,
          task_title,
          task_description: task_description || '',
          task_number,
          priority: priority || 'medium',
          labels: labels || [],
          repo_path: '/home/ng/prod',
          target_dirs: [],
          context_files: [],
          notify_on_complete: true,
          notify_email: 'nicholas.glazer@selify.ai',
          create_pr: true,
          timeout_minutes: 15
        }
      })
    });

    if (!workflowResponse.ok) {
      const errorBody = await workflowResponse.text();
      console.error('[PM API] Failed to start workflow:', errorBody);

      // Return success anyway since we updated the task
      // The workflow will be retried or manually triggered later
      return json({
        success: true,
        workflow_id: workflowId,
        workflow_started: false,
        message: 'Task queued for AI processing, but workflow start failed'
      });
    }

    const workflowResult = await workflowResponse.json();

    return json({
      success: true,
      workflow_id: workflowId,
      workflow_started: true,
      run_id: workflowResult.run_id
    });
  } catch (err) {
    console.error('[PM API] AI process error:', err);
    if (err?.status) throw err;
    throw error(500, {message: err?.message || 'Failed to start AI processing'});
  }
}
