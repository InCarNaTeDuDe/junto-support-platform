import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';

interface HeaderProps {
  title: string;
  isBackendConnected?: boolean;
  onToggleSidebar?: () => void;
  onQuickSearch?: (query: string) => void;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isBackendConnected = true,
  onToggleSidebar,
  onQuickSearch,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onQuickSearch) onQuickSearch(query.trim());
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button type="button" onClick={onToggleSidebar} aria-label="Toggle navigation" className="menu-toggle-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="title-wrap">
          <h1 className="header-title">{title}</h1>
          <span className="header-subtitle">Junto Support Dashboard</span>
        </div>
      </div>

      <div className="header-right">
        <div className="api-status-badge" title={`API: ${API_BASE_URL}`}>
          <span className={`status-pulse ${isBackendConnected ? 'connected' : ''}`} />
          <span>{isBackendConnected ? 'Connected' : 'Offline'}</span>
        </div>

        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            placeholder="Search case #..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </form>

        <button type="button" className="btn btn-secondary btn-sm sync-btn" onClick={onRefresh} title="Sync data">
          Sync
        </button>
      </div>
    </header>
  );
};

export default Header;
