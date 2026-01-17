import {error, fail, redirect} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({parent}) => {
  const {capabilities} = await parent();

  // Check capability
  if (!capabilities?.includes('team.invite') && !capabilities?.includes('*')) {
    throw error(403, {message: 'Access denied. Missing team.invite capability.'});
  }

  return {
    roles: [
      {name: 'super_admin', label: 'Super Admin', description: 'Full system access'},
      {name: 'developer', label: 'Developer', description: 'Code, logs, project management'},
      {name: 'ops', label: 'Operations', description: 'Services, monitoring, deployments'},
      {name: 'support', label: 'Support', description: 'View workspaces, assist customers'}
    ]
  };
};

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({request, locals, fetch}) => {
    const formData = await request.formData();

    const personalEmail = formData.get('personal_email')?.toString().trim();
    const fullName = formData.get('full_name')?.toString().trim();
    const roleName = formData.get('role_name')?.toString();

    // Validation
    if (!personalEmail || !fullName || !roleName) {
      return fail(400, {
        error: 'Please fill in all required fields',
        personalEmail,
        fullName,
        roleName
      });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
      return fail(400, {
        error: 'Invalid email address',
        personalEmail,
        fullName,
        roleName
      });
    }

    try {
      // Call the admin API to trigger the workflow
      const apiBaseUrl = env.API_BASE_URL || 'https://api.selify.ai';
      const response = await fetch(`${apiBaseUrl}/api/admin/team/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${locals.session?.access_token}`
        },
        body: JSON.stringify({
          personal_email: personalEmail,
          full_name: fullName,
          role_name: roleName
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return fail(response.status, {
          error: result.detail || result.error || 'Failed to start onboarding',
          personalEmail,
          fullName,
          roleName
        });
      }

      // Redirect to team list on success
      throw redirect(303, `/team?onboarded=${result.workflow_id}`);
    } catch (err) {
      if (err instanceof Response || err?.status === 303) {
        throw err;
      }

      console.error('[Onboard] Error:', err);
      return fail(500, {
        error: err.message || 'An unexpected error occurred',
        personalEmail,
        fullName,
        roleName
      });
    }
  }
};
