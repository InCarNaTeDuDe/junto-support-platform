import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  isBackendConnected?: boolean;
  onToggleSidebar?: () => void;
  onQuickSearch?: (query: string) => void;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = 'Junto Mobile Support System',
  isBackendConnected = true,
  onToggleSidebar,
  onQuickSearch,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onQuickSearch) {
      onQuickSearch(searchQuery.trim());
    }
  };

  return (
    <header
      style={{
        height: 56,
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="btn-icon"
          style={{ display: 'inline-flex', padding: 6 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            {title}
          </h1>
          {subtitle && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div
          title={`API: ${API_BASE_URL}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
            }}
          />
          <span>{isBackendConnected ? 'Connected' : 'Offline Mode'}</span>
        </div>

        <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg
            style={{
              position: 'absolute',
              left: 8,
              width: 14,
              height: 14,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search case #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{
              padding: '4px 8px 4px 28px',
              fontSize: '0.78rem',
              width: 160,
              backgroundColor: 'var(--bg-subtle)',
            }}
          />
        </form>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          title="Sync data"
          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
          </svg>
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
