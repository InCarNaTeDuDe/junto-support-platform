<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { API_BASE_URL } from '../services/api';

  export let title: string = 'Dashboard';
  export let subtitle: string = '';
  export let isBackendConnected: boolean = true;

  const dispatch = createEventDispatcher<{
    refresh: void;
    quickSearch: string;
    toggleSidebar: void;
  }>();

  let searchQuery = '';

  function handleSearchSubmit() {
    if (searchQuery.trim()) {
      dispatch('quickSearch', searchQuery.trim());
    }
  }
</script>

<header class="top-header">
  <div class="header-left">
    <!-- Hamburger button visible on mobile/tablet -->
    <button
      type="button"
      class="menu-toggle-btn"
      aria-label="Toggle navigation"
      on:click={() => dispatch('toggleSidebar')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <div class="title-wrap">
      <h1 class="header-title">{title}</h1>
      {#if subtitle}
        <span class="header-subtitle">{subtitle}</span>
      {/if}
    </div>
  </div>

  <div class="header-right">
    <div class="api-status-badge" title="API: {API_BASE_URL}">
      <span class="status-pulse" class:connected={isBackendConnected}></span>
      <span class="status-label">{isBackendConnected ? 'Connected' : 'Offline'}</span>
    </div>

    <form class="search-form" on:submit|preventDefault={handleSearchSubmit}>
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search case #..."
        bind:value={searchQuery}
        class="search-input"
      />
    </form>

    <button class="btn btn-secondary btn-sm sync-btn" on:click={() => dispatch('refresh')} title="Sync data">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
      </svg>
      <span class="sync-text">Sync</span>
    </button>
  </div>
</header>

<style>
  .top-header {
    height: 56px;
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .menu-toggle-btn {
    display: none;
    background: transparent;
    border: none;
    color: var(--text-main);
    padding: 6px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .menu-toggle-btn:hover {
    background-color: var(--bg-subtle);
  }

  .title-wrap {
    display: flex;
    align-items: baseline;
    gap: 8px;
    overflow: hidden;
    white-space: nowrap;
  }

  .header-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-subtitle {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .api-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .status-pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #f59e0b;
  }

  .status-pulse.connected {
    background-color: #10b981;
  }

  .search-form {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 8px;
    width: 14px;
    height: 14px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    padding: 4px 8px 4px 28px;
    font-size: 0.78rem;
    font-family: var(--font-sans);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    background-color: var(--bg-subtle);
    color: var(--text-main);
    width: 150px;
    outline: none;
    transition: width 0.15s, border-color 0.15s;
  }

  .search-input:focus {
    width: 200px;
    background-color: var(--bg-surface);
    border-color: var(--border-focus);
  }

  .sync-btn {
    padding: 4px 10px;
    font-size: 0.78rem;
  }

  @media (max-width: 768px) {
    .menu-toggle-btn {
      display: inline-flex;
    }
    .header-subtitle {
      display: none;
    }
    .api-status-badge {
      display: none;
    }
    .search-input {
      width: 110px;
    }
    .search-input:focus {
      width: 140px;
    }
    .sync-text {
      display: none;
    }
  }
</style>
