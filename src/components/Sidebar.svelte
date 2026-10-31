<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth';

  export let activePage: string = 'dashboard';
  export let unassignedCount: number = 0;
  export let criticalCount: number = 0;
  export let isOpenMobile: boolean = false;

  const dispatch = createEventDispatcher<{
    navigate: string;
    logout: void;
    closeMobile: void;
  }>();

  $: user = $authStore.user;
  $: isOwner = $authStore.role === 'OWNER';

  function navigate(page: string) {
    dispatch('navigate', page);
    dispatch('closeMobile');
  }
</script>

<!-- Mobile backdrop -->
{#if isOpenMobile}
  <div
    class="sidebar-backdrop"
    on:click={() => dispatch('closeMobile')}
    on:keydown={(e) => e.key === 'Escape' && dispatch('closeMobile')}
    tabindex="0"
    role="button"
    aria-label="Close sidebar"
  ></div>
{/if}

<aside class="sidebar" class:open-mobile={isOpenMobile}>
  <div class="sidebar-brand">
    <div class="brand-identity">
      <div class="brand-icon">J</div>
      <div class="brand-text">
        <span class="brand-name">Junto</span>
        <span class="brand-sub">Support</span>
      </div>
    </div>

    <!-- Mobile Close button -->
    <button
      type="button"
      class="close-drawer-btn"
      on:click={() => dispatch('closeMobile')}
      aria-label="Close menu"
    >
      ✕
    </button>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-label">Cases</div>

    <button
      class="nav-item"
      class:active={activePage === 'dashboard'}
      on:click={() => navigate('dashboard')}
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="9" rx="1"/>
        <rect x="14" y="3" width="7" height="5" rx="1"/>
        <rect x="14" y="12" width="7" height="9" rx="1"/>
        <rect x="3" y="16" width="7" height="5" rx="1"/>
      </svg>
      <span>Dashboard</span>
    </button>

    <button
      class="nav-item"
      class:active={activePage === 'cases_all'}
      on:click={() => navigate('cases_all')}
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <span>All Cases</span>
      {#if criticalCount > 0}
        <span class="pill pill-warn">{criticalCount}</span>
      {/if}
    </button>

    <button
      class="nav-item"
      class:active={activePage === 'cases_my'}
      on:click={() => navigate('cases_my')}
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span>My Cases</span>
    </button>

    <button
      class="nav-item"
      class:active={activePage === 'cases_unassigned'}
      on:click={() => navigate('cases_unassigned')}
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>Unassigned</span>
      {#if unassignedCount > 0}
        <span class="pill pill-danger">{unassignedCount}</span>
      {/if}
    </button>

    <button
      class="nav-item"
      class:active={activePage === 'cases_resolved'}
      on:click={() => navigate('cases_resolved')}
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <span>Resolved</span>
    </button>

    {#if isOwner}
      <div class="nav-label mt-4">Admin</div>
      <button
        class="nav-item"
        class:active={activePage === 'agents'}
        on:click={() => navigate('agents')}
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Agents</span>
        <span class="pill pill-owner">Owner</span>
      </button>
    {/if}
  </nav>

  <div class="sidebar-footer">
    {#if user}
      <div class="user-info">
        <div class="avatar">{user.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}</div>
        <div class="user-meta">
          <div class="user-name" title={user.name}>{user.name}</div>
          <span class="role-badge" class:owner={user.role === 'OWNER'}>{user.role}</span>
        </div>
      </div>
    {/if}

    <button class="btn btn-secondary btn-sm logout-btn" on:click={() => dispatch('logout')}>
      <span>Logout</span>
    </button>
  </div>
</aside>

<style>
  .sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 90;
  }

  .sidebar {
    width: 220px;
    background-color: var(--bg-surface);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    min-height: 100vh;
    transition: transform 0.2s ease;
    z-index: 100;
  }

  .sidebar-brand {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-subtle);
  }

  .brand-identity {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-icon {
    width: 30px;
    height: 30px;
    background-color: var(--primary);
    color: #ffffff;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .brand-sub {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .close-drawer-btn {
    display: none;
    background: transparent;
    border: none;
    font-size: 1.1rem;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
  }

  .sidebar-nav {
    flex: 1;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow-y: auto;
  }

  .nav-label {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    padding: 6px 10px 2px;
  }

  .mt-4 {
    margin-top: 12px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.82rem;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    text-align: left;
    transition: background 0.12s, color 0.12s;
  }

  .nav-item:hover {
    background-color: var(--bg-subtle);
    color: var(--text-main);
  }

  .nav-item.active {
    background-color: var(--primary-subtle);
    color: var(--primary);
    font-weight: 600;
  }

  .nav-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .pill {
    margin-left: auto;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: var(--radius-full);
  }

  .pill-danger {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .pill-warn {
    background-color: #fff7ed;
    color: #c2410c;
  }

  .pill-owner {
    background-color: #f1f5f9;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #e2e8f0;
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .user-meta {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .role-badge {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 2px;
    background: #e2e8f0;
    color: #475569;
  }

  .role-badge.owner {
    background: #dbeafe;
    color: #1e40af;
  }

  .logout-btn {
    width: 100%;
    font-size: 0.78rem;
    padding: 4px 8px;
  }

  /* Responsive Drawer for Tablet & Mobile */
  @media (max-width: 768px) {
    .sidebar-backdrop {
      display: block;
    }

    .close-drawer-btn {
      display: inline-block;
    }

    .sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      width: 260px;
      transform: translateX(-100%);
      box-shadow: var(--shadow-lg);
    }

    .sidebar.open-mobile {
      transform: translateX(0);
    }
  }
</style>
