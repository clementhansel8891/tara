/**
 * Shared seed factories for creating minimal valid test records.
 * All IDs use a TEST_ prefix to make them easy to identify and clean up.
 * These are used inside transactions and rolled back automatically.
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

/** Generate a unique test ID with an optional prefix */
export function testId(prefix = "test"): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

/** Create a minimal test Company (tenant) */
export async function seedTestCompany(
  prisma: PrismaClient,
  overrides: Partial<{
    id: string;
    name: string;
    code: string;
  }> = {},
) {
  const id = overrides.id ?? testId("comp");
  // Seed the corresponding tenant first to satisfy the companies_tenant_id_fkey constraint
  await (prisma as any).tenants.create({
    data: {
      id,
      name: overrides.name ?? `Test Tenant ${id}`,
      code: `T-${id.slice(-6)}`,
      status: "active",
    },
  });
  return (prisma as any).companies.create({
    data: {
      id,
      name: overrides.name ?? `Test Company ${id}`,
      code: overrides.code ?? `TC-${id.slice(-6)}`,
      status: "active",
      country: "ID",
      currency: "IDR",
      industry: "retail",
      tenant_id: id,
    },
  });
}

/** Create a minimal test Location for a company */
export async function seedTestLocation(
  prisma: PrismaClient,
  tenantId: string,
  overrides: Partial<{
    id: string;
    name: string;
    type: string;
  }> = {},
) {
  const id = overrides.id ?? testId("loc");
  return (prisma as any).locations.create({
    data: {
      id,
      tenant_id: tenantId,
      name: overrides.name ?? `Test Location ${id}`,
      code: `LOC-${id.slice(-6)}`,
      type: overrides.type ?? "branch",
      address: "123 Test St",
      country: "ID",
      currency: "IDR",
    },
  });
}

/** Create a minimal test Department */
export async function seedTestDepartment(
  prisma: PrismaClient,
  tenantId: string,
  overrides: Partial<{
    id: string;
    name: string;
    code: string;
  }> = {},
) {
  const id = overrides.id ?? testId("dept");
  return (prisma as any).departments.create({
    data: {
      id,
      tenant_id: tenantId,
      name: overrides.name ?? `Test Department ${id}`,
      code: overrides.code ?? `DEPT-${id.slice(-6)}`,
      status: "active",
    },
  });
}

/** Create a minimal test Employee */
export async function seedTestEmployee(
  prisma: PrismaClient,
  tenantId: string,
  locationId: string,
  departmentId: string,
  overrides: Partial<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    baseSalary: number;
    hireDate: Date;
  }> = {},
) {
  const id = overrides.id ?? testId("emp");
  return (prisma as any).employees.create({
    data: {
      id,
      tenant_id: tenantId,
      location_id: locationId,
      department_id: departmentId,
      first_name: overrides.firstName ?? "Test",
      last_name: overrides.lastName ?? `Employee ${id}`,
      email: overrides.email ?? `${id}@test.invalid`,
      positions: overrides.position ?? "Test Staff",
      employee_code: `EC-${id.slice(-8)}`,
      employment_type: "full_time",
      base_salary: overrides.baseSalary ?? 5000000,
      hire_date: overrides.hireDate ?? new Date("2024-01-01"),
      status: "active",
    },
  });
}

/** Create a minimal test Product */
export async function seedTestProduct(
  prisma: PrismaClient,
  tenantId: string,
  categoryId: string,
  overrides: Partial<{
    id: string;
    name: string;
    sku: string;
    basePrice: number;
  }> = {},
) {
  const id = overrides.id ?? testId("prod");
  return (prisma as any).item_masters.create({
    data: {
      id,
      tenant_id: tenantId,
      category_id: categoryId,
      name: overrides.name ?? `Test Product ${id}`,
      sku: overrides.sku ?? `SKU-${id.slice(-8)}`,
      barcode: `BAR-${id.slice(-8)}`,
      description: "Integration test product",
      unit: "pcs",
      base_price: overrides.basePrice ?? 100000,
      tax_rate: 0.11,
      type: "ITEM",
      status: "active",
    },
  });
}

/** Create a minimal ProductCategory */
export async function seedTestCategory(
  prisma: PrismaClient,
  tenantId: string,
  overrides: Partial<{ id: string; name: string }> = {},
) {
  const id = overrides.id ?? testId("cat");
  return (prisma as any).product_categories.create({
    data: {
      id,
      tenant_id: tenantId,
      name: overrides.name ?? `Test Category ${id}`,
    },
  });
}

/** Create a minimal Store */
export async function seedTestStore(
  prisma: PrismaClient,
  tenantId: string,
  locationId: string,
  overrides: Partial<{ id: string; name: string; code: string }> = {},
) {
  const id = overrides.id ?? testId("store");
  return (prisma as any).stores.create({
    data: {
      id,
      tenant_id: tenantId,
      location_id: locationId,
      name: overrides.name ?? `Test Store ${id}`,
      code: overrides.code ?? `ST-${id.slice(-6)}`,
      type: "physical",
      status: "active",
      currency: "IDR",
    },
  });
}

/** Create a minimal Shift */
export async function seedTestShift(
  prisma: PrismaClient,
  tenantId: string,
  overrides: Partial<{ id: string; name: string }> = {},
) {
  const id = overrides.id ?? testId("shift");
  return (prisma as any).shifts.create({
    data: {
      id,
      tenant_id: tenantId,
      name: overrides.name ?? `Morning Shift ${id}`,
      start_time: "08:00",
      end_time: "16:00",
      break_duration: 60,
      work_days: [1, 2, 3, 4, 5],
    },
  });
}

/** Create a SupplierMaster and required SupplierBranch */
export async function seedTestSupplier(
  prisma: PrismaClient,
  tenantId: string,
  overrides: Partial<{ id: string; name: string }> = {},
) {
  const id = overrides.id ?? testId("supp");
  const supplier = await (prisma as any).supplier_masters.create({
    data: {
      id,
      tenant_id: tenantId,
      name: overrides.name ?? `Test Supplier ${id}`,
      compliance_status: "APPROVED",
      global_rating: 80,
      risk_tier: "LOW",
      categories: ["general"],
    },
  });
  const branchId = testId("sbranch");
  const branch = await (prisma as any).supplier_branches.create({
    data: {
      id: branchId,
      tenant_id: tenantId,
      supplier_id: supplier.id,
      branch_code: `SB-${branchId.slice(-6)}`,
      branch_name: `${supplier.name} HQ`,
      location: "Jakarta",
      lead_time_days: 3,
      local_rating: 80,
      risk_tier: "LOW",
      active: true,
    },
  });
  return { supplier, branch };
}

/** Create a minimal FiscalPeriod */
export async function seedTestFiscalPeriod(
  prisma: PrismaClient,
  tenantId: string,
  overrides: Partial<{ id: string; name: string; startDate: Date; endDate: Date }> = {},
) {
  const id = overrides.id ?? testId("fp");
  return (prisma as any).finance_fiscal_periods.create({
    data: {
      id,
      tenant_id: tenantId,
      name: overrides.name ?? `FY2026-Q1`,
      start_date: overrides.startDate ?? new Date("2026-01-01"),
      end_date: overrides.endDate ?? new Date("2026-03-31"),
      status: "OPEN",
      fiscal_year_id: "FY-2026",
    },
  });
}

export async function seedTestAccount(tx: PrismaClient, tenantId: string, code: string, name: string, type: string) {
  return await (tx as any).finance_chart_of_accounts.create({
    data: {
      tenant_id: tenantId,
      code,
      name,
      type
    }
  });
}
