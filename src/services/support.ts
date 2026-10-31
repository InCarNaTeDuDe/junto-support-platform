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

class SupportService {
  public async getSummary(): Promise<CasesSummary> {
    const res = await api.get<any>('/support/dashboard/summary');
    const r = res?.data || res || {};
    const total = r.totalCases ?? r.total ?? 0;
    const open = r.openCases ?? r.open ?? 0;
    const inProgress = r.inProgressCases ?? r.inProgress ?? 0;
    const waitingForUser = r.waitingForUserCases ?? r.waitingForUser ?? 0;
    const resolved = r.resolvedCases ?? r.resolved ?? 0;
    const unassigned = r.unassignedCases ?? r.unassigned ?? 0;
    const criticalOrHigh = (r.criticalCases ?? 0) + (r.highPriorityCases ?? 0) || r.criticalOrHigh || 0;

    return {
      totalCases: total,
      openCases: open,
      assignedCases: r.assignedCases ?? r.assigned ?? 0,
      inProgressCases: inProgress,
      waitingForUserCases: waitingForUser,
      resolvedCases: resolved,
      unassignedCases: unassigned,
      criticalCases: r.criticalCases ?? 0,
      highPriorityCases: r.highPriorityCases ?? 0,
      total,
      open,
      inProgress,
      waitingForUser,
      resolved,
      unassigned,
      criticalOrHigh,
    };
  }

  public async getRecentCases(limit: number = 10): Promise<SupportCase[]> {
    const res = await api.get<any>('/support/dashboard/recent-cases', { limit });
    const list = res?.data || res?.cases || res;
    return Array.isArray(list) ? list : [];
  }

  public async getCases(filters: CaseFilterOptions = {}): Promise<PaginatedCasesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 8;
    const q: Record<string, any> = { page, limit };

    if (filters.status && filters.status !== 'ALL') q.status = filters.status;
    if (filters.priority && filters.priority !== 'ALL') q.priority = filters.priority;
    if (filters.category && filters.category !== 'ALL') q.category = filters.category;
    if (filters.search?.trim()) q.search = filters.search.trim();
    if (filters.sortBy) q.sortBy = filters.sortBy;

    if (filters.view === 'UNASSIGNED' || filters.assignedAgentId === 'UNASSIGNED') {
      q.assignedTo = 'unassigned';
    } else if (filters.view === 'RESOLVED') {
      q.status = 'RESOLVED';
    } else if ((filters.view === 'MY_CASES' && filters.assignedAgentId) || (filters.assignedAgentId && filters.assignedAgentId !== 'ALL')) {
      q.assignedTo = filters.assignedAgentId;
    }

    const res = await api.get<any>('/support/cases', q);
    if (res && Array.isArray(res.data)) {
      const cases: SupportCase[] = res.data;
      const p = res.pagination || {};
      return {
        cases,
        total: p.totalRecords ?? cases.length,
        page: p.page ?? page,
        limit: p.limit ?? limit,
        totalPages: p.totalPages ?? (Math.ceil(cases.length / limit) || 1),
      };
    }

    const cases = Array.isArray(res?.cases) ? res.cases : [];
    return { cases, total: cases.length, page: 1, limit: cases.length || limit, totalPages: 1 };
  }

  public async getCaseById(caseId: string): Promise<SupportCase> {
    const res = await api.get<any>(`/support/cases/${caseId}`);
    const data = res?.data || res?.case || res;
    if (!data || (!data.id && !data.caseNumber)) throw new Error(`Support case #${caseId} not found`);

    if (!data.messages?.length) {
      try { data.messages = await this.getCaseMessages(caseId); } catch { data.messages = []; }
    }
    return data;
  }

  public async assignCase(caseId: string, agentId: string | null): Promise<SupportCase> {
    await api.patch(`/support/cases/${caseId}/assign`, { agentId });
    return this.getCaseById(caseId);
  }

  public async updateStatus(caseId: string, status: CaseStatus): Promise<SupportCase> {
    await api.patch(`/support/cases/${caseId}/status`, { status });
    return this.getCaseById(caseId);
  }

  public async updatePriority(caseId: string, priority: CasePriority): Promise<SupportCase> {
    await api.patch(`/support/cases/${caseId}/priority`, { priority });
    return this.getCaseById(caseId);
  }

  public async getCaseMessages(caseId: string): Promise<SupportCaseMessage[]> {
    const res = await api.get<any>(`/support/cases/${caseId}/messages`);
    const msgs = res?.data || res?.messages;
    if (!Array.isArray(msgs)) return [];

    return msgs.map((m: any) => ({
      id: m.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      senderType: m.senderType || (m.sender === 'user' ? 'USER' : 'AGENT'),
      sender: typeof m.sender === 'object' ? m.sender : { id: m.senderId || '', name: m.senderName || m.sender || '' },
      message: m.message || m.text || m.content || '',
      content: m.message || m.text || m.content || '',
      isInternalNote: !!m.isInternalNote,
      createdAt: m.createdAt || new Date().toISOString(),
    }));
  }

  public async addMessage(
    caseId: string,
    message: string,
    isInternalNote: boolean,
    currentAgent: SupportAgent
  ): Promise<SupportCaseMessage> {
    const res = await api.post<any>(`/support/cases/${caseId}/messages`, { message, isInternalNote });
    const data = res?.data;

    return {
      id: data?.id || `msg-${Date.now()}`,
      caseId,
      senderType: isInternalNote ? 'INTERNAL_NOTE' : 'AGENT',
      sender: { id: currentAgent.id, name: currentAgent.name, role: currentAgent.role },
      senderName: currentAgent.name,
      senderRole: currentAgent.role,
      message: data?.message || message,
      content: data?.message || message,
      isInternalNote,
      createdAt: data?.createdAt || new Date().toISOString(),
    };
  }

  public async getAgents(): Promise<SupportAgent[]> {
    const res = await api.get<any>('/support/agents');
    const list = res?.data || res;
    if (!Array.isArray(list)) return [];
    return list.map((a: any) => ({
      ...a,
      isActive: a.isActive !== false && a.status !== 'INACTIVE',
      status: a.isActive !== false && a.status !== 'INACTIVE' ? 'ACTIVE' : 'INACTIVE',
    }));
  }

  public async createAgent(data: { userId?: string; email?: string; name?: string; role: AgentRole }): Promise<SupportAgent> {
    const res = await api.post<any>('/support/agents', data);
    return res?.data || res;
  }

  public async updateAgent(agentId: string, updates: { role?: AgentRole; isActive?: boolean }): Promise<void> {
    await api.patch(`/support/agents/${agentId}`, updates);
  }

  public async updateAgentRole(agentId: string, role: AgentRole): Promise<void> {
    return this.updateAgent(agentId, { role });
  }

  public async updateAgentStatus(agentId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    return this.updateAgent(agentId, { isActive: status === 'ACTIVE' });
  }
}

export const supportService = new SupportService();
