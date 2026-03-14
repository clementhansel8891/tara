export class PerformanceGoal {
  id: string;
  tenantId: string;
  employeeId: string;
  title: string;
  description?: string;
  targetDate: Date;
  progress: number;
  status: string; // IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
  createdAt: Date;
  updatedAt: Date;

  employee?: any;
}
