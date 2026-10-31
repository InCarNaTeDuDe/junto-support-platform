<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { supportService } from '../services/support';
  import type { CasesSummary, SupportCase } from '../types/support';
  import SummaryCard from '../components/SummaryCard.svelte';
  import CaseTable from '../components/CaseTable.svelte';

  const dispatch = createEventDispatcher<{
    selectCase: string;
    navigate: string;
  }>();

  const emptySummary: CasesSummary = {
    total: 0,
    open: 0,
    inProgress: 0,
    waitingForUser: 0,
    resolved: 0,
    criticalOrHigh: 0,
    unassigned: 0,
    totalCases: 0,
    openCases: 0,
    assignedCases: 0,
    inProgressCases: 0,
    waitingForUserCases: 0,
    resolvedCases: 0,
    unassignedCases: 0,
    criticalCases: 0,
    highPriorityCases: 0,
  };

  let summary: CasesSummary = { ...emptySummary };
  let criticalCases: SupportCase[] = [];
  let unassignedCases: SupportCase[] = [];
  let recentCases: SupportCase[] = [];
  let isLoading: boolean = true;
  let errorMsg: string = '';
  let activeTab: 'CRITICAL' | 'UNASSIGNED' | 'RECENT' = 'CRITICAL';

  async function loadData() {
    isLoading = true;
    errorMsg = '';
    try {
      const [sum, crit, unassign, recent] = await Promise.all([
        supportService.getSummary(),
        supportService.getCases({ priority: 'CRITICAL', limit: 5 }),
        supportService.getCases({ view: 'UNASSIGNED', limit: 5 }),
        supportService.getRecentCases(5),
      ]);
      summary = sum;
      criticalCases = crit.cases;
      unassignedCases = unassign.cases;
      recentCases = recent;
    } catch (err: any) {
      errorMsg = err.message || 'Failed to fetch dashboard data';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  $: currentList =
    activeTab === 'CRITICAL'
      ? criticalCases
      : activeTab === 'UNASSIGNED'
        ? unassignedCases
        : recentCases;

  function handleNavigate(page: string) {
    dispatch('navigate', page);
  }

  function handleSelectCase(id: string) {
    dispatch('selectCase', id);
  }
</script>

<div style="display: flex; flex-direction: column; gap: 24px;">
  <div class="summary-grid">
    <SummaryCard
      title="Total Cases"
      count={summary.total}
      subtitle="All support cases"
      accentColor="#64748b"
      on:click={() => handleNavigate('cases_all')}
    />
    <SummaryCard
      title="Open Cases"
      count={summary.open}
      subtitle="Needs response"
      accentColor="#2563eb"
      on:click={() => handleNavigate('cases_all')}
    />
    <SummaryCard
      title="In Progress"
      count={summary.inProgress}
      subtitle="Under investigation"
      accentColor="#d97706"
      on:click={() => handleNavigate('cases_all')}
    />
    <SummaryCard
      title="Waiting for User"
      count={summary.waitingForUser}
      subtitle="Awaiting reply"
      accentColor="#8b5cf6"
      on:click={() => handleNavigate('cases_all')}
    />
    <SummaryCard
      title="Resolved"
      count={summary.resolved}
      subtitle="Completed tickets"
      accentColor="#059669"
      on:click={() => handleNavigate('cases_resolved')}
    />
  </div>

  {#if errorMsg}
    <div class="alert-banner">
      <span>{errorMsg}</span>
      <button type="button" class="btn btn-sm btn-secondary" on:click={loadData}>Retry</button>
    </div>
  {/if}

  <div class="card">
    <div class="section-tabs-bar">
      <div class="tabs-list">
        <button
          type="button"
          class="tab-btn {activeTab === 'CRITICAL' ? 'active' : ''}"
          on:click={() => (activeTab = 'CRITICAL')}
        >
          <span class="tab-indicator indicator-red"></span>
          <span>Critical & High</span>
          <span class="tab-badge badge-red">{summary.criticalOrHigh}</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'UNASSIGNED' ? 'active' : ''}"
          on:click={() => (activeTab = 'UNASSIGNED')}
        >
          <span class="tab-indicator indicator-amber"></span>
          <span>Awaiting Assignment</span>
          <span class="tab-badge badge-amber">{summary.unassigned}</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'RECENT' ? 'active' : ''}"
          on:click={() => (activeTab = 'RECENT')}
        >
          <span class="tab-indicator indicator-blue"></span>
          <span>Recent Activity</span>
          <span class="tab-badge">{recentCases.length}</span>
        </button>
      </div>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        on:click={() => handleNavigate(activeTab === 'UNASSIGNED' ? 'cases_unassigned' : 'cases_all')}
      >
        View Full List →
      </button>
    </div>

    <div style="padding-top: 16px;">
      <CaseTable
        cases={currentList}
        {isLoading}
        emptyMessage={`No ${activeTab.toLowerCase()} cases pending.`}
        on:select={(e) => handleSelectCase(e.detail)}
      />
    </div>
  </div>
</div>
