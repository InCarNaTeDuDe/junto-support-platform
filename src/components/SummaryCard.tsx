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
  subtitle = '',
  accentColor = 'var(--primary)',
  isActive = false,
  onClick,
}) => {
  return (
    <div
      className={`summary-card ${isActive ? 'active' : ''}`}
      style={{
        backgroundColor: isActive ? 'var(--primary-subtle)' : 'var(--bg-surface)',
        borderColor: isActive ? 'var(--primary)' : 'var(--border-subtle)',
      }}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role="button"
      tabIndex={0}
    >
      <div
        className="card-indicator"
        style={{
          width: 4,
          borderRadius: 4,
          backgroundColor: accentColor,
          flexShrink: 0,
        }}
      />
      <div className="card-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          className="card-title"
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </div>
        <div
          className="card-count"
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            lineHeight: 1.2,
            margin: '4px 0 2px',
          }}
        >
          {count}
        </div>
        {subtitle && (
          <div
            className="card-subtitle"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
