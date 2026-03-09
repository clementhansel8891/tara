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
  return prisma.company.create({
    data: {
      id,
      name: overrides.name ?? `Test Company ${id}`,
      code: overrides.code ?? `TC-${id.slice(-6)}`,
      status: "active",
      country: "ID",
      currency: "IDR",
      industry: "retail",
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
  return prisma.location.create({
    data: {
      id,
      tenantId,
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
  return prisma.department.create({
    data: {
      id,
      tenantId,
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
  }> = {},
) {
  const id = overrides.id ?? testId("emp");
  return prisma.employee.create({
    data: {
      id,
      tenantId,
      locationId,
      departmentId,
      firstName: overrides.firstName ?? "Test",
      lastName: overrides.lastName ?? `Employee ${id}`,
      email: overrides.email ?? `${id}@test.invalid`,
      position: overrides.position ?? "Test Staff",
      employeeCode: `EC-${id.slice(-8)}`,
      employmentType: "full_time",
      baseSalary: 5000000,
      hireDate: new Date("2024-01-01"),
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
  return prisma.product.create({
    data: {
      id,
      tenantId,
      categoryId,
      name: overrides.name ?? `Test Product ${id}`,
      sku: overrides.sku ?? `SKU-${id.slice(-8)}`,
      barcode: `BAR-${id.slice(-8)}`,
      description: "Integration test product",
      unit: "pcs",
      basePrice: overrides.basePrice ?? 100000,
      taxRate: 0.11,
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
  return prisma.productCategory.create({
    data: {
      id,
      tenantId,
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
  return prisma.store.create({
    data: {
      id,
      tenantId,
      locationId,
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
  return prisma.shift.create({
    data: {
      id,
      tenantId,
      name: overrides.name ?? `Morning Shift ${id}`,
      startTime: "08:00",
      endTime: "16:00",
      breakDuration: 60,
      workDays: [1, 2, 3, 4, 5],
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
  const supplier = await prisma.supplierMaster.create({
    data: {
      id,
      tenantId,
      name: overrides.name ?? `Test Supplier ${id}`,
      complianceStatus: "APPROVED",
      globalRating: 80,
      riskTier: "LOW",
      categories: ["general"],
    },
  });
  const branchId = testId("sbranch");
  const branch = await prisma.supplierBranch.create({
    data: {
      id: branchId,
      tenantId,
      supplierId: supplier.id,
      branchCode: `SB-${branchId.slice(-6)}`,
      branchName: `${supplier.name} HQ`,
      location: "Jakarta",
      leadTimeDays: 3,
      localRating: 80,
      riskTier: "LOW",
      active: true,
    },
  });
  return { supplier, branch };
}
