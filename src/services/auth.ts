import { api, ApiError } from './api';
import type { SupportAgent, AuthSession, GoogleAuthPayload } from '../types/user';
import type { ApiResponse } from '../types/support';

// Mock agents for fallback testing when live backend is unreachable
export const MOCK_AGENTS: SupportAgent[] = [
  {
    id: 'agent-owner-uuid-1',
    userId: 'user-owner-101',
    email: 'sarah.owner@junto.com',
    name: 'Sarah Connor',
    role: 'OWNER',
    isActive: true,
    status: 'ACTIVE',
    createdAt: '2024-01-15T08:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'agent-supp-uuid-2',
    userId: 'user-supp-202',
    email: 'marcus.support@junto.com',
    name: 'Marcus Wright',
    role: 'SUPPORT',
    isActive: true,
    status: 'ACTIVE',
    createdAt: '2024-03-20T10:30:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'agent-supp-uuid-3',
    userId: 'user-supp-303',
    email: 'elena.support@junto.com',
    name: 'Elena Rostova',
    role: 'SUPPORT',
    isActive: true,
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
   * GET /api/support/me
   * Retrieve the currently authenticated support agent.
   * If not an active support agent, returns HTTP 403.
   * If not logged in, returns HTTP 401.
   */
  public async getSession(): Promise<AuthSession> {
    try {
      // Primary specification endpoint: GET /api/support/me
      const response = await api.get<ApiResponse<SupportAgent> | { success: boolean; data?: SupportAgent; user?: SupportAgent }>('/support/me');

      const agentData = (response as any)?.data || (response as any)?.user;

      if (agentData) {
        const isActive = agentData.isActive !== false && agentData.status !== 'INACTIVE';
        const isAuthorized = isActive && (agentData.role === 'OWNER' || agentData.role === 'SUPPORT');

        this.currentSession = {
          user: {
            ...agentData,
            isActive,
            status: isActive ? 'ACTIVE' : 'INACTIVE',
          },
          isAuthenticated: true,
          isAuthorized,
          role: agentData.role,
        };

        return this.currentSession;
      }
    } catch (err: any) {
      // If 403 Forbidden: User authenticated but not an active support agent in support_agents
      if (err instanceof ApiError && err.status === 403) {
        this.currentSession = {
          user: (err.data && (err.data.data || err.data.user)) || null,
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
        };
        api.setToken(null);
        return this.currentSession;
      }

      // If 401 Unauthorized: Session expired or unauthenticated
      if (err instanceof ApiError && err.status === 401) {
        this.currentSession = {
          user: null,
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
        };
        api.setToken(null);
        return this.currentSession;
      }

      // Check if localStorage has an active demo/fallback session for development
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
   * Authenticate with Google and verify via /api/support/me
   */
  public async loginWithGoogle(payload: GoogleAuthPayload): Promise<AuthSession> {
    try {
      // First attempt backend Google authentication endpoint
      const response = await api.post<{
        success: boolean;
        token?: string;
        data?: SupportAgent;
      }>('/support/auth/google', payload);

      if (response && response.token) {
        api.setToken(response.token);
      }

      // Verify active support agent via GET /api/support/me
      return await this.getSession();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        this.currentSession = {
          user: err.data?.data || null,
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
        };
        throw err;
      }

      // If backend network is unreachable (status 0) or 404 in dev preview, check mock agents
      if (err instanceof ApiError && (err.status === 0 || err.status === 404)) {
        const email = payload.email?.toLowerCase();
        const found = MOCK_AGENTS.find((a) => a.email.toLowerCase() === email);

        if (found) {
          if (!found.isActive) {
            this.currentSession = {
              user: found,
              isAuthenticated: true,
              isAuthorized: false,
              role: found.role,
            };
            throw new ApiError(403, 'Account is inactive. Contact the Junto Owner.');
          }

          this.currentSession = {
            user: found,
            isAuthenticated: true,
            isAuthorized: true,
            role: found.role,
            token: 'mock-junto-agent-jwt',
          };
          localStorage.setItem('junto_support_mock_session', JSON.stringify(this.currentSession));
          return this.currentSession;
        } else if (email) {
          // Unauthorized email test
          this.currentSession = {
            user: {
              id: 'unauth-user',
              userId: 'user-external-999',
              email,
              name: payload.name || 'External User',
              role: 'SUPPORT',
              isActive: false,
              status: 'INACTIVE',
              createdAt: new Date().toISOString(),
            },
            isAuthenticated: true,
            isAuthorized: false,
            role: null,
          };
          throw new ApiError(403, 'User is not registered in Junto support_agents.');
        }
      }

      throw err;
    }
  }

  public async loginWithGoogleIdToken(idToken: string): Promise<AuthSession> {
    return this.loginWithGoogle({ credential: idToken });
  }

  public async loginWithExistingToken(token: string): Promise<AuthSession> {
    api.setToken(token);
    return await this.getSession();
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
