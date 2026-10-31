import React from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  unassignedCount?: number;
  criticalCount?: number;
  isOpenMobile?: boolean;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage = 'dashboard',
  unassignedCount = 0,
  criticalCount = 0,
  isOpenMobile = false,
  onNavigate,
  onLogout,
  onCloseMobile,
}) => {
  const { user, role } = useAuth();
  const isOwner = role === 'OWNER';

  const navigate = (page: string) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 90,
          }}
          onClick={onCloseMobile}
          onKeyDown={(e) => e.key === 'Escape' && onCloseMobile()}
          tabIndex={0}
          role="button"
          aria-label="Close sidebar"
        />
      )}

      <aside
        style={{
          width: 220,
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          minHeight: '100vh',
          zIndex: 100,
          transition: 'transform 0.2s ease',
          ...(isOpenMobile
            ? {
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                width: 260,
                transform: 'translateX(0)',
                boxShadow: 'var(--shadow-lg)',
              }
            : {}),
        }}
        className={isOpenMobile ? 'sidebar open-mobile' : 'sidebar'}
      >
        {/* Brand */}
        <div
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              J
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Junto
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Support
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{ display: isOpenMobile ? 'inline-block' : 'none' }}
          >
            ✕
          </button>
        </div>

        {/* Nav List */}
        <nav
          style={{
            flex: 1,
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              padding: '6px 10px 2px',
            }}
          >
            Cases
          </div>

          <button
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: activePage === 'dashboard' ? 'var(--primary-subtle)' : 'transparent',
              border: 'none',
              color: activePage === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: activePage === 'dashboard' ? 600 : 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activePage === 'cases_all' ? 'active' : ''}`}
            onClick={() => navigate('cases_all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: activePage === 'cases_all' ? 'var(--primary-subtle)' : 'transparent',
              border: 'none',
              color: activePage === 'cases_all' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: activePage === 'cases_all' ? 600 : 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>All Cases</span>
            {criticalCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#fff7ed',
                  color: '#c2410c',
                }}
              >
                {criticalCount}
              </span>
            )}
          </button>

          <button
            className={`nav-item ${activePage === 'cases_my' ? 'active' : ''}`}
            onClick={() => navigate('cases_my')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: activePage === 'cases_my' ? 'var(--primary-subtle)' : 'transparent',
              border: 'none',
              color: activePage === 'cases_my' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: activePage === 'cases_my' ? 600 : 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>My Cases</span>
          </button>

          <button
            className={`nav-item ${activePage === 'cases_unassigned' ? 'active' : ''}`}
            onClick={() => navigate('cases_unassigned')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: activePage === 'cases_unassigned' ? 'var(--primary-subtle)' : 'transparent',
              border: 'none',
              color: activePage === 'cases_unassigned' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: activePage === 'cases_unassigned' ? 600 : 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Unassigned</span>
            {unassignedCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                }}
              >
                {unassignedCount}
              </span>
            )}
          </button>

          <button
            className={`nav-item ${activePage === 'cases_resolved' ? 'active' : ''}`}
            onClick={() => navigate('cases_resolved')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: activePage === 'cases_resolved' ? 'var(--primary-subtle)' : 'transparent',
              border: 'none',
              color: activePage === 'cases_resolved' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: activePage === 'cases_resolved' ? 600 : 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Resolved</span>
          </button>

          {isOwner && (
            <>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  padding: '12px 10px 2px',
                }}
              >
                Admin
              </div>
              <button
                className={`nav-item ${activePage === 'agents' ? 'active' : ''}`}
                onClick={() => navigate('agents')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: activePage === 'agents' ? 'var(--primary-subtle)' : 'transparent',
                  border: 'none',
                  color: activePage === 'agents' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: activePage === 'agents' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Agents</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 2,
                    backgroundColor: '#f1f5f9',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  Owner
                </span>
              </button>
            </>
          )}
        </nav>

        {/* User Footer */}
        <div
          style={{
            padding: 12,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={user.name}
                >
                  {user.name}
                </div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 2,
                    backgroundColor: user.role === 'OWNER' ? '#dbeafe' : '#e2e8f0',
                    color: user.role === 'OWNER' ? '#1e40af' : '#475569',
                  }}
                >
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: '0.78rem', padding: '4px 8px' }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
