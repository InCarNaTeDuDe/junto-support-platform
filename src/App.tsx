import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { supportService } from './services/support';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetails from './pages/CaseDetails';
import Agents from './pages/Agents';

export const App: React.FC = () => {
  const { isAuthenticated, isAuthorized, isLoading: isAuthLoading, logout } = useAuth();

  // Routing State
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Global search query passed from header
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

  useEffect(() => {
    if (isAuthorized) {
      refreshCounts();
    }
  }, [isAuthorized, refreshCounts]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedCaseId(null);
    refreshCounts();
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentPage('case_details');
  };

  const handleBackToCases = () => {
    setSelectedCaseId(null);
    setCurrentPage('cases_all');
    refreshCounts();
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage('dashboard');
    setSelectedCaseId(null);
  };

  const handleQuickSearch = (query: string) => {
    setHeaderSearchQuery(query);
    setSelectedCaseId(null);
    setCurrentPage('cases_all');
  };

  const handleHeaderRefresh = () => {
    refreshCounts();
  };

  const pageHeaderTitles: Record<string, string> = {
    dashboard: 'Operations Dashboard',
    cases_all: 'All Support Cases',
    cases_my: 'My Assigned Cases',
    cases_unassigned: 'Unassigned Queue',
    cases_resolved: 'Resolved Cases Archive',
    case_details: 'Case Details',
    agents: 'Agent Directory & Roles',
  };

  const pageHeaderTitle = pageHeaderTitles[currentPage] || 'Dashboard';

  if (isAuthLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
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
          setCurrentPage('dashboard');
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
          title={pageHeaderTitle}
          subtitle="Junto Mobile Support System"
          isBackendConnected={isBackendConnected}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onQuickSearch={handleQuickSearch}
          onRefresh={handleHeaderRefresh}
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
              view="ALL"
              initialSearch={headerSearchQuery}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'cases_my' && (
            <Cases
              view="MY_CASES"
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'cases_unassigned' && (
            <Cases
              view="UNASSIGNED"
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'cases_resolved' && (
            <Cases
              view="RESOLVED"
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

export default App;
