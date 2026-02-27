/**
 * Payroll Entity
 * Represents payroll calculation for an employee
 */
export class Payroll {
  id: string;
  tenantId: string;
  employeeId: string;
  period: string; // YYYY-MM format
  baseSalary: number;
  hoursWorked?: number;
  hourlyRate?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  bonuses?: number;
  deductions?: number;
  grossPay: number;
  netPay: number;
  status: "draft" | "approved" | "paid";
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
