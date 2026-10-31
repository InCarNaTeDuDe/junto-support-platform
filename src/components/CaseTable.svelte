<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SupportCase } from '../types/support';
  import StatusBadge from './StatusBadge.svelte';
  import PriorityBadge from './PriorityBadge.svelte';

  export let cases: SupportCase[] = [];
  export let isLoading: boolean = false;
  export let emptyMessage: string = 'No support cases found matching your criteria.';

  const dispatch = createEventDispatcher<{
    select: string;
  }>();

  function handleRowClick(caseId: string) {
    dispatch('select', caseId);
  }

  function formatDate(isoString: string): string {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatCategory(cat: string): string {
    return cat ? cat.charAt(0) + cat.slice(1).toLowerCase() : '';
  }
</script>

<div class="table-responsive">
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 110px;">Case #</th>
        <th style="width: 170px;">Customer</th>
        <th>Subject</th>
        <th style="width: 110px;">Category</th>
        <th style="width: 100px;">Priority</th>
        <th style="width: 130px;">Status</th>
        <th style="width: 150px;">Assigned Agent</th>
        <th style="width: 130px;">Created</th>
      </tr>
    </thead>
    <tbody>
      {#if isLoading}
        <tr>
          <td colspan="8">
            <div class="state-container">
              <div class="spinner"></div>
              <h3>Loading support cases...</h3>
            </div>
          </td>
        </tr>
      {:else if cases.length === 0}
        <tr>
          <td colspan="8">
            <div class="state-container">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <h3>No cases to display</h3>
              <p>{emptyMessage}</p>
            </div>
          </td>
        </tr>
      {:else}
        {#each cases as c (c.id)}
          <tr on:click={() => handleRowClick(c.id)}>
            <td class="case-number-cell">
              <span class="case-code">{c.caseNumber}</span>
            </td>
            <td>
              <div class="customer-cell">
                <div class="customer-avatar">
                  {c.customer?.name ? c.customer.name.slice(0, 2).toUpperCase() : 'CU'}
                </div>
                <div class="customer-info">
                  <span class="customer-name">{c.customer?.name || 'Unknown'}</span>
                  {#if c.customer?.phone}
                    <span class="customer-sub">{c.customer.phone}</span>
                  {/if}
                </div>
              </div>
            </td>
            <td>
              <div class="subject-cell">
                <span class="subject-text">{c.subject}</span>
                {#if c.relatedEntity}
                  <span class="entity-tag" title="Related to Junto {c.relatedEntity.type}">
                    {c.relatedEntity.type}: {c.relatedEntity.id}
                  </span>
                {/if}
              </div>
            </td>
            <td>
              <span class="category-tag">{formatCategory(c.category)}</span>
            </td>
            <td>
              <PriorityBadge priority={c.priority} />
            </td>
            <td>
              <StatusBadge status={c.status} />
            </td>
            <td>
              {#if c.assignedAgent}
                <div class="agent-chip">
                  <span class="agent-dot"></span>
                  <span class="agent-name">{c.assignedAgent.name}</span>
                </div>
              {:else}
                <span class="unassigned-chip">Unassigned</span>
              {/if}
            </td>
            <td class="date-cell">
              {formatDate(c.createdAt)}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .case-number-cell {
    font-family: var(--font-mono);
    font-size: 0.82rem;
  }

  .case-code {
    font-weight: 600;
    color: var(--primary);
  }

  .customer-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .customer-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #e0f2fe;
    color: #0369a1;
    font-size: 0.7rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .customer-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .customer-name {
    font-weight: 500;
    font-size: 0.85rem;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .customer-sub {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .subject-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-width: 420px;
  }

  .subject-text {
    font-weight: 500;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entity-tag {
    font-size: 0.7rem;
    font-family: var(--font-mono);
    color: var(--text-muted);
    background-color: var(--bg-subtle);
    padding: 1px 5px;
    border-radius: 3px;
    display: inline-block;
    align-self: flex-start;
  }

  .category-tag {
    font-size: 0.78rem;
    color: var(--text-secondary);
    background-color: var(--bg-subtle);
    padding: 3px 7px;
    border-radius: var(--radius-sm);
    font-weight: 500;
  }

  .agent-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    background-color: var(--bg-subtle);
    padding: 3px 8px;
    border-radius: var(--radius-full);
  }

  .agent-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #10b981;
  }

  .unassigned-chip {
    font-size: 0.75rem;
    color: #b45309;
    background-color: #fef3c7;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-weight: 500;
  }

  .date-cell {
    font-size: 0.8rem;
    color: var(--text-muted);
    white-space: nowrap;
  }
</style>
