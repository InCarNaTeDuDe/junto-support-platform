import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import type { SupportAgent, AgentRole } from '../types/user';

export interface AuthContextType {
  user: SupportAgent | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  role: AgentRole | null;
  isLoading: boolean;
  error: string | null;
  loginWithGoogleIdToken: (idToken: string) => Promise<{ success: boolean; authorized: boolean; error?: string }>;
  loginWithExistingToken: (token: string) => Promise<{ success: boolean; authorized: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupportAgent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [role, setRole] = useState<AgentRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const init = async () => {
    setIsLoading(true);
    try {
      const s = await authService.getSession();
      setUser(s.user);
      setIsAuthenticated(s.isAuthenticated);
      setIsAuthorized(s.isAuthorized);
      setRole(s.role);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { init(); }, []);

  const handleAuthResult = (s: any) => {
    setUser(s.user);
    setIsAuthenticated(s.isAuthenticated);
    setIsAuthorized(s.isAuthorized);
    setRole(s.role);
    setIsLoading(false);
    return { success: true, authorized: s.isAuthorized };
  };

  const loginWithGoogleIdToken = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const s = await authService.loginWithGoogleIdToken(idToken);
      return handleAuthResult(s);
    } catch (err: any) {
      const forbidden = err.status === 403;
      setUser(forbidden ? err.data?.data || err.data?.user || null : null);
      setIsAuthenticated(forbidden);
      setIsAuthorized(false);
      setRole(null);
      setIsLoading(false);
      const msg = err.message || 'Google authentication failed';
      setError(msg);
      return { success: false, authorized: false, error: msg };
    }
  };

  const loginWithExistingToken = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const s = await authService.loginWithExistingToken(token);
      return handleAuthResult(s);
    } catch (err: any) {
      setUser(null);
      setIsAuthenticated(false);
      setIsAuthorized(false);
      setRole(null);
      setIsLoading(false);
      const msg = err.message || 'Authentication failed';
      setError(msg);
      return { success: false, authorized: false, error: msg };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsAuthorized(false);
      setRole(null);
      setIsLoading(false);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAuthorized,
        role,
        isLoading,
        error,
        loginWithGoogleIdToken,
        loginWithExistingToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
