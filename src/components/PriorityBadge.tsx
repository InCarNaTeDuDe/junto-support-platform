import React from 'react';
import type { CasePriority } from '../types/support';

interface PriorityBadgeProps {
  priority: CasePriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const labelMap: Record<string, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };

  const classMap: Record<string, string> = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  };

  const label = labelMap[priority] || priority;
  const badgeClass = classMap[priority] || 'badge-low';

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
