<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from './stores/auth';
  import { supportService } from './services/support';
  import Sidebar from './components/Sidebar.svelte';
  import Header from './components/Header.svelte';
  import Login from './pages/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import Cases from './pages/Cases.svelte';
  import CaseDetails from './pages/CaseDetails.svelte';
  import Agents from './pages/Agents.svelte';

  // Routing State
  let currentPage = 'dashboard';
  let selectedCaseId: string | null = null;
  let unassignedCount = 0;
  let criticalCount = 0;
  let isBackendConnected = true;
  let isMobileSidebarOpen = false;

  // Global search query passed from header
  let headerSearchQuery = '';

  $: user = $authStore.user;
  $: isAuthenticated = $authStore.isAuthenticated;
  $: isAuthorized = $authStore.isAuthorized;
  $: isAuthLoading = $authStore.isLoading;

  async function refreshCounts() {
    try {
      const summary = await supportService.getSummary();
      unassignedCount = summary.unassigned;
      criticalCount = summary.criticalOrHigh;
      isBackendConnected = true;
    } catch {
      isBackendConnected = false;
    }
  }

  onMount(async () => {
    await authStore.initialize();
    if ($authStore.isAuthorized) {
      await refreshCounts();
    }
  });

  function handleNavigate(page: string) {
    currentPage = page;
    selectedCaseId = null;
    refreshCounts();
  }

  function handleSelectCase(caseId: string) {
    selectedCaseId = caseId;
    currentPage = 'case_details';
  }

  function handleBackToCases() {
    selectedCaseId = null;
    currentPage = 'cases_all';
    refreshCounts();
  }

  async function handleLogout() {
    await authStore.logout();
    currentPage = 'dashboard';
    selectedCaseId = null;
  }

  function handleQuickSearch(event: CustomEvent<string>) {
    headerSearchQuery = event.detail;
    selectedCaseId = null;
    currentPage = 'cases_all';
  }

  function handleHeaderRefresh() {
    refreshCounts();
  }

  $: pageHeaderTitle = {
    dashboard: 'Operations Dashboard',
    cases_all: 'All Support Cases',
    cases_my: 'My Assigned Cases',
    cases_unassigned: 'Unassigned Queue',
    cases_resolved: 'Resolved Cases Archive',
    case_details: selectedCaseId ? `Case Details` : 'Case Details',
    agents: 'Agent Directory & Roles',
  }[currentPage] || 'Dashboard';
</script>

{#if isAuthLoading}
  <!-- Global App Loading Spinner -->
  <div class="app-loading-screen">
    <div class="spinner"></div>
    <p>Authenticating Junto Support Session...</p>
  </div>
{:else if !isAuthenticated || !isAuthorized}
  <!-- Login / Access Denied Screen -->
  <Login on:loginSuccess={() => { refreshCounts(); currentPage = 'dashboard'; }} />
{:else}
  <!-- Main Application Shell -->
  <div class="app-shell">
    <Sidebar
      activePage={currentPage}
      {unassignedCount}
      {criticalCount}
      isOpenMobile={isMobileSidebarOpen}
      on:navigate={(e) => handleNavigate(e.detail)}
      on:closeMobile={() => (isMobileSidebarOpen = false)}
      on:logout={handleLogout}
    />

    <div class="main-wrapper">
      <Header
        title={pageHeaderTitle}
        subtitle="Junto Mobile Support System"
        {isBackendConnected}
        on:toggleSidebar={() => (isMobileSidebarOpen = !isMobileSidebarOpen)}
        on:quickSearch={handleQuickSearch}
        on:refresh={handleHeaderRefresh}
      />

      <main class="content-area">
        {#if currentPage === 'dashboard'}
          <Dashboard
            on:selectCase={(e) => handleSelectCase(e.detail)}
            on:navigate={(e) => handleNavigate(e.detail)}
          />
        {:else if currentPage === 'cases_all'}
          <Cases
            view="ALL"
            on:selectCase={(e) => handleSelectCase(e.detail)}
          />
        {:else if currentPage === 'cases_my'}
          <Cases
            view="MY_CASES"
            on:selectCase={(e) => handleSelectCase(e.detail)}
          />
        {:else if currentPage === 'cases_unassigned'}
          <Cases
            view="UNASSIGNED"
            on:selectCase={(e) => handleSelectCase(e.detail)}
          />
        {:else if currentPage === 'cases_resolved'}
          <Cases
            view="RESOLVED"
            on:selectCase={(e) => handleSelectCase(e.detail)}
          />
        {:else if currentPage === 'case_details' && selectedCaseId}
          <CaseDetails
            caseId={selectedCaseId}
            on:back={handleBackToCases}
          />
        {:else if currentPage === 'agents'}
          <Agents />
        {/if}
      </main>
    </div>
  </div>
{/if}

<style>
  .app-loading-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background-color: var(--bg-app);
    color: var(--text-muted);
    font-size: 0.9rem;
  }
</style>
