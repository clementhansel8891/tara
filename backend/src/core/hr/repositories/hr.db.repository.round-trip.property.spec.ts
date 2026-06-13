// Feature: hr-module-stabilization, Property 4: Round-trip persistence of created and updated records
import { describe, it, expect } from "vitest";
import fc from "fast-check";

import { HRDbRepository } from "./hr.db.repository";
import { CreateEmployeeDto } from "../dto/create-employee.dto";
import { UpdateEmployeeDto } from "../dto/update-employee.dto";

/**
 * Property 4: Round-trip persistence of created and updated records
 *
 * Validates: Requirements 1.5, 5.1, 5.2, 5.3, 6.3, 6.4, 7.1, 7.3, 8.1, 9.1,
 *            10.1, 11.1, 11.3, 12.4
 *
 * For any valid create or update of an HR record, reading it back within the
 * same Tenant_Scope yields a record whose persisted fields equal the supplied
 * values, whose `tenant_id` equals the caller's context, and whose date fields
 * serialize to ISO 8601.
 *
 * This exercises the real employee write/read mapping path:
 *   createEmployee/updateEmployee -> mapEmployeeFieldsToColumns -> Prisma write
 *   -> mapEmployee read-back.
 * The Prisma boundary is faked: it stores the `data` written and echoes it back
 * on read (the standard round-trip fixture per the design Testing Strategy).
 * No live database is required, so the test asserts:
 *   (1) every supplied field round-trips through DTO->column->entity mapping
 *       with NO name/casing drops (incl. aliases role_title/position -> positions
 *       and documents_metadata -> document_metadata),
 *   (2) the persisted `tenant_id` equals the caller's context tenant_id and is
 *       never overridden by client-supplied input, and
 *   (3) Date fields serialize to ISO 8601 (JSON.stringify === ISO string).
 */

const ISO_8601_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const idArb = fc.uuid();
const nonEmptyArb = fc.string({ minLength: 1, maxLength: 16 });
const emailArb = fc
  .tuple(nonEmptyArb, nonEmptyArb)
  .map(([local, domain]) => `${local}@${domain}.example`);
const dateIsoArb = fc
  .date({ min: new Date("2000-01-01T00:00:00.000Z"), max: new Date("2035-01-01T00:00:00.000Z"), noInvalidDate: true })
  .map((d) => d.toISOString());
const moneyArb = fc.integer({ min: 0, max: 1_000_000 });

const STATUSES = ["active", "inactive", "terminated", "on_leave"] as const;
const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contractor",
  "intern",
] as const;

/**
 * A fake Prisma boundary. The `employees.create`/`update` calls store the
 * written `data` and echo it straight back as the persisted row (round-trip
 * fixture). `users.findUnique` returns an existing user so the create path
 * skips bcrypt provisioning; `locations`/`user_companies` are inert.
 */
function makeFakePrisma() {
  return {
    locations: {
      findFirst: async () => ({ id: "loc-x", company_id: "co-x" }),
      findUnique: async () => ({ id: "loc-x", company_id: "co-x" }),
    },
    users: {
      // Existing user -> createEmployee skips the bcrypt password-hash branch.
      findUnique: async () => ({ id: "user-existing", email: "existing@example" }),
      create: async ({ data }: any) => ({ id: data.id ?? "user-created", ...data }),
    },
    user_companies: {
      upsert: async () => ({}),
    },
    employees: {
      // Echo the written `data` as the stored row.
      create: async ({ data }: any) => ({ ...data }),
      // The read-back is scoped to the caller's tenant; reflect the where-clause
      // tenant_id onto the stored row, then echo the written fields.
      update: async ({ where, data }: any) => ({
        id: where.id,
        tenant_id: where.tenant_id,
        ...data,
      }),
    },
  } as any;
}

