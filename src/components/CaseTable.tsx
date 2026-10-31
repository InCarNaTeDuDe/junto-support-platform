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
  emptyMessage = 'No support cases found.',
  onSelect,
}) => {
  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');

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
            <th style={{ width: 150 }}>Assigned Agent</th>
            <th style={{ width: 130 }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={8}><div className="state-container"><div className="spinner" /><h3>Loading cases...</h3></div></td></tr>
          ) : cases.length === 0 ? (
            <tr><td colSpan={8}><div className="state-container"><h3>No cases to display</h3><p>{emptyMessage}</p></div></td></tr>
          ) : (
            cases.map((c) => (
              <tr key={c.id} onClick={() => onSelect(c.id)}>
                <td className="case-number-cell"><span className="case-code">{c.caseNumber}</span></td>
                <td>
                  <div className="customer-cell">
                    <div className="customer-avatar">{c.customer?.name?.slice(0, 2).toUpperCase() || 'CU'}</div>
                    <div className="customer-info">
                      <span className="customer-name">{c.customer?.name || 'Customer'}</span>
                      {c.customer?.phone && <span className="customer-sub">{c.customer.phone}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="subject-cell">
                    <span className="subject-text">{c.subject}</span>
                    {c.relatedEntity && <span className="entity-tag">{c.relatedEntity.type}: {c.relatedEntity.id}</span>}
                  </div>
                </td>
                <td><span className="category-tag">{c.category}</span></td>
                <td><PriorityBadge priority={c.priority} /></td>
                <td><StatusBadge status={c.status} /></td>
                <td>
                  {c.assignedAgent ? (
                    <div className="agent-chip"><span className="agent-dot" /><span>{c.assignedAgent.name}</span></div>
                  ) : (
                    <span className="unassigned-chip">Unassigned</span>
                  )}
                </td>
                <td className="date-cell">{formatDate(c.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CaseTable;
