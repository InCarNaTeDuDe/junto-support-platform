import { api, ApiError } from "./api";
import type { SupportAgent, AuthSession, AgentRole } from "../types/user";

class AuthService {
  private currentSession: AuthSession = {
    user: null,
    isAuthenticated: false,
    isAuthorized: false,
    role: null,
  };

  /**
   * Retrieve the currently authenticated user from backend.
   * Primary route: GET /api/auth/me (fallback: GET /api/support/me).
   * Verifies if user exists in support_agents with role OWNER or SUPPORT and isActive === true.
   * Non-support users (e.g. role USER) or inactive agents result in isAuthorized: false (Access Denied).
   */
  public async getSession(): Promise<AuthSession> {
    try {
      let response: any = null;

      try {
        response = await api.get("/auth/me");
      } catch (err: any) {
        if (err.status === 404) {
          response = await api.get("/support/me");
        } else {
          throw err;
        }
      }

      const userData = response?.data || response?.user || response;

      if (userData && (userData.id || userData.email || userData.userId)) {
        const rawRole: string = (userData.role || "").toUpperCase();
        const role: AgentRole | null =
          rawRole === "OWNER"
            ? "OWNER"
            : rawRole === "SUPPORT"
              ? "SUPPORT"
              : null;

        const isActive: boolean =
          userData.isActive !== false && userData.status !== "INACTIVE";
        const isAuthorized: boolean =
          isActive && (role === "OWNER" || role === "SUPPORT");

        const agent: SupportAgent = {
          id: userData.id || userData.userId || "agent-id",
          userId: userData.userId || userData.id,
          name:
            userData.name ||
            userData.fullName ||
            userData.email?.split("@")[0] ||
            "Support Agent",
          email: userData.email || "",
          role: role || "SUPPORT",
          isActive,
          status: isActive ? "ACTIVE" : "INACTIVE",
          avatarUrl: userData.avatarUrl || userData.picture,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt,
        };

        this.currentSession = {
          user: agent,
          isAuthenticated: true,
          isAuthorized,
          role,
        };

        return this.currentSession;
      }

      this.currentSession = {
        user: null,
        isAuthenticated: false,
        isAuthorized: false,
        role: null,
      };
      return this.currentSession;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        const userObj = err.data?.data || err.data?.user || null;
        this.currentSession = {
          user: userObj,
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
        };
        api.setToken(null);
        return this.currentSession;
      }

      // 401 or network failure
      this.currentSession = {
        user: null,
        isAuthenticated: false,
        isAuthorized: false,
        role: null,
      };
      if (err instanceof ApiError && err.status === 401) {
        api.setToken(null);
      }
      return this.currentSession;
    }
  }

  /**
   * Authenticate with Google ID Token against backend route: POST /api/auth/google
   * Matches GoogleWebLoginSchema: { idToken: string, platform: "WEB", deviceInfo?: {...} }
   */
  public async loginWithGoogleIdToken(idToken: string): Promise<AuthSession> {
    if (!idToken || !idToken.trim()) {
      throw new Error("Google ID token is required");
    }

    const payload = {
      idToken: idToken.trim(),
      platform: "WEB" as const,
      deviceInfo: {
        platform: "WEB",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
      },
    };

    try {
      let response: any = null;

      try {
        response = await api.post("/auth/google", payload);
      } catch (err: any) {
        if (err.status === 404) {
          response = await api.post("/support/auth/google", payload);
        } else {
          throw err;
        }
      }

      const token =
        response?.token || response?.accessToken || response?.data?.token;
      if (token) {
        api.setToken(token);
      }

      return await this.getSession();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        this.currentSession = {
          user: err.data?.data || err.data?.user || null,
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
        };
      }
      throw err;
    }
  }

  /**
   * Authenticate directly with a Bearer JWT token (e.g. from existing Junto session)
   */
  public async loginWithExistingToken(token: string): Promise<AuthSession> {
    if (!token || !token.trim()) {
      throw new Error("Token is required");
    }
    api.setToken(token.trim());
    return await this.getSession();
  }

  /**
   * Log out session
   */
  public async logout(): Promise<void> {
    try {
      try {
        await api.post("/auth/logout");
      } catch {
        await api.post("/support/auth/logout");
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      api.setToken(null);
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
