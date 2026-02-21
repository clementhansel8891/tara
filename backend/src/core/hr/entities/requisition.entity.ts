export class JobRequisition {
  id: string;
  tenantId: string;
  departmentId?: string;
  title: string;
  status: 'open' | 'closed' | 'screening' | 'interview' | 'offer' | 'rejected';
  openings: number;
  createdAt: Date;
  updatedAt: Date;
}
