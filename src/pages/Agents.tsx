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
  const [notice, setNotice] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [newRole, setNewRole] = useState<AgentRole>('SUPPORT');

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((p) => (p === msg ? '' : p)), 3500);
  };

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      setAgents(await supportService.getAgents());
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) loadAgents();
  }, [isOwner, loadAgents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const created = await supportService.createAgent({
        userId: userId.trim() || undefined,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: newRole,
      });
      flash(`Agent ${created.name} authorized!`);
      setShowModal(false);
      setName('');
      setEmail('');
      setUserId('');
      await loadAgents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (ag: SupportAgent) => {
    const next: AgentStatus = ag.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (ag.id === user?.id && next === 'INACTIVE') return;
    try {
      await supportService.updateAgentStatus(ag.id, next);
      flash(`${ag.name} marked as ${next}`);
      await loadAgents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status');
    }
  };

  const changeRole = async (ag: SupportAgent, r: AgentRole) => {
    if (ag.id === user?.id && r !== 'OWNER') return;
    try {
      await supportService.updateAgentRole(ag.id, r);
      flash(`${ag.name} role changed to ${r}`);
      await loadAgents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role');
    }
  };

  if (!isOwner) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <h2>Owner Authorization Required</h2>
        <p style={{ marginTop: 8 }}>Only users with the OWNER role can manage agents and permissions.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Support Agents & Access Control</h2>
          <p style={{ marginTop: 2 }}>Authorized Google accounts with access to the dashboard.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Authorized Agent
        </button>
      </div>

      {notice && <div className="alert-banner" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>{notice}</div>}
      {errorMsg && (
        <div className="alert-banner">
          <span>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadAgents}>Retry</button>
        </div>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Google Email</th>
              <th style={{ width: 140 }}>Role</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5}><div className="state-container"><div className="spinner" /><h3>Loading agents...</h3></div></td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={5}><div className="state-container"><h3>No agents found</h3></div></td></tr>
            ) : (
              agents.map((ag) => (
                <tr key={ag.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="agent-avatar">{ag.name.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <strong>{ag.name}</strong>
                        {ag.id === user?.id && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>(You)</span>}
                      </div>
                    </div>
                  </td>
                  <td>{ag.email}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={ag.role}
                      disabled={ag.id === user?.id}
                      onChange={(e) => changeRole(ag, e.target.value as AgentRole)}
                    >
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${ag.status === 'ACTIVE' ? 'badge-resolved' : 'badge-closed'}`}>
                      {ag.status}
                    </span>
                  </td>
                  <td>
                    {ag.id !== user?.id ? (
                      <button
                        type="button"
                        className={`btn btn-sm ${ag.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => toggleStatus(ag)}
                      >
                        {ag.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current User</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="card-header">
              <h3>Authorize Support Agent</h3>
              <button type="button" className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" placeholder="Jordan Smith" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Google Login Email</label>
                <input className="form-control" type="email" placeholder="jordan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value as AgentRole)}>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name.trim() || !email.trim()}>
                  {isSubmitting ? 'Saving...' : 'Authorize'}
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
