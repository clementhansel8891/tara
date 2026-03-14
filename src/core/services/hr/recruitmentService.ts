import type { RecruitmentRequisition } from "@/core/types/hr/recruitment";
import type { SessionContext } from "@/core/security/session";
import { apiRequest } from "@/core/api/apiClient";
import { workflowService } from "./workflowService";

export type CandidateRecord = {
  id: string;
  name: string;
  role: string;
  stage: "sourcing" | "screening" | "interview" | "offer" | "rejected";
  departmentId: string;
  requisitionId: string;
  dateApplied: string;
};

export const recruitmentService = {
  async getPipelineStages() {
    return ["sourcing", "screening", "interview", "offer", "rejected"] as const;
  },

  async listRequisitions(tenantId: string, actor: SessionContext): Promise<RecruitmentRequisition[]> {
    return apiRequest<RecruitmentRequisition[]>(
      `/hr/requisitions`,
      "GET",
      actor
    );
  },

  async listCandidates(tenantId: string, actor: SessionContext): Promise<CandidateRecord[]> {
    return [];
  },

  async createRequisition(
    tenantId: string,
    actor: SessionContext,
    payload: Omit<RecruitmentRequisition, "id" | "tenantId" | "createdAt" | "updatedAt">,
  ) {
    return apiRequest<RecruitmentRequisition>(
      `/hr/requisitions`,
      "POST",
      actor,
      payload
    );
  },

  async scheduleInterview(tenantId: string, actor: SessionContext, candidateId: string, notes?: string) {
    return { success: true };
  },

  async routeCandidate(tenantId: string, actor: SessionContext, candidateId: string) {
    return workflowService.createRequest(tenantId, actor, {
      entityType: "RECRUITMENT",
      entityId: candidateId,
      makerDept: actor.departmentId,
      destinationDept: "HR",
      metadata: { candidateId },
    });
  },

  async getCandidateProfile(tenantId: string, actor: SessionContext, candidateId: string) {
    return {
      id: candidateId,
      name: "Candidate Details",
      email: "candidate@example.com",
      phone: "+1 (555) 000-0000",
      education: "Master of Science in Operations",
      experience: "8 years in retail management",
      documents: [
        { id: "doc-1", name: "Resume_v2.pdf", type: "PDF", size: "1.2 MB" },
        { id: "doc-2", name: "Certifications.zip", type: "ZIP", size: "4.5 MB" },
      ],
    };
  },

  async advanceCandidate(tenantId: string, actor: SessionContext, candidateId: string) {
    return { success: true };
  },

  async rejectCandidate(tenantId: string, actor: SessionContext, candidateId: string, reason: string) {
    return { success: true };
  },

  async hireCandidate(tenantId: string, actor: SessionContext, candidateId: string) {
    return apiRequest<any>(
      `/hr/candidates/${candidateId}/hire`,
      "POST",
      actor
    );
  },
};
