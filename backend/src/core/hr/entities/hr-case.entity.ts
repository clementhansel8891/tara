export class HRCase {
  id: string;
  tenantId: string;
  employeeId: string;
  departmentId?: string;
  title: string;
  type: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
