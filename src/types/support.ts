import type { SupportAgent, AgentRole } from './user';

export type CaseStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'Under Review';

export type CasePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseCategory =
  | 'RIDES'
  | 'DAYMATES'
  | 'SERVICES'
  | 'TICKETS'
  | 'DEALS'
  | 'HELPME'
  | 'ACCOUNT'
  | 'SAFETY'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'TECHNICAL'
  | 'GENERAL'
  | string;

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  rating?: number;
  juntoMemberSince?: string;
}

export interface RelatedEntity {
  type: string;
  id: string;
  summary?: string;
  amount?: string;
  date?: string;
}

export type MessageSenderType = 'USER' | 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'INTERNAL_NOTE';

export interface SupportCaseMessage {
  id: string;
  caseId?: string;
  senderType: MessageSenderType;
  sender?: {
    id: string;
    name: string;
    role?: AgentRole;
  };
  senderId?: string;
  senderName?: string;
  senderRole?: AgentRole;
  message: string;
  content?: string; // alias for message compatibility
  isInternalNote: boolean;
  createdAt: string;
}

// Backward-compatibility alias
export type CaseMessage = SupportCaseMessage;

export interface SupportCase {
  id: string;
  caseNumber: string;
  customerId?: string;
  customer: CustomerInfo;
  chatSessionId?: string;
  category: CaseCategory;
  issueType?: string;
  subject: string;
  description?: string;
  priority: CasePriority;
  status: CaseStatus;
  assignedAgent?: {
    id: string;
    name: string;
    role?: AgentRole;
    email?: string;
  } | null;
  assignedAgentId?: string | null;
  relatedEntity?: RelatedEntity | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  estimatedResponseTime?: string;
  messages?: SupportCaseMessage[];
}

export interface DashboardSummary {
  totalCases: number;
  openCases: number;
  assignedCases: number;
  inProgressCases: number;
  waitingForUserCases: number;
  resolvedCases: number;
  unassignedCases: number;
  criticalCases: number;
  highPriorityCases: number;
}

// Backward-compatibility alias for Dashboard UI
export interface CasesSummary extends DashboardSummary {
  total: number;
  open: number;
  inProgress: number;
  waitingForUser: number;
  resolved: number;
  criticalOrHigh: number;
  unassigned: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
  error?: string;
}

export interface CaseFilterOptions {
  search?: string;
  status?: CaseStatus | 'ALL';
  priority?: CasePriority | 'ALL';
  category?: CaseCategory | 'ALL';
  assignedTo?: string; // agent UUID or 'unassigned'
  assignedAgentId?: string | 'ALL' | 'UNASSIGNED'; // alias
  view?: 'ALL' | 'MY_CASES' | 'UNASSIGNED' | 'RESOLVED';
  sortBy?: 'newest' | 'oldest' | 'priority' | 'status';
  page?: number;
  limit?: number;
}

export interface PaginatedCasesResult {
  cases: SupportCase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