describe("Property 4: Round-trip persistence of created and updated records", () => {
  it("round-trips every supplied field on employee CREATE (mapping, tenant binding, ISO dates)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantId: idArb,
          // A hostile client-supplied tenant_id that MUST be ignored.
          spoofedTenantId: idArb,
          employee_code: nonEmptyArb,
          first_name: nonEmptyArb,
          last_name: nonEmptyArb,
          email: emailArb,
          department_id: idArb,
          location_id: idArb,
          company_id: idArb,
          phone: fc.option(nonEmptyArb, { nil: undefined }),
          manager_id: fc.option(idArb, { nil: undefined }),
          positionValue: nonEmptyArb,
          // The position is supplied under one of its alias names; both must
          // round-trip to the `positions` column and back.
          positionField: fc.constantFrom("position", "role_title"),
          status: fc.constantFrom(...STATUSES),
          employment_type: fc.constantFrom(...EMPLOYMENT_TYPES),
          base_salary: fc.option(moneyArb, { nil: undefined }),
          hourly_rate: fc.option(moneyArb, { nil: undefined }),
          hireDateIso: dateIsoArb,
        }),
        async (s) => {
          const repo = new HRDbRepository(makeFakePrisma());

          const dto: Record<string, unknown> = {
            employee_code: s.employee_code,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email,
            department_id: s.department_id,
            location_id: s.location_id,
            company_id: s.company_id,
            phone: s.phone,
            manager_id: s.manager_id,
            status: s.status,
            employment_type: s.employment_type,
            base_salary: s.base_salary,
            hourly_rate: s.hourly_rate,
            hire_date: s.hireDateIso,
            // Spoofed client tenant_id: must never override the caller context.
            tenant_id: s.spoofedTenantId,
          };
          dto[s.positionField] = s.positionValue;

          const result = await repo.createEmployee(
            s.tenantId,
            dto as unknown as CreateEmployeeDto,
          );

          // (2) tenant_id always derives from the caller context, never the body.
          expect(result.tenant_id).toBe(s.tenantId);

          // (1) Plain fields round-trip with no drops.
          expect(result.employee_code).toBe(s.employee_code);
          expect(result.first_name).toBe(s.first_name);
          expect(result.last_name).toBe(s.last_name);
          expect(result.email).toBe(s.email);
          expect(result.department_id).toBe(s.department_id);
          expect(result.location_id).toBe(s.location_id);
          expect(result.company_id).toBe(s.company_id);
          expect(result.status).toBe(s.status);
          expect(result.employment_type).toBe(s.employment_type);
          if (s.phone !== undefined) expect(result.phone).toBe(s.phone);
          if (s.manager_id !== undefined)
            expect(result.manager_id).toBe(s.manager_id);
          if (s.base_salary !== undefined)
            expect(result.base_salary).toBe(s.base_salary);
          if (s.hourly_rate !== undefined)
            expect(result.hourly_rate).toBe(s.hourly_rate);

          // (1) Alias mapping: position / role_title -> `positions` -> back.
          expect(result.position).toBe(s.positionValue);
          expect(result.role_title).toBe(s.positionValue);

          // (3) Date field serializes to ISO 8601.
          expect(result.hire_date).toBeInstanceOf(Date);
          const serialized = JSON.parse(JSON.stringify({ d: result.hire_date })).d;
          expect(serialized).toMatch(ISO_8601_RE);
          expect(serialized).toBe(new Date(s.hireDateIso).toISOString());
        },
      ),
      { numRuns: 150 },
    );
  });

  it("round-trips every supplied field on employee UPDATE (aliases, metadata, tenant binding, ISO dates)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantId: idArb,
          employeeId: idArb,
          first_name: fc.option(nonEmptyArb, { nil: undefined }),
          last_name: fc.option(nonEmptyArb, { nil: undefined }),
          phone: fc.option(nonEmptyArb, { nil: undefined }),
          department_id: fc.option(idArb, { nil: undefined }),
          manager_id: fc.option(idArb, { nil: undefined }),
          role_title: fc.option(nonEmptyArb, { nil: undefined }),
          status: fc.option(fc.constantFrom(...STATUSES), { nil: undefined }),
          employment_type: fc.option(fc.constantFrom(...EMPLOYMENT_TYPES), {
            nil: undefined,
          }),
          base_salary: fc.option(moneyArb, { nil: undefined }),
          hourly_rate: fc.option(moneyArb, { nil: undefined }),
          documents_metadata: fc.option(
            fc.dictionary(
              nonEmptyArb,
              fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              { maxKeys: 4 },
            ),
            { nil: undefined },
          ),
          terminationIso: fc.option(dateIsoArb, { nil: undefined }),
        }),
        async (s) => {
          const repo = new HRDbRepository(makeFakePrisma());

          const dto: Record<string, unknown> = {};
          if (s.first_name !== undefined) dto.first_name = s.first_name;
          if (s.last_name !== undefined) dto.last_name = s.last_name;
          if (s.phone !== undefined) dto.phone = s.phone;
          if (s.department_id !== undefined) dto.department_id = s.department_id;
          if (s.manager_id !== undefined) dto.manager_id = s.manager_id;
          if (s.role_title !== undefined) dto.role_title = s.role_title;
          if (s.status !== undefined) dto.status = s.status;
          if (s.employment_type !== undefined)
            dto.employment_type = s.employment_type;
          if (s.base_salary !== undefined) dto.base_salary = s.base_salary;
          if (s.hourly_rate !== undefined) dto.hourly_rate = s.hourly_rate;
          if (s.documents_metadata !== undefined)
            dto.documents_metadata = s.documents_metadata;
          if (s.terminationIso !== undefined)
            dto.termination_date = s.terminationIso;

          const result = await repo.updateEmployee(
            s.tenantId,
            s.employeeId,
            dto as unknown as UpdateEmployeeDto,
          );

          // (2) Read-back is scoped to the caller's tenant_id.
          expect(result.tenant_id).toBe(s.tenantId);

          // (1) Supplied fields round-trip with no drops.
          if (s.first_name !== undefined)
            expect(result.first_name).toBe(s.first_name);
          if (s.last_name !== undefined)
            expect(result.last_name).toBe(s.last_name);
          if (s.phone !== undefined) expect(result.phone).toBe(s.phone);
          if (s.department_id !== undefined)
            expect(result.department_id).toBe(s.department_id);
          if (s.manager_id !== undefined)
            expect(result.manager_id).toBe(s.manager_id);
          if (s.status !== undefined) expect(result.status).toBe(s.status);
          if (s.employment_type !== undefined)
            expect(result.employment_type).toBe(s.employment_type);
          if (s.base_salary !== undefined)
            expect(result.base_salary).toBe(s.base_salary);
          if (s.hourly_rate !== undefined)
            expect(result.hourly_rate).toBe(s.hourly_rate);

          // (1) Alias mapping: role_title -> `positions` -> back to position/role_title.
          if (s.role_title !== undefined) {
            expect(result.role_title).toBe(s.role_title);
            expect(result.position).toBe(s.role_title);
          }

          // (1) Alias mapping: documents_metadata -> `document_metadata` -> back.
          if (s.documents_metadata !== undefined) {
            expect(result.documents_metadata).toEqual(s.documents_metadata);
          }

          // (3) Date field serializes to ISO 8601.
          if (s.terminationIso !== undefined) {
            expect(result.termination_date).toBeInstanceOf(Date);
            const serialized = JSON.parse(
              JSON.stringify({ d: result.termination_date }),
            ).d;
            expect(serialized).toMatch(ISO_8601_RE);
            expect(serialized).toBe(new Date(s.terminationIso).toISOString());
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});
