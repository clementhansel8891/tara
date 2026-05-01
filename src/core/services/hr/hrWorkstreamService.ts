import { hrService } from "@/core/services/hr/hrService";
import { attendanceService } from "@/core/services/hr/attendanceService";
import { payrollService } from "@/core/services/hr/payrollService";
import { trainingService } from "@/core/services/hr/trainingService";
import { workflowService } from "@/core/services/hr/workflowService";
import type { SessionContext } from "@/core/security/session";
import { Roles } from "@/core/security/roles";

export type PulseItem = {
  id: string;
  title: string;
  status: string;
  urgency: number;
  owner: string;
  nextAction: string;
  source: string;
  entityId?: string;
};

const ensureTenantAccess = (tenantId: string, actor: SessionContext) => {
  if (actor.role === Roles.SUPERADMIN) return;
  if (actor.tenant_id !== tenantId) {
    throw new Error("Tenant access denied");
  }
};

export const hrWorkstreamService = {
  async getPulseItems(tenantId: string, actor: SessionContext): Promise<PulseItem[]> {
    ensureTenantAccess(tenantId, actor);

    // Fetch data in parallel
    const [workflows, employees, attendance, payrollRuns, trainings] = await Promise.all([
      workflowService.listRequests(tenantId, actor),
      hrService.listEmployees(tenantId, actor),
      attendanceService.listAttendance(tenantId, actor),
      payrollService.listRuns(tenantId, actor),
      trainingService.listAssignments(tenantId, actor),
    ]);

    // Stub contracts for now as service doesn't exist
    const contracts: any[] = []; 

    const employeeMap = new Map(
      employees.map((employee) => [employee.id, employee.departmentId]),
    );

    const workflowItems: PulseItem[] = workflows.slice(0, 6).map((flow) => ({
      id: flow.id,
      title: `Approval needed: ${flow.entityType}`,
      status: flow.status,
      urgency: flow.status === "PENDING" ? 80 : 40,
      owner: flow.destinationDept,
      nextAction: "Review in FlowGate",
      source: "FlowGate",
      entityId: flow.entityId,
    }));

    const contractItems: PulseItem[] = contracts.slice(0, 4).map((contract) => ({
      id: contract.id,
      title: `${contract.title} pending signature`,
      status: contract.status,
      urgency: 65,
      owner: (contract as any).departmentId ?? "HR",
      nextAction: "Route to LexBoard",
      source: "LexBoard",
      entityId: contract.id,
    }));

    const payrollItems: PulseItem[] = payrollRuns
      .filter((run) => run.status !== "approved")
      .slice(0, 4)
      .map((run) => ({
        id: run.id,
        title: `Payroll run ${run.periodStart} - ${run.periodEnd}`,
        status: run.status,
        urgency: run.status === "draft" ? 70 : 55,
        owner: "Payroll Ops",
        nextAction: "Open PayCycle Studio",
        source: "PayCycle Studio",
        entityId: run.id,
      }));

    const attendanceItems: PulseItem[] = attendance
      .filter((record) => record.status !== "on_time")
      .slice(0, 4)
      .map((record) => ({
        id: record.id,
        title: `Attendance anomaly: ${record.employeeId}`,
        status: record.status,
        urgency: record.status === "absent" ? 85 : 60,
        owner: employeeMap.get(record.employeeId) ?? "HR",
        nextAction: "Review in Attendance",
        source: "Attendance",
        entityId: record.employeeId,
      }));

    const trainingItems: PulseItem[] = trainings
      .filter((item) => item.status !== "completed")
      .slice(0, 4)
      .map((assignment) => ({
        id: assignment.id,
        title: `Training incomplete: ${assignment.employeeId}`,
        status: assignment.status,
        urgency: 50,
        owner: employeeMap.get(assignment.employeeId) ?? "HR",
        nextAction: "Open SkillTrack",
        source: "SkillTrack",
        entityId: assignment.employeeId,
      }));

    return [
      ...workflowItems,
      ...contractItems,
      ...payrollItems,
      ...attendanceItems,
      ...trainingItems,
    ];
  },
};
