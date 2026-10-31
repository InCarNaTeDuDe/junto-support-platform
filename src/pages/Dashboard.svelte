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

  let summary: CasesSummary = {
    total: 0,
    open: 0,
    inProgress: 0,
    waitingForUser: 0,
    resolved: 0,
    criticalOrHigh: 0,
    unassigned: 0,
  };

  let criticalCases: SupportCase[] = [];
  let unassignedCases: SupportCase[] = [];
  let recentCases: SupportCase[] = [];

  let isLoading = true;
  let errorMsg = '';
  let activeTab: 'CRITICAL' | 'UNASSIGNED' | 'RECENT' = 'CRITICAL';

  export async function loadDashboardData() {
    isLoading = true;
    errorMsg = '';
    try {
      const [sumData, critData, unassignData, recentData] = await Promise.all([
        supportService.getSummary(),
        supportService.getCases({ priority: 'CRITICAL', limit: 5 }),
        supportService.getCases({ view: 'UNASSIGNED', limit: 5 }),
        supportService.getCases({ limit: 5 }),
      ]);

      summary = sumData;
      criticalCases = critData.cases;
      unassignedCases = unassignData.cases;
      recentCases = recentData.cases;
    } catch (err: any) {
      errorMsg = err.message || 'Failed to fetch dashboard data from Junto backend';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadDashboardData();
  });

  function handleCaseSelect(caseId: string) {
    dispatch('selectCase', caseId);
  }

  function navigateTo(page: string) {
    dispatch('navigate', page);
  }
</script>

<div class="dashboard-page">
  <!-- Summary Cards Grid -->
  <div class="summary-grid">
    <SummaryCard
      title="Total Cases"
      count={summary.total}
      subtitle="All Junto support tickets"
      accentColor="#64748b"
      on:click={() => navigateTo('cases_all')}
    />

    <SummaryCard
      title="Open Cases"
      count={summary.open}
      subtitle="Requires initial agent response"
      accentColor="#2563eb"
      on:click={() => navigateTo('cases_all')}
    />

    <SummaryCard
      title="In Progress"
      count={summary.inProgress}
      subtitle="Actively being handled"
      accentColor="#d97706"
      on:click={() => navigateTo('cases_all')}
    />

    <SummaryCard
      title="Waiting for User"
      count={summary.waitingForUser}
      subtitle="Awaiting customer reply"
      accentColor="#8b5cf6"
      on:click={() => navigateTo('cases_all')}
    />

    <SummaryCard
      title="Resolved"
      count={summary.resolved}
      subtitle="Customer issue completed"
      accentColor="#059669"
      on:click={() => navigateTo('cases_resolved')}
    />
  </div>

  {#if errorMsg}
    <div class="alert-banner">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{errorMsg}</span>
      <button class="btn btn-sm btn-secondary" on:click={loadDashboardData}>Retry</button>
    </div>
  {/if}

  <!-- Triage Focus Tabs -->
  <div class="dashboard-sections card">
    <div class="section-tabs-bar">
      <div class="tabs-list">
        <button
          class="tab-btn"
          class:active={activeTab === 'CRITICAL'}
          on:click={() => (activeTab = 'CRITICAL')}
        >
          <span class="tab-indicator indicator-red"></span>
          <span>Critical & High Priority</span>
          <span class="tab-badge badge-red">{summary.criticalOrHigh}</span>
        </button>

        <button
          class="tab-btn"
          class:active={activeTab === 'UNASSIGNED'}
          on:click={() => (activeTab = 'UNASSIGNED')}
        >
          <span class="tab-indicator indicator-amber"></span>
          <span>Awaiting Assignment</span>
          <span class="tab-badge badge-amber">{summary.unassigned}</span>
        </button>

        <button
          class="tab-btn"
          class:active={activeTab === 'RECENT'}
          on:click={() => (activeTab = 'RECENT')}
        >
          <span class="tab-indicator indicator-blue"></span>
          <span>Recent Support Cases</span>
          <span class="tab-badge">{recentCases.length}</span>
        </button>
      </div>

      <button
        class="btn btn-secondary btn-sm"
        on:click={() => navigateTo(activeTab === 'UNASSIGNED' ? 'cases_unassigned' : 'cases_all')}
      >
        View Full List →
      </button>
    </div>

    <div class="tab-content-area">
      {#if activeTab === 'CRITICAL'}
        <div class="section-description">
          <p>Cases with urgent safety concerns, payment disputes, or critical trip errors requiring prompt resolution.</p>
        </div>
        <CaseTable
          cases={criticalCases}
          {isLoading}
          emptyMessage="No critical or high-priority cases pending right now."
          on:select={(e) => handleCaseSelect(e.detail)}
        />
      {:else if activeTab === 'UNASSIGNED'}
        <div class="section-description">
          <p>Unassigned cases from the Junto mobile chat queue. Assign to yourself or an active agent.</p>
        </div>
        <CaseTable
          cases={unassignedCases}
          {isLoading}
          emptyMessage="Great news! All support cases have been assigned to agents."
          on:select={(e) => handleCaseSelect(e.detail)}
        />
      {:else}
        <div class="section-description">
          <p>Latest incoming cases submitted by Junto mobile users.</p>
        </div>
        <CaseTable
          cases={recentCases}
          {isLoading}
          emptyMessage="No recent cases found in backend."
          on:select={(e) => handleCaseSelect(e.detail)}
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .alert-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    color: #b91c1c;
    font-size: 0.85rem;
  }

  .dashboard-sections {
    padding: 0;
    overflow: hidden;
  }

  .section-tabs-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    gap: 16px;
    flex-wrap: wrap;
  }

  .tabs-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: var(--font-sans);
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.12s;
  }

  .tab-btn:hover {
    background-color: var(--bg-subtle);
    color: var(--text-main);
  }

  .tab-btn.active {
    background-color: var(--bg-subtle);
    color: var(--primary);
    border-color: var(--border-subtle);
    font-weight: 600;
  }

  .tab-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .indicator-red { background-color: #dc2626; }
  .indicator-amber { background-color: #d97706; }
  .indicator-blue { background-color: #2563eb; }

  .tab-badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    background-color: #e2e8f0;
    color: var(--text-secondary);
  }

  .badge-red {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .badge-amber {
    background-color: #fef3c7;
    color: #92400e;
  }

  .tab-content-area {
    padding: 18px 20px 24px;
  }

  .section-description {
    margin-bottom: 14px;
  }

  .section-description p {
    font-size: 0.82rem;
    color: var(--text-muted);
  }
</style>
