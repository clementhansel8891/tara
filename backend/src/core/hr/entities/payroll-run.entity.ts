export class PayrollRun {
  id: string;
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  totalGrossPay: number;
  totalNetPay: number;
  baseCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}
