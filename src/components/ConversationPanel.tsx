import React, { useState } from 'react';
import type { SupportCaseMessage } from '../types/support';

interface ConversationPanelProps {
  messages: SupportCaseMessage[];
  isSending?: boolean;
  onSendMessage: (payload: { content: string; isInternalNote: boolean }) => void;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  isSending = false,
  onSendMessage,
}) => {
  const [messageMode, setMessageMode] = useState<'REPLY' | 'NOTE'>('REPLY');
  const [messageContent, setMessageContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || isSending) return;

    onSendMessage({
      content: messageContent.trim(),
      isInternalNote: messageMode === 'NOTE',
    });
    setMessageContent('');
  };

  const formatTime = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="conversation-panel">
      <div className="thread-header">
        <div className="thread-title">
          <h3>Case Conversation</h3>
          <span className="thread-count">{messages.length} messages</span>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-thread">
            <p>No messages recorded yet for this case.</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.senderType === 'SYSTEM') {
              return (
                <div key={msg.id} className="system-message">
                  <span className="system-line" />
                  <span className="system-content">
                    {msg.message || msg.content} • {formatTime(msg.createdAt)}
                  </span>
                  <span className="system-line" />
                </div>
              );
            }

            if (msg.isInternalNote || msg.senderType === 'INTERNAL_NOTE') {
              return (
                <div key={msg.id} className="message-row internal-note-row">
                  <div className="note-box">
                    <div className="note-header">
                      <span className="note-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Internal Note (Agents Only)
                      </span>
                      <span className="author-name">
                        {msg.sender?.name || msg.senderName || 'Support Agent'}
                      </span>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    </div>
                    <div className="note-body">{msg.message || msg.content}</div>
                  </div>
                </div>
              );
            }

            const isAgent = msg.senderType === 'AGENT';

            return (
              <div
                key={msg.id}
                className={`message-row ${isAgent ? 'agent-row' : 'customer-row'}`}
              >
                <div className="message-bubble">
                  <div className="bubble-header">
                    <span className="author-name">
                      {msg.sender?.name || msg.senderName || (isAgent ? 'Support Agent' : 'Customer')}
                      {isAgent && <span className="agent-tag">Support Agent</span>}
                    </span>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className="bubble-content">{msg.message || msg.content}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="composer-container">
        <div className="composer-tabs">
          <button
            type="button"
            className={`composer-tab ${messageMode === 'REPLY' ? 'active' : ''}`}
            onClick={() => setMessageMode('REPLY')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Reply to Customer
          </button>

          <button
            type="button"
            className={`composer-tab tab-note ${messageMode === 'NOTE' ? 'active' : ''}`}
            onClick={() => setMessageMode('NOTE')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Add Internal Note
          </button>
        </div>

        {messageMode === 'NOTE' && (
          <div className="note-alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>This note is private. The customer in the Junto mobile app will never see this.</span>
          </div>
        )}

        <form className="composer-form" onSubmit={handleSubmit}>
          <textarea
            className={`composer-textarea ${messageMode === 'NOTE' ? 'note-textarea' : ''}`}
            placeholder={
              messageMode === 'REPLY'
                ? 'Type your response to the customer...'
                : 'Write an internal note for authorized Junto agents...'
            }
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={4}
            required
          />

          <div className="composer-footer">
            <div className="composer-tips">
              {messageMode === 'REPLY' ? (
                <span>Customer will receive notification in Junto Support Chat.</span>
              ) : (
                <span className="warning-tip">Visible strictly to authorized Support Agents & Owners.</span>
              )}
            </div>

            <button
              type="submit"
              className={`btn ${messageMode === 'NOTE' ? 'btn-secondary btn-note-submit' : 'btn-primary'}`}
              disabled={!messageContent.trim() || isSending}
            >
              {isSending ? 'Sending...' : messageMode === 'REPLY' ? 'Send Reply' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConversationPanel;
