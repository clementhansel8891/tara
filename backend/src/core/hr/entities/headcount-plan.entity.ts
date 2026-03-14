export class HeadcountPlan {
  id: string;
  tenantId: string;
  scenarioId: string;
  departmentId: string;
  positionTitle: string;
  targetHeadcount: number;
  projectedSalary: number;
  plannedHireDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
