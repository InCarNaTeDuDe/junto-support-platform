import { api, ApiError } from './api';
import type {
  SupportCase,
  CasesSummary,
  CaseFilterOptions,
  PaginatedCasesResult,
  CaseMessage,
  CaseStatus,
  CasePriority,
} from '../types/support';
import type { SupportAgent, AgentRole, AgentStatus } from '../types/user';

// Initial realistic Junto mobile app cases for fallback/development
const INITIAL_JUNTO_AGENTS: SupportAgent[] = [
  {
    id: 'agent_owner_1',
    email: 'sarah.owner@junto.com',
    name: 'Sarah Connor',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: '2024-01-15T08:00:00Z',
    lastLoginAt: '2026-10-30T13:45:00Z',
  },
  {
    id: 'agent_supp_2',
    email: 'marcus.support@junto.com',
    name: 'Marcus Wright',
    role: 'SUPPORT',
    status: 'ACTIVE',
    createdAt: '2024-03-20T10:30:00Z',
    lastLoginAt: '2026-10-30T14:10:00Z',
  },
  {
    id: 'agent_supp_3',
    email: 'elena.support@junto.com',
    name: 'Elena Rostova',
    role: 'SUPPORT',
    status: 'ACTIVE',
    createdAt: '2024-05-10T14:15:00Z',
    lastLoginAt: '2026-10-29T18:22:00Z',
  },
  {
    id: 'agent_supp_4',
    email: 'tarek.support@junto.com',
    name: 'Tarek Mansour',
    role: 'SUPPORT',
    status: 'INACTIVE',
    createdAt: '2024-08-01T09:00:00Z',
    lastLoginAt: '2026-10-15T11:00:00Z',
  },
];

