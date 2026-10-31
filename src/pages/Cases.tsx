import React, { useEffect, useState, useCallback } from 'react';
import { supportService } from '../services/support';
import { useAuth } from '../context/AuthContext';
import type { SupportCase, CaseFilterOptions, CaseStatus, CasePriority, CaseCategory } from '../types/support';
import type { SupportAgent } from '../types/user';
import { CaseTable } from '../components/CaseTable';

interface CasesProps {
  view?: 'ALL' | 'MY_CASES' | 'UNASSIGNED' | 'RESOLVED';
  initialSearch?: string;
  onSelectCase: (caseId: string) => void;
}

export const Cases: React.FC<CasesProps> = ({
  view = 'ALL',
  initialSearch = '',
  onSelectCase,
}) => {
  const { user } = useAuth();

  const [cases, setCases] = useState<SupportCase[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter states
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [assignedAgentId, setAssignedAgentId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'status'>('newest');

  const viewTitles: Record<string, string> = {
    ALL: 'All Cases',
    MY_CASES: 'My Assigned Cases',
    UNASSIGNED: 'Unassigned Cases',
    RESOLVED: 'Resolved Cases',
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (agents.length === 0) {
        const agentList = await supportService.getAgents();
        setAgents(agentList);
      }

      const filters: CaseFilterOptions = {
        view,
        search: search.trim(),
        status: status as CaseStatus | 'ALL',
        priority: priority as CasePriority | 'ALL',
        category: category as CaseCategory | 'ALL',
        assignedAgentId: view === 'MY_CASES' ? user?.id : assignedAgentId,
        sortBy,
        page: currentPage,
        limit: pageSize,
      };

      const result = await supportService.getCases(filters);
      setCases(result.cases);
      setTotalCases(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load support cases');
    } finally {
      setIsLoading(false);
    }
  }, [view, search, status, priority, category, assignedAgentId, sortBy, currentPage, user?.id, agents.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [view, search, status, priority, category, assignedAgentId, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPriority('ALL');
    setCategory('ALL');
    setAssignedAgentId('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages && p !== currentPage) {
      setCurrentPage(p);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{viewTitles[view] || 'Support Cases'}</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Manage and resolve customer support tickets from the Junto mobile chat queue.
          </p>
        </div>
        <div
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {totalCases} {totalCases === 1 ? 'case' : 'cases'} total
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
            <label htmlFor="filter-search" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Search
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                style={{ position: 'absolute', left: 10, width: 14, height: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="filter-search"
                type="text"
                placeholder="Search case # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>

          {/* Status Filter */}
          {view !== 'RESOLVED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
              <label htmlFor="filter-status" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Status
              </label>
              <select
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-select"
              >
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

          {/* Priority Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <label htmlFor="filter-priority" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Priority
            </label>
            <select
              id="filter-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="form-select"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <label htmlFor="filter-category" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Category
            </label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="ALL">All Categories</option>
              <option value="RIDES">Rides</option>
              <option value="DAYMATES">DayMates</option>
              <option value="SERVICES">Services</option>
              <option value="TICKETS">Movie Tickets</option>
              <option value="DEALS">LocalDeals</option>
              <option value="HELPME">HelpMe</option>
              <option value="SAFETY">Safety</option>
              <option value="PAYMENT">Payment</option>
              <option value="ACCOUNT">Account & General</option>
            </select>
          </div>

          {/* Assigned Agent (for ALL and RESOLVED) */}
          {(view === 'ALL' || view === 'RESOLVED') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
              <label htmlFor="filter-agent" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Assigned Agent
              </label>
              <select
                id="filter-agent"
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="form-select"
              >
                <option value="ALL">All Agents</option>
                <option value="UNASSIGNED">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <label htmlFor="filter-sort" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Sort
            </label>
            <select
              id="filter-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority (Highest)</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Reset button */}
          <div style={{ paddingBottom: 2 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetFilters} title="Reset all filters">
              Reset
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#b91c1c',
            fontSize: '0.85rem',
          }}
        >
          <span>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* Case Table */}
      <CaseTable
        cases={cases}
        isLoading={isLoading}
        emptyMessage="No support cases found matching the selected filters."
        onSelect={onSelectCase}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, totalCases)}</strong> of <strong>{totalCases}</strong> cases
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => goToPage(currentPage - 1)}
            >
              ← Previous
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
