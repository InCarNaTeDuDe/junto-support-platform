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
  const [mode, setMode] = useState<'REPLY' | 'NOTE'>('REPLY');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;
    onSendMessage({ content: content.trim(), isInternalNote: mode === 'NOTE' });
    setContent('');
  };

  const formatTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '');

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
          <div className="empty-thread"><p>No messages recorded yet for this case.</p></div>
        ) : (
          messages.map((m) => {
            if (m.senderType === 'SYSTEM') {
              return (
                <div key={m.id} className="system-message">
                  <span className="system-line" />
                  <span className="system-content">{m.message || m.content} • {formatTime(m.createdAt)}</span>
                  <span className="system-line" />
                </div>
              );
            }
            if (m.isInternalNote || m.senderType === 'INTERNAL_NOTE') {
              return (
                <div key={m.id} className="message-row internal-note-row">
                  <div className="note-box">
                    <div className="note-header">
                      <span className="note-badge">Internal Note</span>
                      <span className="author-name">{m.sender?.name || m.senderName || 'Agent'}</span>
                      <span className="message-time">{formatTime(m.createdAt)}</span>
                    </div>
                    <div className="note-body">{m.message || m.content}</div>
                  </div>
                </div>
              );
            }
            const isAgent = m.senderType === 'AGENT';
            return (
              <div key={m.id} className={`message-row ${isAgent ? 'agent-row' : 'customer-row'}`}>
                <div className="message-bubble">
                  <div className="bubble-header">
                    <span className="author-name">{m.sender?.name || m.senderName || (isAgent ? 'Agent' : 'Customer')}</span>
                    <span className="message-time">{formatTime(m.createdAt)}</span>
                  </div>
                  <div className="bubble-content">{m.message || m.content}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="composer-container">
        <div className="composer-tabs">
          <button type="button" className={`composer-tab ${mode === 'REPLY' ? 'active' : ''}`} onClick={() => setMode('REPLY')}>
            Reply to Customer
          </button>
          <button type="button" className={`composer-tab tab-note ${mode === 'NOTE' ? 'active' : ''}`} onClick={() => setMode('NOTE')}>
            Add Internal Note
          </button>
        </div>

        {mode === 'NOTE' && (
          <div className="note-alert">
            <span>This note is private and only visible to authorized support agents.</span>
          </div>
        )}

        <form className="composer-form" onSubmit={handleSubmit}>
          <textarea
            className={`composer-textarea ${mode === 'NOTE' ? 'note-textarea' : ''}`}
            placeholder={mode === 'REPLY' ? 'Type reply to customer...' : 'Write private internal note...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
          />
          <div className="composer-footer">
            <div className="composer-tips">
              <span>{mode === 'REPLY' ? 'Sent to customer chat' : 'Hidden from customer'}</span>
            </div>
            <button
              type="submit"
              className={`btn ${mode === 'NOTE' ? 'btn-secondary btn-note-submit' : 'btn-primary'}`}
              disabled={!content.trim() || isSending}
            >
              {isSending ? 'Sending...' : mode === 'REPLY' ? 'Send Reply' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConversationPanel;
