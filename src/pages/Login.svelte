<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { auth } from '../stores/auth';

  const dispatch = createEventDispatcher<{ loginSuccess: void }>();

  let manualToken: string = '';
  let isLoggingIn: boolean = false;
  let customError: string = '';
  let showAccessDenied: boolean = false;
  let showManualInput: boolean = false;

  let googleBtnContainer: HTMLDivElement;
  let isMounted = true;

  const clientId = '310875006924-5dsprg0oqeivq38pam5glqeb9hkslf9k.apps.googleusercontent.com';
  $: authError = $auth.error;

  onMount(() => {
    isMounted = true;

    const init = (retry = 0) => {
      if (!isMounted) return;
      const g = (window as any).google;
      if (!g?.accounts?.id) {
        if (retry < 15) setTimeout(() => init(retry + 1), 300);
        else customError = 'Google Identity script failed to load.';
        return;
      }

      try {
        g.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: false,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (res: { credential?: string }) => {
            try {
              g.accounts.id.cancel();
              g.accounts.id.disableAutoSelect();
            } catch {}

            if (!res?.credential) {
              customError = 'No credential received from Google.';
              return;
            }

            isLoggingIn = true;
            customError = '';
            showAccessDenied = false;

            try {
              const r = await auth.loginWithGoogleIdToken(res.credential);
              if (r.success && r.authorized) {
                dispatch('loginSuccess');
              } else if (!r.authorized) {
                showAccessDenied = true;
              } else {
                customError = r.error || 'Authentication denied';
              }
            } catch (err: any) {
              customError = err.message || 'Login failed';
            } finally {
              isLoggingIn = false;
            }
          },
        });

        if (googleBtnContainer) {
          googleBtnContainer.innerHTML = '';
          g.accounts.id.renderButton(googleBtnContainer, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } catch (err: any) {
        customError = err.message || 'Error initializing Google Sign-In';
      }
    };

    init();
  });

  onDestroy(() => {
    isMounted = false;
    try {
      (window as any).google?.accounts?.id?.cancel();
    } catch {}
  });

  async function handleManual() {
    if (!manualToken.trim() || isLoggingIn) return;
    isLoggingIn = true;
    customError = '';
    showAccessDenied = false;

    try {
      let r = await auth.loginWithGoogleIdToken(manualToken.trim());
      if (!r.success) {
        r = await auth.loginWithExistingToken(manualToken.trim());
      }

      if (r.success && r.authorized) {
        dispatch('loginSuccess');
      } else if (!r.authorized) {
        showAccessDenied = true;
      } else {
        customError = r.error || 'Login rejected';
      }
    } catch (err: any) {
      customError = err.message || 'Login failed';
    } finally {
      isLoggingIn = false;
    }
  }
</script>

<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;">
  <div class="card" style="width: 100%; max-width: 440px; padding: 36px; textAlign: center; box-shadow: var(--shadow-lg);">
    <div style="width: 50px; height: 50px; border-radius: var(--radius-lg); background: var(--primary); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; margin-bottom: 16px;">
      J
    </div>
    <h1 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 6px;">Junto Support Management</h1>
    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 24px;">
      Internal operations portal for authorized Junto agents and owners.
    </p>

    {#if showAccessDenied}
      <div class="alert-banner" style="margin-bottom: 16px; text-align: left; background: #fef2f2; border-color: #fecaca; color: #b91c1c;">
        <strong>Access Denied:</strong> Google account authenticated, but not registered as an active agent.
      </div>
    {/if}

    {#if (customError || authError) && !showAccessDenied}
      <div class="alert-banner" style="margin-bottom: 16px; text-align: left; background: #fff7ed; border-color: #fed7aa; color: #c2410c;">
        {customError || authError}
      </div>
    {/if}

    {#if isLoggingIn}
      <div style="padding: 24px 0; display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <div class="spinner"></div>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Verifying Google session...</p>
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
        <div bind:this={googleBtnContainer} style="min-height: 44px; display: flex; justify-content: center;"></div>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Sign in with your authorized Google account</span>

        <div style="width: 100%; border-top: 1px solid var(--border-subtle); padding-top: 16px; margin-top: 8px;">
          <button
            type="button"
            class="btn-icon"
            on:click={() => (showManualInput = !showManualInput)}
            style="font-size: 0.78rem; color: var(--text-muted); text-decoration: underline;"
          >
            {showManualInput ? 'Hide token entry' : 'Paste Google ID Token or JWT manually'}
          </button>

          {#if showManualInput}
            <form on:submit|preventDefault={handleManual} style="width: 100%; margin-top: 12px;">
              <input
                type="text"
                class="form-control"
                placeholder="eyJhbGciOi..."
                bind:value={manualToken}
                style="font-size: 0.8rem; font-family: var(--font-mono); margin-bottom: 10px;"
              />
              <button
                type="submit"
                class="btn btn-secondary btn-sm"
                style="width: 100%;"
                disabled={!manualToken.trim() || isLoggingIn}
              >
                Authenticate with Token
              </button>
            </form>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
