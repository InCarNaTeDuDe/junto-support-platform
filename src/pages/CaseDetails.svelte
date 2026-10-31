<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { supportService } from '../services/support';
  import { auth } from '../stores/auth';
  import type { SupportCase, CaseStatus, CasePriority } from '../types/support';
  import type { SupportAgent } from '../types/user';
  import StatusBadge from '../components/StatusBadge.svelte';
  import PriorityBadge from '../components/PriorityBadge.svelte';
  import ConversationPanel from '../components/ConversationPanel.svelte';

  export let caseId: string;

  const dispatch = createEventDispatcher<{ back: void }>();

  let supportCase: SupportCase | null = null;
  let agents: SupportAgent[] = [];
  let isLoading: boolean = true;
  let isUpdating: boolean = false;
  let isSending: boolean = false;
  let errorMsg: string = '';
  let notice: string = '';

  function flash(msg: string) {
    notice = msg;
    setTimeout(() => {
      if (notice === msg) notice = '';
    }, 3500);
  }

  async function loadCase() {
    isLoading = true;
    errorMsg = '';
    try {
      const [c, ags] = await Promise.all([
        supportService.getCaseById(caseId),
        supportService.getAgents(),
      ]);
      supportCase = c;
      agents = ags;
    } catch (err: any) {
      errorMsg = err.message || 'Failed to load case';
    } finally {
      isLoading = false;
    }
  }

  async function updateField(fn: () => Promise<SupportCase>, successText: string) {
    if (!supportCase || isUpdating) return;
    isUpdating = true;
    try {
      supportCase = await fn();
      flash(successText);
    } catch (err: any) {
      errorMsg = err.message || 'Update failed';
    } finally {
      isUpdating = false;
    }
  }

  async function handleSendMessage(event: CustomEvent<{ content: string; isInternalNote: boolean }>) {
    const { content, isInternalNote } = event.detail;
    const currentUser = $auth.user;
    if (!supportCase || !currentUser) return;

    isSending = true;
    try {
      await supportService.addMessage(supportCase.id, content, isInternalNote, currentUser);
      supportCase = await supportService.getCaseById(supportCase.id);
      flash(isInternalNote ? 'Internal note added' : 'Reply sent to user');
    } catch (err: any) {
      errorMsg = err.message || 'Failed to send message';
    } finally {
      isSending = false;
    }
  }

  function formatDate(iso?: string) {
    return iso ? new Date(iso).toLocaleString() : '-';
  }

  onMount(() => {
    loadCase();
  });
</script>

