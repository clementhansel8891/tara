/**
 * Compensation Entity
 * Represents multi-component salary structure
 */
export class Compensation {
  id: string;
  tenantId: string;
  employeeId: string;
  baseSalary: number;
  currency: string;
  payFrequency: "monthly" | "bi_weekly" | "weekly";
  allowances: { type: string; amount: number }[];
  bonuses: { type: string; amount: number }[];
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
