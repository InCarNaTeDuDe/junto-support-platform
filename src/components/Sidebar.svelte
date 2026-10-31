<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth';

  export let activePage: string = 'dashboard';
  export let unassignedCount: number = 0;
  export let criticalCount: number = 0;

  const dispatch = createEventDispatcher<{
    navigate: string;
    logout: void;
  }>();

  $: user = $authStore.user;
  $: isOwner = $authStore.role === 'OWNER';

  function navigate(page: string) {
    dispatch('navigate', page);
  }

  function handleLogout() {
    dispatch('logout');
  }
</script>

<aside class="sidebar">
  <div class="sidebar-brand">
    <div class="brand-icon">J</div>
    <div class="brand-text">
      <span class="brand-name">Junto</span>
      <span class="brand-sub">Support Ops</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section-label">Cases & Workflows</div>

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
        <span class="nav-pill pill-critical" title="{criticalCount} critical/high priority cases">{criticalCount}</span>
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
      <span>My Assigned Cases</span>
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
      <span>Unassigned Cases</span>
      {#if unassignedCount > 0}
        <span class="nav-pill pill-alert">{unassignedCount}</span>
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
      <span>Resolved Cases</span>
    </button>

    {#if isOwner}
      <div class="nav-section-label owner-label">Administration</div>

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
        <span class="nav-pill pill-owner">Owner</span>
      </button>
    {/if}
  </nav>

  <div class="sidebar-footer">
    {#if user}
      <div class="agent-profile">
        <div class="avatar-circle">
          {user.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
        </div>
        <div class="profile-meta">
          <div class="profile-name" title={user.name}>{user.name}</div>
          <div class="profile-role">
            <span class="role-chip" class:owner={user.role === 'OWNER'}>
              {user.role}
            </span>
          </div>
        </div>
      </div>
    {/if}

    <button class="logout-btn" on:click={handleLogout} title="Log out from dashboard">
      <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>Logout</span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    width: 240px;
    background-color: var(--bg-surface);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    min-height: 100vh;
  }

  .sidebar-brand {
    padding: 20px 20px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .brand-icon {
    width: 34px;
    height: 34px;
    background-color: var(--primary);
    color: #ffffff;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.15rem;
    box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-main);
    letter-spacing: -0.01em;
  }

  .brand-sub {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }

  .nav-section-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    padding: 8px 10px 4px;
    margin-top: 4px;
  }

  .owner-label {
    margin-top: 16px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 12px;
    border-radius: var(--radius-md);
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.12s ease, color 0.12s ease;
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
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }

  .nav-pill {
    margin-left: auto;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: var(--radius-full);
  }

  .pill-alert {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .pill-critical {
    background-color: #fff7ed;
    color: #c2410c;
    border: 1px solid #ffedd5;
  }

  .pill-owner {
    background-color: #f1f5f9;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .agent-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: var(--radius-md);
    background-color: var(--bg-subtle);
  }

  .avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #e2e8f0;
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .profile-meta {
    flex: 1;
    min-width: 0;
  }

  .profile-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .role-chip {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    background-color: #e2e8f0;
    color: #475569;
  }

  .role-chip.owner {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 7px 12px;
    border-radius: var(--radius-md);
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: background-color 0.12s, color 0.12s;
  }

  .logout-btn:hover {
    background-color: #fee2e2;
    border-color: #fca5a5;
    color: #dc2626;
  }

  .logout-icon {
    width: 15px;
    height: 15px;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      min-height: auto;
      border-right: none;
      border-bottom: 1px solid var(--border-subtle);
    }
    .sidebar-nav {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
</style>
