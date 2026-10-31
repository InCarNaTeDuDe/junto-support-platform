import React from 'react';
import type { CasePriority } from '../types/support';

interface PriorityBadgeProps {
  priority: CasePriority;
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const PRIORITY_CLASSES: Record<string, string> = {
  CRITICAL: 'badge-critical',
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const label = PRIORITY_LABELS[priority] || priority;
  const badgeClass = PRIORITY_CLASSES[priority] || 'badge-low';

  return (
    <span className={`badge ${badgeClass}`}>
      {priority === 'CRITICAL' && (
        <span style={{ fontWeight: 800, marginRight: 2 }}>!</span>
      )}
      {label}
    </span>
  );
};

export default PriorityBadge;
