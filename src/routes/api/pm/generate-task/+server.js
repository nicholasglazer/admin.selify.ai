import {json} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * POST /api/pm/generate-task
 *
 * Generates structured task data from a natural language description using DeepSeek.
 */
export async function POST({request, locals}) {
  try {
    const {description, team_members, existing_labels} = await request.json();

    if (!description?.trim()) {
      return json({error: 'Description is required'}, {status: 400});
    }

    // Build the prompt for DeepSeek
    const systemPrompt = `You are an AI assistant that analyzes task descriptions and extracts structured task data for a project management board.

Given a task description, you must return a JSON object with the following fields:
- title: A concise title (max 80 chars)
- description: A well-formatted description with context and acceptance criteria
- priority: One of "critical", "high", "medium", "low"
- issue_type: One of "bug", "feature", "task", "improvement"
- labels: Array of relevant labels (max 5)
- ai_analysis: Object with reasoning about your analysis
- ai_confidence: Number between 0 and 1 indicating confidence in analysis
- ai_automatable: Boolean indicating if this task could be automated by AI

When determining priority:
- critical: Security issues, data loss, system down
- high: Major functionality broken, blocking issues
- medium: Important but not urgent, enhancements
- low: Nice to have, minor improvements

When determining issue_type:
- bug: Something is broken or not working as expected
- feature: New functionality to be added
- task: General work item, documentation, configuration
- improvement: Enhancement to existing functionality

Available team members for context: ${JSON.stringify(team_members || [])}
Existing labels in the system: ${JSON.stringify(existing_labels || [])}

IMPORTANT: Only respond with valid JSON, no markdown or other text.`;

    const userPrompt = `Analyze this task description and return structured task data:

"${description}"`;

    // Call DeepSeek API
    if (!DEEPSEEK_API_KEY) {
      // Fallback: generate a simple task without AI
      console.warn('[PM Generate] DeepSeek API key not configured, using fallback');
      return json({
        task: {
          title: description.slice(0, 80),
          description: description,
          priority: 'medium',
          issue_type: 'task',
          labels: [],
          ai_analysis: {reasoning: 'Generated without AI (API key not configured)'},
          ai_confidence: 0.5,
          ai_automatable: false
        }
      });
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: userPrompt}
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: {type: 'json_object'}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PM Generate] DeepSeek API error:', response.status, errorText);
      return json({error: 'AI service unavailable'}, {status: 502});
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[PM Generate] No content in response:', result);
      return json({error: 'Invalid AI response'}, {status: 500});
    }

    // Parse the JSON response
    let task;
    try {
      task = JSON.parse(content);
    } catch (parseError) {
      console.error('[PM Generate] Failed to parse AI response:', content);
      return json({error: 'Failed to parse AI response'}, {status: 500});
    }

    // Validate and sanitize the response
    const sanitizedTask = {
      title: String(task.title || description.slice(0, 80)).slice(0, 200),
      description: String(task.description || description),
      priority: ['critical', 'high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
      issue_type: ['bug', 'feature', 'task', 'improvement'].includes(task.issue_type) ? task.issue_type : 'task',
      labels: Array.isArray(task.labels) ? task.labels.slice(0, 5).map(l => String(l).toLowerCase()) : [],
      ai_analysis: task.ai_analysis || {reasoning: 'No analysis provided'},
      ai_confidence: typeof task.ai_confidence === 'number' ? Math.max(0, Math.min(1, task.ai_confidence)) : 0.8,
      ai_automatable: Boolean(task.ai_automatable),
      status: 'backlog',
      assignee_id: null
    };

    return json({task: sanitizedTask});

  } catch (error) {
    console.error('[PM Generate] Error:', error);
    return json({error: 'Internal server error'}, {status: 500});
  }
}
