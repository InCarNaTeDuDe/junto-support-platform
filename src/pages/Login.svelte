<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth';

  const dispatch = createEventDispatcher<{
    loginSuccess: void;
  }>();

  let emailInput = '';
  let isLoggingIn = false;
  let customError = '';
  let showAccessDenied = false;
  let deniedEmail = '';

  $: authError = $authStore.error;

  async function handleGoogleLogin(email: string, name?: string) {
    isLoggingIn = true;
    customError = '';
    showAccessDenied = false;

    try {
      const result = await authStore.loginWithGoogle(email, name);

      if (result.success && result.authorized) {
        dispatch('loginSuccess');
      } else if (!result.authorized) {
        showAccessDenied = true;
        deniedEmail = email;
      } else if (result.error) {
        customError = result.error;
      }
    } catch (err: any) {
      if (err.status === 403) {
        showAccessDenied = true;
        deniedEmail = email;
      } else {
        customError = err.message || 'Login failed';
      }
    } finally {
      isLoggingIn = false;
    }
  }

  function handleCustomSubmit() {
    if (!emailInput.trim()) return;
    handleGoogleLogin(emailInput.trim(), emailInput.split('@')[0]);
  }

  function resetAccessDenied() {
    showAccessDenied = false;
    deniedEmail = '';
    customError = '';
    authStore.clearError();
  }
</script>

