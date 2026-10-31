import type { SupportAgent, AgentRole } from './user';

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CaseCategory =
  | 'ACCOUNT'
  | 'PAYMENT'
  | 'TRIP'
  | 'DELIVERY'
  | 'TECHNICAL'
  | 'SAFETY'
  | 'GENERAL';

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
  type: 'TRIP' | 'ORDER' | 'TRANSACTION' | 'VEHICLE';
  id: string;
  summary?: string;
  amount?: string;
  date?: string;
}

export type MessageType = 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'INTERNAL_NOTE';

export interface CaseMessage {
  id: string;
  caseId: string;
  senderType: MessageType;
  senderId: string;
  senderName: string;
  senderRole?: AgentRole;
  content: string;
  createdAt: string;
}

export interface SupportCase {
  id: string;
  caseNumber: string;
  customerId: string;
  customer: CustomerInfo;
  subject: string;
  description: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  assignedAgentId: string | null;
  assignedAgent?: SupportAgent | null;
  relatedEntity?: RelatedEntity | null;
  createdAt: string;
  updatedAt: string;
  messages?: CaseMessage[];
}

export interface CasesSummary {
  total: number;
  open: number;
  inProgress: number;
  waitingForUser: number;
  resolved: number;
  criticalOrHigh: number;
  unassigned: number;
}

export interface CaseFilterOptions {
  search?: string;
  status?: CaseStatus | 'ALL';
  priority?: CasePriority | 'ALL';
  category?: CaseCategory | 'ALL';
  assignedAgentId?: string | 'ALL' | 'UNASSIGNED';
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
