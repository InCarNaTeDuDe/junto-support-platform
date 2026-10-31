<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CaseMessage } from '../types/support';

  export let messages: CaseMessage[] = [];
  export let isSending: boolean = false;

  const dispatch = createEventDispatcher<{
    sendMessage: { content: string; isInternalNote: boolean };
  }>();

  let messageMode: 'REPLY' | 'NOTE' = 'REPLY';
  let messageContent = '';

  function handleSubmit() {
    if (!messageContent.trim() || isSending) return;

    dispatch('sendMessage', {
      content: messageContent.trim(),
      isInternalNote: messageMode === 'NOTE',
    });

    messageContent = '';
  }

  function formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<div class="conversation-panel">
  <div class="thread-header">
    <div class="thread-title">
      <h3>Case Conversation</h3>
      <span class="thread-count">{messages.length} messages</span>
    </div>
  </div>

  <div class="messages-container">
    {#if messages.length === 0}
      <div class="empty-thread">
        <p>No messages recorded yet for this case.</p>
      </div>
    {:else}
      {#each messages as msg (msg.id)}
        {#if msg.senderType === 'SYSTEM'}
          <div class="system-message">
            <span class="system-line"></span>
            <span class="system-content">{msg.content} • {formatTime(msg.createdAt)}</span>
            <span class="system-line"></span>
          </div>
        {:else if msg.senderType === 'INTERNAL_NOTE'}
          <div class="message-row internal-note-row">
            <div class="note-box">
              <div class="note-header">
                <span class="note-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Internal Note (Agents Only)
                </span>
                <span class="author-name">{msg.senderName} ({msg.senderRole || 'Agent'})</span>
                <span class="message-time">{formatTime(msg.createdAt)}</span>
              </div>
              <div class="note-body">
                {msg.content}
              </div>
            </div>
          </div>
        {:else}
          <!-- CUSTOMER or AGENT Message -->
          <div
            class="message-row"
            class:customer-row={msg.senderType === 'CUSTOMER'}
            class:agent-row={msg.senderType === 'AGENT'}
          >
            <div class="message-bubble">
              <div class="bubble-header">
                <span class="author-name">
                  {msg.senderName}
                  {#if msg.senderType === 'AGENT'}
                    <span class="agent-tag">Support Agent</span>
                  {/if}
                </span>
                <span class="message-time">{formatTime(msg.createdAt)}</span>
              </div>
              <div class="bubble-content">
                {msg.content}
              </div>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>

  <!-- Message Composer -->
  <div class="composer-container">
    <div class="composer-tabs">
      <button
        type="button"
        class="composer-tab"
        class:active={messageMode === 'REPLY'}
        on:click={() => (messageMode = 'REPLY')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Reply to Customer
      </button>

      <button
        type="button"
        class="composer-tab tab-note"
        class:active={messageMode === 'NOTE'}
        on:click={() => (messageMode = 'NOTE')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Add Internal Note
      </button>
    </div>

    {#if messageMode === 'NOTE'}
      <div class="note-alert">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>This note is private. The customer in the Junto mobile app will never see this.</span>
      </div>
    {/if}

    <form class="composer-form" on:submit|preventDefault={handleSubmit}>
      <textarea
        class="composer-textarea"
        class:note-textarea={messageMode === 'NOTE'}
        placeholder={messageMode === 'REPLY'
          ? 'Type your response to the customer...'
          : 'Write an internal note for authorized Junto agents...'}
        bind:value={messageContent}
        rows="4"
        required
      ></textarea>

      <div class="composer-footer">
        <div class="composer-tips">
          {#if messageMode === 'REPLY'}
            <span>Customer will receive notification in Junto Support Chat.</span>
          {:else}
            <span class="warning-tip">Visible strictly to authorized Support Agents & Owners.</span>
          {/if}
        </div>

        <button
          type="submit"
          class="btn {messageMode === 'NOTE' ? 'btn-secondary btn-note-submit' : 'btn-primary'}"
          disabled={!messageContent.trim() || isSending}
        >
          {#if isSending}
            Sending...
          {:else if messageMode === 'REPLY'}
            Send Reply
          {:else}
            Add Note
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .conversation-panel {
    display: flex;
    flex-direction: column;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .thread-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle);
    background-color: var(--bg-subtle);
  }

  .thread-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .thread-title h3 {
    font-size: 1rem;
    font-weight: 600;
  }

  .thread-count {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .messages-container {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 520px;
    overflow-y: auto;
    background-color: var(--bg-app);
  }

  .empty-thread {
    text-align: center;
    padding: 30px;
    color: var(--text-muted);
  }

  /* System Message */
  .system-message {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
  }

  .system-line {
    flex: 1;
    height: 1px;
    background-color: var(--border-subtle);
  }

  .system-content {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  /* Message Rows */
  .message-row {
    display: flex;
    width: 100%;
  }

  .customer-row {
    justify-content: flex-start;
  }

  .agent-row {
    justify-content: flex-end;
  }

  .message-bubble {
    max-width: 82%;
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .customer-row .message-bubble {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-bottom-left-radius: var(--radius-sm);
  }

  .agent-row .message-bubble {
    background-color: var(--primary-subtle);
    border: 1px solid var(--primary-border);
    border-bottom-right-radius: var(--radius-sm);
  }

  .bubble-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }

  .author-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .agent-tag {
    font-size: 0.65rem;
    font-weight: 700;
    background-color: var(--primary);
    color: #ffffff;
    padding: 1px 6px;
    border-radius: 3px;
  }

  .message-time {
    font-size: 0.7rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .bubble-content {
    font-size: 0.88rem;
    color: var(--text-main);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Internal Note */
  .internal-note-row {
    justify-content: center;
  }

  .note-box {
    width: 100%;
    background-color: var(--note-bg);
    border: 1px solid var(--note-border);
    border-left: 4px solid #d97706;
    border-radius: var(--radius-md);
    padding: 12px 16px;
  }

  .note-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .note-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--note-text);
    background-color: #fef3c7;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
  }

  .note-body {
    font-size: 0.86rem;
    color: var(--note-text);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Composer */
  .composer-container {
    border-top: 1px solid var(--border-subtle);
    padding: 16px 20px;
    background-color: var(--bg-surface);
  }

  .composer-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .composer-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 0.8rem;
    font-weight: 500;
    font-family: var(--font-sans);
    background-color: var(--bg-subtle);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.12s;
  }

  .composer-tab.active {
    background-color: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }

  .tab-note.active {
    background-color: #d97706;
    border-color: #d97706;
    color: #ffffff;
  }

  .note-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #fef3c7;
    color: #92400e;
    font-size: 0.75rem;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    margin-bottom: 10px;
  }

  .composer-textarea {
    width: 100%;
    padding: 10px 14px;
    font-size: 0.875rem;
    font-family: var(--font-sans);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    outline: none;
    resize: vertical;
    min-height: 85px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .composer-textarea:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .note-textarea {
    background-color: #fffdf7;
    border-color: #fde68a;
  }

  .note-textarea:focus {
    border-color: #d97706;
    box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.15);
  }

  .composer-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }

  .composer-tips {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .warning-tip {
    color: #b45309;
    font-weight: 500;
  }

  .btn-note-submit {
    background-color: #d97706;
    color: #ffffff;
    border-color: #d97706;
  }

  .btn-note-submit:hover:not(:disabled) {
    background-color: #b45309;
  }
</style>
