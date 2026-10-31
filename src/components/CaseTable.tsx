import React from 'react';
import type { SupportCase } from '../types/support';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

interface CaseTableProps {
  cases: SupportCase[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSelect: (caseId: string) => void;
}

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  isLoading = false,
  emptyMessage = 'No support cases found matching your criteria.',
  onSelect,
}) => {
  const formatDate = (isoString?: string): string => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCategory = (cat?: string): string => {
    if (!cat) return '';
    return cat.charAt(0) + cat.slice(1).toLowerCase();
  };

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 120 }}>Case #</th>
            <th style={{ width: 170 }}>Customer</th>
            <th>Subject</th>
            <th style={{ width: 110 }}>Category</th>
            <th style={{ width: 100 }}>Priority</th>
            <th style={{ width: 130 }}>Status</th>
            <th style={{ width: 160 }}>Assigned Agent</th>
            <th style={{ width: 130 }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={8}>
                <div className="state-container">
                  <div className="spinner" />
                  <h3>Loading support cases...</h3>
                </div>
              </td>
            </tr>
          ) : cases.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="state-container">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <h3>No cases to display</h3>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            cases.map((c) => (
              <tr key={c.id} onClick={() => onSelect(c.id)}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {c.caseNumber}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {c.customer?.name ? c.customer.name.slice(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {c.customer?.name || 'Unknown'}
                      </span>
                      {c.customer?.phone && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {c.customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 420 }}>
                    <span
                      style={{
                        fontWeight: 500,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.subject}
                    </span>
                    {c.relatedEntity && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '1px 5px',
                          borderRadius: 3,
                          alignSelf: 'flex-start',
                        }}
                        title={`Related to Junto ${c.relatedEntity.type}`}
                      >
                        {c.relatedEntity.type}: {c.relatedEntity.id}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '3px 7px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 500,
                    }}
                  >
                    {formatCategory(c.category)}
                  </span>
                </td>
                <td>
                  <PriorityBadge priority={c.priority} />
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>
                  {c.assignedAgent ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                        }}
                      />
                      <span>{c.assignedAgent.name}</span>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#b45309',
                        backgroundColor: '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 500,
                      }}
                    >
                      Unassigned
                    </span>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(c.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CaseTable;
