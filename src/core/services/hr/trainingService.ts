import type { TrainingAssignment, TrainingProgram } from "@/core/types/hr/training";
import type { SessionContext } from "@/core/security/session";
import { Roles } from "@/core/security/roles";

const ensureTenantAccess = (tenantId: string, actor: SessionContext) => {
  if (actor.role === Roles.SUPERADMIN) return;
  if (actor.tenantId !== tenantId) throw new Error("Tenant access denied");
};

export const trainingService = {
  async listPrograms(tenantId: string, actor: SessionContext): Promise<TrainingProgram[]> {
    // Stub
    return [
      { id: "prog-1", tenantId, name: "Onboarding", status: "in_progress", completionRate: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "prog-2", tenantId, name: "Compliance", status: "in_progress", completionRate: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
  },

  async listAssignments(tenantId: string, actor: SessionContext): Promise<TrainingAssignment[]> {
    // Stub
    return [];
  },

  async getComplianceStatus(tenantId: string, actor: SessionContext) {
    return {
      assigned: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0,
    };
  },

  async assignTraining(
    tenantId: string,
    actor: SessionContext,
    payload: { employeeId: string; programId: string; status?: TrainingAssignment["status"] },
  ) {
    console.log("Assign training", payload);
    return {
      id: "assign-stub",
      tenantId,
      employeeId: payload.employeeId,
      programId: payload.programId,
      status: payload.status ?? "planned",
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as TrainingAssignment;
  },

  async createProgram(
    tenantId: string,
    actor: SessionContext,
    payload: Omit<TrainingProgram, "id" | "tenantId" | "createdAt" | "updatedAt">,
  ) {
    console.log("Create program", payload);
    return {
      id: "prog-stub",
      tenantId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as TrainingProgram;
  },

  async bulkAssign(
    tenantId: string,
    actor: SessionContext,
    payload: { employeeIds: string[]; programId: string },
  ) {
    console.log("Bulk assign", payload);
    return [];
  },

  async exportCompliance(tenantId: string, actor: SessionContext) {
    return [];
  },

  async requestComplianceReview(tenantId: string, actor: SessionContext, employeeId: string) {
    return { id: "req-stub", status: "pending" };
  },

  async completeTraining(tenantId: string, actor: SessionContext, assignmentId: string) {
    return { id: assignmentId, status: "completed" } as any;
  },
};
