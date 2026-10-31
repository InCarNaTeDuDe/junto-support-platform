import React from 'react';

interface SummaryCardProps {
  title: string;
  count: number;
  subtitle?: string;
  accentColor?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  subtitle,
  accentColor = 'var(--primary)',
  isActive = false,
  onClick,
}) => {
  return (
    <div
      className={`summary-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="card-indicator" style={{ backgroundColor: accentColor }} />
      <div className="card-content">
        <div className="card-title">{title}</div>
        <div className="card-count">{count}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default SummaryCard;
