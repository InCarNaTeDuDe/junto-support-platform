import { api, ApiError } from './api';
import type { SupportAgent, AuthSession, AgentRole } from '../types/user';

function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

class AuthService {
  private session: AuthSession = { user: null, isAuthenticated: false, isAuthorized: false, role: null };

  public async getSession(): Promise<AuthSession> {
    const token = api.getToken();
    if (token) {
      try {
        let res: any;
        try {
          res = await api.get('/auth/me');
        } catch {
          res = await api.get('/support/me');
        }
        const u = res?.data || res?.user || res;
        if (u && (u.id || u.email || u.userId)) {
          const role: AgentRole = (u.role || '').toUpperCase() === 'SUPPORT' ? 'SUPPORT' : 'OWNER';
          const isActive = u.isActive !== false && u.status !== 'INACTIVE';
          const agent: SupportAgent = {
            id: u.id || u.userId || '',
            userId: u.userId || u.id,
            name: u.name || u.fullName || u.email || '',
            email: u.email || '',
            role,
            isActive,
            status: isActive ? 'ACTIVE' : 'INACTIVE',
            avatarUrl: u.avatarUrl || u.picture,
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt,
          };
          this.session = { user: agent, isAuthenticated: true, isAuthorized: isActive, role, token };
          try { localStorage.setItem('junto_support_session', JSON.stringify(this.session)); } catch {}
          return this.session;
        }
      } catch {
        // Backend unavailable; verify cached session
      }
    }

    try {
      const saved = localStorage.getItem('junto_support_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.user && parsed.isAuthenticated) {
          this.session = { ...parsed, isAuthorized: true };
          return this.session;
        }
      }
    } catch {}

    this.session = { user: null, isAuthenticated: false, isAuthorized: false, role: null };
    return this.session;
  }

  public async loginWithGoogleIdToken(idToken: string): Promise<AuthSession> {
    const token = idToken.trim();
    if (!token) throw new Error('Token is required');
    api.setToken(token);

    const claims = decodeJwt(token) || {};
    let res: any = null;

    try {
      const body = { idToken: token, platform: 'WEB' };
      try {
        res = await api.post('/auth/google', body);
      } catch (err: any) {
        if (err.status === 404) {
          res = await api.post('/support/auth/google', body);
        } else if (err.status === 403) {
          throw err;
        }
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) throw e;
    }

    const authToken = res?.token || res?.accessToken || res?.data?.token || token;
    api.setToken(authToken);

    const u = res?.user || res?.data?.user || res?.agent || res?.data?.agent || (res?.data?.id ? res.data : null);
    const email = u?.email || claims?.email || '';
    const name = u?.name || u?.fullName || claims?.name || email;
    const role: AgentRole = ((u?.role || '').toUpperCase() === 'SUPPORT') ? 'SUPPORT' : 'OWNER';
    const isActive = u ? (u.isActive !== false && u.status !== 'INACTIVE') : true;

    const agent: SupportAgent = {
      id: u?.id || u?.userId || claims?.sub || '',
      userId: u?.userId || u?.id || claims?.sub,
      name,
      email,
      role,
      isActive,
      status: isActive ? 'ACTIVE' : 'INACTIVE',
      avatarUrl: u?.avatarUrl || u?.picture || claims?.picture,
      createdAt: u?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.session = { user: agent, isAuthenticated: true, isAuthorized: isActive, role, token: authToken };
    try {
      localStorage.setItem('junto_support_session', JSON.stringify(this.session));
      localStorage.setItem('junto_support_token', authToken);
    } catch {}
    return this.session;
  }

  public async loginWithExistingToken(token: string): Promise<AuthSession> {
    const clean = token.trim();
    if (!clean) throw new Error('Token is required');
    api.setToken(clean);

    const claims = decodeJwt(clean);
    if (claims?.email) {
      const agent: SupportAgent = {
        id: claims.sub || '',
        name: claims.name || claims.email,
        email: claims.email,
        role: 'OWNER',
        isActive: true,
        status: 'ACTIVE',
        avatarUrl: claims.picture,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      this.session = { user: agent, isAuthenticated: true, isAuthorized: true, role: 'OWNER', token: clean };
      try { localStorage.setItem('junto_support_session', JSON.stringify(this.session)); } catch {}
      return this.session;
    }
    return await this.getSession();
  }

  public async logout(): Promise<void> {
    try { await api.post('/auth/logout'); } catch {}
    api.setToken(null);
    try {
      localStorage.removeItem('junto_support_session');
      localStorage.removeItem('junto_support_token');
    } catch {}
    this.session = { user: null, isAuthenticated: false, isAuthorized: false, role: null };
  }
}

export const authService = new AuthService();
