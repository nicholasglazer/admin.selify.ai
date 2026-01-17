import {error} from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({locals, parent}) => {
  const {capabilities} = await parent();

  // Check capabilities for PM board access
  if (!capabilities?.includes('ops.tasks.view') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. You need ops.tasks.view capability.'});
  }

  // For now, return mock issues
  // TODO: Replace with Gitea API or Supabase queries
  const mockIssues = [
    {
      id: 'issue_1',
      title: 'Fix login redirect issue',
      description: 'Users are not being redirected after login on mobile devices',
      status: 'in_progress',
      priority: 'high',
      labels: ['bug', 'mobile'],
      assignee: 'ai-agent',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-17T14:30:00Z',
      source: 'feedback',
      external_id: null
    },
    {
      id: 'issue_2',
      title: 'Add dark mode toggle to settings',
      description: 'Users have requested a dark mode option in the settings page',
      status: 'backlog',
      priority: 'medium',
      labels: ['feature', 'ui'],
      assignee: null,
      created_at: '2026-01-14T08:00:00Z',
      updated_at: '2026-01-14T08:00:00Z',
      source: 'manual',
      external_id: null
    },
    {
      id: 'issue_3',
      title: 'Optimize image loading performance',
      description: 'Large images are causing slow page loads. Implement lazy loading.',
      status: 'ai_queue',
      priority: 'medium',
      labels: ['performance', 'images'],
      assignee: 'ai-agent',
      created_at: '2026-01-16T12:00:00Z',
      updated_at: '2026-01-17T09:00:00Z',
      source: 'feedback',
      external_id: null
    },
    {
      id: 'issue_4',
      title: 'Update Stripe webhook handlers',
      description: 'Stripe has deprecated some webhook event types. Update handlers.',
      status: 'review',
      priority: 'high',
      labels: ['billing', 'api'],
      assignee: 'ai-agent',
      created_at: '2026-01-13T16:00:00Z',
      updated_at: '2026-01-17T11:00:00Z',
      source: 'manual',
      external_id: null
    },
    {
      id: 'issue_5',
      title: 'Add export functionality to reports',
      description: 'Allow users to export reports as CSV and PDF',
      status: 'done',
      priority: 'low',
      labels: ['feature', 'reports'],
      assignee: 'ai-agent',
      created_at: '2026-01-10T09:00:00Z',
      updated_at: '2026-01-16T15:00:00Z',
      source: 'feedback',
      external_id: null
    },
    {
      id: 'issue_6',
      title: 'Database connection pooling issue',
      description: 'Intermittent connection failures during high traffic',
      status: 'backlog',
      priority: 'critical',
      labels: ['bug', 'database', 'urgent'],
      assignee: null,
      created_at: '2026-01-17T07:00:00Z',
      updated_at: '2026-01-17T07:00:00Z',
      source: 'feedback',
      external_id: null
    }
  ];

  return {
    issues: mockIssues,
    columns: null // Will use defaults from reactive state
  };
};
