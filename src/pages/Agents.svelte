<script lang="ts">
  import { onMount } from 'svelte';
  import { supportService } from '../services/support';
  import { auth } from '../stores/auth';
  import type { SupportAgent, AgentRole, AgentStatus } from '../types/user';

  let agents: SupportAgent[] = [];
  let isLoading: boolean = true;
  let isSubmitting: boolean = false;
  let errorMsg: string = '';
  let notice: string = '';

  let showModal: boolean = false;
  let name: string = '';
  let email: string = '';
  let userId: string = '';
  let newRole: AgentRole = 'SUPPORT';

  $: user = $auth.user;
  $: isOwner = $auth.role === 'OWNER';

  function flash(msg: string) {
    notice = msg;
    setTimeout(() => {
      if (notice === msg) notice = '';
    }, 3500);
  }

  async function loadAgents() {
    isLoading = true;
    errorMsg = '';
    try {
      agents = await supportService.getAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to load agents';
    } finally {
      isLoading = false;
    }
  }

  async function handleCreate() {
    if (!name.trim() || !email.trim() || isSubmitting) return;
    isSubmitting = true;
    errorMsg = '';
    try {
      const created = await supportService.createAgent({
        userId: userId.trim() || undefined,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: newRole,
      });
      flash(`Agent ${created.name} authorized!`);
      showModal = false;
      name = '';
      email = '';
      userId = '';
      await loadAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to add agent';
    } finally {
      isSubmitting = false;
    }
  }

  async function toggleStatus(ag: SupportAgent) {
    const next: AgentStatus = ag.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (ag.id === user?.id && next === 'INACTIVE') return;
    try {
      await supportService.updateAgentStatus(ag.id, next);
      flash(`${ag.name} marked as ${next}`);
      await loadAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to update status';
    }
  }

  async function changeRole(ag: SupportAgent, r: AgentRole) {
    if (ag.id === user?.id && r !== 'OWNER') return;
    try {
      await supportService.updateAgentRole(ag.id, r);
      flash(`${ag.name} role changed to ${r}`);
      await loadAgents();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to update role';
    }
  }

  onMount(() => {
    if (isOwner) {
      loadAgents();
    }
  });
</script>

{#if !isOwner}
  <div class="card" style="padding: 32px; text-align: center;">
    <h2>Owner Authorization Required</h2>
    <p style="margin-top: 8px;">Only users with the OWNER role can manage agents and permissions.</p>
  </div>
{:else}
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2>Support Agents & Access Control</h2>
        <p style="margin-top: 2px;">Authorized Google accounts with access to the dashboard.</p>
      </div>
      <button type="button" class="btn btn-primary" on:click={() => (showModal = true)}>
        + Add Authorized Agent
      </button>
    </div>

    {#if notice}
      <div class="alert-banner" style="background: #ecfdf5; border-color: #a7f3d0; color: #047857;">
        {notice}
      </div>
    {/if}

    {#if errorMsg}
      <div class="alert-banner">
        <span>{errorMsg}</span>
        <button type="button" class="btn btn-sm btn-secondary" on:click={loadAgents}>Retry</button>
      </div>
    {/if}

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Google Email</th>
            <th style="width: 140px;">Role</th>
            <th style="width: 120px;">Status</th>
            <th style="width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if isLoading}
            <tr>
              <td colspan="5">
                <div class="state-container">
                  <div class="spinner"></div>
                  <h3>Loading agents...</h3>
                </div>
              </td>
            </tr>
          {:else if agents.length === 0}
            <tr>
              <td colspan="5">
                <div class="state-container">
                  <h3>No agents found</h3>
                </div>
              </td>
            </tr>
          {:else}
            {#each agents as ag (ag.id)}
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="agent-avatar">{ag.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{ag.name}</strong>
                      {#if ag.id === user?.id}
                        <span style="margin-left: 6px; font-size: 0.75rem; color: var(--text-muted);">(You)</span>
                      {/if}
                    </div>
                  </div>
                </td>
                <td>{ag.email}</td>
                <td>
                  <select
                    class="form-select form-select-sm"
                    value={ag.role}
                    disabled={ag.id === user?.id}
                    on:change={(e) => changeRole(ag, (e.currentTarget as HTMLSelectElement).value as AgentRole)}
                  >
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </td>
                <td>
                  <span class="badge {ag.status === 'ACTIVE' ? 'badge-resolved' : 'badge-closed'}">
                    {ag.status}
                  </span>
                </td>
                <td>
                  {#if ag.id !== user?.id}
                    <button
                      type="button"
                      class="btn btn-sm {ag.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}"
                      on:click={() => toggleStatus(ag)}
                    >
                      {ag.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  {:else}
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Current User</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    {#if showModal}
      <div class="modal-overlay" on:click={(e) => e.target === e.currentTarget && (showModal = false)} role="presentation">
        <div class="modal-content">
          <div class="card-header">
            <h3>Authorize Support Agent</h3>
            <button type="button" class="btn-icon" on:click={() => (showModal = false)}>✕</button>
          </div>
          <form on:submit|preventDefault={handleCreate}>
            <div class="form-group">
              <label class="form-label" for="agent-name">Full Name</label>
              <input
                id="agent-name"
                class="form-control"
                placeholder="Jordan Smith"
                bind:value={name}
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="agent-email">Google Login Email</label>
              <input
                id="agent-email"
                class="form-control"
                type="email"
                placeholder="jordan@example.com"
                bind:value={email}
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="agent-role">Role</label>
              <select id="agent-role" class="form-select" bind:value={newRole}>
                <option value="SUPPORT">SUPPORT</option>
                <option value="OWNER">OWNER</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" on:click={() => (showModal = false)}>
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={isSubmitting || !name.trim() || !email.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Authorize'}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
{/if}
