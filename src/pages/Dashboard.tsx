import React, { useEffect, useState } from 'react';
import { supportService } from '../services/support';
import type { CasesSummary, SupportCase } from '../types/support';
import { SummaryCard } from '../components/SummaryCard';
import { CaseTable } from '../components/CaseTable';

interface DashboardProps {
  onSelectCase: (caseId: string) => void;
  onNavigate: (page: string) => void;
}

const emptySummary: CasesSummary = {
  total: 0, open: 0, inProgress: 0, waitingForUser: 0, resolved: 0, criticalOrHigh: 0, unassigned: 0,
  totalCases: 0, openCases: 0, assignedCases: 0, inProgressCases: 0, waitingForUserCases: 0, resolvedCases: 0, unassignedCases: 0, criticalCases: 0, highPriorityCases: 0,
};

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCase, onNavigate }) => {
  const [summary, setSummary] = useState<CasesSummary>(emptySummary);
  const [criticalCases, setCriticalCases] = useState<SupportCase[]>([]);
  const [unassignedCases, setUnassignedCases] = useState<SupportCase[]>([]);
  const [recentCases, setRecentCases] = useState<SupportCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'CRITICAL' | 'UNASSIGNED' | 'RECENT'>('CRITICAL');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [sum, crit, unassign, recent] = await Promise.all([
        supportService.getSummary(),
        supportService.getCases({ priority: 'CRITICAL', limit: 5 }),
        supportService.getCases({ view: 'UNASSIGNED', limit: 5 }),
        supportService.getRecentCases(5),
      ]);
      setSummary(sum);
      setCriticalCases(crit.cases);
      setUnassignedCases(unassign.cases);
      setRecentCases(recent);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const currentList = activeTab === 'CRITICAL' ? criticalCases : activeTab === 'UNASSIGNED' ? unassignedCases : recentCases;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="summary-grid">
        <SummaryCard title="Total Cases" count={summary.total} subtitle="All support cases" accentColor="#64748b" onClick={() => onNavigate('cases_all')} />
        <SummaryCard title="Open Cases" count={summary.open} subtitle="Needs response" accentColor="#2563eb" onClick={() => onNavigate('cases_all')} />
        <SummaryCard title="In Progress" count={summary.inProgress} subtitle="Under investigation" accentColor="#d97706" onClick={() => onNavigate('cases_all')} />
        <SummaryCard title="Waiting for User" count={summary.waitingForUser} subtitle="Awaiting reply" accentColor="#8b5cf6" onClick={() => onNavigate('cases_all')} />
        <SummaryCard title="Resolved" count={summary.resolved} subtitle="Completed tickets" accentColor="#059669" onClick={() => onNavigate('cases_resolved')} />
      </div>

      {errorMsg && (
        <div className="alert-banner">
          <span>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadData}>Retry</button>
        </div>
      )}

      <div className="card">
        <div className="section-tabs-bar">
          <div className="tabs-list">
            <button type="button" className={`tab-btn ${activeTab === 'CRITICAL' ? 'active' : ''}`} onClick={() => setActiveTab('CRITICAL')}>
              <span className="tab-indicator indicator-red" />
              <span>Critical & High</span>
              <span className="tab-badge badge-red">{summary.criticalOrHigh}</span>
            </button>
            <button type="button" className={`tab-btn ${activeTab === 'UNASSIGNED' ? 'active' : ''}`} onClick={() => setActiveTab('UNASSIGNED')}>
              <span className="tab-indicator indicator-amber" />
              <span>Awaiting Assignment</span>
              <span className="tab-badge badge-amber">{summary.unassigned}</span>
            </button>
            <button type="button" className={`tab-btn ${activeTab === 'RECENT' ? 'active' : ''}`} onClick={() => setActiveTab('RECENT')}>
              <span className="tab-indicator indicator-blue" />
              <span>Recent Activity</span>
              <span className="tab-badge">{recentCases.length}</span>
            </button>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate(activeTab === 'UNASSIGNED' ? 'cases_unassigned' : 'cases_all')}>
            View Full List →
          </button>
        </div>

        <div style={{ paddingTop: 16 }}>
          <CaseTable
            cases={currentList}
            isLoading={isLoading}
            emptyMessage={`No ${activeTab.toLowerCase()} cases pending.`}
            onSelect={onSelectCase}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
