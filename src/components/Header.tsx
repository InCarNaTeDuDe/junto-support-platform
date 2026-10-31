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
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="menu-toggle-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="title-wrap">
          <h1 className="header-title">{title}</h1>
          {subtitle && <span className="header-subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="header-right">
        <div className="api-status-badge" title={`API: ${API_BASE_URL}`}>
          <span className={`status-pulse ${isBackendConnected ? 'connected' : ''}`} />
          <span>{isBackendConnected ? 'Connected' : 'Offline Mode'}</span>
        </div>

        <form onSubmit={handleSubmit} className="search-form">
          <svg
            className="search-icon"
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
            className="search-input"
          />
        </form>

        <button
          type="button"
          className="btn btn-secondary btn-sm sync-btn"
          onClick={onRefresh}
          title="Sync data"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
          </svg>
          <span className="sync-text">Sync</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
