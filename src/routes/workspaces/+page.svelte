<script>
  import {getContext} from 'svelte';
  import {formatDistanceToNow} from 'date-fns';

  let {data} = $props();
  const {workspaces, pagination, search} = data;

  // Get admin state from context for capability checking
  const adminState = getContext('adminState');

  // Format micro-units as dollars
  const formatCredits = micro => {
    const dollars = micro / 100000;
    return `$${dollars.toFixed(2)}`;
  };

  // Subscription plan colors
  const planColors = {
    free: 'bg-base03/50 text-base05',
    starter: 'bg-base0B/20 text-base0B',
    pro: 'bg-base0D/20 text-base0D',
    enterprise: 'bg-base0E/20 text-base0E'
  };

  let searchInput = $state(search || '');
</script>

<svelte:head>
  <title>Workspaces | Selify Admin</title>
</svelte:head>

<div class="workspaces-page">
  <header class="page-header">
    <div>
      <h1 class="page-title">Workspaces</h1>
      <p class="page-subtitle">{pagination.total} workspaces total</p>
    </div>
  </header>

  <div class="search-bar">
    <form method="GET">
      <input
        type="text"
        name="search"
        placeholder="Search by workspace name or owner email..."
        value={searchInput}
        oninput={e => (searchInput = e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  </div>

  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Workspace</th>
          <th>Owner</th>
          <th>Plan</th>
          <th>Credits</th>
          <th>PAYG Balance</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each workspaces as workspace}
          <tr>
            <td>
              <div class="workspace-name">{workspace.name}</div>
              <div class="workspace-id">{workspace.id.substring(0, 8)}...</div>
            </td>
            <td>
              <div class="owner-email">{workspace.users?.email || 'Unknown'}</div>
            </td>
            <td>
              <span class="badge {planColors[workspace.subscription_plan] || planColors.free}">
                {workspace.subscription_plan || 'free'}
              </span>
            </td>
            <td class="mono">
              {formatCredits(workspace.subscription_credits_remaining_micro || 0)}
            </td>
            <td class="mono">
              {formatCredits(workspace.payg_balance_micro || 0)}
            </td>
            <td class="text-muted">
              {formatDistanceToNow(new Date(workspace.created_at), {addSuffix: true})}
            </td>
            <td>
              <div class="action-buttons">
                {#if adminState.hasCap('admin.workspaces.view')}
                  <a href="/workspaces/{workspace.id}" class="action-link">View</a>
                {/if}
                {#if adminState.hasCap('admin.billing.modify')}
                  <button class="action-link credit-btn">Credit</button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if workspaces.length === 0}
    <div class="empty-state">
      <p>No workspaces found{search ? ` matching "${search}"` : ''}.</p>
    </div>
  {/if}

  {#if pagination.totalPages > 1}
    <div class="pagination">
      {#if pagination.page > 1}
        <a href="?page={pagination.page - 1}{search ? `&search=${search}` : ''}" class="page-link">Previous</a>
      {/if}
      <span class="page-info">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      {#if pagination.page < pagination.totalPages}
        <a href="?page={pagination.page + 1}{search ? `&search=${search}` : ''}" class="page-link">Next</a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .workspaces-page {
    max-width: 1200px;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-base7);
    margin: 0;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--color-base5);
    margin-top: 0.25rem;
  }

  .search-bar {
    margin-bottom: 1.5rem;
  }

  .search-bar form {
    display: flex;
    gap: 0.75rem;
  }

  .search-bar input {
    flex: 1;
    max-width: 400px;
    padding: 0.625rem 1rem;
    background: var(--color-base1);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-base7);
    font-size: 0.875rem;
  }

  .search-bar input:focus {
    outline: none;
    border-color: var(--color-base0D);
  }

  .search-bar button {
    padding: 0.625rem 1.25rem;
    background: var(--color-base2);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-base7);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .search-bar button:hover {
    background: var(--color-base3);
  }

  .table-container {
    background: var(--color-base1);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    text-align: left;
    padding: 1rem 1.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-base5);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    background: var(--color-base1);
    border-bottom: 1px solid var(--color-border);
  }

  .data-table td {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.875rem;
  }

  .data-table tbody tr:last-child td {
    border-bottom: none;
  }

  .data-table tbody tr:hover {
    background: var(--color-base2)/50;
  }

  .workspace-name {
    font-weight: 600;
    color: var(--color-base7);
  }

  .workspace-id {
    font-size: 0.75rem;
    color: var(--color-base5);
    font-family: monospace;
  }

  .owner-email {
    font-size: 0.875rem;
    color: var(--color-base6);
  }

  .badge {
    display: inline-flex;
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    text-transform: capitalize;
  }

  .mono {
    font-family: monospace;
    color: var(--color-base6);
  }

  .text-muted {
    color: var(--color-base5);
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .action-link {
    color: var(--color-base0D);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .action-link:hover {
    text-decoration: underline;
  }

  .credit-btn {
    color: var(--color-base0B);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-base5);
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .page-link {
    padding: 0.5rem 1rem;
    background: var(--color-base1);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-base6);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.15s;
  }

  .page-link:hover {
    background: var(--color-base2);
    color: var(--color-base7);
  }

  .page-info {
    font-size: 0.875rem;
    color: var(--color-base5);
  }
</style>
