<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth';

  const dispatch = createEventDispatcher<{ loginSuccess: void }>();

  let manualToken = '';
  let isLoggingIn = false;
  let customError = '';
  let showAccessDenied = false;
  let showManualInput = false;

  // Google OAuth configuration
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';

  let isMounted = false;

  onMount(() => {
    isMounted = true;

    if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
      customError =
        'Google OAuth Client ID is missing or invalid. Check VITE_GOOGLE_CLIENT_ID in your frontend environment variables.';
      return;
    }

    initGoogleOneTap();

    return () => {
      isMounted = false;
    };
  });

  function initGoogleOneTap(attempt = 0) {
    if (typeof window === 'undefined' || !isMounted) return;

    const googleIdentity = (window as any).google?.accounts?.id;

    if (!googleIdentity) {
      if (attempt < 10) {
        window.setTimeout(() => initGoogleOneTap(attempt + 1), 500);
      } else {
        customError = 'Unable to load Google Login. Please refresh and try again.';
      }
      return;
    }

    try {
      googleIdentity.initialize({
        client_id: clientId,
        callback: handleOneTapCredential,
        auto_select: true,
        cancel_on_tap_outside: false,
      });

      googleIdentity.prompt();

      const btnContainer = document.getElementById('google-onetap-btn');

      if (btnContainer) {
        btnContainer.innerHTML = '';

        googleIdentity.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'continue_with',
          shape: 'rectangular',
        });
      }
    } catch {
      customError = 'Unable to initialize Google Login. Please try again.';
    }
  }

  async function handleOneTapCredential(response: { credential?: string }) {
    if (!response?.credential) {
      customError = 'Google did not return an ID token.';
      return;
    }

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