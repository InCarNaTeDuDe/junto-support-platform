<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SupportCaseMessage } from '../types/support';

  export let messages: SupportCaseMessage[] = [];
  export let isSending: boolean = false;

  let mode: 'REPLY' | 'NOTE' = 'REPLY';
  let content: string = '';

  const dispatch = createEventDispatcher<{
    sendMessage: { content: string; isInternalNote: boolean };
  }>();

  function handleSubmit() {
    if (!content.trim() || isSending) return;
    dispatch('sendMessage', {
      content: content.trim(),
      isInternalNote: mode === 'NOTE',
    });
    content = '';
  }

  function formatTime(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], {
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
      {#each messages as m (m.id)}
        {#if m.senderType === 'SYSTEM'}
          <div class="system-message">
            <span class="system-line"></span>
            <span class="system-content">{m.message || m.content} • {formatTime(m.createdAt)}</span>
            <span class="system-line"></span>
          </div>
        {:else if m.isInternalNote || m.senderType === 'INTERNAL_NOTE'}
          <div class="message-row internal-note-row">
            <div class="note-box">
              <div class="note-header">
                <span class="note-badge">Internal Note</span>
                <span class="author-name">{m.sender?.name || m.senderName || 'Agent'}</span>
                <span class="message-time">{formatTime(m.createdAt)}</span>
              </div>
              <div class="note-body">{m.message || m.content}</div>
            </div>
          </div>
        {:else}
          {@const isAgent = m.senderType === 'AGENT'}
          <div class="message-row {isAgent ? 'agent-row' : 'customer-row'}">
            <div class="message-bubble">
              <div class="bubble-header">
                <span class="author-name">
                  {m.sender?.name || m.senderName || (isAgent ? 'Agent' : 'Customer')}
                </span>
                <span class="message-time">{formatTime(m.createdAt)}</span>
              </div>
              <div class="bubble-content">{m.message || m.content}</div>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>

  <div class="composer-container">
    <div class="composer-tabs">
      <button
        type="button"
        class="composer-tab {mode === 'REPLY' ? 'active' : ''}"
        on:click={() => (mode = 'REPLY')}
      >
        Reply to Customer
      </button>
      <button
        type="button"
        class="composer-tab tab-note {mode === 'NOTE' ? 'active' : ''}"
        on:click={() => (mode = 'NOTE')}
      >
        Add Internal Note
      </button>
    </div>

    {#if mode === 'NOTE'}
      <div class="note-alert">
        <span>This note is private and only visible to authorized support agents.</span>
      </div>
    {/if}

    <form class="composer-form" on:submit|preventDefault={handleSubmit}>
      <textarea
        class="composer-textarea {mode === 'NOTE' ? 'note-textarea' : ''}"
        placeholder={mode === 'REPLY' ? 'Type reply to customer...' : 'Write private internal note...'}
        bind:value={content}
        rows="3"
        required
      ></textarea>
      <div class="composer-footer">
        <div class="composer-tips">
          <span>{mode === 'REPLY' ? 'Sent to customer chat' : 'Hidden from customer'}</span>
        </div>
        <button
          type="submit"
          class="btn {mode === 'NOTE' ? 'btn-secondary btn-note-submit' : 'btn-primary'}"
          disabled={!content.trim() || isSending}
        >
          {isSending ? 'Sending...' : mode === 'REPLY' ? 'Send Reply' : 'Add Note'}
        </button>
      </div>
    </form>
  </div>
</div>
