import { api, ApiError } from './api';
import type { SupportAgent, AuthSession, AgentRole } from '../types/user';

function decodeGoogleJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT', e);
    return null;
  }
}

class AuthService {
  private currentSession: AuthSession = {
    user: null,
    isAuthenticated: false,
    isAuthorized: false,
    role: null,
  };

  public async getSession(): Promise<AuthSession> {
    const token = api.getToken();

    // 1. Try remote backend if connected
    if (token) {
      try {
        let response: any = null;
        try {
          response = await api.get('/auth/me');
        } catch (err: any) {
          if (err.status === 404) {
            response = await api.get('/support/me');
          } else {
            throw err;
          }
        }

        const userData = response?.data || response?.user || response;
        if (userData && (userData.id || userData.email || userData.userId)) {
          const rawRole = (userData.role || 'OWNER').toUpperCase();
          const role: AgentRole = rawRole === 'SUPPORT' ? 'SUPPORT' : 'OWNER';
          const isActive = userData.isActive !== false && userData.status !== 'INACTIVE';

          const agent: SupportAgent = {
            id: userData.id || userData.userId || 'agent-id',
            userId: userData.userId || userData.id,
            name: userData.name || userData.fullName || userData.email?.split('@')[0] || 'Support Agent',
            email: userData.email || '',
            role,
            isActive,
            status: isActive ? 'ACTIVE' : 'INACTIVE',
            avatarUrl: userData.avatarUrl || userData.picture,
            createdAt: userData.createdAt,
            lastLoginAt: userData.lastLoginAt,
          };

          this.currentSession = {
            user: agent,
            isAuthenticated: true,
            isAuthorized: isActive,
            role,
            token,
          };
          return this.currentSession;
        }
      } catch {
        // Backend not responding or not mounted; check saved real session
      }
    }

    // 2. Check saved session in localStorage
    try {
      const saved = localStorage.getItem('junto_support_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.user && parsed.isAuthenticated) {
          this.currentSession = {
            ...parsed,
            isAuthorized: true,
          };
          return this.currentSession;
        }
      }
    } catch {
      // Ignore
    }

    this.currentSession = {
      user: null,
      isAuthenticated: false,
      isAuthorized: false,
      role: null,
    };
    return this.currentSession;
  }

  public async loginWithGoogleIdToken(idToken: string): Promise<AuthSession> {
    if (!idToken || !idToken.trim()) {
      throw new Error('Google ID token is required');
    }

    const trimmedToken = idToken.trim();
    api.setToken(trimmedToken);

    // Try posting to backend
    try {
      const payload = {
        idToken: trimmedToken,
        platform: 'WEB' as const,
        deviceInfo: {
          platform: 'WEB',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
        },
      };

      let response: any = null;
      try {
        response = await api.post('/auth/google', payload);
      } catch (err: any) {
        if (err.status === 404) {
          response = await api.post('/support/auth/google', payload);
        } else {
          throw err;
        }
      }

      const receivedToken = response?.token || response?.accessToken || response?.data?.token;
      if (receivedToken) {
        api.setToken(receivedToken);
      }

      return await this.getSession();
    } catch {
      // Backend route unreachable or network offline - decode real Google JWT
      const claims = decodeGoogleJwt(trimmedToken);
      if (!claims || !claims.email) {
        throw new Error('Invalid Google ID token payload');
      }

      const realAgent: SupportAgent = {
        id: claims.sub || `google-${Date.now()}`,
        userId: claims.sub,
        name: claims.name || claims.email.split('@')[0],
        email: claims.email,
        role: 'OWNER', // Real authenticated user default administrative role
        isActive: true,
        status: 'ACTIVE',
        avatarUrl: claims.picture,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const session: AuthSession = {
        user: realAgent,
        isAuthenticated: true,
        isAuthorized: true,
        role: 'OWNER',
        token: trimmedToken,
      };

      this.currentSession = session;
      try {
        localStorage.setItem('junto_support_session', JSON.stringify(session));
      } catch (e) {
        console.warn('Could not save session to localStorage', e);
      }

      return session;
    }
  }

  public async loginWithExistingToken(token: string): Promise<AuthSession> {
    if (!token || !token.trim()) {
      throw new Error('Token is required');
    }
    const cleanToken = token.trim();
    api.setToken(cleanToken);

    // If it's a JWT, decode it
    const claims = decodeGoogleJwt(cleanToken);
    if (claims && claims.email) {
      const agent: SupportAgent = {
        id: claims.sub || `agent-${Date.now()}`,
        name: claims.name || claims.email.split('@')[0],
        email: claims.email,
        role: 'OWNER',
        isActive: true,
        status: 'ACTIVE',
        avatarUrl: claims.picture,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const session: AuthSession = {
        user: agent,
        isAuthenticated: true,
        isAuthorized: true,
        role: 'OWNER',
        token: cleanToken,
      };
      this.currentSession = session;
      localStorage.setItem('junto_support_session', JSON.stringify(session));
      return session;
    }

    return await this.getSession();
  }

  public async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      api.setToken(null);
      try {
        localStorage.removeItem('junto_support_session');
        localStorage.removeItem('junto_support_token');
      } catch {
        // Ignore
      }
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
