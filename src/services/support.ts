import { api, ApiError } from './api';
import type {
  SupportCase,
  CasesSummary,
  DashboardSummary,
  CaseFilterOptions,
  PaginatedCasesResult,
  SupportCaseMessage,
  CaseStatus,
  CasePriority,
  ApiResponse,
} from '../types/support';
import type { SupportAgent, AgentRole } from '../types/user';

// Mock agents matching the API contract specification for development/fallback
const INITIAL_JUNTO_AGENTS: SupportAgent[] = [
  {
    id: 'agent-owner-uuid-1',
    userId: 'user-owner-101',
    email: 'sarah.owner@junto.com',
    name: 'Sarah Connor',
    role: 'OWNER',
    isActive: true,
    status: 'ACTIVE',
    createdAt: '2024-01-15T08:00:00Z',
    lastLoginAt: '2026-10-31T09:45:00Z',
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
    lastLoginAt: '2026-10-31T10:10:00Z',
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
    lastLoginAt: '2026-10-30T18:22:00Z',
  },
  {
    id: 'agent-supp-uuid-4',
    userId: 'user-supp-404',
    email: 'tarek.support@junto.com',
    name: 'Tarek Mansour',
    role: 'SUPPORT',
    isActive: false,
    status: 'INACTIVE',
    createdAt: '2024-08-01T09:00:00Z',
    lastLoginAt: '2026-10-15T11:00:00Z',
  },
];

