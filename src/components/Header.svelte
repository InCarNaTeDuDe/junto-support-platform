<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { API_BASE_URL } from '../services/api';

  export let title: string = 'Dashboard';
  export let isBackendConnected: boolean = true;

  let query: string = '';

  const dispatch = createEventDispatcher<{
    toggleSidebar: void;
    quickSearch: string;
    refresh: void;
  }>();

  function handleSubmit() {
    if (query.trim()) {
      dispatch('quickSearch', query.trim());
    }
  }

  function handleToggleSidebar() {
    dispatch('toggleSidebar');
  }

  function handleRefresh() {
    dispatch('refresh');
  }
</script>

<header class="top-header">
  <div class="header-left">
    <button
      type="button"
      on:click={handleToggleSidebar}
      aria-label="Toggle navigation"
      class="menu-toggle-btn"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    <div class="title-wrap">
      <h1 class="header-title">{title}</h1>
      <span class="header-subtitle">Junto Support Dashboard</span>
    </div>
  </div>

  <div class="header-right">
    <div class="api-status-badge" title="API: {API_BASE_URL}">
      <span class="status-pulse {isBackendConnected ? 'connected' : ''}"></span>
      <span>{isBackendConnected ? 'Connected' : 'Offline'}</span>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="search-form">
      <input
        type="text"
        placeholder="Search case #..."
        bind:value={query}
        class="search-input"
      />
    </form>

    <button
      type="button"
      class="btn btn-secondary btn-sm sync-btn"
      on:click={handleRefresh}
      title="Sync data"
    >
      Sync
    </button>
  </div>
</header>
