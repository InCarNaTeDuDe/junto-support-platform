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
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((p) => (p === msg ? '' : p)), 3500);
  };

  const loadCase = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [c, ags] = await Promise.all([
        supportService.getCaseById(caseId),
        supportService.getAgents(),
      ]);
      setSupportCase(c);
      setAgents(ags);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load case');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadCase(); }, [loadCase]);

  const updateField = async (fn: () => Promise<SupportCase>, successText: string) => {
    if (!supportCase || isUpdating) return;
    setIsUpdating(true);
    try {
      setSupportCase(await fn());
      flash(successText);
    } catch (err: any) {
      setErrorMsg(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async ({ content, isInternalNote }: { content: string; isInternalNote: boolean }) => {
    if (!supportCase || !user) return;
    setIsSending(true);
    try {
      await supportService.addMessage(supportCase.id, content, isInternalNote, user);
      setSupportCase(await supportService.getCaseById(supportCase.id));
      flash(isInternalNote ? 'Internal note added' : 'Reply sent to user');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="case-header-nav">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>← Back to Cases</button>
        {supportCase && (
          <div className="header-actions">
            <div className="action-control">
              <span className="control-label">Status:</span>
              <select
                className="form-select form-select-sm"
                value={supportCase.status}
                disabled={isUpdating}
                onChange={(e) => updateField(() => supportService.updateStatus(supportCase.id, e.target.value as CaseStatus), `Status updated to ${e.target.value}`)}
              >
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_USER">Waiting for User</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="action-control">
              <span className="control-label">Priority:</span>
              <select
                className="form-select form-select-sm"
                value={supportCase.priority}
                disabled={isUpdating}
                onChange={(e) => updateField(() => supportService.updatePriority(supportCase.id, e.target.value as CasePriority), `Priority set to ${e.target.value}`)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="action-control">
              <span className="control-label">Assignee:</span>
              <select
                className="form-select form-select-sm"
                value={supportCase.assignedAgentId || 'UNASSIGNED'}
                disabled={isUpdating}
                onChange={(e) => updateField(() => supportService.assignCase(supportCase.id, e.target.value === 'UNASSIGNED' ? null : e.target.value), 'Assignee updated')}
              >
                <option value="UNASSIGNED">Unassigned</option>
                {agents.map((ag) => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {notice && <div className="alert-banner" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>{notice}</div>}
      {errorMsg && (
        <div className="alert-banner">
          <span>{errorMsg}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadCase}>Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="card state-container"><div className="spinner" /><h3>Loading case #{caseId}...</h3></div>
      ) : !supportCase ? (
        <div className="card state-container"><h3>Case not found</h3><button type="button" className="btn btn-primary btn-sm" onClick={onBack}>Back to Cases</button></div>
      ) : (
        <div className="case-grid">
          <div className="main-column">
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
              {supportCase.description && (
                <div className="case-description-box">
                  <div className="desc-label">Customer Description:</div>
                  <p className="desc-content">{supportCase.description}</p>
                </div>
              )}
            </div>

            <ConversationPanel messages={supportCase.messages || []} isSending={isSending} onSendMessage={handleSendMessage} />
          </div>

          <div className="side-column">
            <div className="card side-card">
              <h3 className="side-card-title">Customer Information</h3>
              <div className="customer-profile-box">
                <div className="customer-large-avatar">{supportCase.customer?.name?.slice(0, 2).toUpperCase() || 'CU'}</div>
                <div className="customer-large-meta">
                  <div className="customer-large-name">{supportCase.customer?.name || 'Customer'}</div>
                  <div className="customer-rating">★ {supportCase.customer?.rating ?? 5.0} Rating</div>
                </div>
              </div>
              <div className="customer-details-list">
                <div className="detail-row"><span className="detail-key">Email:</span><span className="detail-val">{supportCase.customer?.email}</span></div>
                {supportCase.customer?.phone && <div className="detail-row"><span className="detail-key">Phone:</span><span className="detail-val">{supportCase.customer.phone}</span></div>}
              </div>
            </div>

            {supportCase.relatedEntity && (
              <div className="card side-card entity-card">
                <h3 className="side-card-title">Related Junto Entity</h3>
                <div className="entity-badge">
                  <span className="entity-type">{supportCase.relatedEntity.type}</span>
                  <span className="entity-id">{supportCase.relatedEntity.id}</span>
                </div>
                {supportCase.relatedEntity.summary && <div className="entity-summary">{supportCase.relatedEntity.summary}</div>}
              </div>
            )}

            <div className="card side-card">
              <h3 className="side-card-title">Metadata</h3>
              <div className="customer-details-list">
                <div className="detail-row"><span className="detail-key">Category:</span><span className="detail-val font-bold">{supportCase.category}</span></div>
                <div className="detail-row"><span className="detail-key">Last Activity:</span><span className="detail-val">{formatDate(supportCase.updatedAt)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetails;
