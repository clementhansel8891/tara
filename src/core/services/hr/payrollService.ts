import type { Payroll, PayrollRun, Payslip, PayrollComponent, PayrollRunStatus } from "@/core/hr/payroll/types";
import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";

export const payrollService = {
  async prepareCycle(tenantId: string, actor: SessionContext, periodStart: string, periodEnd: string): Promise<PayrollRun> {
    // Stub
    return {
      id: "run-stub",
      tenantId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      status: "draft",
      totalEmployees: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  },

  async lockAttendance(tenantId: string, actor: SessionContext, periodStart: string, periodEnd: string) {
    console.log("Locking attendance", periodStart, periodEnd);
  },

  async runVarianceCheck(tenantId: string, actor: SessionContext, runId: string) {
    return { runId, varianceScore: 0 };
  },

  async listRuns(tenantId: string, actor: SessionContext): Promise<PayrollRun[]> {
    // Backend doesn't have listRuns yet, stubbing empty
    return [];
  },

  async getEmployeePayroll(tenantId: string, actor: SessionContext, employeeId: string): Promise<Payroll[]> {
    return apiRequest<Payroll[]>(`/hr/payroll/${employeeId}`, "GET", actor);
  },

  async submitForApproval(tenantId: string, actor: SessionContext, runId: string) {
    // Stub
  },

  async approveRun(tenantId: string, actor: SessionContext, runId: string) {
    // Stub
  },

  async exportJournal(tenantId: string, actor: SessionContext, runId: string) {
    return { url: "http://mock-export" };
  },

  async generatePayslip(
    tenantId: string,
    actor: SessionContext,
    employeeId: string,
    periodStart: string,
    periodEnd: string,
    components: PayrollComponent[],
  ): Promise<Payslip> {
    // Stub
    return {
      id: "payslip-stub",
      tenantId,
      employeeId,
      periodStart,
      periodEnd,
      grossPay: 0,
      netPay: 0,
      components,
      createdAt: new Date().toISOString()
    };
  },
};
