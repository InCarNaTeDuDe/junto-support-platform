import React from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  unassignedCount?: number;
  criticalCount?: number;
  isOpenMobile?: boolean;
  onNavigate: (page: string) => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  unassignedCount = 0,
  criticalCount = 0,
  isOpenMobile = false,
  onNavigate,
  onCloseMobile,
  onLogout,
}) => {
  const { user, role } = useAuth();
  const isOwner = role === 'OWNER';

  const handleNav = (page: string) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`sidebar ${isOpenMobile ? 'open-mobile' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-identity">
            <div className="brand-icon">J</div>
            <div className="brand-text">
              <span className="brand-name">Junto</span>
              <span className="brand-sub">Support</span>
            </div>
          </div>

          <button
            type="button"
            className="close-drawer-btn"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Cases</div>

          <button
            type="button"
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNav('dashboard')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === 'cases_all' ? 'active' : ''}`}
            onClick={() => handleNav('cases_all')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>All Cases</span>
            {criticalCount > 0 && <span className="pill pill-warn">{criticalCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === 'cases_my' ? 'active' : ''}`}
            onClick={() => handleNav('cases_my')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>My Cases</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === 'cases_unassigned' ? 'active' : ''}`}
            onClick={() => handleNav('cases_unassigned')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Unassigned</span>
            {unassignedCount > 0 && <span className="pill pill-danger">{unassignedCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === 'cases_resolved' ? 'active' : ''}`}
            onClick={() => handleNav('cases_resolved')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Resolved</span>
          </button>

          {isOwner && (
            <>
              <div className="nav-label" style={{ marginTop: 14 }}>Admin</div>
              <button
                type="button"
                className={`nav-item ${activePage === 'agents' ? 'active' : ''}`}
                onClick={() => handleNav('agents')}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Agents</span>
                <span className="pill pill-owner">Owner</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="avatar">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
              </div>
              <div className="user-meta">
                <div className="user-name" title={user.name}>
                  {user.name}
                </div>
                <span className={`role-badge ${user.role === 'OWNER' ? 'owner' : ''}`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm logout-btn"
            onClick={onLogout}
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
