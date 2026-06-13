import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { PayrollEngineService } from "./payroll-engine.service";

/**
 * Task 10.2 — Payroll calculation uses the employee's compensation WITHIN the
 * caller's Tenant_Scope (Requirements 1.2, 10.1).
 *
 * `compensations.employee_id` is globally unique, so a bare `findUnique` by id
 * alone would read compensation regardless of tenant. These tests prove the
 * engine:
 *   1. Looks compensation up with a composite, tenant-scoped predicate
 *      ({ employee_id, tenant_id }).
 *   2. Computes gross/net pay from that in-scope `base_salary`.
 *   3. Rejects with a client error (400) when no compensation exists within the
 *      caller's tenant scope (no cross-tenant leakage).
 *
 * The Prisma boundary is mocked so the test is fast and deterministic.
 */

const TENANT = "tnt-test";
const EMPLOYEE = "emp-1";

function buildEngine(overrides: { compensation?: any } = {}) {
  const compensationsFindFirst = vi.fn().mockResolvedValue(
    overrides.compensation === undefined
      ? { employee_id: EMPLOYEE, tenant_id: TENANT, base_salary: 1600, currency: "IDR" }
      : overrides.compensation,
  );

  const prisma: any = {
    compensations: { findFirst: compensationsFindFirst },
    // No attendance / bonuses / adjustments -> gross == base_salary.
    hr_attendance_records: { findMany: vi.fn().mockResolvedValue([]) },
    hr_sales_bonuses: { findMany: vi.fn().mockResolvedValue([]) },
    hr_payroll_adjustments: { findMany: vi.fn().mockResolvedValue([]) },
    // No tax configured -> tax amount 0.
    finance_tax_configs: { findFirst: vi.fn().mockResolvedValue(null) },
  };

  const engine = new PayrollEngineService(prisma);
  return { engine, prisma, compensationsFindFirst };
}

describe("PayrollEngineService.calculateEmployeePayroll — compensation within scope (task 10.2)", () => {
  let start: Date;
  let end: Date;

  beforeEach(() => {
    start = new Date("2024-01-01T00:00:00.000Z");
    end = new Date("2024-01-31T23:59:59.000Z");
  });

  it("resolves compensation scoped to { employee_id, tenant_id } and computes pay from base_salary", async () => {
    const { engine, compensationsFindFirst } = buildEngine();

    const breakdown = await engine.calculateEmployeePayroll(TENANT, EMPLOYEE, start, end);

    // The lookup is composite-key and tenant-scoped (no cross-tenant read).
    expect(compensationsFindFirst).toHaveBeenCalledWith({
      where: { employee_id: EMPLOYEE, tenant_id: TENANT },
    });

    // Payroll is computed from the in-scope compensation's base_salary.
    expect(breakdown.base_salary).toBe(1600);
    expect(breakdown.gross_income).toBe(1600);
    expect(breakdown.tax.amount).toBe(0);
    expect(breakdown.net_pay).toBe(1600);
  });

  it("rejects with BadRequestException (400) when no compensation exists within tenant scope", async () => {
    const { engine } = buildEngine({ compensation: null });

    await expect(
      engine.calculateEmployeePayroll(TENANT, EMPLOYEE, start, end),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
