import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export interface AuthContextType extends AuthState {
  loginWithGoogle: (email: string, name?: string, credential?: string) => Promise<{ success: boolean; authorized: boolean; error?: string }>;
  loginWithGoogleIdToken: (idToken: string) => Promise<{ success: boolean; authorized: boolean; error?: string }>;
  loginWithExistingToken: (token: string) => Promise<{ success: boolean; authorized: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupportAgent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [role, setRole] = useState<AgentRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authService.getSession();
      setUser(session.user);
      setIsAuthenticated(session.isAuthenticated);
      setIsAuthorized(session.isAuthorized);
      setRole(session.role);
    } catch (err: any) {
      setUser(null);
      setIsAuthenticated(false);
      setIsAuthorized(false);
      setRole(null);
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loginWithGoogle = async (email: string, name?: string, credential?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authService.loginWithGoogle({ email, name, credential });
      setUser(session.user);
      setIsAuthenticated(session.isAuthenticated);
      setIsAuthorized(session.isAuthorized);
      setRole(session.role);
      setIsLoading(false);
      return { success: true, authorized: session.isAuthorized };
    } catch (err: any) {
      const isUnauthorized = err.status === 403;
      setUser(
        isUnauthorized
          ? {
              id: 'unauth-user',
              userId: 'user-external-999',
              email,
              name: name || 'User',
              role: 'SUPPORT',
              isActive: false,
              status: 'INACTIVE',
              createdAt: '',
            }
          : null
      );
      setIsAuthenticated(isUnauthorized);
      setIsAuthorized(false);
      setRole(null);
      setIsLoading(false);
      const errMsg = err.message || 'Authentication failed';
      setError(errMsg);
      return { success: false, authorized: false, error: errMsg };
    }
  };

  const loginWithGoogleIdToken = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authService.loginWithGoogleIdToken(idToken);
      setUser(session.user);
      setIsAuthenticated(session.isAuthenticated);
      setIsAuthorized(session.isAuthorized);
      setRole(session.role);
      setIsLoading(false);
      return { success: true, authorized: session.isAuthorized };
    } catch (err: any) {
      const isUnauthorized = err.status === 403;
      setUser(null);
      setIsAuthenticated(isUnauthorized);
      setIsAuthorized(false);
      setRole(null);
      setIsLoading(false);
      const errMsg = err.message || 'Google authentication failed';
      setError(errMsg);
      return { success: false, authorized: false, error: errMsg };
    }
  };

  const loginWithExistingToken = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authService.loginWithExistingToken(token);
      setUser(session.user);
      setIsAuthenticated(session.isAuthenticated);
      setIsAuthorized(session.isAuthorized);
      setRole(session.role);
      setIsLoading(false);
      return { success: true, authorized: session.isAuthorized };
    } catch (err: any) {
      const isUnauthorized = err.status === 403;
      setUser(null);
      setIsAuthenticated(isUnauthorized);
      setIsAuthorized(false);
      setRole(null);
      setIsLoading(false);
      const errMsg = err.message || 'Authentication with token failed';
      setError(errMsg);
      return { success: false, authorized: false, error: errMsg };
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

  const clearError = () => {
    setError(null);
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
        loginWithGoogle,
        loginWithGoogleIdToken,
        loginWithExistingToken,
        logout,
        clearError,
        initialize,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
