export type AgentRole = 'OWNER' | 'SUPPORT';

export type AgentStatus = 'ACTIVE' | 'INACTIVE';

export interface SupportAgent {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: AgentRole;
  isActive: boolean;
  status?: AgentStatus;
  avatarUrl?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: SupportAgent | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  role: AgentRole | null;
  token?: string;
}

export interface GoogleAuthPayload {
  credential?: string;
  code?: string;
  email?: string;
  name?: string;
}
