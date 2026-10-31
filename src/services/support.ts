import { api } from './api';
import type {
  SupportCase,
  CasesSummary,
  CaseFilterOptions,
  PaginatedCasesResult,
  SupportCaseMessage,
  CaseStatus,
  CasePriority,
} from '../types/support';
import type { SupportAgent, AgentRole } from '../types/user';
import { INITIAL_CASES, INITIAL_AGENTS } from './mockData';

class SupportService {
  private localCases: SupportCase[] = [...INITIAL_CASES];
  private localAgents: SupportAgent[] = [...INITIAL_AGENTS];
  private useLocalFallback: boolean = false;

  private computeSummary(cases: SupportCase[]): CasesSummary {
    const total = cases.length;
    const open = cases.filter((c) => c.status === 'OPEN').length;
    const inProgress = cases.filter((c) => c.status === 'IN_PROGRESS').length;
    const waitingForUser = cases.filter((c) => c.status === 'WAITING_FOR_USER').length;
    const resolved = cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const assigned = cases.filter((c) => !!c.assignedAgentId).length;
    const unassigned = cases.filter((c) => !c.assignedAgentId).length;
    const critical = cases.filter((c) => c.priority === 'CRITICAL').length;
    const high = cases.filter((c) => c.priority === 'HIGH').length;
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
      total,
      open,
      inProgress,
      waitingForUser,
      resolved,
      unassigned,
      criticalOrHigh,
    };
  }

  public async getSummary(): Promise<CasesSummary> {
    try {
      const response = await api.get<any>('/support/dashboard/summary');
      const raw = response?.data || response;
      if (raw && (raw.totalCases !== undefined || raw.total !== undefined)) {
        this.useLocalFallback = false;
        return {
          totalCases: raw.totalCases ?? raw.total ?? 0,
          openCases: raw.openCases ?? raw.open ?? 0,
          assignedCases: raw.assignedCases ?? raw.assigned ?? 0,
          inProgressCases: raw.inProgressCases ?? raw.inProgress ?? 0,
          waitingForUserCases: raw.waitingForUserCases ?? raw.waitingForUser ?? 0,
          resolvedCases: raw.resolvedCases ?? raw.resolved ?? 0,
          unassignedCases: raw.unassignedCases ?? raw.unassigned ?? 0,
          criticalCases: raw.criticalCases ?? 0,
          highPriorityCases: raw.highPriorityCases ?? 0,
          total: raw.total ?? raw.totalCases ?? 0,
          open: raw.open ?? raw.openCases ?? 0,
          inProgress: raw.inProgress ?? raw.inProgressCases ?? 0,
          waitingForUser: raw.waitingForUser ?? raw.waitingForUserCases ?? 0,
          resolved: raw.resolved ?? raw.resolvedCases ?? 0,
          unassigned: raw.unassigned ?? raw.unassignedCases ?? 0,
          criticalOrHigh: (raw.criticalCases || 0) + (raw.highPriorityCases || 0) || raw.criticalOrHigh || 0,
        };
      }
    } catch {
      this.useLocalFallback = true;
    }

    return this.computeSummary(this.localCases);
  }

  public async getRecentCases(limit: number = 10): Promise<SupportCase[]> {
    try {
      const response = await api.get<any>('/support/dashboard/recent-cases', { limit });
      const list = response?.data || response?.cases || response;
      if (Array.isArray(list)) {
        return list;
      }
    } catch {
      // Fallback to local
    }

    return [...this.localCases]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public async getCases(filters: CaseFilterOptions = {}): Promise<PaginatedCasesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 8;

    try {
      const queryParams: Record<string, any> = { page, limit };
      if (filters.status && filters.status !== 'ALL') queryParams.status = filters.status;
      if (filters.priority && filters.priority !== 'ALL') queryParams.priority = filters.priority;
      if (filters.category && filters.category !== 'ALL') queryParams.category = filters.category;
      if (filters.search?.trim()) queryParams.search = filters.search.trim();

      if (filters.view === 'UNASSIGNED' || filters.assignedAgentId === 'UNASSIGNED') {
        queryParams.assignedTo = 'unassigned';
      } else if (filters.view === 'RESOLVED') {
        queryParams.status = 'RESOLVED';
      } else if (filters.assignedAgentId && filters.assignedAgentId !== 'ALL') {
        queryParams.assignedTo = filters.assignedAgentId;
      }

      const response = await api.get<any>('/support/cases', queryParams);

      if (response && Array.isArray(response.data)) {
        return {
          cases: response.data,
          total: response.pagination?.totalRecords ?? response.data.length,
          page: response.pagination?.page ?? page,
          limit: response.pagination?.limit ?? limit,
          totalPages: response.pagination?.totalPages ?? (Math.ceil(response.data.length / limit) || 1),
        };
      }
    } catch {
      // Use local filtered list
    }

    let filtered = [...this.localCases];

    // Filter by view
    if (filters.view === 'MY_CASES' && filters.assignedAgentId) {
      filtered = filtered.filter((c) => c.assignedAgentId === filters.assignedAgentId);
    } else if (filters.view === 'UNASSIGNED') {
      filtered = filtered.filter((c) => !c.assignedAgentId);
    } else if (filters.view === 'RESOLVED') {
      filtered = filtered.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');
    }

    // Filter by assigned agent dropdown
    if (filters.assignedAgentId && filters.assignedAgentId !== 'ALL' && filters.view !== 'MY_CASES') {
      if (filters.assignedAgentId === 'UNASSIGNED') {
        filtered = filtered.filter((c) => !c.assignedAgentId);
      } else {
        filtered = filtered.filter((c) => c.assignedAgentId === filters.assignedAgentId);
      }
    }

    // Filter by status
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    // Filter by priority
    if (filters.priority && filters.priority !== 'ALL') {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }

    // Filter by category
    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((c) => c.category?.toUpperCase() === filters.category?.toUpperCase());
    }

    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.customer?.name.toLowerCase().includes(q) ||
          c.customer?.email.toLowerCase().includes(q)
      );
    }

    // Sort
    if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === 'priority') {
      const priorityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
    } else if (filters.sortBy === 'status') {
      filtered.sort((a, b) => a.status.localeCompare(b.status));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const pagedCases = filtered.slice(startIndex, startIndex + limit);

    return {
      cases: pagedCases,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async getCaseById(caseId: string): Promise<SupportCase> {
    try {
      const response = await api.get<any>(`/support/cases/${caseId}`);
      const caseData = response?.data || response?.case || response;
      if (caseData && (caseData.id || caseData.caseNumber)) {
        return caseData;
      }
    } catch {
      // Local fallback
    }

    const found = this.localCases.find((c) => c.id === caseId || c.caseNumber === caseId);
    if (!found) {
      throw new Error(`Support case #${caseId} not found`);
    }
    return found;
  }

  public async assignCase(caseId: string, agentId: string | null): Promise<SupportCase> {
    try {
      await api.patch(`/support/cases/${caseId}/assign`, { agentId });
      return await this.getCaseById(caseId);
    } catch {
      // Update local
      const idx = this.localCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
      if (idx !== -1) {
        const agent = agentId ? this.localAgents.find((a) => a.id === agentId) || null : null;
        this.localCases[idx] = {
          ...this.localCases[idx],
          assignedAgentId: agentId,
          assignedAgent: agent
            ? { id: agent.id, name: agent.name, role: agent.role, email: agent.email }
            : null,
          status: agentId && this.localCases[idx].status === 'OPEN' ? 'ASSIGNED' : this.localCases[idx].status,
          updatedAt: new Date().toISOString(),
        };
        return this.localCases[idx];
      }
      throw new Error(`Case #${caseId} not found`);
    }
  }

  public async updateStatus(caseId: string, status: CaseStatus): Promise<SupportCase> {
    try {
      await api.patch(`/support/cases/${caseId}/status`, { status });
      return await this.getCaseById(caseId);
    } catch {
      const idx = this.localCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
      if (idx !== -1) {
        this.localCases[idx] = {
          ...this.localCases[idx],
          status,
          updatedAt: new Date().toISOString(),
          resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : this.localCases[idx].resolvedAt,
        };
        return this.localCases[idx];
      }
      throw new Error(`Case #${caseId} not found`);
    }
  }

  public async updatePriority(caseId: string, priority: CasePriority): Promise<SupportCase> {
    try {
      await api.patch(`/support/cases/${caseId}/priority`, { priority });
      return await this.getCaseById(caseId);
    } catch {
      const idx = this.localCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
      if (idx !== -1) {
        this.localCases[idx] = {
          ...this.localCases[idx],
          priority,
          updatedAt: new Date().toISOString(),
        };
        return this.localCases[idx];
      }
      throw new Error(`Case #${caseId} not found`);
    }
  }

  public async getCaseMessages(caseId: string): Promise<SupportCaseMessage[]> {
    try {
      const response = await api.get<any>(`/support/cases/${caseId}/messages`);
      const msgs = response?.data || response?.messages;
      if (Array.isArray(msgs)) {
        return msgs;
      }
    } catch {
      // Local fallback
    }

    const c = this.localCases.find((x) => x.id === caseId || x.caseNumber === caseId);
    return c?.messages || [];
  }

  public async addMessage(
    caseId: string,
    message: string,
    isInternalNote: boolean,
    currentAgent: SupportAgent
  ): Promise<SupportCaseMessage> {
    const newMessage: SupportCaseMessage = {
      id: `msg-${Date.now()}`,
      caseId,
      senderType: isInternalNote ? 'INTERNAL_NOTE' : 'AGENT',
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

    try {
      await api.post(`/support/cases/${caseId}/messages`, { message, isInternalNote });
    } catch {
      // Local fallback
    }

    const idx = this.localCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (idx !== -1) {
      const existing = this.localCases[idx].messages || [];
      this.localCases[idx] = {
        ...this.localCases[idx],
        messages: [...existing, newMessage],
        status: !isInternalNote && this.localCases[idx].status === 'OPEN' ? 'IN_PROGRESS' : this.localCases[idx].status,
        updatedAt: new Date().toISOString(),
      };
    }

    return newMessage;
  }

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
    } catch {
      // Local fallback
    }

    return [...this.localAgents];
  }

  public async createAgent(data: {
    userId?: string;
    email?: string;
    name?: string;
    role: AgentRole;
  }): Promise<SupportAgent> {
    try {
      const response = await api.post<any>('/support/agents', data);
      if (response?.data) return response.data;
    } catch {
      // Local fallback
    }

    const newAgent: SupportAgent = {
      id: `agent-${Date.now()}`,
      userId: data.userId || `usr-${Date.now()}`,
      name: data.name || 'New Agent',
      email: data.email || 'agent@junto.com',
      role: data.role,
      isActive: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: undefined,
    };
    this.localAgents.push(newAgent);
    return newAgent;
  }

  public async updateAgent(agentId: string, updates: { role?: AgentRole; isActive?: boolean }): Promise<void> {
    try {
      await api.patch(`/support/agents/${agentId}`, updates);
    } catch {
      // Local fallback
    }

    const idx = this.localAgents.findIndex((a) => a.id === agentId);
    if (idx !== -1) {
      this.localAgents[idx] = {
        ...this.localAgents[idx],
        ...(updates.role ? { role: updates.role } : {}),
        ...(updates.isActive !== undefined
          ? { isActive: updates.isActive, status: updates.isActive ? 'ACTIVE' : 'INACTIVE' }
          : {}),
      };
    }
  }

  public async updateAgentRole(agentId: string, role: AgentRole): Promise<void> {
    return this.updateAgent(agentId, { role });
  }

  public async updateAgentStatus(agentId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    return this.updateAgent(agentId, { isActive: status === 'ACTIVE' });
  }
}

export const supportService = new SupportService();
