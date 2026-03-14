import { BenefitPlan } from "./benefit-plan.entity";

export class EmployeeBenefit {
  id: string;
  tenantId: string;
  employeeId: string;
  planId: string;
  enrollmentDate: Date;
  status: string; // ACTIVE, PENDING, CANCELLED
  coverageAmount?: number;
  createdAt: Date;
  updatedAt: Date;

  plan?: BenefitPlan;
}
