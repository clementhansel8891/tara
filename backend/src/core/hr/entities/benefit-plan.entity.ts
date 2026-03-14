import { EmployeeBenefit } from "./employee-benefit.entity";

export class BenefitPlan {
  id: string;
  tenantId: string;
  name: string;
  type: string; // HEALTH, RETIREMENT, PERK, INSURANCE
  description?: string;
  employerContribution: number;
  employeeContribution: number;
  frequency: string; // MONTHLY, ANNUALLY
  createdAt: Date;
  updatedAt: Date;

  enrollments?: EmployeeBenefit[];
}
