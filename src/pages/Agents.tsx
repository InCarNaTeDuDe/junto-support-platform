import React, { useEffect, useState, useCallback } from 'react';
import { supportService } from '../services/support';
import { useAuth } from '../context/AuthContext';
import type { SupportAgent, AgentRole, AgentStatus } from '../types/user';

export const Agents: React.FC = () => {
  const { user, role } = useAuth();
  const isOwner = role === 'OWNER';

  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Add Agent Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<AgentRole>('SUPPORT');

  const showNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => {
      setSuccessNotice((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const list = await supportService.getAgents();
      setAgents(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load support agents list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) {
      loadAgents();
    }
  }, [isOwner, loadAgents]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const created = await supportService.createAgent({
        userId: newUserId.trim() || undefined,
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
      });

      showNotice(`Agent ${created.name} (${created.email}) authorized successfully!`);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewUserId('');
      setNewRole('SUPPORT');
      await loadAgents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authorize agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (agent: SupportAgent) => {
    const newStatus: AgentStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (agent.id === user?.id && newStatus === 'INACTIVE') {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      await supportService.updateAgentStatus(agent.id, newStatus);
      showNotice(`Agent ${agent.name} marked as ${newStatus}.`);
      await loadAgents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update agent status');
    }
  };

  const handleChangeRole = async (agent: SupportAgent, updatedRole: AgentRole) => {
    if (agent.id === user?.id && updatedRole !== 'OWNER') {
      alert('You cannot demote your own account.');
      return;
    }

    try {
      await supportService.updateAgentRole(agent.id, updatedRole);
      showNotice(`Agent ${agent.name} role changed to ${updatedRole}.`);
      await loadAgents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change agent role');
    }
  };

  const formatDate = (iso?: string): string => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOwner) {
    return (
      <div className="card access-denied-box">
        <div className="denied-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h2>Owner Authorization Required</h2>
        <p>Only users with the <strong>OWNER</strong> role can manage support agents and permissions in Junto.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Support Agents & Access Control</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Authorized team members who can log in to Junto Support Management with Google.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Authorized Agent</span>
        </button>
      </div>

      {successNotice && (
        <div className="success-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successNotice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-banner">
          <span>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadAgents}>
            Retry
          </button>
        </div>
      )}

      {/* Agents Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Agent Name</th>
              <th>Authorized Google Email</th>
              <th style={{ width: 140 }}>Role</th>
              <th style={{ width: 130 }}>Status</th>
              <th style={{ width: 140 }}>Member Since</th>
              <th style={{ width: 130 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>
                  <div className="state-container">
                    <div className="spinner" />
                    <h3>Loading agent list...</h3>
                  </div>
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="state-container">
                    <h3>No agents found</h3>
                  </div>
                </td>
              </tr>
            ) : (
              agents.map((ag) => (
                <tr key={ag.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="agent-avatar">
                        {ag.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{ag.name}</span>
                        {ag.id === user?.id && <span className="you-tag">(You)</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{ag.email}</span>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={ag.role}
                      disabled={ag.id === user?.id}
                      onChange={(e) => handleChangeRole(ag, e.target.value as AgentRole)}
                    >
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-pill ${ag.status === 'ACTIVE' ? 'active-pill' : 'inactive-pill'}`}>
                      {ag.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDate(ag.createdAt)}
                  </td>
                  <td>
                    {ag.id !== user?.id ? (
                      <button
                        type="button"
                        className={`btn btn-sm ${ag.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleStatus(ag)}
                      >
                        {ag.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Current user
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          role="dialog"
        >
          <div className="modal-content">
            <div className="card-header">
              <h3>Add Authorized Support Agent</h3>
              <button type="button" className="btn-icon" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAgent}>
              <div className="form-group">
                <label htmlFor="agent-new-name" className="form-label">Full Name</label>
                <input
                  id="agent-new-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Jordan Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="agent-new-email" className="form-label">Google Workspace / Login Email</label>
                <input
                  id="agent-new-email"
                  type="email"
                  className="form-control"
                  placeholder="jordan.support@junto.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
                <span className="form-hint">Must match their Google Sign-In identity to be authorized.</span>
              </div>

              <div className="form-group">
                <label htmlFor="agent-new-userid" className="form-label">Junto User ID (Optional UUID)</label>
                <input
                  id="agent-new-userid"
                  type="text"
                  className="form-control font-mono"
                  placeholder="e.g. user-uuid-5001"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                />
                <span className="form-hint">Optional UUID if user already exists in PostgreSQL users table.</span>
              </div>

              <div className="form-group">
                <label htmlFor="agent-new-role" className="form-label">Role</label>
                <select
                  id="agent-new-role"
                  className="form-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AgentRole)}
                >
                  <option value="SUPPORT">SUPPORT (Manage cases, customer chat, notes)</option>
                  <option value="OWNER">OWNER (Full administrative access & agent management)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !newName.trim() || !newEmail.trim()}
                >
                  {isSubmitting ? 'Saving...' : 'Authorize Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
