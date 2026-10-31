<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { supportService } from '../services/support';
  import { auth } from '../stores/auth';
  import type { SupportCase, CaseFilterOptions, CaseStatus, CasePriority } from '../types/support';
  import type { SupportAgent } from '../types/user';
  import CaseTable from '../components/CaseTable.svelte';

  export let view: 'ALL' | 'MY_CASES' | 'UNASSIGNED' | 'RESOLVED' = 'ALL';
  export let initialSearch: string = '';

  const dispatch = createEventDispatcher<{ selectCase: string }>();

  let cases: SupportCase[] = [];
  let agents: SupportAgent[] = [];
  let totalCases: number = 0;
  let totalPages: number = 1;
  let currentPage: number = 1;
  let isLoading: boolean = true;
  let errorMsg: string = '';

  let search: string = initialSearch;
  let status: string = 'ALL';
  let priority: string = 'ALL';
  let category: string = 'ALL';
  let assignedAgentId: string = 'ALL';
  let sortBy: 'newest' | 'oldest' | 'priority' | 'status' = 'newest';

  const titles: Record<string, string> = {
    ALL: 'All Cases',
    MY_CASES: 'My Assigned Cases',
    UNASSIGNED: 'Unassigned Queue',
    RESOLVED: 'Resolved Cases',
  };

  async function loadData() {
    isLoading = true;
    errorMsg = '';
    try {
      if (!agents.length) {
        agents = await supportService.getAgents();
      }

      const filters: CaseFilterOptions = {
        view,
        search: search.trim(),
        status: status as CaseStatus | 'ALL',
        priority: priority as CasePriority | 'ALL',
        category: category as any,
        assignedAgentId: view === 'MY_CASES' ? $auth.user?.id : assignedAgentId,
        sortBy,
        page: currentPage,
        limit: 8,
      };

      const res = await supportService.getCases(filters);
      cases = res.cases;
      totalCases = res.total;
      totalPages = res.totalPages;
    } catch (err: any) {
      errorMsg = err.message || 'Failed to load cases';
    } finally {
      isLoading = false;
    }
  }

  // Trigger search / filter update
  function onFilterChange() {
    currentPage = 1;
    loadData();
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
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

  onMount(() => {
    loadData();
  });
</script>

<div style="display: flex; flex-direction: column; gap: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
    <div>
      <h2>{titles[view] || 'Support Cases'}</h2>
      <p style="margin-top: 2px;">Manage customer support tickets from the Junto mobile chat queue.</p>
    </div>
    <div class="total-pill">{totalCases} {totalCases === 1 ? 'case' : 'cases'} total</div>
  </div>

  <div class="card filter-toolbar">
    <div class="filter-row">
      <div class="filter-item search-item">
        <label class="filter-label" for="case-search">Search</label>
        <input
          id="case-search"
          type="text"
          placeholder="Search case # or customer..."
          bind:value={search}
          on:input={onFilterChange}
          class="form-control"
        />
      </div>

      {#if view !== 'RESOLVED'}
        <div class="filter-item">
          <label class="filter-label" for="case-status">Status</label>
          <select id="case-status" bind:value={status} on:change={onFilterChange} class="form-select">
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      {/if}

      <div class="filter-item">
        <label class="filter-label" for="case-priority">Priority</label>
        <select id="case-priority" bind:value={priority} on:change={onFilterChange} class="form-select">
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div class="filter-item">
        <label class="filter-label" for="case-category">Category</label>
        <select id="case-category" bind:value={category} on:change={onFilterChange} class="form-select">
          <option value="ALL">All Categories</option>
          <option value="RIDES">Rides</option>
          <option value="DAYMATES">DayMates</option>
          <option value="SERVICES">Services</option>
          <option value="TICKETS">Tickets</option>
          <option value="DEALS">Deals</option>
          <option value="HELPME">HelpMe</option>
          <option value="PAYMENT">Payment</option>
        </select>
      </div>

      {#if view === 'ALL' || view === 'RESOLVED'}
        <div class="filter-item">
          <label class="filter-label" for="case-agent">Agent</label>
          <select id="case-agent" bind:value={assignedAgentId} on:change={onFilterChange} class="form-select">
            <option value="ALL">All Agents</option>
            <option value="UNASSIGNED">Unassigned</option>
            {#each agents as ag (ag.id)}
              <option value={ag.id}>{ag.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="filter-item">
        <label class="filter-label" for="case-sort">Sort</label>
        <select id="case-sort" bind:value={sortBy} on:change={onFilterChange} class="form-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div class="filter-item action-item">
        <button type="button" class="btn btn-secondary btn-sm" on:click={resetFilters}>Reset</button>
      </div>
    </div>
  </div>

  {#if errorMsg}
    <div class="alert-banner">
      <span>{errorMsg}</span>
      <button type="button" class="btn btn-sm btn-secondary" on:click={loadData}>Retry</button>
    </div>
  {/if}

  <CaseTable
    cases={cases}
    {isLoading}
    on:select={(e) => dispatch('selectCase', e.detail)}
  />

  {#if totalPages > 1}
    <div class="pagination-bar">
      <div class="pagination-info">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </div>
      <div class="pagination-actions">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          disabled={currentPage <= 1 || isLoading}
          on:click={() => handlePageChange(currentPage - 1)}
        >
          ← Previous
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          disabled={currentPage >= totalPages || isLoading}
          on:click={() => handlePageChange(currentPage + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  {/if}
</div>
