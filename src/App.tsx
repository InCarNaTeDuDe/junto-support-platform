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

export const AppContent: React.FC = () => {
  const { isAuthenticated, isAuthorized, isLoading: isAuthLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState(() => parseRoute(window.location.pathname).page);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => parseRoute(window.location.pathname).caseId);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    const handlePop = () => {
      const route = parseRoute(window.location.pathname);
      setCurrentPage(route.page);
      setSelectedCaseId(route.caseId);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAuthorized) {
      refreshCounts();
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        window.history.replaceState({}, '', '/dashboard');
        setCurrentPage('dashboard');
      }
    } else if (!isAuthLoading && (!isAuthenticated || !isAuthorized)) {
      if (window.location.pathname !== '/login') window.history.replaceState({}, '', '/login');
    }
  }, [isAuthenticated, isAuthorized, isAuthLoading, refreshCounts]);

  const navigateTo = (page: string, caseId: string | null = null) => {
    const path = getPath(page, caseId);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setCurrentPage(page);
    setSelectedCaseId(caseId);
    setSearchQuery('');
    refreshCounts();
  };

  const handleLogout = async () => {
    await logout();
    window.history.pushState({}, '', '/login');
    setCurrentPage('login');
    setSelectedCaseId(null);
  };

  if (isAuthLoading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner" />
        <p>Authenticating session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return <Login onLoginSuccess={() => { refreshCounts(); navigateTo('dashboard'); }} />;
  }

  const titles: Record<string, string> = {
    dashboard: 'Operations Dashboard',
    cases_all: 'All Support Cases',
    cases_my: 'My Assigned Cases',
    cases_unassigned: 'Unassigned Queue',
    cases_resolved: 'Resolved Cases',
    case_details: 'Case Details',
    agents: 'Agent Directory',
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={currentPage}
        unassignedCount={unassignedCount}
        criticalCount={criticalCount}
        isOpenMobile={isMobileSidebarOpen}
        onNavigate={(p) => navigateTo(p)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Header
          title={titles[currentPage] || 'Dashboard'}
          isBackendConnected={isBackendConnected}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onQuickSearch={(q) => { setSearchQuery(q); navigateTo('cases_all'); }}
          onRefresh={refreshCounts}
        />

        <main className="content-area">
          {currentPage === 'dashboard' && <Dashboard onSelectCase={(id) => navigateTo('case_details', id)} onNavigate={(p) => navigateTo(p)} />}
          {currentPage === 'cases_all' && <Cases key={`all-${searchQuery}`} view="ALL" initialSearch={searchQuery} onSelectCase={(id) => navigateTo('case_details', id)} />}
          {currentPage === 'cases_my' && <Cases key={`my-${searchQuery}`} view="MY_CASES" initialSearch={searchQuery} onSelectCase={(id) => navigateTo('case_details', id)} />}
          {currentPage === 'cases_unassigned' && <Cases key={`u-${searchQuery}`} view="UNASSIGNED" initialSearch={searchQuery} onSelectCase={(id) => navigateTo('case_details', id)} />}
          {currentPage === 'cases_resolved' && <Cases key={`r-${searchQuery}`} view="RESOLVED" initialSearch={searchQuery} onSelectCase={(id) => navigateTo('case_details', id)} />}
          {currentPage === 'case_details' && selectedCaseId && <CaseDetails caseId={selectedCaseId} onBack={() => navigateTo('cases_all')} />}
          {currentPage === 'agents' && <Agents />}
        </main>
      </div>
    </div>
  );
};

export default AppContent;
