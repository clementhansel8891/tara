export class TrainingProgram {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  completionRate: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  assignments?: any[];
  skills?: any[];
}
