// Feature: hr-module-stabilization, Property 1: Tenant-scoped reads never leak other tenants
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { HRDbRepository } from "./hr.db.repository";

/**
 * Property 1: Tenant-scoped reads never leak other tenants
 * Validates: Requirements 2.1, 2.6, 4.3, 6.1, 6.2, 6.7, 7.7, 8.5, 9.5, 10.6, 11.4, 11.5
 *
 * For any two distinct tenants seeded with HR records, any read (list, filtered
 * list, or get-by-id) issued by a non-privileged caller of one tenant returns
 * only records belonging to that caller's `tenant_id`, and a get-by-id for a
 * record owned by the other tenant returns a not-found (null) response.
 *
 * Strategy (per design "Generators" / "Isolation & atomicity"): seed two tenants
 * into a fake Prisma boundary that honours the repository's `where`-clause
 * filtering (notably `tenant_id`, the `findFirst({ OR: [{id},{user_id}], tenant_id })`
 * composite-key reads — Requirement 4.3 — and `deleted_at: null`). The repository
 * is exercised unchanged; the property asserts no read ever surfaces a row whose
 * `tenant_id` differs from the calling tenant, and cross-tenant get-by-id is null.
 *
 * This single property is parameterized across the HR record types reachable
 * through the repository's tenant-scoped reads: employees (6.1/6.2/6.7),
 * leave requests (9.5), job requisitions (11.4), performance cycles (11.4),
 * and payroll runs (10.6). The composite-key get-by-id reads exercise 4.3 and
 * the cross-tenant not-found contract (2.6/6.7/9.5/10.6/11.5).
 */

type Row = Record<string, any>;

/**
 * Minimal Prisma `where` matcher: supports scalar equality, explicit `null`
 * (e.g. `deleted_at: null`), `OR`/`AND` arrays, and date/number range operators.
 * Nested relation filters (objects without range keys) are intentionally ignored
 * — the repository never relies on them for tenant isolation, and the generators
 * below never produce them, so isolation is always decided by `tenant_id`.
 */
function matchWhere(row: Row, where: any): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "OR") {
      if (!(cond as any[]).some((sub) => matchWhere(row, sub))) return false;
      continue;
    }
    if (key === "AND") {
      if (!(cond as any[]).every((sub) => matchWhere(row, sub))) return false;
      continue;
    }
    if (cond === null) {
      if (row[key] !== null && row[key] !== undefined) return false;
      continue;
    }
    if (typeof cond === "object" && !(cond instanceof Date)) {
      const range = cond as Record<string, any>;
      const hasRange =
        "gte" in range || "lte" in range || "lt" in range || "gt" in range;
      if (hasRange) {
        const v = row[key];
        const t = v instanceof Date ? v.getTime() : v;
        const norm = (x: any) => (x instanceof Date ? x.getTime() : x);
        if ("gte" in range && t < norm(range.gte)) return false;
        if ("lte" in range && t > norm(range.lte)) return false;
        if ("lt" in range && t >= norm(range.lt)) return false;
        if ("gt" in range && t <= norm(range.gt)) return false;
        continue;
      }
      // Nested relation filter — not used for tenant isolation; skip.
      continue;
    }
    if (row[key] !== cond) return false;
  }
  return true;
}

/** Build a fake Prisma model delegate backed by an in-memory row array. */
function makeTable(rows: Row[]) {
  const filtered = (args: any) => rows.filter((r) => matchWhere(r, args?.where));
  return {
    findMany: async (args: any = {}) => {
      let res = filtered(args);
      if (args.orderBy) {
        const [k, dir] = Object.entries(args.orderBy)[0] as [string, string];
        res = [...res].sort((a, b) => {
          if (a[k] < b[k]) return dir === "desc" ? 1 : -1;
          if (a[k] > b[k]) return dir === "desc" ? -1 : 1;
          return 0;
        });
      }
      if (typeof args.skip === "number") res = res.slice(args.skip);
      if (typeof args.take === "number") res = res.slice(0, args.take);
      return res;
    },
    findFirst: async (args: any = {}) => filtered(args)[0] ?? null,
    findUnique: async (args: any = {}) => filtered(args)[0] ?? null,
    count: async (args: any = {}) => filtered(args).length,
  };
}