// Initial realistic Junto cases conforming to contract for fallback
const INITIAL_JUNTO_CASES: SupportCase[] = [
  {
    id: 'case-uuid-101',
    caseNumber: 'JNT-2026-001024',
    customerId: 'user-uuid-101',
    customer: {
      id: 'user-uuid-101',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '9876543210',
      rating: 4.9,
      juntoMemberSince: '2023-04-12',
    },
    chatSessionId: 'session-rides-101',
    category: 'RIDES',
    issueType: 'DRIVER_NOT_ARRIVED',
    subject: "Driver didn't arrive",
    description: 'My driver did not arrive at the pickup point at Central Station. The ride was marked complete or timed out without pickup.',
    priority: 'HIGH',
    status: 'OPEN',
    assignedAgentId: null,
    assignedAgent: null,
    relatedEntity: {
      type: 'RIDE',
      id: 'ride-uuid-9901',
      summary: 'Central Station -> Tech Park Phase 2',
      amount: '₹340.00',
      date: '2026-10-31 09:30',
    },
    createdAt: '2026-10-31T09:35:00Z',
    updatedAt: '2026-10-31T09:35:00Z',
    messages: [
      {
        id: 'msg-uuid-1',
        caseId: 'case-uuid-101',
        senderType: 'USER',
        sender: {
          id: 'user-uuid-101',
          name: 'Rahul Sharma',
        },
        message: "My driver didn't arrive at the pickup point.",
        content: "My driver didn't arrive at the pickup point.",
        isInternalNote: false,
        createdAt: '2026-10-31T09:35:00Z',
      },
      {
        id: 'msg-uuid-2',
        caseId: 'case-uuid-101',
        senderType: 'SYSTEM',
        sender: {
          id: 'system',
          name: 'Junto System',
        },
        message: 'Case escalated from Junto Mobile Support Chat (Ride: ride-uuid-9901).',
        content: 'Case escalated from Junto Mobile Support Chat (Ride: ride-uuid-9901).',
        isInternalNote: false,
        createdAt: '2026-10-31T09:35:02Z',
      },
    ],
  },
  {
    id: 'case-uuid-102',
    caseNumber: 'JNT-2026-001025',
    customerId: 'user-uuid-102',
    customer: {
      id: 'user-uuid-102',
      name: 'Priya Patel',
      email: 'priya.patel@novatech.in',
      phone: '9812345678',
      rating: 4.8,
      juntoMemberSince: '2022-11-03',
    },
    chatSessionId: 'session-safety-102',
    category: 'SAFETY',
    issueType: 'VEHICLE_PLATE_MISMATCH',
    subject: 'Driver vehicle plate did not match Junto app details',
    description: 'When the car arrived, the license plate was KA05MN1234 instead of KA01AB9876 shown in the app. Passenger felt unsafe and cancelled.',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    assignedAgentId: 'agent-supp-uuid-2',
    assignedAgent: INITIAL_JUNTO_AGENTS[1], // Marcus Wright
    relatedEntity: {
      type: 'RIDE',
      id: 'ride-uuid-9902',
      summary: 'Koramangala 4th Block -> Airport Terminal 1',
      amount: '₹850.00',
      date: '2026-10-31 08:15',
    },
    createdAt: '2026-10-31T08:20:00Z',
    updatedAt: '2026-10-31T09:10:00Z',
    messages: [
      {
        id: 'msg-uuid-201',
        caseId: 'case-uuid-102',
        senderType: 'USER',
        sender: {
          id: 'user-uuid-102',
          name: 'Priya Patel',
        },
        message: 'The car that arrived had a completely different number plate than what was shown in the app. I refused to board.',
        content: 'The car that arrived had a completely different number plate than what was shown in the app. I refused to board.',
        isInternalNote: false,
        createdAt: '2026-10-31T08:20:00Z',
      },
      {
        id: 'msg-uuid-202',
        caseId: 'case-uuid-102',
        senderType: 'AGENT',
        sender: {
          id: 'agent-supp-uuid-2',
          name: 'Marcus Wright',
          role: 'SUPPORT',
        },
        message: 'Hello Priya, thank you for putting your safety first. I have locked the driver account pending vehicle document re-verification and waived your cancellation fee.',
        content: 'Hello Priya, thank you for putting your safety first. I have locked the driver account pending vehicle document re-verification and waived your cancellation fee.',
        isInternalNote: false,
        createdAt: '2026-10-31T09:05:00Z',
      },
      {
        id: 'msg-uuid-203',
        caseId: 'case-uuid-102',
        senderType: 'AGENT',
        sender: {
          id: 'agent-supp-uuid-2',
          name: 'Marcus Wright',
          role: 'SUPPORT',
        },
        message: 'Internal Note: Flagged driver KYC vehicle profile #VK-991 for manual fleet audit.',
        content: 'Internal Note: Flagged driver KYC vehicle profile #VK-991 for manual fleet audit.',
        isInternalNote: true,
        createdAt: '2026-10-31T09:10:00Z',
      },
    ],
  },
  {
    id: 'case-uuid-103',
    caseNumber: 'JNT-2026-001026',
    customerId: 'user-uuid-103',
    customer: {
      id: 'user-uuid-103',
      name: 'Amit Verma',
      email: 'amit.verma@apex.org',
      phone: '9789012345',
      rating: 4.7,
      juntoMemberSince: '2024-02-18',
    },
    chatSessionId: 'session-payment-103',
    category: 'PAYMENT',
    issueType: 'DOUBLE_DEDUCTION',
    subject: 'Double charged for local service booking',
    description: 'My Junto Pay wallet was debited twice for electrical repair service #SRV-44120.',
    priority: 'HIGH',
    status: 'WAITING_FOR_USER',
    assignedAgentId: 'agent-supp-uuid-3',
    assignedAgent: INITIAL_JUNTO_AGENTS[2], // Elena Rostova
    relatedEntity: {
      type: 'TRANSACTION',
      id: 'txn-uuid-8831',
      summary: 'Electrical Repair Booking',
      amount: '₹450.00',
      date: '2026-10-30 14:00',
    },
    createdAt: '2026-10-30T14:15:00Z',
    updatedAt: '2026-10-31T10:00:00Z',
    messages: [
      {
        id: 'msg-uuid-301',
        caseId: 'case-uuid-103',
        senderType: 'USER',
        sender: {
          id: 'user-uuid-103',
          name: 'Amit Verma',
        },
        message: 'I see two separate debits of ₹450 each on my bank statement for the same service technician booking.',
        content: 'I see two separate debits of ₹450 each on my bank statement for the same service technician booking.',
        isInternalNote: false,
        createdAt: '2026-10-30T14:15:00Z',
      },
      {
        id: 'msg-uuid-302',
        caseId: 'case-uuid-103',
        senderType: 'AGENT',
        sender: {
          id: 'agent-supp-uuid-3',
          name: 'Elena Rostova',
          role: 'SUPPORT',
        },
        message: 'Hi Amit, we identified the duplicate gateway authorization. Could you share the last 4 digits of your payment card so we can initiate the direct charge reversal?',
        content: 'Hi Amit, we identified the duplicate gateway authorization. Could you share the last 4 digits of your payment card so we can initiate the direct charge reversal?',
        isInternalNote: false,
        createdAt: '2026-10-31T10:00:00Z',
      },
    ],
  },
  {
    id: 'case-uuid-104',
    caseNumber: 'JNT-2026-001027',
    customerId: 'user-uuid-104',
    customer: {
      id: 'user-uuid-104',
      name: 'Ananya Roy',
      email: 'ananya.roy@gmail.com',
      phone: '9901122334',
      rating: 5.0,
      juntoMemberSince: '2023-08-14',
    },
    chatSessionId: 'session-tickets-104',
    category: 'TICKETS',
    issueType: 'TICKET_TRANSFER_PROBLEM',
    subject: 'Movie ticket QR code not received from seller',
    description: 'Purchased 2 tickets for Inception IMAX screening. Seller marked deal completed but did not send ticket transfer link.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    assignedAgentId: 'agent-supp-uuid-2',
    assignedAgent: INITIAL_JUNTO_AGENTS[1], // Marcus Wright
    relatedEntity: {
      type: 'TICKET',
      id: 'tkt-uuid-5519',
      summary: 'Inception IMAX (2 Tickets)',
      amount: '₹600.00',
      date: '2026-10-29 19:30',
    },
    createdAt: '2026-10-29T20:00:00Z',
    updatedAt: '2026-10-30T11:20:00Z',
    resolvedAt: '2026-10-30T11:20:00Z',
    messages: [
      {
        id: 'msg-uuid-401',
        caseId: 'case-uuid-104',
        senderType: 'USER',
        sender: {
          id: 'user-uuid-104',
          name: 'Ananya Roy',
        },
        message: 'The seller claimed they sent the BookMyShow transfer, but nothing has arrived.',
        content: 'The seller claimed they sent the BookMyShow transfer, but nothing has arrived.',
        isInternalNote: false,
        createdAt: '2026-10-29T20:00:00Z',
      },
      {
        id: 'msg-uuid-402',
        caseId: 'case-uuid-104',
        senderType: 'AGENT',
        sender: {
          id: 'agent-supp-uuid-2',
          name: 'Marcus Wright',
          role: 'SUPPORT',
        },
        message: 'Hi Ananya, we contacted the seller directly and forwarded the verified PDF tickets to your registered email. Have a great movie!',
        content: 'Hi Ananya, we contacted the seller directly and forwarded the verified PDF tickets to your registered email. Have a great movie!',
        isInternalNote: false,
        createdAt: '2026-10-30T11:20:00Z',
      },
    ],
  },
];

