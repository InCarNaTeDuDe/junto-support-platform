import { writable } from 'svelte/store';
import { authService } from '../services/auth';
import type { SupportAgent, AgentRole } from '../types/user';

export interface AuthState {
  user: SupportAgent | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  role: AgentRole | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAuthorized: false,
  role: null,
  isLoading: true,
  error: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    async init() {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const s = await authService.getSession();
        set({
          user: s.user,
          isAuthenticated: s.isAuthenticated,
          isAuthorized: s.isAuthorized,
          role: s.role,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        set({
          user: null,
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
          isLoading: false,
          error: err.message || 'Session verification failed',
        });
      }
    },
    async loginWithGoogleIdToken(idToken: string) {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const s = await authService.loginWithGoogleIdToken(idToken);
        set({
          user: s.user,
          isAuthenticated: s.isAuthenticated,
          isAuthorized: s.isAuthorized,
          role: s.role,
          isLoading: false,
          error: null,
        });
        return { success: true, authorized: s.isAuthorized };
      } catch (err: any) {
        const forbidden = err.status === 403;
        const msg = err.message || 'Google authentication failed';
        set({
          user: forbidden ? err.data?.data || err.data?.user || null : null,
          isAuthenticated: forbidden,
          isAuthorized: false,
          role: null,
          isLoading: false,
          error: msg,
        });
        return { success: false, authorized: false, error: msg };
      }
    },
    async loginWithExistingToken(token: string) {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const s = await authService.loginWithExistingToken(token);
        set({
          user: s.user,
          isAuthenticated: s.isAuthenticated,
          isAuthorized: s.isAuthorized,
          role: s.role,
          isLoading: false,
          error: null,
        });
        return { success: true, authorized: s.isAuthorized };
      } catch (err: any) {
        const msg = err.message || 'Authentication failed';
        set({
          user: null,
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
          isLoading: false,
          error: msg,
        });
        return { success: false, authorized: false, error: msg };
      }
    },
    async logout() {
      update((s) => ({ ...s, isLoading: true }));
      try {
        await authService.logout();
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
          isLoading: false,
          error: null,
        });
      }
    },
  };
}

export const auth = createAuthStore();
