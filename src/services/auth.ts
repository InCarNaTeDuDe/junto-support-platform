import { api, ApiError } from './api';
import type { SupportAgent, AuthSession, GoogleAuthPayload } from '../types/user';

// Mock agents for fallback testing when live backend is unreachable
const MOCK_AGENTS: SupportAgent[] = [
  {
    id: 'agent_owner_1',
    email: 'sarah.owner@junto.com',
    name: 'Sarah Connor',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: '2024-01-15T08:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'agent_supp_2',
    email: 'marcus.support@junto.com',
    name: 'Marcus Wright',
    role: 'SUPPORT',
    status: 'ACTIVE',
    createdAt: '2024-03-20T10:30:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'agent_supp_3',
    email: 'elena.support@junto.com',
    name: 'Elena Rostova',
    role: 'SUPPORT',
    status: 'ACTIVE',
    createdAt: '2024-05-10T14:15:00Z',
    lastLoginAt: new Date().toISOString(),
  },
];

class AuthService {
  private currentSession: AuthSession = {
    user: null,
    isAuthenticated: false,
    isAuthorized: false,
    role: null,
  };

  /**
   * Check current session with the backend.
   * Expects backend to check session cookie or token, verify user exists in `support_agents` and is active.
   */
  public async getSession(): Promise<AuthSession> {
    try {
      // Primary backend endpoint for session verification
      const response = await api.get<{
        user: SupportAgent;
        authorized: boolean;
        role?: 'OWNER' | 'SUPPORT';
        token?: string;
      }>('/support/auth/session');

      if (response && response.user) {
        const isActive = response.user.status === 'ACTIVE';
        const isAuthorized = response.authorized && isActive;

        this.currentSession = {
          user: response.user,
          isAuthenticated: true,
          isAuthorized,
          role: response.user.role,
          token: response.token,
        };

        if (response.token) {
          api.setToken(response.token);
        }

        return this.currentSession;
      }
    } catch (err: any) {
      // If 401 or 403 from backend, user is not authenticated or authorized
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        this.currentSession = {
          user: null,
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
        };
        api.setToken(null);
        return this.currentSession;
      }

      // Check if localStorage has an active demo/fallback session
      const saved = localStorage.getItem('junto_support_mock_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.currentSession = parsed;
          return this.currentSession;
        } catch {
          // ignore parsing error
        }
      }
    }

    return this.currentSession;
  }

  /**
   * Authenticate via Google OAuth credential token or backend flow.
   * Backend checks whether user email is in `support_agents` table and active.
   */
  public async loginWithGoogle(payload: GoogleAuthPayload): Promise<AuthSession> {
    try {
      const response = await api.post<{
        user: SupportAgent;
        authorized: boolean;
        token?: string;
      }>('/support/auth/google', payload);

      if (response.token) {
        api.setToken(response.token);
      }

      this.currentSession = {
        user: response.user,
        isAuthenticated: true,
        isAuthorized: response.authorized && response.user.status === 'ACTIVE',
        role: response.user.role,
        token: response.token,
      };

      return this.currentSession;
    } catch (err: any) {
      // If backend is not available in local test or returns error, handle appropriately
      if (err instanceof ApiError && err.status === 403) {
        // Backend actively returned 403 Forbidden (not in support_agents or inactive)
        this.currentSession = {
          user: err.data?.user || null,
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
        };
        throw err;
      }

      // If backend network error, check if email matches mock list for development evaluation
      if (err instanceof ApiError && err.status === 0) {
        const email = payload.email?.toLowerCase();
        const found = MOCK_AGENTS.find((a) => a.email.toLowerCase() === email);

        if (found) {
          if (found.status !== 'ACTIVE') {
            this.currentSession = {
              user: found,
              isAuthenticated: true,
              isAuthorized: false,
              role: found.role,
            };
            const deniedError = new ApiError(403, 'Account is inactive. Contact the Junto Owner.');
            throw deniedError;
          }

          this.currentSession = {
            user: found,
            isAuthenticated: true,
            isAuthorized: true,
            role: found.role,
            token: 'mock-jwt-token-support',
          };
          localStorage.setItem('junto_support_mock_session', JSON.stringify(this.currentSession));
          return this.currentSession;
        } else if (email) {
          // Unauthorized email
          this.currentSession = {
            user: {
              id: 'unauth_user',
              email,
              name: payload.name || 'External User',
              role: 'SUPPORT',
              status: 'INACTIVE',
              createdAt: new Date().toISOString(),
            },
            isAuthenticated: true,
            isAuthorized: false,
            role: null,
          };
          const denied = new ApiError(403, 'User is not registered in Junto support_agents.');
          throw denied;
        }
      }

      throw err;
    }
  }

  /**
   * Log out session and clear credentials
   */
  public async logout(): Promise<void> {
    try {
      await api.post('/support/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      api.setToken(null);
      localStorage.removeItem('junto_support_mock_session');
      this.currentSession = {
        user: null,
        isAuthenticated: false,
        isAuthorized: false,
        role: null,
      };
    }
  }
}

export const authService = new AuthService();
