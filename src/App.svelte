<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { auth } from './stores/auth';
  import { supportService } from './services/support';
  import Sidebar from './components/Sidebar.svelte';
  import Header from './components/Header.svelte';
  import Login from './pages/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import Cases from './pages/Cases.svelte';
  import CaseDetails from './pages/CaseDetails.svelte';
  import Agents from './pages/Agents.svelte';

  function parseRoute(path: string): { page: string; caseId: string | null } {
    const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    if (clean === '' || clean === '/' || clean === '/dashboard') return { page: 'dashboard', caseId: null };
    if (clean === '/cases' || clean === '/cases/all') return { page: 'cases_all', caseId: null };
    if (clean === '/cases/my') return { page: 'cases_my', caseId: null };
    if (clean === '/cases/unassigned') return { page: 'cases_unassigned', caseId: null };
    if (clean === '/cases/resolved') return { page: 'cases_resolved', caseId: null };
    if (clean.startsWith('/cases/')) return { page: 'case_details', caseId: decodeURIComponent(clean.slice(7)) };
    if (clean === '/agents') return { page: 'agents', caseId: null };
    if (clean === '/login') return { page: 'login', caseId: null };
    return { page: 'dashboard', caseId: null };
  }

  function resolveCurrentLocation(): { page: string; caseId: string | null; cleanUrl?: string } {
    if (typeof window === 'undefined') return { page: 'dashboard', caseId: null };

    // 1. Check if 404 fallback redirected with ?p=... or ?redirect=...
    const params = new URLSearchParams(window.location.search);
    const redirected = params.get('p') || params.get('redirect');
    if (redirected) {
      const decoded = decodeURIComponent(redirected);
      return { ...parseRoute(decoded), cleanUrl: decoded };
    }

    // 2. Check hash route fallback (#/cases/my, #dashboard)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const cleanHash = hash.replace(/^#\/?/, '/');
      if (cleanHash && cleanHash !== '/') {
        return { ...parseRoute(cleanHash), cleanUrl: cleanHash };
      }
    }

    // 3. Standard pathname
    return parseRoute(window.location.pathname);
  }

  function getPath(page: string, caseId: string | null): string {
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      cases_all: '/cases',
      cases_my: '/cases/my',
      cases_unassigned: '/cases/unassigned',
      cases_resolved: '/cases/resolved',
      case_details: caseId ? `/cases/${encodeURIComponent(caseId)}` : '/cases',
      agents: '/agents',
      login: '/login',
    };
    return routes[page] || '/dashboard';
  }

  let currentPage: string = resolveCurrentLocation().page;
  let selectedCaseId: string | null = resolveCurrentLocation().caseId;
  let unassignedCount: number = 0;
  let criticalCount: number = 0;
  let isBackendConnected: boolean = true;
  let isMobileSidebarOpen: boolean = false;
  let searchQuery: string = '';

  $: isAuthenticated = $auth.isAuthenticated;
  $: isAuthorized = $auth.isAuthorized;
  $: isAuthLoading = $auth.isLoading;

  const titles: Record<string, string> = {
    dashboard: 'Operations Dashboard',
    cases_all: 'All Support Cases',
    cases_my: 'My Assigned Cases',
    cases_unassigned: 'Unassigned Queue',
    cases_resolved: 'Resolved Cases',
    case_details: 'Case Details',
    agents: 'Agent Directory',
  };

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

  function navigateTo(page: string, caseId: string | null = null) {
    const path = getPath(page, caseId);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    currentPage = page;
    selectedCaseId = caseId;
    searchQuery = '';
    refreshCounts();
  }

  async function handleLogout() {
    await auth.logout();
    window.history.pushState({}, '', '/login');
    currentPage = 'login';
    selectedCaseId = null;
  }

  function handleLocationChange() {
    const route = resolveCurrentLocation();
    currentPage = route.page;
    selectedCaseId = route.caseId;
  }

  onMount(() => {
    auth.init();

    const initial = resolveCurrentLocation();
    if (initial.cleanUrl && window.history.replaceState) {
      window.history.replaceState({}, '', initial.cleanUrl);
    }

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    }
  });

  $: if (isAuthenticated && isAuthorized) {
    refreshCounts();
    const current = resolveCurrentLocation();
    if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/')) {
      if (!current.cleanUrl || current.page === 'login') {
        window.history.replaceState({}, '', '/dashboard');
        currentPage = 'dashboard';
      }
    }
  } else if (!isAuthLoading && (!isAuthenticated || !isAuthorized)) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
  }
</script>

{#if isAuthLoading}
  <div class="app-loading-screen">
    <div class="spinner"></div>
    <p>Authenticating session...</p>
  </div>
{:else if !isAuthenticated || !isAuthorized}
  <Login
    on:loginSuccess={() => {
      refreshCounts();
      navigateTo('dashboard');
    }}
  />
{:else}
  <div class="app-shell">
    <Sidebar
      activePage={currentPage}
      {unassignedCount}
      {criticalCount}
      isOpenMobile={isMobileSidebarOpen}
      on:navigate={(e) => navigateTo(e.detail)}
      on:closeMobile={() => (isMobileSidebarOpen = false)}
      on:logout={handleLogout}
    />

    <div class="main-wrapper">
      <Header
        title={titles[currentPage] || 'Dashboard'}
        {isBackendConnected}
        on:toggleSidebar={() => (isMobileSidebarOpen = !isMobileSidebarOpen)}
        on:quickSearch={(e) => {
          searchQuery = e.detail;
          navigateTo('cases_all');
        }}
        on:refresh={refreshCounts}
      />

      <main class="content-area">
        {#if currentPage === 'dashboard'}
          <Dashboard
            on:selectCase={(e) => navigateTo('case_details', e.detail)}
            on:navigate={(e) => navigateTo(e.detail)}
          />
        {:else if currentPage === 'cases_all'}
          <Cases
            key={`all-${searchQuery}`}
            view="ALL"
            initialSearch={searchQuery}
            on:selectCase={(e) => navigateTo('case_details', e.detail)}
          />
        {:else if currentPage === 'cases_my'}
          <Cases
            key={`my-${searchQuery}`}
            view="MY_CASES"
            initialSearch={searchQuery}
            on:selectCase={(e) => navigateTo('case_details', e.detail)}
          />
        {:else if currentPage === 'cases_unassigned'}
          <Cases
            key={`u-${searchQuery}`}
            view="UNASSIGNED"
            initialSearch={searchQuery}
            on:selectCase={(e) => navigateTo('case_details', e.detail)}
          />
        {:else if currentPage === 'cases_resolved'}
          <Cases
            key={`r-${searchQuery}`}
            view="RESOLVED"
            initialSearch={searchQuery}
            on:selectCase={(e) => navigateTo('case_details', e.detail)}
          />
        {:else if currentPage === 'case_details' && selectedCaseId}
          <CaseDetails
            caseId={selectedCaseId}
            on:back={() => navigateTo('cases_all')}
          />
        {:else if currentPage === 'agents'}
          <Agents />
        {/if}
      </main>
    </div>
  </div>
{/if}
