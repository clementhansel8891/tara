/**
 * Leave Request Entity
 * Represents employee leave requests
 */
export class LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveType: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'emergency';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
