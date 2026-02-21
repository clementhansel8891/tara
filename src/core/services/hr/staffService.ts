import type { Employee } from "@/core/types/hr/employee";
import { hrService } from "@/core/services/hr/hrService";
import { orgService } from "@/core/services/hr/orgService";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { audit } from "@/core/logging/audit";

export type StaffFilters = {
  search?: string;
  departmentId?: string;
  status?: Employee["status"] | "all";
  roleTitle?: string;
};

export type StaffListResult = {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
};

const ensureTenantAccess = (tenantId: string, actor: SessionContext) => {
  if (actor.role === Roles.SUPERADMIN) return;
  if (actor.tenantId !== tenantId) {
    throw new Error("Tenant access denied");
  }
};

export const staffService = {
  getStatusOptions() {
    return ["active", "on_leave", "inactive", "terminated"] as const;
  },

  async listRoleTitles(tenantId: string, actor: SessionContext) {
    const employees = await hrService.listEmployees(tenantId, actor);
    const roles = new Set(employees.map((emp) => emp.roleTitle));
    return Array.from(roles);
  },

  async listStaff(
    tenantId: string,
    actor: SessionContext,
    filters: StaffFilters = {},
    pagination: { page?: number; pageSize?: number } = {},
  ): Promise<StaffListResult> {
    ensureTenantAccess(tenantId, actor);
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 10;
    
    // Fetch all employees from backend
    // In a real app, filtering and pagination should be done on backend
    let employees = await hrService.listEmployees(tenantId, actor);

    if (filters.search) {
      const query = filters.search.toLowerCase();
      employees = employees.filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(query) ||
          emp.roleTitle.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query),
      );
    }

    if (filters.departmentId && filters.departmentId !== "all") {
      employees = employees.filter((emp) => emp.departmentId === filters.departmentId);
    }

    if (filters.status && filters.status !== "all") {
      employees = employees.filter((emp) => emp.status === filters.status);
    }

    if (filters.roleTitle && filters.roleTitle !== "all") {
      employees = employees.filter((emp) => emp.roleTitle === filters.roleTitle);
    }

    const total = employees.length;
    const start = (page - 1) * pageSize;
    const items = employees.slice(start, start + pageSize);
    return { items, total, page, pageSize };
  },

  async listDepartments(tenantId: string, actor: SessionContext) {
    return orgService.getOrgMap(tenantId, actor);
  },

  async createEmployee(
    tenantId: string,
    actor: SessionContext,
    payload: Omit<Employee, "id" | "tenantId" | "createdAt" | "updatedAt">,
  ) {
    ensureTenantAccess(tenantId, actor);
    const record = await hrService.createEmployee(tenantId, actor, payload);
    audit.log({
      tenantId,
      actorId: actor.userId,
      action: "staff.create",
      entityType: "employee",
      entityId: record.id,
    });
    return record;
  },

  async updateEmployee(
    tenantId: string,
    actor: SessionContext,
    employeeId: string,
    patch: Partial<Employee>,
  ) {
    ensureTenantAccess(tenantId, actor);
    const record = await hrService.updateEmployee(tenantId, actor, employeeId, patch);
    return record;
  },

  // Stubbed methods for workflows/actions
  async requestTermination(tenantId: string, actor: SessionContext, employeeId: string, reason?: string) {
    console.log("Termination requested", employeeId, reason);
    return { id: "req-stub", status: "pending" };
  },

  async requestTransfer(tenantId: string, actor: SessionContext, employeeId: string, targetDept: string, reason?: string) {
     console.log("Transfer requested", employeeId, targetDept, reason);
     return { id: "req-stub", status: "pending" };
  },

  async importStaff(tenantId: string, actor: SessionContext, source: string) {
     console.log("Import staff", source);
  },

  async exportStaff(tenantId: string, actor: SessionContext) {
     const employees = await hrService.listEmployees(tenantId, actor);
     console.log("Export staff", employees.length);
     return employees;
  },

  async requestPerformanceReview(tenantId: string, actor: SessionContext, employeeId: string) {
    console.log("Performance review requested", employeeId);
    return { id: "req-stub", status: "pending" };
  },

  async openPayrollCase(tenantId: string, actor: SessionContext, employeeId: string) {
    console.log("Payroll case opened", employeeId);
    return { id: "req-stub", status: "pending" };
  },
};