const INITIAL_JUNTO_CASES: SupportCase[] = [
  {
    id: 'case_101',
    caseNumber: 'JT-70491',
    customerId: 'cust_8821',
    customer: {
      id: 'cust_8821',
      name: 'Amara Okafor',
      email: 'amara.okafor@gmail.com',
      phone: '+1 (555) 349-2190',
      rating: 4.9,
      juntoMemberSince: '2023-04-12',
    },
    subject: 'Driver vehicle plate did not match Junto app details',
    description: 'When the ride arrived for pickup at Central Station, the license plate was 7ABC89 instead of 4XYZ12 listed in the app. I felt unsafe and canceled. Please refund the $5.50 cancellation fee.',
    category: 'SAFETY',
    priority: 'CRITICAL',
    status: 'OPEN',
    assignedAgentId: null,
    assignedAgent: null,
    relatedEntity: {
      type: 'TRIP',
      id: 'TRIP-90218',
      summary: 'Central Station -> South Hill Marina',
      amount: '$24.50',
      date: '2026-10-30 08:30',
    },
    createdAt: '2026-10-30T08:35:00Z',
    updatedAt: '2026-10-30T08:35:00Z',
    messages: [
      {
        id: 'msg_101_1',
        caseId: 'case_101',
        senderType: 'CUSTOMER',
        senderId: 'cust_8821',
        senderName: 'Amara Okafor',
        content: 'When the ride arrived for pickup at Central Station, the license plate was 7ABC89 instead of 4XYZ12 listed in the app. I felt unsafe and canceled. Please refund the $5.50 cancellation fee.',
        createdAt: '2026-10-30T08:35:00Z',
      },
      {
        id: 'msg_101_2',
        caseId: 'case_101',
        senderType: 'SYSTEM',
        senderId: 'system',
        senderName: 'Junto System',
        content: 'Case initiated from Junto Mobile App Support Chat (Trip ID: TRIP-90218). Priority marked as CRITICAL by automated safety triage.',
        createdAt: '2026-10-30T08:35:01Z',
      },
    ],
  },
  {
    id: 'case_102',
    caseNumber: 'JT-70492',
    customerId: 'cust_3490',
    customer: {
      id: 'cust_3490',
      name: 'Liam Chen',
      email: 'liam.chen@techventures.co',
      phone: '+1 (555) 782-9011',
      rating: 4.7,
      juntoMemberSince: '2022-11-03',
    },
    subject: 'Double charged for delivery order from Green Garden Bistro',
    description: 'My Junto Pay wallet shows two simultaneous deductions of $38.40 for order #ORD-44910. The restaurant only received one order.',
    category: 'PAYMENT',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedAgentId: 'agent_supp_2',
    assignedAgent: INITIAL_JUNTO_AGENTS[1], // Marcus Wright
    relatedEntity: {
      type: 'ORDER',
      id: 'ORD-44910',
      summary: 'Green Garden Bistro (2 items)',
      amount: '$38.40',
      date: '2026-10-29 19:15',
    },
    createdAt: '2026-10-29T19:40:00Z',
    updatedAt: '2026-10-30T09:15:00Z',
    messages: [
      {
        id: 'msg_102_1',
        caseId: 'case_102',
        senderType: 'CUSTOMER',
        senderId: 'cust_3490',
        senderName: 'Liam Chen',
        content: 'My Junto Pay wallet shows two simultaneous deductions of $38.40 for order #ORD-44910. The restaurant only received one order.',
        createdAt: '2026-10-29T19:40:00Z',
      },
      {
        id: 'msg_102_2',
        caseId: 'case_102',
        senderType: 'AGENT',
        senderId: 'agent_supp_2',
        senderName: 'Marcus Wright',
        senderRole: 'SUPPORT',
        content: 'Hello Liam, I have checked the payment gateway transaction log. One of the charges is an uncaptured authorization hold that failed settlement. I have manually voided the hold and credited $38.40 back to your Junto Pay balance.',
        createdAt: '2026-10-30T09:10:00Z',
      },
      {
        id: 'msg_102_3',
        caseId: 'case_102',
        senderType: 'INTERNAL_NOTE',
        senderId: 'agent_supp_2',
        senderName: 'Marcus Wright',
        senderRole: 'SUPPORT',
        content: 'Notified payments on-call engineer regarding duplicate stripe authorization hook on webhook retry.',
        createdAt: '2026-10-30T09:15:00Z',
      },
    ],
  },
  {
    id: 'case_103',
    caseNumber: 'JT-70493',
    customerId: 'cust_1120',
    customer: {
      id: 'cust_1120',
      name: 'Sofia Alva',
      email: 'sofia.alva@outlook.com',
      phone: '+1 (555) 433-8902',
      rating: 5.0,
      juntoMemberSince: '2024-02-18',
    },
    subject: 'Cannot link corporate MasterCard in Junto Wallet',
    description: 'When typing in the card CVV, the screen spins and shows "Bank 3D-Secure timeout". My bank says the request never reached them.',
    category: 'PAYMENT',
    priority: 'MEDIUM',
    status: 'WAITING_FOR_USER',
    assignedAgentId: 'agent_supp_3',
    assignedAgent: INITIAL_JUNTO_AGENTS[2], // Elena Rostova
    relatedEntity: {
      type: 'TRANSACTION',
      id: 'TXN-77319',
      summary: 'Card Verification ($0.00)',
      amount: '$0.00',
      date: '2026-10-28 14:00',
    },
    createdAt: '2026-10-28T14:15:00Z',
    updatedAt: '2026-10-29T11:20:00Z',
    messages: [
      {
        id: 'msg_103_1',
        caseId: 'case_103',
        senderType: 'CUSTOMER',
        senderId: 'cust_1120',
        senderName: 'Sofia Alva',
        content: 'When typing in the card CVV, the screen spins and shows "Bank 3D-Secure timeout". My bank says the request never reached them.',
        createdAt: '2026-10-28T14:15:00Z',
      },
      {
        id: 'msg_103_2',
        caseId: 'case_103',
        senderType: 'AGENT',
        senderId: 'agent_supp_3',
        senderName: 'Elena Rostova',
        senderRole: 'SUPPORT',
        content: 'Hi Sofia, could you please confirm the Junto mobile app version on your phone? In app version 4.12.0 we updated the 3D-Secure SDK to fix this exact corporate card handshake. Please update from the App Store and let us know if the issue persists.',
        createdAt: '2026-10-29T11:20:00Z',
      },
    ],
  },
  {
    id: 'case_104',
    caseNumber: 'JT-70494',
    customerId: 'cust_9011',
    customer: {
      id: 'cust_9011',
      name: 'Devon Vance',
      email: 'devon@vancemedia.net',
      phone: '+1 (555) 612-4411',
      rating: 4.8,
      juntoMemberSince: '2021-09-10',
    },
    subject: 'Courier delivered order to wrong apartment building number',
    description: 'I live at 404 Elm St, Apt 3B. The courier left the package at 414 Elm St on the front sidewalk in the rain. Food is spoiled.',
    category: 'DELIVERY',
    priority: 'HIGH',
    status: 'RESOLVED',
    assignedAgentId: 'agent_supp_2',
    assignedAgent: INITIAL_JUNTO_AGENTS[1], // Marcus Wright
    relatedEntity: {
      type: 'ORDER',
      id: 'ORD-44812',
      summary: 'Tokyo Ramen House',
      amount: '$42.10',
      date: '2026-10-27 20:10',
    },
    createdAt: '2026-10-27T20:30:00Z',
    updatedAt: '2026-10-28T09:40:00Z',
    messages: [
      {
        id: 'msg_104_1',
        caseId: 'case_104',
        senderType: 'CUSTOMER',
        senderId: 'cust_9011',
        senderName: 'Devon Vance',
        content: 'I live at 404 Elm St, Apt 3B. The courier left the package at 414 Elm St on the front sidewalk in the rain. Food is spoiled.',
        createdAt: '2026-10-27T20:30:00Z',
      },
      {
        id: 'msg_104_2',
        caseId: 'case_104',
        senderType: 'AGENT',
        senderId: 'agent_supp_2',
        senderName: 'Marcus Wright',
        senderRole: 'SUPPORT',
        content: 'Hi Devon, I am very sorry for this experience. I have processed a full refund of $42.10 to your original payment method and added a $10 apologetic credit coupon to your Junto account.',
        createdAt: '2026-10-28T09:35:00Z',
      },
      {
        id: 'msg_104_3',
        caseId: 'case_104',
        senderType: 'CUSTOMER',
        senderId: 'cust_9011',
        senderName: 'Devon Vance',
        content: 'Thank you Marcus, I see the credit and refund now. Appreciate the swift response.',
        createdAt: '2026-10-28T09:38:00Z',
      },
      {
        id: 'msg_104_4',
        caseId: 'case_104',
        senderType: 'SYSTEM',
        senderId: 'system',
        senderName: 'Junto System',
        content: 'Case marked as RESOLVED by Marcus Wright.',
        createdAt: '2026-10-28T09:40:00Z',
      },
    ],
  },
  {
    id: 'case_105',
    caseNumber: 'JT-70495',
    customerId: 'cust_5099',
    customer: {
      id: 'cust_5099',
      name: 'Maya Patel',
      email: 'maya.patel@gmail.com',
      phone: '+1 (555) 902-1277',
      rating: 4.95,
      juntoMemberSince: '2023-01-05',
    },
    subject: 'Requesting driver phone number to retrieve forgotten briefcase in car',
    description: 'I just finished ride #TRIP-90240 15 minutes ago. I accidentally left my black leather briefcase on the back seat.',
    category: 'TRIP',
    priority: 'HIGH',
    status: 'OPEN',
    assignedAgentId: null,
    assignedAgent: null,
    relatedEntity: {
      type: 'TRIP',
      id: 'TRIP-90240',
      summary: 'Downtown Hyatt -> Airport Terminal 2',
      amount: '$56.00',
      date: '2026-10-30 13:30',
    },
    createdAt: '2026-10-30T13:50:00Z',
    updatedAt: '2026-10-30T13:50:00Z',
    messages: [
      {
        id: 'msg_105_1',
        caseId: 'case_105',
        senderType: 'CUSTOMER',
        senderId: 'cust_5099',
        senderName: 'Maya Patel',
        content: 'I just finished ride #TRIP-90240 15 minutes ago. I accidentally left my black leather briefcase on the back seat. My flight boards in 2 hours!',
        createdAt: '2026-10-30T13:50:00Z',
      },
      {
        id: 'msg_105_2',
        caseId: 'case_105',
        senderType: 'SYSTEM',
        senderId: 'system',
        senderName: 'Junto System',
        content: 'Lost item alert dispatched to driver app. Driver currently completing another fare.',
        createdAt: '2026-10-30T13:51:00Z',
      },
    ],
  },
  {
    id: 'case_106',
    caseNumber: 'JT-70496',
    customerId: 'cust_7721',
    customer: {
      id: 'cust_7721',
      name: 'Oliver King',
      email: 'oliver.king@apex.io',
      phone: '+1 (555) 231-8841',
      rating: 4.6,
      juntoMemberSince: '2024-06-19',
    },
    subject: 'Phone number change requires verification reset',
    description: 'I switched my carrier and no longer have access to my old phone number +1 (555) 231-8841. I need to update it to +1 (555) 991-3320 to receive login OTPs.',
    category: 'ACCOUNT',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedAgentId: 'agent_owner_1',
    assignedAgent: INITIAL_JUNTO_AGENTS[0], // Sarah Connor
    createdAt: '2026-10-29T16:00:00Z',
    updatedAt: '2026-10-30T10:00:00Z',
    messages: [
      {
        id: 'msg_106_1',
        caseId: 'case_106',
        senderType: 'CUSTOMER',
        senderId: 'cust_7721',
        senderName: 'Oliver King',
        content: 'I switched my carrier and no longer have access to my old phone number +1 (555) 231-8841. I need to update it to +1 (555) 991-3320 to receive login OTPs.',
        createdAt: '2026-10-29T16:00:00Z',
      },
      {
        id: 'msg_106_2',
        caseId: 'case_106',
        senderType: 'INTERNAL_NOTE',
        senderId: 'agent_owner_1',
        senderName: 'Sarah Connor',
        senderRole: 'OWNER',
        content: 'Verified government ID uploaded in KYC portal matches account name and selfie match threshold is 98.4%. Proceeding with phone number change.',
        createdAt: '2026-10-30T10:00:00Z',
      },
    ],
  },
  {
    id: 'case_107',
    caseNumber: 'JT-70497',
    customerId: 'cust_4188',
    customer: {
      id: 'cust_4188',
      name: 'Chloe Tremblay',
      email: 'chloe.t@montreal.ca',
      phone: '+1 (555) 871-3301',
      rating: 5.0,
      juntoMemberSince: '2023-08-14',
    },
    subject: 'How do I add a tip to my driver after the ride has ended?',
    description: 'I had an exceptional ride this morning with driver Antoine, but was in a hurry and missed the rating/tip screen.',
    category: 'GENERAL',
    priority: 'LOW',
    status: 'RESOLVED',
    assignedAgentId: 'agent_supp_3',
    assignedAgent: INITIAL_JUNTO_AGENTS[2], // Elena Rostova
    relatedEntity: {
      type: 'TRIP',
      id: 'TRIP-90199',
      summary: 'Old Port -> Mile End',
      amount: '$18.75',
      date: '2026-10-29 09:30',
    },
    createdAt: '2026-10-29T10:00:00Z',
    updatedAt: '2026-10-29T12:00:00Z',
    messages: [
      {
        id: 'msg_107_1',
        caseId: 'case_107',
        senderType: 'CUSTOMER',
        senderId: 'cust_4188',
        senderName: 'Chloe Tremblay',
        content: 'How do I add a tip to my driver after the ride has ended?',
        createdAt: '2026-10-29T10:00:00Z',
      },
      {
        id: 'msg_107_2',
        caseId: 'case_107',
        senderType: 'AGENT',
        senderId: 'agent_supp_3',
        senderName: 'Elena Rostova',
        senderRole: 'SUPPORT',
        content: 'Hi Chloe! You can add a tip up to 24 hours after your ride ends. In the Junto app, tap Menu > Activity > select your trip with Antoine > tap "Add a Tip" at the bottom. Thank you for showing appreciation to our driver partners!',
        createdAt: '2026-10-29T12:00:00Z',
      },
    ],
  },
];

