<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth';

  const dispatch = createEventDispatcher<{ loginSuccess: void }>();

  let manualToken = '';
  let isLoggingIn = false;
  let customError = '';
  let showAccessDenied = false;
  let showManualInput = false;

  const clientId =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
    'your-client-id.apps.googleusercontent.com';

  onMount(() => {
    initGoogleOneTap();
  });

  function initGoogleOneTap() {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) {
      setTimeout(initGoogleOneTap, 200);
      return;
    }

    try {
      const google = (window as any).google.accounts.id;
      google.initialize({
        client_id: clientId,
        callback: handleOneTapCredential,
        auto_select: true,
        cancel_on_tap_outside: false,
      });

      // Trigger non-popup Google One Tap prompt natively
      google.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.info('One Tap note:', notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
        }
      });

      const btnContainer = document.getElementById('google-onetap-btn');
      if (btnContainer) {
        google.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'continue_with',
          shape: 'rectangular',
        });
      }
    } catch (e) {
      console.warn('Google One Tap init:', e);
    }
  }

  async function handleOneTapCredential(response: { credential?: string }) {
    if (!response?.credential) return;
    await submitIdToken(response.credential);
  }

  async function submitIdToken(idToken: string) {
    if (!idToken.trim() || isLoggingIn) return;
    isLoggingIn = true;
    customError = '';
    showAccessDenied = false;

    try {
      const res = await authStore.loginWithGoogleIdToken(idToken.trim());
      if (res.success && res.authorized) {
        dispatch('loginSuccess');
      } else if (!res.authorized) {
        showAccessDenied = true;
      } else {
        customError = res.error || 'Authentication rejected by backend';
      }
    } catch (err: any) {
      if (err.status === 403) {
        showAccessDenied = true;
      } else {
        customError = err.message || 'Login failed';
      }
    } finally {
      isLoggingIn = false;
    }
  }

  async function submitManual() {
    if (!manualToken.trim() || isLoggingIn) return;
    isLoggingIn = true;
    customError = '';
    showAccessDenied = false;

    try {
      // Try as Google ID Token first; if fails, try as existing Bearer token
      let res = await authStore.loginWithGoogleIdToken(manualToken.trim());
      if (!res.success) {
        res = await authStore.loginWithExistingToken(manualToken.trim());
      }

      if (res.success && res.authorized) {
        dispatch('loginSuccess');
      } else if (!res.authorized) {
        showAccessDenied = true;
      } else {
        customError = res.error || 'Authentication rejected';
      }
    } catch (err: any) {
      customError = err.message || 'Login failed';
    } finally {
      isLoggingIn = false;
    }
  }
</script>

<div class="login-page">
  <div class="card login-card">
    <div class="login-brand">
      <div class="brand-badge">J</div>
      <h1>Junto Support</h1>
      <p>Customer Support Operations</p>
    </div>

    {#if showAccessDenied}
      <div class="denied-box">
        <div class="denied-icon">✕</div>
        <h2>Access Denied</h2>
        <p>This account is not authorized as an active <strong>OWNER</strong> or <strong>SUPPORT</strong> agent.</p>
        <button class="btn btn-secondary w-full" on:click={() => (showAccessDenied = false)}>
          Try Another Account
        </button>
      </div>
    {:else}
      <div class="login-content">
        <p class="login-lead">Sign in using Google One Tap to access customer tickets.</p>

        {#if customError}
          <div class="alert alert-error">{customError}</div>
        {/if}

        <div class="onetap-container">
          <!-- Non-popup Google One Tap Native Action -->
          <div id="google-onetap-btn"></div>
          <button
            type="button"
            class="btn btn-secondary w-full prompt-trigger-btn"
            disabled={isLoggingIn}
            on:click={() => initGoogleOneTap()}
          >
            {isLoggingIn ? 'Verifying...' : 'Prompt Google One Tap'}
          </button>
        </div>

        <div class="divider">
          <span>or manual token</span>
        </div>

        {#if !showManualInput}
          <button
            type="button"
            class="text-btn"
            on:click={() => (showManualInput = true)}
          >
            Enter ID Token / Bearer Token manually
          </button>
        {:else}
          <form on:submit|preventDefault={submitManual} class="manual-form">
            <textarea
              class="form-control font-mono"
              rows="3"
              placeholder="Paste Google idToken or Bearer JWT token..."
              bind:value={manualToken}
              required
            ></textarea>
            <button
              type="submit"
              class="btn btn-primary w-full mt-2"
              disabled={isLoggingIn || !manualToken.trim()}
            >
              {isLoggingIn ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background-color: var(--bg-app);
  }

  .login-card {
    width: 100%;
    max-width: 380px;
    padding: 0;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .login-brand {
    background-color: var(--primary);
    color: #ffffff;
    padding: 24px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .brand-badge {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-md);
    background: #ffffff;
    color: var(--primary);
    font-weight: 800;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }

  .login-brand h1 {
    color: #ffffff;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .login-brand p {
    color: #cbd5e1;
    font-size: 0.75rem;
  }

  .login-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .login-lead {
    font-size: 0.82rem;
    color: var(--text-muted);
    text-align: center;
  }

  .onetap-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .prompt-trigger-btn {
    font-size: 0.82rem;
  }

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--border-subtle);
  }

  .divider span {
    padding: 0 8px;
  }

  .text-btn {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
  }

  .text-btn:hover {
    text-decoration: underline;
  }

  .manual-form textarea {
    font-size: 0.75rem;
    resize: vertical;
  }

  .alert {
    padding: 8px 12px;
    border-radius: var(--radius-md);
    font-size: 0.78rem;
  }

  .alert-error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }

  .denied-box {
    padding: 28px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .denied-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #fee2e2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .denied-box h2 {
    color: #dc2626;
    font-size: 1.15rem;
  }

  .denied-box p {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .w-full {
    width: 100%;
  }

  .mt-2 {
    margin-top: 8px;
  }
</style>
