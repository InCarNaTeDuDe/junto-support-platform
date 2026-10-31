<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { supportService } from '../services/support';
  import { authStore } from '../stores/auth';
  import type { SupportCase, CaseFilterOptions } from '../types/support';
  import type { SupportAgent } from '../types/user';
  import CaseTable from '../components/CaseTable.svelte';

  export let view: 'ALL' | 'MY_CASES' | 'UNASSIGNED' | 'RESOLVED' = 'ALL';

  const dispatch = createEventDispatcher<{
    selectCase: string;
  }>();

  let cases: SupportCase[] = [];
  let agents: SupportAgent[] = [];
  let totalCases = 0;
  let totalPages = 1;
  let currentPage = 1;
  const pageSize = 8;

  let isLoading = true;
  let errorMsg = '';

  // Filter states
  let search = '';
  let status = 'ALL';
  let priority = 'ALL';
  let category = 'ALL';
  let assignedAgentId = 'ALL';
  let sortBy: 'newest' | 'oldest' | 'priority' | 'status' = 'newest';

  $: currentUser = $authStore.user;

  // View title
  $: viewTitle = {
    ALL: 'All Cases',
    MY_CASES: 'My Assigned Cases',
    UNASSIGNED: 'Unassigned Cases',
    RESOLVED: 'Resolved Cases',
  }[view];

  async function loadData() {
    isLoading = true;
    errorMsg = '';

    try {
      if (agents.length === 0) {
        agents = await supportService.getAgents();
      }

      const filters: CaseFilterOptions = {
        view,
        search: search.trim(),
        status: status as any,
        priority: priority as any,
        category: category as any,
        assignedAgentId: view === 'MY_CASES' ? currentUser?.id : assignedAgentId,
        sortBy,
        page: currentPage,
        limit: pageSize,
      };

      const result = await supportService.getCases(filters);
      cases = result.cases;
      totalCases = result.total;
      totalPages = result.totalPages;
      currentPage = result.page;
    } catch (err: any) {
      errorMsg = err.message || 'Failed to load support cases';
    } finally {
      isLoading = false;
    }
  }

  // Trigger reload when view changes
  $: if (view) {
    currentPage = 1;
    loadData();
  }

  function handleFilterChange() {
    currentPage = 1;
    loadData();
  }

  function resetFilters() {
    search = '';
    status = 'ALL';
    priority = 'ALL';
    category = 'ALL';
    assignedAgentId = 'ALL';
    sortBy = 'newest';
    currentPage = 1;
    loadData();
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      currentPage = page;
      loadData();
    }
  }

  function handleSelectCase(id: string) {
    dispatch('selectCase', id);
  }
</script>

<div class="cases-page">
  <!-- Page Header -->
  <div class="page-top-bar">
    <div>
      <h2 class="page-title">{viewTitle}</h2>
      <p class="page-desc">
        Manage and resolve customer support tickets from the Junto mobile chat queue.
      </p>
    </div>
    <div class="total-pill">
      {totalCases} {totalCases === 1 ? 'case' : 'cases'} total
    </div>
  </div>

  <!-- Filter & Search Toolbar -->
  <div class="card filter-toolbar">
    <div class="filter-row">
      <!-- Search -->
      <div class="filter-item search-item">
        <label for="filter-search" class="filter-label">Search</label>
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="filter-search"
            type="text"
            placeholder="Search case # or customer..."
            bind:value={search}
            on:input={handleFilterChange}
            class="form-control with-icon"
          />
        </div>
      </div>

      <!-- Status Filter -->
      {#if view !== 'RESOLVED'}
        <div class="filter-item">
          <label for="filter-status" class="filter-label">Status</label>
          <select id="filter-status" bind:value={status} on:change={handleFilterChange} class="form-select">
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      {/if}

      <!-- Priority Filter -->
      <div class="filter-item">
        <label for="filter-priority" class="filter-label">Priority</label>
        <select id="filter-priority" bind:value={priority} on:change={handleFilterChange} class="form-select">
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <!-- Category Filter -->
      <div class="filter-item">
        <label for="filter-cat" class="filter-label">Category</label>
        <select id="filter-cat" bind:value={category} on:change={handleFilterChange} class="form-select">
          <option value="ALL">All Categories</option>
          <option value="SAFETY">Safety</option>
          <option value="PAYMENT">Payment</option>
          <option value="TRIP">Trip</option>
          <option value="DELIVERY">Delivery</option>
          <option value="ACCOUNT">Account</option>
          <option value="TECHNICAL">Technical</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      <!-- Agent Filter (if not in MY_CASES or UNASSIGNED) -->
      {#if view === 'ALL' || view === 'RESOLVED'}
        <div class="filter-item">
          <label for="filter-agent" class="filter-label">Assigned Agent</label>
          <select id="filter-agent" bind:value={assignedAgentId} on:change={handleFilterChange} class="form-select">
            <option value="ALL">All Agents</option>
            <option value="UNASSIGNED">Unassigned</option>
            {#each agents as agent (agent.id)}
              <option value={agent.id}>{agent.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Sort By -->
      <div class="filter-item">
        <label for="filter-sort" class="filter-label">Sort</label>
        <select id="filter-sort" bind:value={sortBy} on:change={handleFilterChange} class="form-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority (Highest)</option>
          <option value="status">Status</option>
        </select>
      </div>

      <!-- Reset button -->
      <div class="filter-item action-item">
        <button class="btn btn-secondary btn-sm" on:click={resetFilters} title="Reset all filters">
          Reset
        </button>
      </div>
    </div>
  </div>

  {#if errorMsg}
    <div class="alert-banner">
      <span>{errorMsg}</span>
      <button class="btn btn-sm btn-secondary" on:click={loadData}>Retry</button>
    </div>
  {/if}

  <!-- Case Table -->
  <CaseTable
    {cases}
    {isLoading}
    emptyMessage="No support cases found matching the selected filters."
    on:select={(e) => handleSelectCase(e.detail)}
  />

  <!-- Pagination Controls -->
  {#if totalPages > 1}
    <div class="pagination-bar">
      <div class="pagination-info">
        Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
        <strong>{Math.min(currentPage * pageSize, totalCases)}</strong> of <strong>{totalCases}</strong> cases
      </div>

      <div class="pagination-actions">
        <button
          class="btn btn-secondary btn-sm"
          disabled={currentPage <= 1 || isLoading}
          on:click={() => goToPage(currentPage - 1)}
        >
          ← Previous
        </button>

        <span class="page-number-display">
          Page {currentPage} of {totalPages}
        </span>

        <button
          class="btn btn-secondary btn-sm"
          disabled={currentPage >= totalPages || isLoading}
          on:click={() => goToPage(currentPage + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .cases-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .page-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
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

  .total-pill {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .filter-toolbar {
    padding: 14px 18px;
  }

  .filter-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 130px;
  }

  .search-item {
    flex: 1;
    min-width: 200px;
  }

  .action-item {
    min-width: auto;
    justify-content: flex-end;
  }

  .filter-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    width: 14px;
    height: 14px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .with-icon {
    padding-left: 32px;
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

  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    gap: 16px;
    flex-wrap: wrap;
  }

  .pagination-info {
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .pagination-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .page-number-display {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
</style>
