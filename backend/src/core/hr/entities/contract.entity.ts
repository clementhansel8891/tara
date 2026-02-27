export class Contract {
  id: string;
  tenantId: string;
  employeeId?: string;
  title: string;
  type: string;
  status: "active" | "draft" | "expired" | "terminated";
  startDate: Date;
  endDate?: Date;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}
