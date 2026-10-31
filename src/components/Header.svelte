<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { API_BASE_URL } from '../services/api';

  export let title: string = 'Dashboard';
  export let subtitle: string = '';
  export let isBackendConnected: boolean = true;

  const dispatch = createEventDispatcher<{
    refresh: void;
    quickSearch: string;
  }>();

  let searchQuery = '';

  function handleSearchSubmit() {
    if (searchQuery.trim()) {
      dispatch('quickSearch', searchQuery.trim());
    }
  }

  function handleRefresh() {
    dispatch('refresh');
  }
</script>

<header class="top-header">
  <div class="header-left">
    <div class="title-wrap">
      <h1 class="header-title">{title}</h1>
      {#if subtitle}
        <p class="header-subtitle">{subtitle}</p>
      {/if}
    </div>
  </div>

  <div class="header-right">
    <!-- Backend Connection Indicator -->
    <div class="api-status-badge" title="API Base: {API_BASE_URL}">
      <span class="status-pulse" class:connected={isBackendConnected}></span>
      <span class="status-label">
        {isBackendConnected ? 'Junto API Live' : 'Offline / Standalone'}
      </span>
    </div>

    <!-- Quick Search Input -->
    <form class="search-form" on:submit|preventDefault={handleSearchSubmit}>
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search case # or customer..."
        bind:value={searchQuery}
        class="search-input"
      />
    </form>

    <!-- Refresh Button -->
    <button class="btn btn-secondary btn-sm refresh-btn" on:click={handleRefresh} title="Refresh case data">
      <svg class="icon-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
      </svg>
      <span>Sync</span>
    </button>
  </div>
</header>

<style>
  .top-header {
    height: 64px;
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .header-subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .api-status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .status-pulse {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: #f59e0b;
  }

  .status-pulse.connected {
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  .search-form {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    width: 15px;
    height: 15px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    padding: 6px 12px 6px 32px;
    font-size: 0.8rem;
    font-family: var(--font-sans);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    background-color: var(--bg-subtle);
    color: var(--text-main);
    width: 220px;
    outline: none;
    transition: width 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
  }

  .search-input:focus {
    width: 280px;
    background-color: var(--bg-surface);
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .icon-refresh {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 768px) {
    .top-header {
      padding: 0 16px;
      height: auto;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding-top: 12px;
      padding-bottom: 12px;
    }
    .header-right {
      width: 100%;
      justify-content: space-between;
    }
    .search-input {
      width: 160px;
    }
    .search-input:focus {
      width: 180px;
    }
  }
</style>
