import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { supportService } from './services/support';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Cases } from './pages/Cases';
import { CaseDetails } from './pages/CaseDetails';
import { Agents } from './pages/Agents';

// Helper to parse path into page and caseId
function parseRouteFromPath(path: string): { page: string; caseId: string | null } {
  const cleanPath = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  if (cleanPath === '' || cleanPath === '/' || cleanPath === '/dashboard') {
    return { page: 'dashboard', caseId: null };
  }
  if (cleanPath === '/cases' || cleanPath === '/cases/all') {
    return { page: 'cases_all', caseId: null };
  }
  if (cleanPath === '/cases/my') {
    return { page: 'cases_my', caseId: null };
  }
  if (cleanPath === '/cases/unassigned') {
    return { page: 'cases_unassigned', caseId: null };
  }
  if (cleanPath === '/cases/resolved') {
    return { page: 'cases_resolved', caseId: null };
  }
  if (cleanPath.startsWith('/cases/')) {
    const caseId = cleanPath.slice('/cases/'.length);
    if (caseId) {
      return { page: 'case_details', caseId: decodeURIComponent(caseId) };
    }
  }
  if (cleanPath === '/agents') {
    return { page: 'agents', caseId: null };
  }
  if (cleanPath === '/login') {
    return { page: 'login', caseId: null };
  }

  return { page: 'dashboard', caseId: null };
}

function getPathForRoute(page: string, caseId: string | null): string {
  switch (page) {
    case 'dashboard':
      return '/dashboard';
    case 'cases_all':
      return '/cases';
    case 'cases_my':
      return '/cases/my';
    case 'cases_unassigned':
      return '/cases/unassigned';
    case 'cases_resolved':
      return '/cases/resolved';
    case 'case_details':
      return caseId ? `/cases/${encodeURIComponent(caseId)}` : '/cases';
    case 'agents':
      return '/agents';
    case 'login':
      return '/login';
    default:
      return '/dashboard';
  }
}

export const AppContent: React.FC = () => {
  const { isAuthenticated, isAuthorized, isLoading: isAuthLoading, logout } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>(() => {
    return parseRouteFromPath(window.location.pathname).page;
  });
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    return parseRouteFromPath(window.location.pathname).caseId;
  });

  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');

  const refreshCounts = useCallback(async () => {
    try {
      const summary = await supportService.getSummary();
      setUnassignedCount(summary.unassigned);
      setCriticalCount(summary.criticalOrHigh);
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const { page, caseId } = parseRouteFromPath(window.location.pathname);
      setCurrentPage(page);
      setSelectedCaseId(caseId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Sync route and refresh counts on auth state change
  useEffect(() => {
    if (isAuthenticated && isAuthorized) {
      refreshCounts();
      // If currently on login route, replace with /dashboard
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        window.history.replaceState({}, '', '/dashboard');
        setCurrentPage('dashboard');
      }
    } else if (!isAuthLoading && (!isAuthenticated || !isAuthorized)) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({}, '', '/login');
      }
    }
  }, [isAuthenticated, isAuthorized, isAuthLoading, refreshCounts]);

  const navigateTo = (page: string, caseId: string | null = null) => {
    const targetPath = getPathForRoute(page, caseId);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentPage(page);
    setSelectedCaseId(caseId);
    setHeaderSearchQuery('');
    refreshCounts();
  };

  const handleNavigate = (page: string) => {
    navigateTo(page, null);
  };

  const handleSelectCase = (caseId: string) => {
    navigateTo('case_details', caseId);
  };

  const handleBackToCases = () => {
    navigateTo('cases_all', null);
  };

  const handleLogout = async () => {
    await logout();
    window.history.pushState({}, '', '/login');
    setCurrentPage('login');
    setSelectedCaseId(null);
  };

  const handleQuickSearch = (query: string) => {
    setHeaderSearchQuery(query);
    navigateTo('cases_all', null);
  };

  const pageHeaderTitle: Record<string, string> = {
    dashboard: 'Operations Dashboard',
    cases_all: 'All Support Cases',
    cases_my: 'My Assigned Cases',
    cases_unassigned: 'Unassigned Queue',
    cases_resolved: 'Resolved Cases Archive',
    case_details: selectedCaseId ? `Case Details` : 'Case Details',
    agents: 'Agent Directory & Roles',
  };

  if (isAuthLoading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner" />
        <p>Authenticating Junto Support Session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return (
      <Login
        onLoginSuccess={() => {
          refreshCounts();
          navigateTo('dashboard', null);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={currentPage}
        unassignedCount={unassignedCount}
        criticalCount={criticalCount}
        isOpenMobile={isMobileSidebarOpen}
        onNavigate={handleNavigate}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Header
          title={pageHeaderTitle[currentPage] || 'Dashboard'}
          subtitle="Junto Mobile Support System"
          isBackendConnected={isBackendConnected}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onQuickSearch={handleQuickSearch}
          onRefresh={refreshCounts}
        />

        <main className="content-area">
          {currentPage === 'dashboard' && (
            <Dashboard
              onSelectCase={handleSelectCase}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'cases_all' && (
            <Cases
              key={`all-${headerSearchQuery}`}
              view="ALL"
              initialSearch={headerSearchQuery}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'cases_my' && (
            <Cases
              key={`my-${headerSearchQuery}`}
              view="MY_CASES"
              initialSearch={headerSearchQuery}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'cases_unassigned' && (
            <Cases
              key={`unassigned-${headerSearchQuery}`}
              view="UNASSIGNED"
              initialSearch={headerSearchQuery}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'cases_resolved' && (
            <Cases
              key={`resolved-${headerSearchQuery}`}
              view="RESOLVED"
              initialSearch={headerSearchQuery}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'case_details' && selectedCaseId && (
            <CaseDetails
              caseId={selectedCaseId}
              onBack={handleBackToCases}
            />
          )}

          {currentPage === 'agents' && <Agents />}
        </main>
      </div>
    </div>
  );
};

export default AppContent;
