<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { supportService } from '../services/support';
  import { authStore } from '../stores/auth';
  import type { SupportCase, CaseStatus, CasePriority } from '../types/support';
  import type { SupportAgent } from '../types/user';
  import StatusBadge from '../components/StatusBadge.svelte';
  import PriorityBadge from '../components/PriorityBadge.svelte';
  import ConversationPanel from '../components/ConversationPanel.svelte';

  export let caseId: string;

  const dispatch = createEventDispatcher<{
    back: void;
  }>();

  let supportCase: SupportCase | null = null;
  let agents: SupportAgent[] = [];
  let isLoading = true;
  let isUpdating = false;
  let isSendingMessage = false;
  let errorMsg = '';
  let successNotice = '';

  $: currentUser = $authStore.user;

  async function loadCase() {
    isLoading = true;
    errorMsg = '';
    try {
      const [caseData, agentsList] = await Promise.all([
        supportService.getCaseById(caseId),
        supportService.getAgents(),
      ]);
      supportCase = caseData;
      agents = agentsList;
    } catch (err: any) {
      errorMsg = err.message || 'Failed to load case details';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadCase();
  });

  async function handleStatusChange(newStatus: CaseStatus) {
    if (!supportCase || isUpdating) return;
    isUpdating = true;
    try {
      const updated = await supportService.updateStatus(
        supportCase.id,
        newStatus,
        currentUser?.name || 'Support Agent'
      );
      supportCase = updated;
      showNotice(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: any) {
      errorMsg = err.message || 'Failed to update case status';
    } finally {
      isUpdating = false;
    }
  }

  async function handlePriorityChange(newPriority: CasePriority) {
    if (!supportCase || isUpdating) return;
    isUpdating = true;
    try {
      const updated = await supportService.updatePriority(
        supportCase.id,
        newPriority,
        currentUser?.name || 'Support Agent'
      );
      supportCase = updated;
      showNotice(`Priority changed to ${newPriority}`);
    } catch (err: any) {
      errorMsg = err.message || 'Failed to update priority';
    } finally {
      isUpdating = false;
    }
  }

  async function handleAssignChange(agentId: string) {
    if (!supportCase || isUpdating) return;
    isUpdating = true;
    const targetId = agentId === 'UNASSIGNED' ? null : agentId;
    try {
      const updated = await supportService.assignCase(
        supportCase.id,
        targetId,
        currentUser?.name || 'Support Agent'
      );
      supportCase = updated;
      showNotice(targetId ? 'Case assigned successfully' : 'Case marked as unassigned');
    } catch (err: any) {
      errorMsg = err.message || 'Failed to assign case';
    } finally {
      isUpdating = false;
    }
  }

  async function handleSendMessage(event: CustomEvent<{ content: string; isInternalNote: boolean }>) {
    if (!supportCase || !currentUser) return;
    isSendingMessage = true;
    const { content, isInternalNote } = event.detail;

    try {
      await supportService.addMessage(
        supportCase.id,
        content,
        isInternalNote,
        currentUser
      );
      // Refresh case to show latest message thread and status updates
      supportCase = await supportService.getCaseById(supportCase.id);
      showNotice(isInternalNote ? 'Internal note saved' : 'Reply sent to customer');
    } catch (err: any) {
      errorMsg = err.message || 'Failed to send message';
    } finally {
      isSendingMessage = false;
    }
  }

  function showNotice(msg: string) {
    successNotice = msg;
    setTimeout(() => {
      if (successNotice === msg) successNotice = '';
    }, 3500);
  }

  function formatDate(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<div class="case-details-page">
  <!-- Top Bar with Back Button and Quick Case Actions -->
  <div class="case-header-nav">
    <button class="btn btn-secondary btn-sm back-btn" on:click={() => dispatch('back')}>
      ← Back to Cases
    </button>

    {#if supportCase}
      <div class="header-actions">
        <!-- Status Selector -->
        <div class="action-control">
          <span class="control-label">Status:</span>
          <select
            class="form-select form-select-sm"
            value={supportCase.status}
            disabled={isUpdating}
            on:change={(e) => handleStatusChange(e.currentTarget.value as CaseStatus)}
          >
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <!-- Priority Selector -->
        <div class="action-control">
          <span class="control-label">Priority:</span>
          <select
            class="form-select form-select-sm"
            value={supportCase.priority}
            disabled={isUpdating}
            on:change={(e) => handlePriorityChange(e.currentTarget.value as CasePriority)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <!-- Assignee Selector -->
        <div class="action-control">
          <span class="control-label">Assignee:</span>
          <select
            class="form-select form-select-sm"
            value={supportCase.assignedAgentId || 'UNASSIGNED'}
            disabled={isUpdating}
            on:change={(e) => handleAssignChange(e.currentTarget.value)}
          >
            <option value="UNASSIGNED">Unassigned</option>
            {#each agents as agent (agent.id)}
              <option value={agent.id}>
                {agent.name} ({agent.role})
              </option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
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
    <div class="error-banner">
      <span>{errorMsg}</span>
      <button class="btn btn-sm btn-secondary" on:click={loadCase}>Retry</button>
    </div>
  {/if}

  {#if isLoading}
    <div class="state-container card">
      <div class="spinner"></div>
      <h3>Loading case #{caseId}...</h3>
    </div>
  {:else if !supportCase}
    <div class="state-container card">
      <h3>Case not found</h3>
      <p>The requested support case could not be retrieved from the Junto backend.</p>
      <button class="btn btn-primary btn-sm" on:click={() => dispatch('back')}>
        Return to Cases
      </button>
    </div>
  {:else}
    <div class="case-grid">
      <!-- Main Column: Subject, Description & Conversation -->
      <div class="main-column">
        <!-- Case Information Banner -->
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

          <div class="case-description-box">
            <div class="desc-label">Customer Problem Description:</div>
            <p class="desc-content">{supportCase.description}</p>
          </div>
        </div>

        <!-- Conversation Panel -->
        <ConversationPanel
          messages={supportCase.messages || []}
          isSending={isSendingMessage}
          on:sendMessage={handleSendMessage}
        />
      </div>

      <!-- Right Column: Customer Info & Related Entities -->
      <div class="side-column">
        <!-- Customer Information Card -->
        <div class="card side-card">
          <h3 class="side-card-title">Customer Information</h3>
          <div class="customer-profile-box">
            <div class="customer-large-avatar">
              {supportCase.customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="customer-large-meta">
              <div class="customer-large-name">{supportCase.customer.name}</div>
              <div class="customer-rating">
                ★ {supportCase.customer.rating || 5.0} Junto Rating
              </div>
            </div>
          </div>

          <div class="customer-details-list">
            <div class="detail-row">
              <span class="detail-key">Email:</span>
              <span class="detail-val">{supportCase.customer.email}</span>
            </div>
            {#if supportCase.customer.phone}
              <div class="detail-row">
                <span class="detail-key">Phone:</span>
                <span class="detail-val">{supportCase.customer.phone}</span>
              </div>
            {/if}
            {#if supportCase.customer.juntoMemberSince}
              <div class="detail-row">
                <span class="detail-key">Member Since:</span>
                <span class="detail-val">{supportCase.customer.juntoMemberSince}</span>
              </div>
            {/if}
            <div class="detail-row">
              <span class="detail-key">User ID:</span>
              <span class="detail-val font-mono">{supportCase.customerId}</span>
            </div>
          </div>
        </div>

        <!-- Related Junto Entity (Trip / Order / Payment) -->
        {#if supportCase.relatedEntity}
          <div class="card side-card entity-card">
            <h3 class="side-card-title">Related Junto Entity</h3>
            <div class="entity-badge">
              <span class="entity-type">{supportCase.relatedEntity.type}</span>
              <span class="entity-id">{supportCase.relatedEntity.id}</span>
            </div>
            {#if supportCase.relatedEntity.summary}
              <div class="entity-summary">
                {supportCase.relatedEntity.summary}
              </div>
            {/if}
            <div class="entity-props">
              {#if supportCase.relatedEntity.amount}
                <div class="prop-item">
                  <span class="prop-label">Fare / Total</span>
                  <span class="prop-value font-bold">{supportCase.relatedEntity.amount}</span>
                </div>
              {/if}
              {#if supportCase.relatedEntity.date}
                <div class="prop-item">
                  <span class="prop-label">Service Date</span>
                  <span class="prop-value">{supportCase.relatedEntity.date}</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Case Metadata Card -->
        <div class="card side-card">
          <h3 class="side-card-title">Case Metadata</h3>
          <div class="customer-details-list">
            <div class="detail-row">
              <span class="detail-key">Category:</span>
              <span class="detail-val font-bold">{supportCase.category}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Created Date:</span>
              <span class="detail-val">{formatDate(supportCase.createdAt)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Last Activity:</span>
              <span class="detail-val">{formatDate(supportCase.updatedAt)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Internal UUID:</span>
              <span class="detail-val font-mono font-xs">{supportCase.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .case-details-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .case-header-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 12px 18px;
    flex-wrap: wrap;
  }

  .back-btn {
    font-weight: 500;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .action-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .form-select-sm {
    padding: 4px 10px;
    font-size: 0.8rem;
    width: auto;
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
    font-weight: 500;
  }

  .error-banner {
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

  .case-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
  }

  .main-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .case-info-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .case-meta-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .case-num-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .case-badge {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--primary);
    background-color: var(--primary-subtle);
    padding: 3px 8px;
    border-radius: var(--radius-sm);
  }

  .created-time {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .case-subject {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.35;
  }

  .case-description-box {
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 14px 16px;
  }

  .desc-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .desc-content {
    font-size: 0.9rem;
    color: var(--text-main);
    line-height: 1.55;
    white-space: pre-wrap;
  }

  /* Side Column */
  .side-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .side-card {
    padding: 18px 20px;
  }

  .side-card-title {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .customer-profile-box {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .customer-large-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #e0f2fe;
    color: #0369a1;
    font-weight: 700;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .customer-large-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .customer-rating {
    font-size: 0.75rem;
    color: #d97706;
    font-weight: 600;
  }

  .customer-details-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 0.82rem;
  }

  .detail-key {
    color: var(--text-muted);
  }

  .detail-val {
    color: var(--text-main);
    text-align: right;
    word-break: break-all;
  }

  .font-mono {
    font-family: var(--font-mono);
  }

  .font-xs {
    font-size: 0.72rem;
  }

  .font-bold {
    font-weight: 600;
  }

  /* Entity Card */
  .entity-card {
    background-color: #faf5ff;
    border-color: #e9d5ff;
  }

  .entity-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .entity-type {
    background-color: #7e22ce;
    color: #ffffff;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.7rem;
  }

  .entity-id {
    font-family: var(--font-mono);
    color: #581c87;
  }

  .entity-summary {
    font-size: 0.85rem;
    color: var(--text-main);
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .entity-props {
    display: flex;
    gap: 16px;
    padding-top: 10px;
    border-top: 1px dashed #d8b4fe;
  }

  .prop-item {
    display: flex;
    flex-direction: column;
  }

  .prop-label {
    font-size: 0.7rem;
    color: #7e22ce;
  }

  .prop-value {
    font-size: 0.85rem;
    color: var(--text-main);
  }

  @media (max-width: 900px) {
    .case-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
