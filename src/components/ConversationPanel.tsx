import React, { useState } from 'react';
import type { SupportCaseMessage } from '../types/support';

interface ConversationPanelProps {
  messages: SupportCaseMessage[];
  isSending?: boolean;
  onSendMessage: (data: { content: string; isInternalNote: boolean }) => void;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages = [],
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Case Conversation</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 520,
          overflowY: 'auto',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
            <p>No messages recorded yet for this case.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const text = msg.message || msg.content || '';

            if (msg.senderType === 'SYSTEM') {
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '8px 0',
                  }}
                >
                  <span style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {text} • {formatTime(msg.createdAt)}
                  </span>
                  <span style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                </div>
              );
            }

            if (msg.isInternalNote || msg.senderType === 'INTERNAL_NOTE') {
              return (
                <div key={msg.id} style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--note-bg)',
                      border: '1px solid var(--note-border)',
                      borderLeft: '4px solid #d97706',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--note-text)',
                          backgroundColor: '#fef3c7',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Internal Note (Agents Only)
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {msg.sender?.name || msg.senderName || 'Support Agent'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.86rem',
                        color: 'var(--note-text)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {text}
                    </div>
                  </div>
                </div>
              );
            }

            const isAgent = msg.senderType === 'AGENT';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: isAgent ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    backgroundColor: isAgent ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${isAgent ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                    borderBottomRightRadius: isAgent ? 'var(--radius-sm)' : 'var(--radius-lg)',
                    borderBottomLeftRadius: !isAgent ? 'var(--radius-sm)' : 'var(--radius-lg)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {msg.sender?.name || msg.senderName || (isAgent ? 'Support Agent' : 'Customer')}
                      {isAgent && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--primary)',
                            color: '#ffffff',
                            padding: '1px 6px',
                            borderRadius: 3,
                          }}
                        >
                          Support Agent
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Composer */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              backgroundColor: messageMode === 'REPLY' ? 'var(--primary)' : 'var(--bg-subtle)',
              color: messageMode === 'REPLY' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: messageMode === 'REPLY' ? 'var(--primary)' : 'var(--border-subtle)',
            }}
            onClick={() => setMessageMode('REPLY')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Reply to Customer
          </button>

          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              backgroundColor: messageMode === 'NOTE' ? '#d97706' : 'var(--bg-subtle)',
              color: messageMode === 'NOTE' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: messageMode === 'NOTE' ? '#d97706' : 'var(--border-subtle)',
            }}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 10,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>This note is private. The customer in the Junto mobile app will never see this.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            className="form-textarea"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.875rem',
              backgroundColor: messageMode === 'NOTE' ? '#fffdf7' : 'var(--bg-surface)',
              borderColor: messageMode === 'NOTE' ? '#fde68a' : 'var(--border-subtle)',
              minHeight: 85,
            }}
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {messageMode === 'REPLY' ? (
                <span>Customer will receive notification in Junto Support Chat.</span>
              ) : (
                <span style={{ color: '#b45309', fontWeight: 500 }}>
                  Visible strictly to authorized Support Agents & Owners.
                </span>
              )}
            </div>

            <button
              type="submit"
              className={`btn ${messageMode === 'NOTE' ? 'btn-secondary' : 'btn-primary'}`}
              style={
                messageMode === 'NOTE'
                  ? { backgroundColor: '#d97706', color: '#ffffff', borderColor: '#d97706' }
                  : undefined
              }
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
