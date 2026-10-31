import React from 'react';
import type { CaseStatus } from '../types/support';

interface StatusBadgeProps {
  status: CaseStatus;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_USER: 'Waiting for User',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  'Under Review': 'Under Review',
};

const STATUS_CLASSES: Record<string, string> = {
  OPEN: 'badge-open',
  ASSIGNED: 'badge-assigned',
  IN_PROGRESS: 'badge-inprogress',
  WAITING_FOR_USER: 'badge-waiting',
  RESOLVED: 'badge-resolved',
  CLOSED: 'badge-closed',
  'Under Review': 'badge-open',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  const badgeClass = STATUS_CLASSES[status] || 'badge-open';

  return (
    <span className={`badge ${badgeClass}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
