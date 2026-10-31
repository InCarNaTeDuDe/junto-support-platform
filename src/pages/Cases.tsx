import React, { useEffect, useState, useCallback } from 'react';
import { supportService } from '../services/support';
import { useAuth } from '../context/AuthContext';
import type { SupportCase, CaseFilterOptions, CaseStatus, CasePriority } from '../types/support';
import type { SupportAgent } from '../types/user';
import { CaseTable } from '../components/CaseTable';

interface CasesProps {
  view?: 'ALL' | 'MY_CASES' | 'UNASSIGNED' | 'RESOLVED';
  initialSearch?: string;
  onSelectCase: (caseId: string) => void;
}

export const Cases: React.FC<CasesProps> = ({ view = 'ALL', initialSearch = '', onSelectCase }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [assignedAgentId, setAssignedAgentId] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'status'>('newest');

  const titles: Record<string, string> = {
    ALL: 'All Cases',
    MY_CASES: 'My Assigned Cases',
    UNASSIGNED: 'Unassigned Queue',
    RESOLVED: 'Resolved Cases',
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (!agents.length) setAgents(await supportService.getAgents());

      const filters: CaseFilterOptions = {
        view,
        search: search.trim(),
        status: status as CaseStatus | 'ALL',
        priority: priority as CasePriority | 'ALL',
        category: category as any,
        assignedAgentId: view === 'MY_CASES' ? user?.id : assignedAgentId,
        sortBy,
        page: currentPage,
        limit: 8,
      };

      const res = await supportService.getCases(filters);
      setCases(res.cases);
      setTotalCases(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  }, [view, search, status, priority, category, assignedAgentId, sortBy, currentPage, user?.id, agents.length]);

  useEffect(() => { setCurrentPage(1); }, [view, search, status, priority, category, assignedAgentId, sortBy]);
  useEffect(() => { loadData(); }, [loadData]);

  const resetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPriority('ALL');
    setCategory('ALL');
    setAssignedAgentId('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>{titles[view] || 'Support Cases'}</h2>
          <p style={{ marginTop: 2 }}>Manage customer support tickets from the Junto mobile chat queue.</p>
        </div>
        <div className="total-pill">{totalCases} {totalCases === 1 ? 'case' : 'cases'} total</div>
      </div>

      <div className="card filter-toolbar">
        <div className="filter-row">
          <div className="filter-item search-item">
            <label className="filter-label">Search</label>
            <input
              type="text"
              placeholder="Search case # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>

          {view !== 'RESOLVED' && (
            <div className="filter-item">
              <label className="filter-label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_USER">Waiting for User</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          )}

          <div className="filter-item">
            <label className="filter-label">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-select">
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
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

          {(view === 'ALL' || view === 'RESOLVED') && (
            <div className="filter-item">
              <label className="filter-label">Agent</label>
              <select value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)} className="form-select">
                <option value="ALL">All Agents</option>
                <option value="UNASSIGNED">Unassigned</option>
                {agents.map((ag) => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
              </select>
            </div>
          )}

          <div className="filter-item">
            <label className="filter-label">Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="form-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="filter-item action-item">
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner">
          <span>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadData}>Retry</button>
        </div>
      )}

      <CaseTable cases={cases} isLoading={isLoading} onSelect={onSelectCase} />

      {totalPages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></div>
          <div className="pagination-actions">
            <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage <= 1 || isLoading} onClick={() => setCurrentPage((p) => p - 1)}>
              ← Previous
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage >= totalPages || isLoading} onClick={() => setCurrentPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