class SupportService {
  private fallbackCases: SupportCase[] = [];
  private fallbackAgents: SupportAgent[] = [];

  constructor() {
    this.initFallbackData();
  }

  private initFallbackData() {
    try {
      const savedCases = localStorage.getItem('junto_support_mock_cases');
      if (savedCases) {
        this.fallbackCases = JSON.parse(savedCases);
      } else {
        this.fallbackCases = JSON.parse(JSON.stringify(INITIAL_JUNTO_CASES));
        this.saveCases();
      }

      const savedAgents = localStorage.getItem('junto_support_mock_agents');
      if (savedAgents) {
        this.fallbackAgents = JSON.parse(savedAgents);
      } else {
        this.fallbackAgents = JSON.parse(JSON.stringify(INITIAL_JUNTO_AGENTS));
        this.saveAgents();
      }
    } catch {
      this.fallbackCases = JSON.parse(JSON.stringify(INITIAL_JUNTO_CASES));
      this.fallbackAgents = JSON.parse(JSON.stringify(INITIAL_JUNTO_AGENTS));
    }
  }

  private saveCases() {
    try {
      localStorage.setItem('junto_support_mock_cases', JSON.stringify(this.fallbackCases));
    } catch (e) {
      console.warn('Unable to persist cases to localStorage', e);
    }
  }