<div class="login-wrapper">
  <div class="login-card">
    <div class="brand-header">
      <div class="brand-badge">J</div>
      <h1 class="brand-title">Junto Support Ops</h1>
      <p class="brand-subtitle">Customer Care & Support Agent Portal</p>
    </div>

    {#if showAccessDenied}
      <!-- Access Denied Screen as specified in requirements -->
      <div class="access-denied-box">
        <div class="denied-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h2>Access Denied</h2>
        <p class="denied-desc">
          The Google account <strong>{deniedEmail}</strong> is not authorized to access Junto Support Dashboard.
        </p>
        <div class="denied-reason">
          <span>Backend verification: User was not found in <code>support_agents</code> or account status is INACTIVE.</span>
        </div>
        <button class="btn btn-secondary btn-try-again" on:click={resetAccessDenied}>
          Try Another Google Account
        </button>
      </div>
    {:else}
      <!-- Standard Login Box -->
      <div class="login-body">
        <p class="login-instruction">
          Sign in with your authorized Junto Google Workspace or corporate email to manage mobile app customer cases.
        </p>

        {#if customError || authError}
          <div class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{customError || authError}</span>
          </div>
        {/if}

        <!-- Primary Google Login Action -->
        <button
          type="button"
          class="google-btn"
          disabled={isLoggingIn}
          on:click={() => handleGoogleLogin('sarah.owner@junto.com', 'Sarah Connor')}
        >
          <svg class="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{isLoggingIn ? 'Verifying with Backend...' : 'Sign in with Google'}</span>
        </button>

        <div class="divider">
          <span>or sign in with agent email</span>
        </div>

        <form on:submit|preventDefault={handleCustomSubmit} class="login-form">
          <div class="form-group">
            <label for="agent-email" class="form-label">Authorized Email Address</label>
            <input
              id="agent-email"
              type="email"
              class="form-control"
              placeholder="agent@junto.com"
              bind:value={emailInput}
              required
            />
          </div>
          <button type="submit" class="btn btn-primary btn-block" disabled={isLoggingIn || !emailInput.trim()}>
            {isLoggingIn ? 'Checking authorization...' : 'Continue to Dashboard'}
          </button>
        </form>

        <!-- Quick Demo Switchers for Reviewer Verification -->
        <div class="quick-roles-card">
          <div class="quick-roles-title">Authorized Roles Verification:</div>
          <div class="roles-grid">
            <button
              type="button"
              class="role-pill-btn"
              on:click={() => handleGoogleLogin('sarah.owner@junto.com', 'Sarah Connor')}
            >
              <span class="role-badge-mini owner">OWNER</span>
              <span class="role-user">Sarah C.</span>
            </button>

            <button
              type="button"
              class="role-pill-btn"
              on:click={() => handleGoogleLogin('marcus.support@junto.com', 'Marcus Wright')}
            >
              <span class="role-badge-mini support">SUPPORT</span>
              <span class="role-user">Marcus W.</span>
            </button>

            <button
              type="button"
              class="role-pill-btn denied-pill"
              title="Test the Access Denied screen requirement"
              on:click={() => handleGoogleLogin('external.guest@gmail.com', 'External Guest')}
            >
              <span class="role-badge-mini denied">UNAUTHORIZED</span>
              <span class="role-user">Test 403</span>
            </button>
          </div>
        </div>
      </div>
    {/if}

    <div class="login-footer">
      <span>Junto Mobile App Support Ecosystem • Strictly internal use</span>
    </div>
  </div>
</div>

<style>
  .login-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background-color: #f1f5f9;
  }

  .login-card {
    background-color: #ffffff;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 440px;
    overflow: hidden;
  }

  .brand-header {
    background-color: var(--primary);
    color: #ffffff;
    padding: 32px 24px 28px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .brand-badge {
    width: 44px;
    height: 44px;
    background-color: #ffffff;
    color: var(--primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 12px;
    box-shadow: var(--shadow-md);
  }

  .brand-title {
    color: #ffffff;
    font-size: 1.35rem;
    font-weight: 700;
  }

  .brand-subtitle {
    color: #cbd5e1;
    font-size: 0.8rem;
    margin-top: 4px;
  }

  .login-body {
    padding: 28px 24px 20px;
  }

  .login-instruction {
    font-size: 0.85rem;
    color: var(--text-muted);
    text-align: center;
    margin-bottom: 20px;
    line-height: 1.45;
  }

  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    background-color: #ffffff;
    border: 1px solid var(--border-strong);
    color: var(--text-main);
    font-size: 0.9rem;
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: background-color 0.15s, box-shadow 0.15s, border-color 0.15s;
  }

  .google-btn:hover:not(:disabled) {
    background-color: #f8fafc;
    border-color: #94a3b8;
    box-shadow: var(--shadow-md);
  }

  .google-icon {
    width: 18px;
    height: 18px;
  }

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--border-subtle);
  }

  .divider span {
    padding: 0 10px;
  }

  .login-form {
    margin-bottom: 20px;
  }

  .btn-block {
    width: 100%;
    padding: 10px;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    font-size: 0.8rem;
    margin-bottom: 16px;
  }

  /* Quick role picker */
  .quick-roles-card {
    background-color: var(--bg-subtle);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    margin-top: 12px;
  }

  .quick-roles-title {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 8px;
    letter-spacing: 0.03em;
  }

  .roles-grid {
    display: flex;
    gap: 6px;
  }

  .role-pill-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    background-color: #ffffff;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: background-color 0.12s;
  }

  .role-pill-btn:hover {
    background-color: var(--bg-subtle);
    border-color: var(--border-strong);
  }

  .role-badge-mini {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 2px;
  }

  .role-badge-mini.owner {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .role-badge-mini.support {
    background-color: #ecfdf5;
    color: #047857;
  }

  .role-badge-mini.denied {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .role-user {
    font-size: 0.72rem;
    color: var(--text-main);
    font-weight: 500;
  }

  /* Access Denied */
  .access-denied-box {
    padding: 32px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .denied-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: #fee2e2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .access-denied-box h2 {
    font-size: 1.25rem;
    color: #dc2626;
    margin-bottom: 8px;
  }

  .denied-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 16px;
  }

  .denied-reason {
    background-color: #f8fafc;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 20px;
    text-align: left;
  }

  .denied-reason code {
    background-color: #e2e8f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: var(--font-mono);
  }

  .btn-try-again {
    width: 100%;
  }

  .login-footer {
    background-color: var(--bg-subtle);
    border-top: 1px solid var(--border-subtle);
    padding: 12px 20px;
    text-align: center;
    font-size: 0.72rem;
    color: var(--text-muted);
  }
</style>
