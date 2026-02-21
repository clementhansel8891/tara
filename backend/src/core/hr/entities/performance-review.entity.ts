export class PerformanceReview {
  id: string;
  tenantId: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  status: 'pending' | 'submitted' | 'calibrated' | 'approved';
  rating?: number;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}
