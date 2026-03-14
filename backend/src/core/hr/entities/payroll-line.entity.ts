export class PayrollLine {
  id: string;
  tenantId: string;
  payrollRunId: string;
  employeeId: string;
  grossPay: number;
  netPay: number;
  adjustments: number;
  createdAt: Date;
  updatedAt: Date;
}