// ----- Row builders (one per seeded HR record type) -------------------------

function employeeRow(tenant_id: string, n: number): Row {
  const id = `${tenant_id}__emp__${n}`;
  return {
    id,
    user_id: `${tenant_id}__usr__${n}`,
    tenant_id,
    company_id: `${tenant_id}__co`,
    location_id: `${tenant_id}__loc`,
    department_id: `${tenant_id}__dep`,
    employee_code: `E-${n}`,
    first_name: `First${n}`,
    last_name: `Last${n}`,
    email: `e${n}@${tenant_id}.example`,
    phone: null,
    manager_id: null,
    positions: "Staff",
    status: "active",
    employment_type: "full_time",
    base_salary: null,
    hourly_rate: null,
    hire_date: new Date("2024-01-01T00:00:00.000Z"),
    termination_date: null,
    document_metadata: null,
    deleted_at: null,
    companies: { currency: "USD" },
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function leaveRow(tenant_id: string, n: number): Row {
  return {
    id: `${tenant_id}__leave__${n}`,
    tenant_id,
    employee_id: `${tenant_id}__emp__${n}`,
    leave_type: "annual",
    start_date: new Date("2024-02-01T00:00:00.000Z"),
    end_date: new Date("2024-02-03T00:00:00.000Z"),
    total_days: 2,
    reason: "vacation",
    status: "requested",
    requested_at: new Date("2024-01-15T00:00:00.000Z"),
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    deleted_at: null,
    created_at: new Date("2024-01-15T00:00:00.000Z"),
    updated_at: new Date("2024-01-15T00:00:00.000Z"),
  };
}

function requisitionRow(tenant_id: string, n: number): Row {
  return {
    id: `${tenant_id}__req__${n}`,
    tenant_id,
    department_id: `${tenant_id}__dep`,
    title: `Role ${n}`,
    openings: 1,
    status: "open",
    created_at: new Date("2024-01-10T00:00:00.000Z"),
    updated_at: new Date("2024-01-10T00:00:00.000Z"),
  };
}

function cycleRow(tenant_id: string, n: number): Row {
  return {
    id: `${tenant_id}__cycle__${n}`,
    tenant_id,
    name: `Cycle ${n}`,
    status: "active",
    start_date: new Date("2024-01-01T00:00:00.000Z"),
    end_date: new Date("2024-12-31T00:00:00.000Z"),
    due_date: new Date("2024-12-15T00:00:00.000Z"),
    deleted_at: null,
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function payrollRunRow(tenant_id: string, n: number): Row {
  return {
    id: `${tenant_id}__run__${n}`,
    tenant_id,
    period_start: new Date("2024-01-01T00:00:00.000Z"),
    period_end: new Date("2024-01-31T00:00:00.000Z"),
    status: "DRAFT",
    total_gross_pay: 1000,
    total_net_pay: 800,
    base_currency: "USD",
    created_at: new Date("2024-02-01T00:00:00.000Z"),
    updated_at: new Date("2024-02-01T00:00:00.000Z"),
  };
}

function buildRows<T>(tenant_id: string, count: number, fn: (t: string, n: number) => T): T[] {
  return Array.from({ length: count }, (_v, n) => fn(tenant_id, n));
}

describe("Property 1: Tenant-scoped reads never leak other tenants", () => {
  it("scoped reads return only the caller's tenant; cross-tenant get-by-id is not-found", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantA: fc.uuid(),
          tenantB: fc.uuid(),
          empA: fc.nat({ max: 5 }),
          empB: fc.nat({ max: 5 }),
          leaveA: fc.nat({ max: 4 }),
          leaveB: fc.nat({ max: 4 }),
          reqA: fc.nat({ max: 4 }),
          reqB: fc.nat({ max: 4 }),
          cycA: fc.nat({ max: 4 }),
          cycB: fc.nat({ max: 4 }),
          runA: fc.nat({ max: 4 }),
          runB: fc.nat({ max: 4 }),
        }),
        async (s) => {
          // Two genuinely distinct tenants.
          fc.pre(s.tenantA !== s.tenantB);
          const A = s.tenantA;
          const B = s.tenantB;

          const employees = [
            ...buildRows(A, s.empA, employeeRow),
            ...buildRows(B, s.empB, employeeRow),
          ];
          const leaves = [
            ...buildRows(A, s.leaveA, leaveRow),
            ...buildRows(B, s.leaveB, leaveRow),
          ];
          const requisitions = [
            ...buildRows(A, s.reqA, requisitionRow),
            ...buildRows(B, s.reqB, requisitionRow),
          ];
          const cycles = [
            ...buildRows(A, s.cycA, cycleRow),
            ...buildRows(B, s.cycB, cycleRow),
          ];
          const runs = [
            ...buildRows(A, s.runA, payrollRunRow),
            ...buildRows(B, s.runB, payrollRunRow),
          ];

          const prisma = {
            employees: makeTable(employees),
            leave_requests: makeTable(leaves),
            job_requisitions: makeTable(requisitions),
            hr_performance_cycles: makeTable(cycles),
            hr_payroll_runs: makeTable(runs),
          } as any;

          const repo = new HRDbRepository(prisma);

          // --- (1) List reads: every returned record belongs to the caller. ---
          const empList = await repo.getEmployees(A, undefined, undefined, undefined, 1, 100);
          for (const e of empList.data) expect(e.tenant_id).toBe(A);

          const leaveList = await repo.getLeaveRequests(A);
          for (const l of leaveList) expect(l.tenant_id).toBe(A);

          const reqList = await repo.getRequisitions(A);
          for (const r of reqList) expect(r.tenant_id).toBe(A);

          const cycleList = await repo.getPerformanceCycles(A);
          for (const c of cycleList) expect(c.tenant_id).toBe(A);

          const runList = await repo.getPayrollRuns(A);
          for (const r of runList) expect(r.tenant_id).toBe(A);

          // --- (2) Filtered list read: filter by A's own scope still A-only. ---
          const empFiltered = await repo.getEmployees(A, `${A}__loc`, `${A}__co`, `${A}__dep`, 1, 100);
          for (const e of empFiltered.data) expect(e.tenant_id).toBe(A);
          // A location filter that belongs to B must yield nothing for caller A.
          const empForeignLoc = await repo.getEmployees(A, `${B}__loc`, undefined, undefined, 1, 100);
          expect(empForeignLoc.data).toEqual([]);

          // --- (3) get-by-id for the OTHER tenant's records => not-found (null). ---
          for (let n = 0; n < s.empB; n++) {
            expect(await repo.getEmployeeById(A, `${B}__emp__${n}`)).toBeNull();
            // Composite-key read also covers the user_id branch (Requirement 4.3).
            expect(await repo.getEmployeeById(A, `${B}__usr__${n}`)).toBeNull();
          }
          for (let n = 0; n < s.leaveB; n++) {
            expect(await repo.getLeaveRequestById(A, `${B}__leave__${n}`)).toBeNull();
          }
          for (let n = 0; n < s.runB; n++) {
            expect(await repo.getPayrollRunById(A, `${B}__run__${n}`)).toBeNull();
          }

          // --- (4) get-by-id for the caller's OWN records => found, and A-scoped. ---
          for (let n = 0; n < s.empA; n++) {
            const own = await repo.getEmployeeById(A, `${A}__emp__${n}`);
            expect(own).not.toBeNull();
            expect(own!.tenant_id).toBe(A);
          }
          for (let n = 0; n < s.runA; n++) {
            const own = await repo.getPayrollRunById(A, `${A}__run__${n}`);
            expect(own).not.toBeNull();
            expect(own!.tenant_id).toBe(A);
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});
