// Re-exporting from the single source of truth
export type { PayrollRun, PayrollRunStatus } from "@/core/types/hr/payroll";

export type PayrollComponent = {
  id: string;
  name: string;
  amount: number;
  type: "allowance" | "deduction" | "tax" | "overtime" | "base";
};

export type Payslip = {
  id: string;
  tenantId: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
  components: PayrollComponent[];
  createdAt: string;
};

export type Payroll = Payslip;
