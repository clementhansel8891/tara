/**
 * PayrollRun Entity (table `hr_payroll_runs`).
 *
 * Field-mapping discipline (Requirement 5): the camelCase fields below are
 * compatibility aliases and do NOT match schema columns. Persist them via
 * `utils/field-mapping.ts -> mapPayrollRunFieldsToColumns`, which resolves:
 *   - `totalGrossPay` -> column `total_gross_pay`
 *   - `totalNetPay`   -> column `total_net_pay`
 *   - `baseCurrency`  -> column `base_currency`
 */
export class PayrollRun {
  id: string;
  tenant_id: string;
  period_start: Date;
  period_end: Date;
  status: string;
  totalGrossPay: number; // Alias -> column `total_gross_pay`
  totalNetPay: number; // Alias -> column `total_net_pay`
  baseCurrency: string; // Alias -> column `base_currency`
  created_at: Date;
  updated_at: Date;
}
