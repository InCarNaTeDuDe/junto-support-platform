import { api, ApiError } from "./api";
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
} from "../types/support";
import type { SupportAgent, AgentRole } from "../types/user";

class SupportService {
  /**
   * GET /api/support/dashboard/summary
   * Fetch live dashboard statistics from backend.
   */
  public async getSummary(): Promise<CasesSummary> {
    const response = await api.get<
      | ApiResponse<DashboardSummary>
      | { success: boolean; data?: DashboardSummary }
    >("/support/dashboard/summary");
    const raw: any = (response as any)?.data || response;

    const total = raw?.totalCases ?? raw?.total ?? 0;
    const open = raw?.openCases ?? raw?.open ?? 0;
    const assigned = raw?.assignedCases ?? raw?.assigned ?? 0;
    const inProgress = raw?.inProgressCases ?? raw?.inProgress ?? 0;
    const waitingForUser = raw?.waitingForUserCases ?? raw?.waitingForUser ?? 0;
    const resolved = raw?.resolvedCases ?? raw?.resolved ?? 0;
    const unassigned = raw?.unassignedCases ?? raw?.unassigned ?? 0;
    const critical = raw?.criticalCases ?? 0;
    const high = raw?.highPriorityCases ?? 0;
    const criticalOrHigh = critical + high || (raw?.criticalOrHigh ?? 0);

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

  /**
   * GET /api/support/dashboard/recent-cases?limit=10
   */
  public async getRecentCases(limit: number = 10): Promise<SupportCase[]> {
    const response = await api.get<
      ApiResponse<SupportCase[]> | { success: boolean; data?: SupportCase[] }
    >("/support/dashboard/recent-cases", { limit });
    const list =
      (response as any)?.data || (response as any)?.cases || response;
    return Array.isArray(list) ? list : [];
  }

  /**
   * GET /api/support/cases
   * Fetch support cases with pagination, search and filtering from backend.
   */
  public async getCases(
    filters: CaseFilterOptions = {},
  ): Promise<PaginatedCasesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    let assignedToParam: string | undefined = undefined;
    if (filters.assignedTo) {
      assignedToParam = filters.assignedTo;
    } else if (
      filters.view === "UNASSIGNED" ||
      filters.assignedAgentId === "UNASSIGNED"
    ) {
      assignedToParam = "unassigned";
    } else if (filters.view === "MY_CASES" && filters.assignedAgentId) {
      assignedToParam = filters.assignedAgentId;
    } else if (filters.assignedAgentId && filters.assignedAgentId !== "ALL") {
      assignedToParam = filters.assignedAgentId;
    }

    let statusParam = filters.status;
    if (filters.view === "RESOLVED") {
      statusParam = "RESOLVED";
    }

    const queryParams: Record<string, any> = {
      page,
      limit,
    };

    if (statusParam && statusParam !== "ALL") queryParams.status = statusParam;
    if (filters.priority && filters.priority !== "ALL")
      queryParams.priority = filters.priority;
    if (filters.category && filters.category !== "ALL")
      queryParams.category = filters.category;
    if (assignedToParam) queryParams.assignedTo = assignedToParam;
    if (filters.search && filters.search.trim())
      queryParams.search = filters.search.trim();

    const response = await api.get<any>("/support/cases", queryParams);

    // 1. Management API contract: { success: true, data: [...], pagination: { ... } }
    if (response && Array.isArray(response.data)) {
      const casesList: SupportCase[] = response.data;
      const pagination = response.pagination || {};
      return {
        cases: casesList,
        total: pagination.totalRecords ?? casesList.length,
        page: pagination.page ?? page,
        limit: pagination.limit ?? limit,
        totalPages:
          pagination.totalPages ??
          (Math.ceil((pagination.totalRecords || casesList.length) / limit) ||
            1),
      };
    }

    // 2. Mobile router format: { success: true, cases: [...] }
    if (response && Array.isArray(response.cases)) {
      const rawCases = response.cases;
      const normalized: SupportCase[] = rawCases.map((c: any) => ({
        id: c.id || c.caseNumber,
        caseNumber: c.caseNumber,
        customerId: c.userId || "user-customer",
        customer: c.customer || {
          id: c.userId || "user-customer",
          name: c.customerName || "Junto User",
          email: c.customerEmail || "user@junto.com",
        },
        category: c.category,
        issueType: c.issueType || "",
        subject: c.summary || c.subject || "Support Issue",
        description: c.details || c.description || "",
        priority: c.priority || "MEDIUM",
        status: c.status === "Under Review" ? "OPEN" : c.status || "OPEN",
        assignedAgentId: c.assignedAgentId || null,
        assignedAgent: c.assignedAgent || null,
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
        relatedEntity:
          c.relatedEntity ||
          (c.relatedEntityType
            ? { type: c.relatedEntityType, id: c.relatedEntityId }
            : null),
      }));

      return {
        cases: normalized,
        total: normalized.length,
        page: 1,
        limit: normalized.length || 10,
        totalPages: 1,
      };
    }

    return {
      cases: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }

  /**
   * GET /api/support/cases/:caseId
   */
  public async getCaseById(caseId: string): Promise<SupportCase> {
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
          id: c.userId || "user-uuid",
          name: c.customerName || "Junto User",
          email: c.customerEmail || "user@junto.com",
          phone: c.phone || "",
        },
        category: c.category,
        issueType: c.issueType || "",
        subject: c.summary || c.subject || "Support Issue",
        description: c.details || c.description || "",
        priority: c.priority || "MEDIUM",
        status: c.status === "Under Review" ? "OPEN" : c.status || "OPEN",
        assignedAgentId: c.assignedAgentId || null,
        assignedAgent: c.assignedAgent || null,
        relatedEntity:
          c.relatedEntity ||
          (c.relatedEntityType
            ? { type: c.relatedEntityType, id: c.relatedEntityId }
            : null),
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
      };
    }

    if (!caseData) {
      throw new ApiError(404, `Support case #${caseId} not found`);
    }

    // Fetch conversation thread if not already populated
    if (!caseData.messages || caseData.messages.length === 0) {
      try {
        caseData.messages = await this.getCaseMessages(caseId);
      } catch {
        caseData.messages = [];
      }
    }

    return caseData;
  }

  /**
   * PATCH /api/support/cases/:caseId/assign
   */
  public async assignCase(
    caseId: string,
    agentId: string | null,
    _agentName?: string,
  ): Promise<SupportCase> {
    await api.patch<any>(`/support/cases/${caseId}/assign`, { agentId });
    return await this.getCaseById(caseId);
  }

  /**
   * PATCH /api/support/cases/:caseId/status
   */
  public async updateStatus(
    caseId: string,
    status: CaseStatus,
    _agentName?: string,
  ): Promise<SupportCase> {
    await api.patch<any>(`/support/cases/${caseId}/status`, { status });
    return await this.getCaseById(caseId);
  }

  /**
   * PATCH /api/support/cases/:caseId/priority
   */
  public async updatePriority(
    caseId: string,
    priority: CasePriority,
    _agentName?: string,
  ): Promise<SupportCase> {
    await api.patch<any>(`/support/cases/${caseId}/priority`, { priority });
    return await this.getCaseById(caseId);
  }

  /**
   * GET /api/support/cases/:caseId/messages
   */
  public async getCaseMessages(caseId: string): Promise<SupportCaseMessage[]> {
    const response = await api.get<any>(`/support/cases/${caseId}/messages`);
    const msgs = response?.data || response?.messages;
    if (Array.isArray(msgs)) {
      return msgs.map((m: any) => ({
        id: m.id || `msg-${Math.random()}`,
        caseId,
        senderType: m.senderType || (m.sender === "user" ? "USER" : "AGENT"),
        sender:
          m.sender && typeof m.sender === "object"
            ? m.sender
            : {
                id: m.senderId || "sender",
                name: m.senderName || m.sender || "Participant",
              },
        message: m.message || m.text || m.content || "",
        content: m.message || m.text || m.content || "",
        isInternalNote: !!m.isInternalNote,
        createdAt: m.createdAt || new Date().toISOString(),
      }));
    }
    return [];
  }

  /**
   * POST /api/support/cases/:caseId/messages
   * Request: { "message": "...", "isInternalNote": boolean }
   */
  public async addMessage(
    caseId: string,
    message: string,
    isInternalNote: boolean,
    currentAgent: SupportAgent,
  ): Promise<SupportCaseMessage> {
    const payload = {
      message,
      isInternalNote,
    };

    const response = await api.post<any>(
      `/support/cases/${caseId}/messages`,
      payload,
    );
    const data = response?.data;

    return {
      id: data?.id || `msg-${Date.now()}`,
      caseId,
      senderType: "AGENT",
      sender: {
        id: currentAgent.id,
        name: currentAgent.name,
        role: currentAgent.role,
      },
      message: data?.message || message,
      content: data?.message || message,
      isInternalNote,
      createdAt: data?.createdAt || new Date().toISOString(),
    };
  }

  /**
   * GET /api/support/agents
   */
  public async getAgents(): Promise<SupportAgent[]> {
    const response = await api.get<any>("/support/agents");
    const list = response?.data || response;
    if (Array.isArray(list)) {
      return list.map((a: any) => ({
        ...a,
        isActive: a.isActive !== false && a.status !== "INACTIVE",
        status:
          a.isActive !== false && a.status !== "INACTIVE"
            ? "ACTIVE"
            : "INACTIVE",
      }));
    }
    return [];
  }

  /**
   * POST /api/support/agents
   */
  public async createAgent(data: {
    userId?: string;
    email?: string;
    name?: string;
    role: AgentRole;
  }): Promise<SupportAgent> {
    const response = await api.post<any>("/support/agents", data);
    return response?.data || response;
  }

  /**
   * PATCH /api/support/agents/:agentId
   */
  public async updateAgent(
    agentId: string,
    updates: { role?: AgentRole; isActive?: boolean },
  ): Promise<void> {
    await api.patch(`/support/agents/${agentId}`, updates);
  }

  public async updateAgentRole(
    agentId: string,
    role: AgentRole,
  ): Promise<void> {
    return this.updateAgent(agentId, { role });
  }

  public async updateAgentStatus(
    agentId: string,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<void> {
    return this.updateAgent(agentId, { isActive: status === "ACTIVE" });
  }
}

export const supportService = new SupportService();
