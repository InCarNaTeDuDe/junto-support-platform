import React, { useEffect, useState, useCallback } from 'react';
import { supportService } from '../services/support';
import { useAuth } from '../context/AuthContext';
import type { SupportCase, CaseStatus, CasePriority } from '../types/support';
import type { SupportAgent } from '../types/user';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ConversationPanel } from '../components/ConversationPanel';

interface CaseDetailsProps {
  caseId: string;
  onBack: () => void;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId, onBack }) => {
  const { user } = useAuth();

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
      const updated = await supportService.updateStatus(supportCase.id, newStatus);
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
      const updated = await supportService.updatePriority(supportCase.id, newPriority);
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
      const updated = await supportService.assignCase(supportCase.id, targetId);
      setSupportCase(updated);
      showNotice(targetId ? 'Case assigned successfully' : 'Case marked as unassigned');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign case');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async (payload: { content: string; isInternalNote: boolean }) => {
    if (!supportCase || !user) return;
    setIsSendingMessage(true);

    try {
      await supportService.addMessage(supportCase.id, payload.content, payload.isInternalNote, user);
      const updatedCase = await supportService.getCaseById(supportCase.id);
      setSupportCase(updatedCase);
      showNotice(payload.isInternalNote ? 'Internal note saved' : 'Reply sent to customer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const formatDate = (iso?: string): string => {
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
    <div className="case-details-page">
      {/* Top Bar with Back Button and Quick Case Actions */}
      <div className="case-header-nav">
        <button type="button" className="btn btn-secondary btn-sm back-btn" onClick={onBack}>
          ← Back to Cases
        </button>

        {supportCase && (
          <div className="header-actions">
            {/* Status Selector */}
            <div className="action-control">
              <span className="control-label">Status:</span>
              <select
                className="form-select form-select-sm"
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
            <div className="action-control">
              <span className="control-label">Priority:</span>
              <select
                className="form-select form-select-sm"
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
            <div className="action-control">
              <span className="control-label">Assignee:</span>
              <select
                className="form-select form-select-sm"
                value={supportCase.assignedAgentId || 'UNASSIGNED'}
                disabled={isUpdating}
                onChange={(e) => handleAssignChange(e.target.value)}
              >
                <option value="UNASSIGNED">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
        <div className="error-banner">
          <span>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadCase}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="state-container card">
          <div className="spinner" />
          <h3>Loading case #{caseId}...</h3>
        </div>
      ) : !supportCase ? (
        <div className="state-container card">
          <h3>Case not found</h3>
          <p>The requested support case could not be retrieved from the Junto backend.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onBack}>
            Return to Cases
          </button>
        </div>
      ) : (
        <div className="case-grid">
          {/* Main Column */}
          <div className="main-column">
            {/* Case Information Card */}
            <div className="card case-info-card">
              <div className="case-meta-top">
                <div className="case-num-wrap">
                  <span className="case-badge">{supportCase.caseNumber}</span>
                  <StatusBadge status={supportCase.status} />
                  <PriorityBadge priority={supportCase.priority} />
                </div>
                <span className="created-time">Created {formatDate(supportCase.createdAt)}</span>
              </div>

              <h1 className="case-subject">{supportCase.subject}</h1>

              <div className="case-description-box">
                <div className="desc-label">Customer Problem Description:</div>
                <p className="desc-content">{supportCase.description}</p>
              </div>
            </div>

            {/* Conversation Panel */}
            <ConversationPanel
              messages={supportCase.messages || []}
              isSending={isSendingMessage}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Side Column */}
          <div className="side-column">
            {/* Customer Information Card */}
            <div className="card side-card">
              <h3 className="side-card-title">Customer Information</h3>
              <div className="customer-profile-box">
                <div className="customer-large-avatar">
                  {supportCase.customer?.name?.slice(0, 2).toUpperCase() || 'CU'}
                </div>
                <div className="customer-large-meta">
                  <div className="customer-large-name">{supportCase.customer?.name || 'Customer'}</div>
                  <div className="customer-rating">
                    ★ {supportCase.customer?.rating || 5.0} Junto Rating
                  </div>
                </div>
              </div>

              <div className="customer-details-list">
                <div className="detail-row">
                  <span className="detail-key">Email:</span>
                  <span className="detail-val">{supportCase.customer?.email}</span>
                </div>
                {supportCase.customer?.phone && (
                  <div className="detail-row">
                    <span className="detail-key">Phone:</span>
                    <span className="detail-val">{supportCase.customer?.phone}</span>
                  </div>
                )}
                {supportCase.customer?.juntoMemberSince && (
                  <div className="detail-row">
                    <span className="detail-key">Member Since:</span>
                    <span className="detail-val">{supportCase.customer?.juntoMemberSince}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-key">User ID:</span>
                  <span className="detail-val font-mono">{supportCase.customerId || supportCase.customer?.id}</span>
                </div>
              </div>
            </div>

            {/* Related Junto Entity */}
            {supportCase.relatedEntity && (
              <div className="card side-card entity-card">
                <h3 className="side-card-title">Related Junto Entity</h3>
                <div className="entity-badge">
                  <span className="entity-type">{supportCase.relatedEntity.type}</span>
                  <span className="entity-id">{supportCase.relatedEntity.id}</span>
                </div>
                {supportCase.relatedEntity.summary && (
                  <div className="entity-summary">{supportCase.relatedEntity.summary}</div>
                )}
                <div className="entity-props">
                  {supportCase.relatedEntity.amount && (
                    <div className="prop-item">
                      <span className="prop-label">Fare / Total</span>
                      <span className="prop-value font-bold">{supportCase.relatedEntity.amount}</span>
                    </div>
                  )}
                  {supportCase.relatedEntity.date && (
                    <div className="prop-item">
                      <span className="prop-label">Service Date</span>
                      <span className="prop-value">{supportCase.relatedEntity.date}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Case Metadata */}
            <div className="card side-card">
              <h3 className="side-card-title">Case Metadata</h3>
              <div className="customer-details-list">
                <div className="detail-row">
                  <span className="detail-key">Category:</span>
                  <span className="detail-val font-bold">{supportCase.category}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Created Date:</span>
                  <span className="detail-val">{formatDate(supportCase.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Last Activity:</span>
                  <span className="detail-val">{formatDate(supportCase.updatedAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Internal UUID:</span>
                  <span className="detail-val font-mono font-xs">{supportCase.id}</span>
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
