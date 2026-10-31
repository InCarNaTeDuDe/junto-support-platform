<script lang="ts">
  import { onMount } from 'svelte';
  import { supportService } from '../services/support';
  import { authStore } from '../stores/auth';
  import type { SupportAgent, AgentRole, AgentStatus } from '../types/user';

  let agents: SupportAgent[] = [];
  let isLoading = true;
  let isSubmitting = false;
  let errorMsg = '';
  let successNotice = '';

  // Add Agent Modal State
  let showAddModal = false;
  let newName = '';
  let newEmail = '';
  let newRole: AgentRole = 'SUPPORT';

  $: currentUser = $authStore.user;
  $: isOwner = $authStore.role === 'OWNER';

  async function loadAgents() {
    isLoading = true;
    errorMsg = '';
    try {
      agents = await supportService.getAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to load support agents list';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    if (isOwner) {
      loadAgents();
    }
  });

  async function handleCreateAgent() {
    if (!newName.trim() || !newEmail.trim() || isSubmitting) return;

    isSubmitting = true;
    errorMsg = '';

    try {
      const created = await supportService.createAgent({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
      });

      showNotice(`Agent ${created.name} (${created.email}) authorized successfully!`);
      showAddModal = false;
      newName = '';
      newEmail = '';
      newRole = 'SUPPORT';
      await loadAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to authorize agent';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleToggleStatus(agent: SupportAgent) {
    const newStatus: AgentStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    // Prevent owner from deactivating themselves
    if (agent.id === currentUser?.id && newStatus === 'INACTIVE') {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      await supportService.updateAgentStatus(agent.id, newStatus);
      showNotice(`Agent ${agent.name} marked as ${newStatus}.`);
      await loadAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to update agent status';
    }
  }

  async function handleChangeRole(agent: SupportAgent, newRole: AgentRole) {
    if (agent.id === currentUser?.id && newRole !== 'OWNER') {
      alert('You cannot demote your own account.');
      return;
    }

    try {
      await supportService.updateAgentRole(agent.id, newRole);
      showNotice(`Agent ${agent.name} role changed to ${newRole}.`);
      await loadAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to change agent role';
    }
  }

  function showNotice(msg: string) {
    successNotice = msg;
    setTimeout(() => {
      if (successNotice === msg) successNotice = '';
    }, 3500);
  }

  function formatDate(iso?: string): string {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
</script>

<div class="agents-page">
  {#if !isOwner}
    <!-- Access Denied for Non-Owners -->
    <div class="card access-denied-box">
      <div class="denied-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
      <h2>Owner Authorization Required</h2>
      <p>Only users with the <strong>OWNER</strong> role can manage support agents and permissions in Junto.</p>
    </div>
  {:else}
    <!-- Owner Agent Management View -->
    <div class="page-top-bar">
      <div>
        <h2 class="page-title">Support Agents & Access Control</h2>
        <p class="page-desc">
          Authorized team members who can log in to Junto Support Management with Google.
        </p>
      </div>

      <button class="btn btn-primary" on:click={() => (showAddModal = true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Add Authorized Agent</span>
      </button>
    </div>

    {#if successNotice}
      <div class="success-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{successNotice}</span>
      </div>
    {/if}

    {#if errorMsg}
      <div class="alert-banner">
        <span>{errorMsg}</span>
        <button class="btn btn-sm btn-secondary" on:click={loadAgents}>Retry</button>
      </div>
    {/if}

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Agent Name</th>
            <th>Authorized Google Email</th>
            <th style="width: 140px;">Role</th>
            <th style="width: 130px;">Status</th>
            <th style="width: 140px;">Member Since</th>
            <th style="width: 130px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if isLoading}
            <tr>
              <td colspan="6">
                <div class="state-container">
                  <div class="spinner"></div>
                  <h3>Loading agent list...</h3>
                </div>
              </td>
            </tr>
          {:else if agents.length === 0}
            <tr>
              <td colspan="6">
                <div class="state-container">
                  <h3>No agents found</h3>
                </div>
              </td>
            </tr>
          {:else}
            {#each agents as agent (agent.id)}
              <tr>
                <td>
                  <div class="agent-profile-cell">
                    <div class="agent-avatar">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div class="agent-name-wrap">
                      <span class="agent-name font-bold">{agent.name}</span>
                      {#if agent.id === currentUser?.id}
                        <span class="you-tag">(You)</span>
                      {/if}
                    </div>
                  </div>
                </td>
                <td>
                  <span class="email-text">{agent.email}</span>
                </td>
                <td>
                  <select
                    class="form-select form-select-sm"
                    value={agent.role}
                    disabled={agent.id === currentUser?.id}
                    on:change={(e) => handleChangeRole(agent, e.currentTarget.value as AgentRole)}
                  >
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </td>
                <td>
                  <span
                    class="status-pill"
                    class:active-pill={agent.status === 'ACTIVE'}
                    class:inactive-pill={agent.status === 'INACTIVE'}
                  >
                    {agent.status}
                  </span>
                </td>
                <td class="date-cell">
                  {formatDate(agent.createdAt)}
                </td>
                <td>
                  {#if agent.id !== currentUser?.id}
                    <button
                      class="btn btn-sm {agent.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}"
                      on:click={() => handleToggleStatus(agent)}
                    >
                      {agent.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  {:else}
                    <span class="action-muted">Current user</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Add Agent Modal -->
    {#if showAddModal}
      <div
        class="modal-overlay"
        on:click|self={() => (showAddModal = false)}
        on:keydown={(e) => e.key === 'Escape' && (showAddModal = false)}
        tabindex="0"
        role="dialog"
      >
        <div class="modal-content">
          <div class="card-header">
            <h3>Add Authorized Support Agent</h3>
            <button class="btn-icon" on:click={() => (showAddModal = false)}>✕</button>
          </div>

          <form on:submit|preventDefault={handleCreateAgent}>
            <div class="form-group">
              <label for="agent-new-name" class="form-label">Full Name</label>
              <input
                id="agent-new-name"
                type="text"
                class="form-control"
                placeholder="e.g. Jordan Smith"
                bind:value={newName}
                required
              />
            </div>

            <div class="form-group">
              <label for="agent-new-email" class="form-label">Google Workspace / Login Email</label>
              <input
                id="agent-new-email"
                type="email"
                class="form-control"
                placeholder="jordan.support@junto.com"
                bind:value={newEmail}
                required
              />
              <span class="form-hint">Must match their Google Sign-In identity to be authorized.</span>
            </div>

            <div class="form-group">
              <label for="agent-new-role" class="form-label">Role</label>
              <select id="agent-new-role" class="form-select" bind:value={newRole}>
                <option value="SUPPORT">SUPPORT (Manage cases, customer chat, notes)</option>
                <option value="OWNER">OWNER (Full administrative access & agent management)</option>
              </select>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                on:click={() => (showAddModal = false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={isSubmitting || !newName.trim() || !newEmail.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Authorize Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .agents-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .page-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .page-desc {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .success-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: var(--radius-md);
    color: #047857;
    font-size: 0.85rem;
  }

  .alert-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    color: #b91c1c;
    font-size: 0.85rem;
  }

  .agent-profile-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .agent-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #dbeafe;
    color: #1e40af;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .agent-name-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .you-tag {
    font-size: 0.7rem;
    color: var(--primary);
    font-weight: 600;
  }

  .email-text {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .form-select-sm {
    padding: 4px 8px;
    font-size: 0.8rem;
    width: 100%;
  }

  .status-pill {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: var(--radius-full);
  }

  .active-pill {
    background-color: #ecfdf5;
    color: #047857;
  }

  .inactive-pill {
    background-color: #f1f5f9;
    color: #64748b;
  }

  .date-cell {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .action-muted {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
  }

  /* Modal */
  .form-hint {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 4px;
    display: block;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
  }

  /* Access Denied */
  .access-denied-box {
    padding: 48px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .denied-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #fee2e2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