// In-memory or localStorage cache for dev fallback
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
      console.warn('Unable to save fallback cases to localStorage', e);
    }
  }

  private saveAgents() {
    try {
      localStorage.setItem('junto_support_mock_agents', JSON.stringify(this.fallbackAgents));
    } catch (e) {
      console.warn('Unable to save fallback agents to localStorage', e);
    }
  }

  /**
   * Get summary counts for Dashboard overview
   */
  public async getSummary(): Promise<CasesSummary> {
    try {
      return await api.get<CasesSummary>('/support/cases/summary');
    } catch (err: any) {
      // Calculate from fallback dataset
      const total = this.fallbackCases.length;
      const open = this.fallbackCases.filter((c) => c.status === 'OPEN').length;
      const inProgress = this.fallbackCases.filter((c) => c.status === 'IN_PROGRESS').length;
      const waitingForUser = this.fallbackCases.filter((c) => c.status === 'WAITING_FOR_USER').length;
      const resolved = this.fallbackCases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      const criticalOrHigh = this.fallbackCases.filter(
        (c) => (c.priority === 'CRITICAL' || c.priority === 'HIGH') && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
      ).length;
      const unassigned = this.fallbackCases.filter(
        (c) => !c.assignedAgentId && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
      ).length;

      return {
        total,
        open,
        inProgress,
        waitingForUser,
        resolved,
        criticalOrHigh,
        unassigned,
      };
    }
  }

  /**
   * Get filtered and paginated cases list
   */
  public async getCases(filters: CaseFilterOptions = {}): Promise<PaginatedCasesResult> {
    try {
      return await api.get<PaginatedCasesResult>('/support/cases', filters);
    } catch (err: any) {
      let filtered = [...this.fallbackCases];

      // View filters
      if (filters.view === 'MY_CASES' && filters.assignedAgentId) {
        filtered = filtered.filter((c) => c.assignedAgentId === filters.assignedAgentId);
      } else if (filters.view === 'UNASSIGNED') {
        filtered = filtered.filter((c) => !c.assignedAgentId);
      } else if (filters.view === 'RESOLVED') {
        filtered = filtered.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((c) => c.status === filters.status);
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'ALL') {
        filtered = filtered.filter((c) => c.priority === filters.priority);
      }

      // Category filter
      if (filters.category && filters.category !== 'ALL') {
        filtered = filtered.filter((c) => c.category === filters.category);
      }

      // Assigned Agent filter
      if (filters.assignedAgentId && filters.assignedAgentId !== 'ALL') {
        if (filters.assignedAgentId === 'UNASSIGNED') {
          filtered = filtered.filter((c) => !c.assignedAgentId);
        } else {
          filtered = filtered.filter((c) => c.assignedAgentId === filters.assignedAgentId);
        }
      }

      // Search filter (case number or customer name/email)
      if (filters.search && filters.search.trim()) {
        const query = filters.search.trim().toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.caseNumber.toLowerCase().includes(query) ||
            c.subject.toLowerCase().includes(query) ||
            c.customer.name.toLowerCase().includes(query) ||
            c.customer.email.toLowerCase().includes(query)
        );
      }

      // Sorting
      if (filters.sortBy === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (filters.sortBy === 'priority') {
        const priorityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
      } else if (filters.sortBy === 'status') {
        filtered.sort((a, b) => a.status.localeCompare(b.status));
      } else {
        // Default: newest
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
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
  }

  /**
   * Get single case by ID with full conversation messages
   */
  public async getCaseById(id: string): Promise<SupportCase> {
    try {
      return await api.get<SupportCase>(`/support/cases/${id}`);
    } catch (err: any) {
      const found = this.fallbackCases.find((c) => c.id === id || c.caseNumber === id);
      if (!found) {
        throw new ApiError(404, `Support case #${id} not found`);
      }
      return found;
    }
  }

  /**
   * Change case status
   */
  public async updateStatus(id: string, status: CaseStatus, agentName: string): Promise<SupportCase> {
    try {
      return await api.patch<SupportCase>(`/support/cases/${id}/status`, { status });
    } catch (err: any) {
      const c = this.fallbackCases.find((x) => x.id === id);
      if (c) {
        c.status = status;
        c.updatedAt = new Date().toISOString();
        if (!c.messages) c.messages = [];
        c.messages.push({
          id: `sys_${Date.now()}`,
          caseId: id,
          senderType: 'SYSTEM',
          senderId: 'system',
          senderName: 'Junto System',
          content: `Status changed to ${status.replace(/_/g, ' ')} by ${agentName}`,
          createdAt: new Date().toISOString(),
        });
        this.saveCases();
        return c;
      }
      throw err;
    }
  }

  /**
   * Change case priority
   */
  public async updatePriority(id: string, priority: CasePriority, agentName: string): Promise<SupportCase> {
    try {
      return await api.patch<SupportCase>(`/support/cases/${id}/priority`, { priority });
    } catch (err: any) {
      const c = this.fallbackCases.find((x) => x.id === id);
      if (c) {
        c.priority = priority;
        c.updatedAt = new Date().toISOString();
        if (!c.messages) c.messages = [];
        c.messages.push({
          id: `sys_${Date.now()}`,
          caseId: id,
          senderType: 'SYSTEM',
          senderId: 'system',
          senderName: 'Junto System',
          content: `Priority changed to ${priority} by ${agentName}`,
          createdAt: new Date().toISOString(),
        });
        this.saveCases();
        return c;
      }
      throw err;
    }
  }

  /**
   * Assign case to agent (or unassign)
   */
  public async assignCase(id: string, agentId: string | null, agentName?: string): Promise<SupportCase> {
    try {
      return await api.patch<SupportCase>(`/support/cases/${id}/assign`, { assignedAgentId: agentId });
    } catch (err: any) {
      const c = this.fallbackCases.find((x) => x.id === id);
      if (c) {
        c.assignedAgentId = agentId;
        const assignedAgent = this.fallbackAgents.find((a) => a.id === agentId) || null;
        c.assignedAgent = assignedAgent;
        c.updatedAt = new Date().toISOString();

        if (!c.messages) c.messages = [];
        const label = assignedAgent ? `Assigned to ${assignedAgent.name}` : 'Unassigned';
        c.messages.push({
          id: `sys_${Date.now()}`,
          caseId: id,
          senderType: 'SYSTEM',
          senderId: 'system',
          senderName: 'Junto System',
          content: `${label} by ${agentName || 'Agent'}`,
          createdAt: new Date().toISOString(),
        });

        this.saveCases();
        return c;
      }
      throw err;
    }
  }

  /**
   * Send reply or internal note
   */
  public async addMessage(
    caseId: string,
    content: string,
    isInternalNote: boolean,
    currentAgent: SupportAgent
  ): Promise<CaseMessage> {
    const payload = {
      content,
      senderType: isInternalNote ? 'INTERNAL_NOTE' : 'AGENT',
    };

    try {
      return await api.post<CaseMessage>(`/support/cases/${caseId}/messages`, payload);
    } catch (err: any) {
      const c = this.fallbackCases.find((x) => x.id === caseId);
      if (c) {
        const newMessage: CaseMessage = {
          id: `msg_${Date.now()}`,
          caseId,
          senderType: isInternalNote ? 'INTERNAL_NOTE' : 'AGENT',
          senderId: currentAgent.id,
          senderName: currentAgent.name,
          senderRole: currentAgent.role,
          content,
          createdAt: new Date().toISOString(),
        };

        if (!c.messages) c.messages = [];
        c.messages.push(newMessage);
        c.updatedAt = new Date().toISOString();

        // If it was customer reply and status was OPEN, update to IN_PROGRESS
        if (!isInternalNote && c.status === 'OPEN') {
          c.status = 'IN_PROGRESS';
        }

        this.saveCases();
        return newMessage;
      }
      throw err;
    }
  }

  /**
   * AGENT MANAGEMENT (OWNER ONLY)
   */
  public async getAgents(): Promise<SupportAgent[]> {
    try {
      return await api.get<SupportAgent[]>('/support/agents');
    } catch (err: any) {
      return [...this.fallbackAgents];
    }
  }

  public async createAgent(data: { email: string; name: string; role: AgentRole }): Promise<SupportAgent> {
    try {
      return await api.post<SupportAgent>('/support/agents', data);
    } catch (err: any) {
      const existing = this.fallbackAgents.find((a) => a.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        throw new ApiError(400, 'Agent with this email already exists');
      }

      const newAgent: SupportAgent = {
        id: `agent_${Date.now()}`,
        email: data.email.trim(),
        name: data.name.trim(),
        role: data.role,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      this.fallbackAgents.push(newAgent);
      this.saveAgents();
      return newAgent;
    }
  }

  public async updateAgentRole(agentId: string, role: AgentRole): Promise<SupportAgent> {
    try {
      return await api.patch<SupportAgent>(`/support/agents/${agentId}/role`, { role });
    } catch (err: any) {
      const a = this.fallbackAgents.find((x) => x.id === agentId);
      if (a) {
        a.role = role;
        this.saveAgents();
        return a;
      }
      throw err;
    }
  }

  public async updateAgentStatus(agentId: string, status: AgentStatus): Promise<SupportAgent> {
    try {
      return await api.patch<SupportAgent>(`/support/agents/${agentId}/status`, { status });
    } catch (err: any) {
      const a = this.fallbackAgents.find((x) => x.id === agentId);
      if (a) {
        a.status = status;
        this.saveAgents();
        return a;
      }
      throw err;
    }
  }
}

export const supportService = new SupportService();