<div style="display: flex; flex-direction: column; gap: 20px;">
  <div class="case-header-nav">
    <button type="button" class="btn btn-secondary btn-sm" on:click={() => dispatch('back')}>
      ← Back to Cases
    </button>
    {#if supportCase}
      <div class="header-actions">
        <div class="action-control">
          <label class="control-label" for="case-detail-status">Status:</label>
          <select
            id="case-detail-status"
            class="form-select form-select-sm"
            value={supportCase.status}
            disabled={isUpdating}
            on:change={(e) => {
              const val = (e.currentTarget as HTMLSelectElement).value as CaseStatus;
              updateField(() => supportService.updateStatus(supportCase!.id, val), `Status updated to ${val}`);
            }}
          >
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div class="action-control">
          <label class="control-label" for="case-detail-priority">Priority:</label>
          <select
            id="case-detail-priority"
            class="form-select form-select-sm"
            value={supportCase.priority}
            disabled={isUpdating}
            on:change={(e) => {
              const val = (e.currentTarget as HTMLSelectElement).value as CasePriority;
              updateField(() => supportService.updatePriority(supportCase!.id, val), `Priority set to ${val}`);
            }}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div class="action-control">
          <label class="control-label" for="case-detail-assignee">Assignee:</label>
          <select
            id="case-detail-assignee"
            class="form-select form-select-sm"
            value={supportCase.assignedAgentId || 'UNASSIGNED'}
            disabled={isUpdating}
            on:change={(e) => {
              const val = (e.currentTarget as HTMLSelectElement).value;
              updateField(() => supportService.assignCase(supportCase!.id, val === 'UNASSIGNED' ? null : val), 'Assignee updated');
            }}
          >
            <option value="UNASSIGNED">Unassigned</option>
            {#each agents as ag (ag.id)}
              <option value={ag.id}>{ag.name}</option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
  </div>

  {#if notice}
    <div class="alert-banner" style="background: #ecfdf5; border-color: #a7f3d0; color: #047857;">
      {notice}
    </div>
  {/if}

  {#if errorMsg}
    <div class="alert-banner">
      <span>{errorMsg}</span>
      <button type="button" class="btn btn-sm btn-secondary" on:click={loadCase}>Retry</button>
    </div>
  {/if}

  {#if isLoading}
    <div class="card state-container">
      <div class="spinner"></div>
      <h3>Loading case #{caseId}...</h3>
    </div>
  {:else if !supportCase}
    <div class="card state-container">
      <h3>Case not found</h3>
      <button type="button" class="btn btn-primary btn-sm" on:click={() => dispatch('back')}>
        Back to Cases
      </button>
    </div>
  {:else}
    <div class="case-grid">
      <div class="main-column">
        <div class="card case-info-card">
          <div class="case-meta-top">
            <div class="case-num-wrap">
              <span class="case-badge">{supportCase.caseNumber}</span>
              <StatusBadge status={supportCase.status} />
              <PriorityBadge priority={supportCase.priority} />
            </div>
            <span class="created-time">Created {formatDate(supportCase.createdAt)}</span>
          </div>
          <h1 class="case-subject">{supportCase.subject}</h1>
          {#if supportCase.description}
            <div class="case-description-box">
              <div class="desc-label">Customer Description:</div>
              <p class="desc-content">{supportCase.description}</p>
            </div>
          {/if}
        </div>

        <ConversationPanel
          messages={supportCase.messages || []}
          {isSending}
          on:sendMessage={handleSendMessage}
        />
      </div>

      <div class="side-column">
        <div class="card side-card">
          <h3 class="side-card-title">Customer Information</h3>
          <div class="customer-profile-box">
            <div class="customer-large-avatar">
              {supportCase.customer?.name?.slice(0, 2).toUpperCase() || 'CU'}
            </div>
            <div class="customer-large-meta">
              <div class="customer-large-name">{supportCase.customer?.name || 'Customer'}</div>
              <div class="customer-rating">★ {supportCase.customer?.rating ?? 5.0} Rating</div>
            </div>
          </div>
          <div class="customer-details-list">
            <div class="detail-row">
              <span class="detail-key">Email:</span>
              <span class="detail-val">{supportCase.customer?.email || '-'}</span>
            </div>
            {#if supportCase.customer?.phone}
              <div class="detail-row">
                <span class="detail-key">Phone:</span>
                <span class="detail-val">{supportCase.customer.phone}</span>
              </div>
            {/if}
          </div>
        </div>

        {#if supportCase.relatedEntity}
          <div class="card side-card entity-card">
            <h3 class="side-card-title">Related Junto Entity</h3>
            <div class="entity-badge">
              <span class="entity-type">{supportCase.relatedEntity.type}</span>
              <span class="entity-id">{supportCase.relatedEntity.id}</span>
            </div>
            {#if supportCase.relatedEntity.summary}
              <div class="entity-summary">{supportCase.relatedEntity.summary}</div>
            {/if}
          </div>
        {/if}

        <div class="card side-card">
          <h3 class="side-card-title">Metadata</h3>
          <div class="customer-details-list">
            <div class="detail-row">
              <span class="detail-key">Category:</span>
              <span class="detail-val font-bold">{supportCase.category}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Last Activity:</span>
              <span class="detail-val">{formatDate(supportCase.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
