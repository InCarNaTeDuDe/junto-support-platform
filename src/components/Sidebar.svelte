<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { auth } from '../stores/auth';

  export let activePage: string = 'dashboard';
  export let unassignedCount: number = 0;
  export let criticalCount: number = 0;
  export let isOpenMobile: boolean = false;

  const dispatch = createEventDispatcher<{
    navigate: string;
    closeMobile: void;
    logout: void;
  }>();

  $: user = $auth.user;
  $: isOwner = $auth.role === 'OWNER';

  function handleNav(page: string) {
    dispatch('navigate', page);
    dispatch('closeMobile');
  }

  function handleCloseMobile() {
    dispatch('closeMobile');
  }

  function handleLogout() {
    dispatch('logout');
  }
</script>

{#if isOpenMobile}
  <div class="sidebar-backdrop" on:click={handleCloseMobile} role="presentation"></div>
{/if}

<aside class="sidebar {isOpenMobile ? 'open-mobile' : ''}">
  <div class="sidebar-brand">
    <div class="brand-identity">
      <div class="brand-icon">J</div>
      <div class="brand-text">
        <span class="brand-name">Junto</span>
        <span class="brand-sub">Support</span>
      </div>
    </div>
    <button type="button" class="close-drawer-btn" on:click={handleCloseMobile}>✕</button>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-label">Cases</div>
    <button
      type="button"
      class="nav-item {activePage === 'dashboard' ? 'active' : ''}"
      on:click={() => handleNav('dashboard')}
    >
      <span>Dashboard</span>
    </button>
    <button
      type="button"
      class="nav-item {activePage === 'cases_all' ? 'active' : ''}"
      on:click={() => handleNav('cases_all')}
    >
      <span>All Cases</span>
      {#if criticalCount > 0}
        <span class="pill pill-warn">{criticalCount}</span>
      {/if}
    </button>
    <button
      type="button"
      class="nav-item {activePage === 'cases_my' ? 'active' : ''}"
      on:click={() => handleNav('cases_my')}
    >
      <span>My Cases</span>
    </button>
    <button
      type="button"
      class="nav-item {activePage === 'cases_unassigned' ? 'active' : ''}"
      on:click={() => handleNav('cases_unassigned')}
    >
      <span>Unassigned</span>
      {#if unassignedCount > 0}
        <span class="pill pill-danger">{unassignedCount}</span>
      {/if}
    </button>
    <button
      type="button"
      class="nav-item {activePage === 'cases_resolved' ? 'active' : ''}"
      on:click={() => handleNav('cases_resolved')}
    >
      <span>Resolved</span>
    </button>

    {#if isOwner}
      <div class="nav-label" style="margin-top: 14px;">Admin</div>
      <button
        type="button"
        class="nav-item {activePage === 'agents' ? 'active' : ''}"
        on:click={() => handleNav('agents')}
      >
        <span>Agents</span>
        <span class="pill pill-owner">Owner</span>
      </button>
    {/if}
  </nav>

  <div class="sidebar-footer">
    {#if user}
      <div class="user-info">
        <div class="avatar">{user.name?.slice(0, 2).toUpperCase() || 'AG'}</div>
        <div class="user-meta">
          <div class="user-name" title={user.name}>{user.name}</div>
          <span class="role-badge {user.role === 'OWNER' ? 'owner' : ''}">{user.role}</span>
        </div>
      </div>
    {/if}
    <button type="button" class="btn btn-secondary btn-sm logout-btn" on:click={handleLogout}>
      Logout
    </button>
  </div>
</aside>
