export class TrainingAssignment {
  id: string;
  tenantId: string;
  programId: string;
  employeeId: string;
  status: string; // in_progress, completed
  assignedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  employee?: any;
  program?: any;
}
