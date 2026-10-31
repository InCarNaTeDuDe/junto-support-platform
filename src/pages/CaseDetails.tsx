import React, { useState, useEffect, useCallback } from 'react';
import { supportService } from '../services/support';
import { useAuth } from '../context/AuthContext';
import type { SupportCase, CaseStatus, CasePriority } from '../types/support';
import type { SupportAgent } from '../types/user';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ConversationPanel from '../components/ConversationPanel';

interface CaseDetailsProps {
  caseId: string;
  onBack: () => void;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId, onBack }) => {
  const { user: currentUser } = useAuth();

  const [supportCase, setSupportCase] = useState<SupportCase | null>(null);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const showNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => {
      setSuccessNotice((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const loadCase = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [caseData, agentsList] = await Promise.all([
        supportService.getCaseById(caseId),
        supportService.getAgents(),
      ]);
      setSupportCase(caseData);
      setAgents(agentsList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!supportCase || isUpdating) return;
    setIsUpdating(true);
    try {
      const updated = await supportService.updateStatus(
        supportCase.id,
        newStatus,
        currentUser?.name || 'Support Agent'
      );
      setSupportCase(updated);
      showNotice(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update case status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: CasePriority) => {
    if (!supportCase || isUpdating) return;
    setIsUpdating(true);
    try {
      const updated = await supportService.updatePriority(
        supportCase.id,
        newPriority,
        currentUser?.name || 'Support Agent'
      );
      setSupportCase(updated);
      showNotice(`Priority changed to ${newPriority}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update priority');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignChange = async (agentId: string) => {
    if (!supportCase || isUpdating) return;
    setIsUpdating(true);
    const targetId = agentId === 'UNASSIGNED' ? null : agentId;
    try {
      const updated = await supportService.assignCase(
        supportCase.id,
        targetId,
        currentUser?.name || 'Support Agent'
      );
      setSupportCase(updated);
      showNotice(targetId ? 'Case assigned successfully' : 'Case marked as unassigned');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign case');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async ({ content, isInternalNote }: { content: string; isInternalNote: boolean }) => {
    if (!supportCase || !currentUser) return;
    setIsSendingMessage(true);

    try {
      await supportService.addMessage(
        supportCase.id,
        content,
        isInternalNote,
        currentUser
      );
      // Refresh case to show latest message thread and status updates
      const updated = await supportService.getCaseById(supportCase.id);
      setSupportCase(updated);
      showNotice(isInternalNote ? 'Internal note saved' : 'Reply sent to customer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const formatDate = (iso?: string | null): string => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Bar with Back Button and Quick Case Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          flexWrap: 'wrap',
        }}
      >
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back to Cases
        </button>

        {supportCase && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* Status Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Status:
              </span>
              <select
                className="form-select"
                style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                value={supportCase.status}
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
              >
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_USER">Waiting for User</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Priority:
              </span>
              <select
                className="form-select"
                style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                value={supportCase.priority}
                disabled={isUpdating}
                onChange={(e) => handlePriorityChange(e.target.value as CasePriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Assignee:
              </span>
              <select
                className="form-select"
                style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                value={supportCase.assignedAgentId || 'UNASSIGNED'}
                disabled={isUpdating}
                onChange={(e) => handleAssignChange(e.target.value)}
              >
                <option value="UNASSIGNED">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {successNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            color: '#047857',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successNotice}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#b91c1c',
            fontSize: '0.85rem',
          }}
        >
          <span>{errorMsg}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadCase}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="card state-container">
          <div className="spinner" />
          <h3>Loading case #{caseId}...</h3>
        </div>
      ) : !supportCase ? (
        <div className="card state-container">
          <h3>Case not found</h3>
          <p>The requested support case could not be retrieved from the Junto backend.</p>
          <button className="btn btn-primary btn-sm" onClick={onBack} style={{ marginTop: 12 }}>
            Return to Cases
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Case Info Banner */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      backgroundColor: 'var(--primary-subtle)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {supportCase.caseNumber}
                  </span>
                  <StatusBadge status={supportCase.status} />
                  <PriorityBadge priority={supportCase.priority} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Created {formatDate(supportCase.createdAt)}
                </span>
              </div>

              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  lineHeight: 1.35,
                }}
              >
                {supportCase.subject}
              </h1>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                  }}
                >
                  Customer Problem Description:
                </div>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {supportCase.description}
                </p>
              </div>
            </div>

            {/* Conversation Panel */}
            <ConversationPanel
              messages={supportCase.messages || []}
              isSending={isSendingMessage}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Right Column: Customer Info & Related Entities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Customer Information Card */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  marginBottom: 14,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                Customer Information
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {supportCase.customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {supportCase.customer.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                    ★ {supportCase.customer.rating || 5.0} Junto Rating
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <span style={{ color: 'var(--text-main)', textAlign: 'right', wordBreak: 'break-all' }}>
                    {supportCase.customer.email}
                  </span>
                </div>
                {supportCase.customer.phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                    <span style={{ color: 'var(--text-main)' }}>{supportCase.customer.phone}</span>
                  </div>
                )}
                {supportCase.customer.juntoMemberSince && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                    <span style={{ color: 'var(--text-main)' }}>{supportCase.customer.juntoMemberSince}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                    {supportCase.customerId}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Junto Entity */}
            {supportCase.relatedEntity && (
              <div
                className="card"
                style={{
                  padding: '18px 20px',
                  backgroundColor: '#faf5ff',
                  borderColor: '#e9d5ff',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                    marginBottom: 14,
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  Related Junto Entity
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>
                  <span
                    style={{
                      backgroundColor: '#7e22ce',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {supportCase.relatedEntity.type}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#581c87' }}>
                    {supportCase.relatedEntity.id}
                  </span>
                </div>
                {supportCase.relatedEntity.summary && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: 12, lineHeight: 1.4 }}>
                    {supportCase.relatedEntity.summary}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    paddingTop: 10,
                    borderTop: '1px dashed #d8b4fe',
                  }}
                >
                  {supportCase.relatedEntity.amount && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: '#7e22ce' }}>Fare / Total</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>
                        {supportCase.relatedEntity.amount}
                      </span>
                    </div>
                  )}
                  {supportCase.relatedEntity.date && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: '#7e22ce' }}>Service Date</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {supportCase.relatedEntity.date}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Case Metadata */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  marginBottom: 14,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                Case Metadata
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{supportCase.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Created Date:</span>
                  <span style={{ color: 'var(--text-main)' }}>{formatDate(supportCase.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Activity:</span>
                  <span style={{ color: 'var(--text-main)' }}>{formatDate(supportCase.updatedAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Internal UUID:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-main)' }}>
                    {supportCase.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetails;
