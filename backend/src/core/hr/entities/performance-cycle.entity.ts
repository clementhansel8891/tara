export class PerformanceCycle {
  id: string;
  tenantId: string;
  name: string;
  status: "active" | "completed" | "draft";
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
