<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SupportCase } from '../types/support';
  import StatusBadge from './StatusBadge.svelte';
  import PriorityBadge from './PriorityBadge.svelte';

  export let cases: SupportCase[] = [];
  export let isLoading: boolean = false;
  export let emptyMessage: string = 'No support cases found.';

  const dispatch = createEventDispatcher<{ select: string }>();

  function formatDate(iso?: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleRowClick(caseId: string) {
    dispatch('select', caseId);
  }
</script>

<div class="table-responsive">
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 120px;">Case #</th>
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
              <h3>Loading cases...</h3>
            </div>
          </td>
        </tr>
      {:else if cases.length === 0}
        <tr>
          <td colspan="8">
            <div class="state-container">
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
                  {c.customer?.name?.slice(0, 2).toUpperCase() || 'CU'}
                </div>
                <div class="customer-info">
                  <span class="customer-name">{c.customer?.name || 'Customer'}</span>
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
                  <span class="entity-tag">
                    {c.relatedEntity.type}: {c.relatedEntity.id}
                  </span>
                {/if}
              </div>
            </td>
            <td>
              <span class="category-tag">{c.category}</span>
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
                  <span>{c.assignedAgent.name}</span>
                </div>
              {:else}
                <span class="unassigned-chip">Unassigned</span>
              {/if}
            </td>
            <td class="date-cell">{formatDate(c.createdAt)}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
