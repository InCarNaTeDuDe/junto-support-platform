import React, { useEffect, useState } from 'react';
import { supportService } from '../services/support';
import type { CasesSummary, SupportCase } from '../types/support';
import { SummaryCard } from '../components/SummaryCard';
import { CaseTable } from '../components/CaseTable';

interface DashboardProps {
  onSelectCase: (caseId: string) => void;
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCase, onNavigate }) => {
  const [summary, setSummary] = useState<CasesSummary>({
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
  });

  const [criticalCases, setCriticalCases] = useState<SupportCase[]>([]);
  const [unassignedCases, setUnassignedCases] = useState<SupportCase[]>([]);
  const [recentCases, setRecentCases] = useState<SupportCase[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'CRITICAL' | 'UNASSIGNED' | 'RECENT'>('CRITICAL');

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [sumData, critData, unassignData, recentList] = await Promise.all([
        supportService.getSummary(),
        supportService.getCases({ priority: 'CRITICAL', limit: 5 }),
        supportService.getCases({ view: 'UNASSIGNED', limit: 5 }),
        supportService.getRecentCases(5),
      ]);

      setSummary(sumData);
      setCriticalCases(critData.cases);
      setUnassignedCases(unassignData.cases);
      setRecentCases(recentList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch dashboard data from Junto backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="dashboard-page">
      {/* Summary Cards Grid */}
      <div className="summary-grid">
        <SummaryCard
          title="Total Cases"
          count={summary.total}
          subtitle="All Junto support tickets"
          accentColor="#64748b"
          onClick={() => onNavigate('cases_all')}
        />
        <SummaryCard
          title="Open Cases"
          count={summary.open}
          subtitle="Requires initial agent response"
          accentColor="#2563eb"
          onClick={() => onNavigate('cases_all')}
        />
        <SummaryCard
          title="In Progress"
          count={summary.inProgress}
          subtitle="Actively being handled"
          accentColor="#d97706"
          onClick={() => onNavigate('cases_all')}
        />
        <SummaryCard
          title="Waiting for User"
          count={summary.waitingForUser}
          subtitle="Awaiting customer reply"
          accentColor="#8b5cf6"
          onClick={() => onNavigate('cases_all')}
        />
        <SummaryCard
          title="Resolved"
          count={summary.resolved}
          subtitle="Customer issue completed"
          accentColor="#059669"
          onClick={() => onNavigate('cases_resolved')}
        />
      </div>

      {errorMsg && (
        <div className="alert-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* Triage Focus Tabs Card */}
      <div className="dashboard-sections card">
        <div className="section-tabs-bar">
          <div className="tabs-list">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setActiveTab('CRITICAL')}
            >
              <span className="tab-indicator indicator-red" />
              <span>Critical & High Priority</span>
              <span className="tab-badge badge-red">{summary.criticalOrHigh}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'UNASSIGNED' ? 'active' : ''}`}
              onClick={() => setActiveTab('UNASSIGNED')}
            >
              <span className="tab-indicator indicator-amber" />
              <span>Awaiting Assignment</span>
              <span className="tab-badge badge-amber">{summary.unassigned}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'RECENT' ? 'active' : ''}`}
              onClick={() => setActiveTab('RECENT')}
            >
              <span className="tab-indicator indicator-blue" />
              <span>Recent Support Cases</span>
              <span className="tab-badge">{recentCases.length}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate(activeTab === 'UNASSIGNED' ? 'cases_unassigned' : 'cases_all')}
          >
            View Full List →
          </button>
        </div>

        <div className="tab-content-area">
          {activeTab === 'CRITICAL' && (
            <>
              <div className="section-description">
                <p>
                  Cases with urgent safety concerns, payment disputes, or critical trip errors requiring prompt resolution.
                </p>
              </div>
              <CaseTable
                cases={criticalCases}
                isLoading={isLoading}
                emptyMessage="No critical or high-priority cases pending right now."
                onSelect={onSelectCase}
              />
            </>
          )}

          {activeTab === 'UNASSIGNED' && (
            <>
              <div className="section-description">
                <p>
                  Unassigned cases from the Junto mobile chat queue. Assign to yourself or an active agent.
                </p>
              </div>
              <CaseTable
                cases={unassignedCases}
                isLoading={isLoading}
                emptyMessage="Great news! All support cases have been assigned to agents."
                onSelect={onSelectCase}
              />
            </>
          )}

          {activeTab === 'RECENT' && (
            <>
              <div className="section-description">
                <p>Latest incoming cases submitted by Junto mobile users.</p>
              </div>
              <CaseTable
                cases={recentCases}
                isLoading={isLoading}
                emptyMessage="No recent cases found in backend."
                onSelect={onSelectCase}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
