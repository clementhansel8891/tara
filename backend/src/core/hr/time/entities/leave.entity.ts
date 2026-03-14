export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  startDate: Date;
  endDate: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
