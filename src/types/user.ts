export type AgentRole = 'OWNER' | 'SUPPORT';

export type AgentStatus = 'ACTIVE' | 'INACTIVE';

export interface SupportAgent {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: AgentRole;
  status: AgentStatus;
  createdAt: string;
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
