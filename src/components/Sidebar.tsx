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

  const handleNav = (p: string) => {
    onNavigate(p);
    onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar ${isOpenMobile ? 'open-mobile' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-identity">
            <div className="brand-icon">J</div>
            <div className="brand-text">
              <span className="brand-name">Junto</span>
              <span className="brand-sub">Support</span>
            </div>
          </div>
          <button type="button" className="close-drawer-btn" onClick={onCloseMobile}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Cases</div>
          <button type="button" className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => handleNav('dashboard')}>
            <span>Dashboard</span>
          </button>
          <button type="button" className={`nav-item ${activePage === 'cases_all' ? 'active' : ''}`} onClick={() => handleNav('cases_all')}>
            <span>All Cases</span>
            {criticalCount > 0 && <span className="pill pill-warn">{criticalCount}</span>}
          </button>
          <button type="button" className={`nav-item ${activePage === 'cases_my' ? 'active' : ''}`} onClick={() => handleNav('cases_my')}>
            <span>My Cases</span>
          </button>
          <button type="button" className={`nav-item ${activePage === 'cases_unassigned' ? 'active' : ''}`} onClick={() => handleNav('cases_unassigned')}>
            <span>Unassigned</span>
            {unassignedCount > 0 && <span className="pill pill-danger">{unassignedCount}</span>}
          </button>
          <button type="button" className={`nav-item ${activePage === 'cases_resolved' ? 'active' : ''}`} onClick={() => handleNav('cases_resolved')}>
            <span>Resolved</span>
          </button>

          {isOwner && (
            <>
              <div className="nav-label" style={{ marginTop: 14 }}>Admin</div>
              <button type="button" className={`nav-item ${activePage === 'agents' ? 'active' : ''}`} onClick={() => handleNav('agents')}>
                <span>Agents</span>
                <span className="pill pill-owner">Owner</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="avatar">{user.name?.slice(0, 2).toUpperCase() || 'AG'}</div>
              <div className="user-meta">
                <div className="user-name" title={user.name}>{user.name}</div>
                <span className={`role-badge ${user.role === 'OWNER' ? 'owner' : ''}`}>{user.role}</span>
              </div>
            </div>
          )}
          <button type="button" className="btn btn-secondary btn-sm logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
