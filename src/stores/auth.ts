import { writable } from "svelte/store";
import { authService } from "../services/auth";
import type { SupportAgent, AgentRole } from "../types/user";

export interface AuthState {
  user: SupportAgent | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  role: AgentRole | null;
  isLoading: boolean;
  error: string | null;
}

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAuthorized: false,
  role: null,
  isLoading: true,
  error: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialAuthState);

  return {
    subscribe,

    async initialize() {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const session = await authService.getSession();
        set({
          user: session.user,
          isAuthenticated: session.isAuthenticated,
          isAuthorized: session.isAuthorized,
          role: session.role,
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
          error: err.message || "Failed to authenticate",
        });
      }
    },

    async loginWithGoogleIdToken(idToken: string) {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const session = await authService.loginWithGoogleIdToken(idToken);
        set({
          user: session.user,
          isAuthenticated: session.isAuthenticated,
          isAuthorized: session.isAuthorized,
          role: session.role,
          isLoading: false,
          error: null,
        });
        return { success: true, authorized: session.isAuthorized };
      } catch (err: any) {
        const isUnauthorized = err.status === 403;
        set({
          user: isUnauthorized
            ? err.data?.data || err.data?.user || null
            : null,
          isAuthenticated: isUnauthorized,
          isAuthorized: false,
          role: null,
          isLoading: false,
          error: err.message || "Google authentication failed",
        });
        return {
          success: false,
          authorized: false,
          error: err.message,
          status: err.status,
        };
      }
    },

    async loginWithExistingToken(token: string) {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const session = await authService.loginWithExistingToken(token);
        set({
          user: session.user,
          isAuthenticated: session.isAuthenticated,
          isAuthorized: session.isAuthorized,
          role: session.role,
          isLoading: false,
          error: null,
        });
        return { success: true, authorized: session.isAuthorized };
      } catch (err: any) {
        const isUnauthorized = err.status === 403;
        set({
          user: null,
          isAuthenticated: isUnauthorized,
          isAuthorized: false,
          role: null,
          isLoading: false,
          error: err.message || "Authentication with token failed",
        });
        return {
          success: false,
          authorized: false,
          error: err.message,
          status: err.status,
        };
      }
    },

    async logout() {
      update((s) => ({ ...s, isLoading: true }));
      await authService.logout();
      set({
        user: null,
        isAuthenticated: false,
        isAuthorized: false,
        role: null,
        isLoading: false,
        error: null,
      });
    },

    clearError() {
      update((s) => ({ ...s, error: null }));
    },
  };
}

export const authStore = createAuthStore();
