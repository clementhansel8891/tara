import { describe, it, expect, beforeEach, vi } from "vitest";
import { HRDbRepository } from "./hr.db.repository";

/**
 * Unit tests for Task 2.2 — employee create/update/deactivate with explicit
 * DTO-to-column field mapping (Requirements 1.5, 5.1, 5.2, 5.3, 6.3, 6.4, 6.5).
 *
 * These tests mock the Prisma client and assert on the `data` payloads handed to
 * Prisma, proving that values bind to the correct schema columns (no implicit
 * spread, no drift to nonexistent columns such as `position`).
 */

const TENANT = "tnt-test";

/** Build a fake employees row echoing the persisted columns for mapEmployee(). */
function fakeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "emp-1",
    tenant_id: TENANT,
    company_id: "co-1",
    location_id: "loc-1",
    employee_code: "E-1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    phone: null,
    department_id: "dep-1",
    manager_id: null,
    user_id: "usr-1",
    positions: "Staff",
    job_role_id: null,
    status: "active",
    employment_type: "full_time",
    base_salary: null,
    hourly_rate: null,
    hire_date: new Date("2024-01-01T00:00:00.000Z"),
    termination_date: null,
    document_metadata: null,
    deleted_at: null,
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-01T00:00:00.000Z"),
    companies: { currency: "USD" },
    ...overrides,
  };
}

describe("HRDbRepository employee write paths (field mapping)", () => {
  let prisma: any;
  let repo: HRDbRepository;
  let createdData: any;
  let updatedData: any;

  beforeEach(() => {
    createdData = undefined;
    updatedData = undefined;

    prisma = {
      locations: {
        findFirst: vi.fn().mockResolvedValue({ id: "loc-1", company_id: "co-1" }),
        findUnique: vi.fn().mockResolvedValue({ id: "loc-1", company_id: "co-1" }),
      },
      users: {
        findUnique: vi.fn().mockResolvedValue({ id: "usr-1" }),
        create: vi.fn().mockResolvedValue({ id: "usr-1" }),
      },
      user_companies: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      employees: {
        create: vi.fn().mockImplementation((args: any) => {
          createdData = args.data;
          return Promise.resolve(fakeRow(args.data));
        }),
        update: vi.fn().mockImplementation((args: any) => {
          updatedData = args.data;
          return Promise.resolve(fakeRow(args.data));
        }),
      },
    };

    repo = new HRDbRepository(prisma);
  });

  describe("createEmployee", () => {
    it("maps role_title to the `positions` column and never writes `position`", async () => {
      await repo.createEmployee(TENANT, {
        employee_code: "E-1",
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        department_id: "dep-1",
        role_title: "Engineer",
        location_id: "loc-1",
        company_id: "co-1",
        hire_date: "2024-01-01",
      } as any);

      expect(createdData.positions).toBe("Engineer");
      expect(createdData).not.toHaveProperty("position");
      expect(createdData).not.toHaveProperty("role_title");
    });

    it("defaults `positions` to 'Staff' when none supplied and binds resolved scope", async () => {
      await repo.createEmployee(TENANT, {
        employee_code: "E-2",
        first_name: "Grace",
        last_name: "Hopper",
        email: "grace@example.com",
        department_id: "dep-1",
        location_id: "loc-1",
        company_id: "co-1",
        hire_date: "2024-01-01",
      } as any);

      expect(createdData.positions).toBe("Staff");
      expect(createdData.tenant_id).toBe(TENANT);
      expect(createdData.status).toBe("active");
      expect(createdData.employment_type).toBe("full_time");
    });

    it("drops computed `full_name` (no backing column)", async () => {
      await repo.createEmployee(TENANT, {
        employee_code: "E-3",
        first_name: "Ada",
        last_name: "Lovelace",
        full_name: "Ada Lovelace",
        email: "ada3@example.com",
        department_id: "dep-1",
        location_id: "loc-1",
        company_id: "co-1",
        hire_date: "2024-01-01",
      } as any);

      expect(createdData).not.toHaveProperty("full_name");
    });
  });

  describe("updateEmployee", () => {
    it("maps role_title to `positions` (regression for the `position` drift bug)", async () => {
      await repo.updateEmployee(TENANT, "emp-1", {
        role_title: "Manager",
      } as any);

      expect(updatedData.positions).toBe("Manager");
      expect(updatedData).not.toHaveProperty("position");
      expect(updatedData).not.toHaveProperty("role_title");
    });

    it("persists every supplied field via correct columns and drops full_name", async () => {
      await repo.updateEmployee(TENANT, "emp-1", {
        first_name: "Edith",
        last_name: "Clarke",
        full_name: "Edith Clarke",
        department_id: "dep-2",
        documents_metadata: { note: "x" },
      } as any);

      expect(updatedData.first_name).toBe("Edith");
      expect(updatedData.last_name).toBe("Clarke");
      expect(updatedData.department_id).toBe("dep-2");
      expect(updatedData.document_metadata).toEqual({ note: "x" });
      expect(updatedData).not.toHaveProperty("documents_metadata");
      expect(updatedData).not.toHaveProperty("full_name");
    });

    it("converts base_salary/hourly_rate to Decimal and termination_date to Date", async () => {
      await repo.updateEmployee(TENANT, "emp-1", {
        base_salary: 1500,
        hourly_rate: 20,
        termination_date: "2024-06-01",
      } as any);

      expect(updatedData.base_salary.toString()).toBe("1500");
      expect(updatedData.hourly_rate.toString()).toBe("20");
      expect(updatedData.termination_date).toBeInstanceOf(Date);
    });
  });

  describe("deactivateEmployee", () => {
    it("soft-deactivates via `status` and retains the record (no deleted_at)", async () => {
      const result = await repo.deactivateEmployee(TENANT, "emp-1");

      expect(updatedData.status).toBe("terminated");
      expect(updatedData.termination_date).toBeInstanceOf(Date);
      expect(updatedData).not.toHaveProperty("deleted_at");
      expect(result.status).toBe("terminated");
    });
  });

  describe("date serialization (ISO 8601)", () => {
    it("returns Date fields that serialize to ISO 8601 via JSON", async () => {
      const created = await repo.createEmployee(TENANT, {
        employee_code: "E-9",
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada9@example.com",
        department_id: "dep-1",
        location_id: "loc-1",
        company_id: "co-1",
        hire_date: "2024-01-01",
      } as any);

      const serialized = JSON.parse(JSON.stringify(created));
      expect(serialized.hire_date).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