  private saveAgents() {
    try {
      localStorage.setItem('junto_support_mock_agents', JSON.stringify(this.fallbackAgents));
    } catch (e) {
      console.warn('Unable to persist agents to localStorage', e);
    }
  }

  /**
   * GET /api/support/dashboard/summary
   * Fetch dashboard statistics.
   */
  public async getSummary(): Promise<CasesSummary> {
    try {
      const response = await api.get<ApiResponse<DashboardSummary> | { success: boolean; data?: DashboardSummary }>('/support/dashboard/summary');
      const raw = (response as any)?.data || response;

      if (raw && (raw.totalCases !== undefined || raw.total !== undefined)) {
        const total = raw.totalCases ?? raw.total ?? 0;
        const open = raw.openCases ?? raw.open ?? 0;
        const assigned = raw.assignedCases ?? raw.assigned ?? 0;
        const inProgress = raw.inProgressCases ?? raw.inProgress ?? 0;
        const waitingForUser = raw.waitingForUserCases ?? raw.waitingForUser ?? 0;
        const resolved = raw.resolvedCases ?? raw.resolved ?? 0;
        const unassigned = raw.unassignedCases ?? raw.unassigned ?? 0;
        const critical = raw.criticalCases ?? 0;
        const high = raw.highPriorityCases ?? 0;
        const criticalOrHigh = critical + high;

        return {
          totalCases: total,
          openCases: open,
          assignedCases: assigned,
          inProgressCases: inProgress,
          waitingForUserCases: waitingForUser,
          resolvedCases: resolved,
          unassignedCases: unassigned,
          criticalCases: critical,
          highPriorityCases: high,
          // UI aliases
          total,
          open,
          inProgress,
          waitingForUser,
          resolved,
          unassigned,
          criticalOrHigh: criticalOrHigh || (raw.criticalOrHigh ?? 0),
        };
      }
    } catch (err: any) {
      console.info('GET /api/support/dashboard/summary returned error or pending backend:', err.message);
    }

    // Dynamic calculation from fallback dataset
    const total = this.fallbackCases.length;
    const open = this.fallbackCases.filter((c) => c.status === 'OPEN').length;
    const inProgress = this.fallbackCases.filter((c) => c.status === 'IN_PROGRESS').length;
    const waitingForUser = this.fallbackCases.filter((c) => c.status === 'WAITING_FOR_USER').length;
    const resolved = this.fallbackCases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const unassigned = this.fallbackCases.filter((c) => !c.assignedAgentId && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const critical = this.fallbackCases.filter((c) => c.priority === 'CRITICAL' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const high = this.fallbackCases.filter((c) => c.priority === 'HIGH' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const assigned = this.fallbackCases.filter((c) => !!c.assignedAgentId && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;

    return {
      totalCases: total,
      openCases: open,
      assignedCases: assigned,
      inProgressCases: inProgress,
      waitingForUserCases: waitingForUser,
      resolvedCases: resolved,
      unassignedCases: unassigned,
      criticalCases: critical,
      highPriorityCases: high,
      total,
      open,
      inProgress,
      waitingForUser,
      resolved,
      unassigned,
      criticalOrHigh: critical + high,
    };
  }

  /**
   * GET /api/support/dashboard/recent-cases?limit=10
   */
  public async getRecentCases(limit: number = 10): Promise<SupportCase[]> {
    try {
      const response = await api.get<ApiResponse<SupportCase[]> | { success: boolean; data?: SupportCase[] }>('/support/dashboard/recent-cases', { limit });
      const list = (response as any)?.data || response;
      if (Array.isArray(list)) {
        return list;
      }
    } catch (err: any) {
      console.info('GET /api/support/dashboard/recent-cases returned error or pending backend:', err.message);
    }

    return [...this.fallbackCases]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * GET /api/support/cases
   * Fetch support cases with pagination, search and filtering.
   * Query params: page, limit, status, priority, category, assignedTo, search
   */
  public async getCases(filters: CaseFilterOptions = {}): Promise<PaginatedCasesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    // Map UI view or assignedAgentId to API query parameter `assignedTo`
    let assignedToParam: string | undefined = undefined;
    if (filters.assignedTo) {
      assignedToParam = filters.assignedTo;
    } else if (filters.view === 'UNASSIGNED' || filters.assignedAgentId === 'UNASSIGNED') {
      assignedToParam = 'unassigned';
    } else if (filters.view === 'MY_CASES' && filters.assignedAgentId) {
      assignedToParam = filters.assignedAgentId;
    } else if (filters.assignedAgentId && filters.assignedAgentId !== 'ALL') {
      assignedToParam = filters.assignedAgentId;
    }

    let statusParam = filters.status;
    if (filters.view === 'RESOLVED') {
      statusParam = 'RESOLVED';
    }

    const queryParams: Record<string, any> = {
      page,
      limit,
    };

    if (statusParam && statusParam !== 'ALL') queryParams.status = statusParam;
    if (filters.priority && filters.priority !== 'ALL') queryParams.priority = filters.priority;
    if (filters.category && filters.category !== 'ALL') queryParams.category = filters.category;
    if (assignedToParam) queryParams.assignedTo = assignedToParam;
    if (filters.search && filters.search.trim()) queryParams.search = filters.search.trim();

    try {
      const response = await api.get<any>('/support/cases', queryParams);

      // 1. Check if backend returned standard contract { success: true, data: [...], pagination: { ... } }
      if (response && Array.isArray(response.data)) {
        const casesList: SupportCase[] = response.data;
        const pagination = response.pagination || {};
        return {
          cases: casesList,
          total: pagination.totalRecords ?? casesList.length,
          page: pagination.page ?? page,
          limit: pagination.limit ?? limit,
          totalPages: pagination.totalPages ?? (Math.ceil((pagination.totalRecords || casesList.length) / limit) || 1),
        };
      }

      // 2. Check if customer router format { success: true, cases: [...] }
      if (response && Array.isArray(response.cases)) {
        const rawCases = response.cases;
        const normalized = rawCases.map((c: any) => ({
          id: c.id || c.caseNumber,
          caseNumber: c.caseNumber,
          customerId: c.userId || 'user-customer',
          customer: c.customer || {
            id: c.userId || 'user-customer',
            name: c.customerName || 'Junto User',
            email: c.customerEmail || 'user@junto.com',
          },
          category: c.category,
          issueType: c.issueType || '',
          subject: c.summary || c.subject || 'Support Issue',
          description: c.details || c.description || '',
          priority: c.priority || 'MEDIUM',
          status: c.status === 'Under Review' ? 'OPEN' : (c.status || 'OPEN'),
          assignedAgentId: c.assignedAgentId || null,
          assignedAgent: c.assignedAgent || null,
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
          relatedEntity: c.relatedEntityType ? { type: c.relatedEntityType, id: c.relatedEntityId } : null,
        }));

        return {
          cases: normalized,
          total: normalized.length,
          page: 1,
          limit: normalized.length || 10,
          totalPages: 1,
        };
      }
    } catch (err: any) {
      console.info('GET /api/support/cases returned error or pending backend:', err.message);
    }

    // Fallback in-browser filtering
    let filtered = [...this.fallbackCases];

    if (filters.view === 'MY_CASES' && filters.assignedAgentId) {
      filtered = filtered.filter((c) => c.assignedAgentId === filters.assignedAgentId);
    } else if (filters.view === 'UNASSIGNED' || assignedToParam === 'unassigned') {
      filtered = filtered.filter((c) => !c.assignedAgentId && c.status !== 'RESOLVED' && c.status !== 'CLOSED');
    } else if (filters.view === 'RESOLVED' || statusParam === 'RESOLVED') {
      filtered = filtered.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');
    }

    if (statusParam && statusParam !== 'ALL' && filters.view !== 'RESOLVED') {
      filtered = filtered.filter((c) => c.status === statusParam);
    }

    if (filters.priority && filters.priority !== 'ALL') {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }

    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((c) => c.category?.toUpperCase() === filters.category?.toUpperCase());
    }

    if (assignedToParam && assignedToParam !== 'unassigned') {
      filtered = filtered.filter((c) => c.assignedAgentId === assignedToParam);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.customer.name.toLowerCase().includes(q) ||
          c.customer.email.toLowerCase().includes(q)
      );
    }

    // Sort
    if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === 'priority') {
      const pOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      filtered.sort((a, b) => (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0));
    } else if (filters.sortBy === 'status') {
      filtered.sort((a, b) => a.status.localeCompare(b.status));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      cases: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    };
  }

  /**
   * GET /api/support/cases/:caseId
   * Fetch individual case details and messages.
   */
  public async getCaseById(caseId: string): Promise<SupportCase> {
    try {
      const response = await api.get<any>(`/support/cases/${caseId}`);
      let caseData: SupportCase | null = null;

      if (response && response.data) {
        caseData = response.data;
      } else if (response && response.case) {
        const c = response.case;
        caseData = {
          id: c.id || c.caseNumber,
          caseNumber: c.caseNumber,
          customer: c.customer || {
            id: c.userId || 'user-uuid',
            name: c.customerName || 'Junto User',
            email: c.customerEmail || 'user@junto.com',
            phone: c.phone || '9876543210',
          },
          category: c.category,
          issueType: c.issueType || '',
          subject: c.summary || c.subject || 'Support Issue',
          description: c.details || c.description || '',
          priority: c.priority || 'MEDIUM',
          status: c.status === 'Under Review' ? 'OPEN' : (c.status || 'OPEN'),
          assignedAgentId: c.assignedAgentId || null,
          assignedAgent: c.assignedAgent || null,
          relatedEntity: c.relatedEntity || (c.relatedEntityType ? { type: c.relatedEntityType, id: c.relatedEntityId } : null),
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
        };
      }

      if (caseData) {
        // Fetch messages if not embedded
        if (!caseData.messages || caseData.messages.length === 0) {
          try {
            const msgs = await this.getCaseMessages(caseId);
            caseData.messages = msgs;
          } catch {
            // ignore if messages endpoint fails
          }
        }
        return caseData;
      }
    } catch (err: any) {
      console.info(`GET /api/support/cases/${caseId} returned error:`, err.message);
    }

    const found = this.fallbackCases.find((c) => c.id === caseId || c.caseNumber === caseId);
    if (!found) {
      throw new ApiError(404, `Support case #${caseId} not found`);
    }
    return found;
  }

  /**
   * PATCH /api/support/cases/:caseId/assign
   * Request: { "agentId": "agent-uuid" | null }
   */
  public async assignCase(caseId: string, agentId: string | null, _agentName?: string): Promise<SupportCase> {
    try {
      const response = await api.patch<any>(`/support/cases/${caseId}/assign`, { agentId });
      if (response && response.data) {
        return await this.getCaseById(caseId);
      }
    } catch (err: any) {
      console.info(`PATCH /api/support/cases/${caseId}/assign returned error:`, err.message);
    }

    // Fallback update
    const c = this.fallbackCases.find((x) => x.id === caseId || x.caseNumber === caseId);
    if (c) {
      c.assignedAgentId = agentId;
      const agent = this.fallbackAgents.find((a) => a.id === agentId) || null;
      c.assignedAgent = agent;
      if (agentId && c.status === 'OPEN') {
        c.status = 'ASSIGNED';
      }
      c.updatedAt = new Date().toISOString();

      if (!c.messages) c.messages = [];
      const label = agent ? `Assigned to ${agent.name}` : 'Unassigned';
      c.messages.push({
        id: `sys-${Date.now()}`,
        caseId: c.id,
        senderType: 'SYSTEM',
        sender: { id: 'system', name: 'Junto System' },
        message: `${label} by Support Supervisor`,
        content: `${label} by Support Supervisor`,
        isInternalNote: false,
        createdAt: new Date().toISOString(),
      });

      this.saveCases();
      return c;
    }

    throw new ApiError(404, `Case #${caseId} not found`);
  }

  /**
   * PATCH /api/support/cases/:caseId/status
   * Request: { "status": "IN_PROGRESS" }
   */
  public async updateStatus(caseId: string, status: CaseStatus, agentName: string): Promise<SupportCase> {
    try {
      const response = await api.patch<any>(`/support/cases/${caseId}/status`, { status });
      if (response && response.data) {
        return await this.getCaseById(caseId);
      }
    } catch (err: any) {
      console.info(`PATCH /api/support/cases/${caseId}/status returned error:`, err.message);
    }

    const c = this.fallbackCases.find((x) => x.id === caseId || x.caseNumber === caseId);
    if (c) {
      c.status = status;
      c.updatedAt = new Date().toISOString();
      if (status === 'RESOLVED') {
        c.resolvedAt = new Date().toISOString();
      } else if (status === 'CLOSED') {
        c.closedAt = new Date().toISOString();
      }

      if (!c.messages) c.messages = [];
      c.messages.push({
        id: `sys-${Date.now()}`,
        caseId: c.id,
        senderType: 'SYSTEM',
        sender: { id: 'system', name: 'Junto System' },
        message: `Status updated to ${status.replace(/_/g, ' ')} by ${agentName}`,
        content: `Status updated to ${status.replace(/_/g, ' ')} by ${agentName}`,
        isInternalNote: false,
        createdAt: new Date().toISOString(),
      });

      this.saveCases();
      return c;
    }

    throw new ApiError(404, `Case #${caseId} not found`);
  }

  /**
   * PATCH /api/support/cases/:caseId/priority
   * Request: { "priority": "CRITICAL" }
   */
  public async updatePriority(caseId: string, priority: CasePriority, agentName: string): Promise<SupportCase> {
    try {
      const response = await api.patch<any>(`/support/cases/${caseId}/priority`, { priority });
      if (response && response.data) {
        return await this.getCaseById(caseId);
      }
    } catch (err: any) {
      console.info(`PATCH /api/support/cases/${caseId}/priority returned error:`, err.message);
    }

    const c = this.fallbackCases.find((x) => x.id === caseId || x.caseNumber === caseId);
    if (c) {
      c.priority = priority;
      c.updatedAt = new Date().toISOString();

      if (!c.messages) c.messages = [];
      c.messages.push({
        id: `sys-${Date.now()}`,
        caseId: c.id,
        senderType: 'SYSTEM',
        sender: { id: 'system', name: 'Junto System' },
        message: `Priority updated to ${priority} by ${agentName}`,
        content: `Priority updated to ${priority} by ${agentName}`,
        isInternalNote: false,
        createdAt: new Date().toISOString(),
      });

      this.saveCases();
      return c;
    }

    throw new ApiError(404, `Case #${caseId} not found`);
  }

  /**
   * GET /api/support/cases/:caseId/messages
   */
  public async getCaseMessages(caseId: string): Promise<SupportCaseMessage[]> {
    try {
      const response = await api.get<any>(`/support/cases/${caseId}/messages`);
      const msgs = response?.data || response?.messages;
      if (Array.isArray(msgs)) {
        return msgs.map((m: any) => ({
          id: m.id || `msg-${Date.now()}`,
          caseId,
          senderType: m.senderType || (m.sender === 'user' ? 'USER' : 'AGENT'),
          sender: m.sender && typeof m.sender === 'object' ? m.sender : { id: m.senderId || 'sender', name: m.senderName || m.sender || 'Participant' },
          message: m.message || m.text || m.content || '',
          content: m.message || m.text || m.content || '',
          isInternalNote: !!m.isInternalNote,
          createdAt: m.createdAt || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.info(`GET /api/support/cases/${caseId}/messages returned error:`, err.message);
    }

    const found = this.fallbackCases.find((c) => c.id === caseId || c.caseNumber === caseId);
    return found?.messages || [];
  }

  /**
   * POST /api/support/cases/:caseId/messages
   * Request:
   * Customer reply: { "message": "...", "isInternalNote": false }
   * Internal note: { "message": "...", "isInternalNote": true }
   */
  public async addMessage(
    caseId: string,
    message: string,
    isInternalNote: boolean,
    currentAgent: SupportAgent
  ): Promise<SupportCaseMessage> {
    const payload = {
      message,
      isInternalNote,
    };

    try {
      const response = await api.post<any>(`/support/cases/${caseId}/messages`, payload);
      const data = response?.data;
      if (data) {
        return {
          id: data.id || `msg-${Date.now()}`,
          caseId,
          senderType: 'AGENT',
          sender: {
            id: currentAgent.id,
            name: currentAgent.name,
            role: currentAgent.role,
          },
          message: data.message || message,
          content: data.message || message,
          isInternalNote,
          createdAt: data.createdAt || new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.info(`POST /api/support/cases/${caseId}/messages returned error:`, err.message);
    }

    const c = this.fallbackCases.find((x) => x.id === caseId || x.caseNumber === caseId);
    if (c) {
      const newMsg: SupportCaseMessage = {
        id: `msg-${Date.now()}`,
        caseId: c.id,
        senderType: 'AGENT',
        sender: {
          id: currentAgent.id,
          name: currentAgent.name,
          role: currentAgent.role,
        },
        senderName: currentAgent.name,
        senderRole: currentAgent.role,
        message,
        content: message,
        isInternalNote,
        createdAt: new Date().toISOString(),
      };

      if (!c.messages) c.messages = [];
      c.messages.push(newMsg);
      c.updatedAt = new Date().toISOString();

      if (!isInternalNote && (c.status === 'OPEN' || c.status === 'ASSIGNED')) {
        c.status = 'IN_PROGRESS';
      }

      this.saveCases();
      return newMsg;
    }

    throw new ApiError(404, `Case #${caseId} not found`);
  }

  /**
   * GET /api/support/agents
   * Fetch all support agents (OWNER only).
   */
  public async getAgents(): Promise<SupportAgent[]> {
    try {
      const response = await api.get<any>('/support/agents');
      const list = response?.data || response;
      if (Array.isArray(list)) {
        return list.map((a: any) => ({
          ...a,
          isActive: a.isActive !== false && a.status !== 'INACTIVE',
          status: a.isActive !== false && a.status !== 'INACTIVE' ? 'ACTIVE' : 'INACTIVE',
        }));
      }
    } catch (err: any) {
      console.info('GET /api/support/agents returned error:', err.message);
    }

    return [...this.fallbackAgents];
  }

  /**
   * POST /api/support/agents
   * Register an existing Junto user as a support agent.
   * Request: { "userId": "user-uuid", "role": "SUPPORT" }
   */
  public async createAgent(data: { userId?: string; email?: string; name?: string; role: AgentRole }): Promise<SupportAgent> {
    try {
      const response = await api.post<any>('/support/agents', data);
      if (response && response.data) {
        return response.data;
      }
    } catch (err: any) {
      console.info('POST /api/support/agents returned error:', err.message);
      if (err instanceof ApiError && err.status === 403) {
        throw err;
      }
    }

    // Fallback registration
    const newAgent: SupportAgent = {
      id: `agent-uuid-${Date.now()}`,
      userId: data.userId || `user-${Date.now()}`,
      email: data.email || `${data.name?.toLowerCase().replace(/\s+/g, '.')}@junto.com`,
      name: data.name || 'Support Agent',
      role: data.role,
      isActive: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.fallbackAgents.push(newAgent);
    this.saveAgents();
    return newAgent;
  }

  /**
   * PATCH /api/support/agents/:agentId
   * Update agent role or activation status.
   * Request: { "role": "OWNER", "isActive": true }
   */
  public async updateAgent(agentId: string, updates: { role?: AgentRole; isActive?: boolean }): Promise<void> {
    try {
      await api.patch(`/support/agents/${agentId}`, updates);
      return;
    } catch (err: any) {
      console.info(`PATCH /api/support/agents/${agentId} returned error:`, err.message);
      if (err instanceof ApiError && err.status === 403) {
        throw err;
      }
    }

    const a = this.fallbackAgents.find((x) => x.id === agentId);
    if (a) {
      if (updates.role !== undefined) a.role = updates.role;
      if (updates.isActive !== undefined) {
        a.isActive = updates.isActive;
        a.status = updates.isActive ? 'ACTIVE' : 'INACTIVE';
      }
      this.saveAgents();
      return;
    }

    throw new ApiError(404, `Agent #${agentId} not found`);
  }

  // Alias for backward compatibility with Agents.svelte
  public async updateAgentRole(agentId: string, role: AgentRole): Promise<void> {
    return this.updateAgent(agentId, { role });
  }

  public async updateAgentStatus(agentId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    return this.updateAgent(agentId, { isActive: status === 'ACTIVE' });
  }
}

export const supportService = new SupportService();
