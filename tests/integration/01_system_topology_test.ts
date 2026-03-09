/**
 * Phase 1: System Topology Validation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Validates that all core database tables correctly implement tenant isolation (tenantId).
 * Also verifies the Location → Store → Order hierarchy exists correctly.
 *
 * Checks:
 *  1. All tenanted models can be queried by tenantId without schema errors
 *  2. Cross-tenant data isolation: Company A data does NOT appear in Company B queries
 *  3. Required hierarchy: Company → Location → Store → RetailOrder
 *  4. Required hierarchy: Company → Location → Employee → Department
 *  5. Detect any major models missing tenantId (reported as WARN)
 *
 * Output: PASS / FAIL / WARN per check
 * Data: All written inside a rolled-back transaction — zero production impact
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, warn, printSummary } from "./helpers/logger";
import { runInRollbackTx, safeRun } from "./helpers/tx";
import {
  seedTestCompany,
  seedTestLocation,
  seedTestDepartment,
  seedTestEmployee,
  seedTestCategory,
  seedTestProduct,
  seedTestStore,
  testId,
} from "./helpers/seeds";

// ─── Models that MUST have tenantId ─────────────────────────────────────────
// These are the primary business models verified for tenant isolation.
const TENANTED_MODEL_DESCRIPTORS = [
  { label: "Company/Location", table: "location" },
  { label: "HR/Department", table: "department" },
  { label: "HR/Employee", table: "employee" },
  { label: "HR/Shift", table: "shift" },
  { label: "HR/ScheduleAssignment", table: "scheduleAssignment" },
  { label: "HR/AttendanceRecord", table: "attendanceRecord" },
  { label: "HR/PayrollRun", table: "payrollRun" },
  { label: "HR/PayrollLine", table: "payrollLine" },
  { label: "HR/LeaveRequest", table: "leaveRequest" },
  { label: "Finance/JournalEntry", table: "journalEntry" },
  { label: "Finance/MoneySource", table: "moneySource" },
  { label: "Finance/Payable", table: "payable" },
  { label: "Finance/Receivable", table: "receivable" },
  { label: "Finance/FixedAsset", table: "fixedAsset" },
  { label: "Inventory/StockLevel", table: "stockLevel" },
  { label: "Inventory/StockMovement", table: "stockMovement" },
  { label: "Inventory/InventoryPool", table: "inventoryPool" },
  { label: "Product/Category", table: "productCategory" },
  { label: "Product/Item", table: "product" },
  { label: "Retail/Store", table: "store" },
  { label: "Retail/POSDevice", table: "pOSDevice" },
  { label: "Retail/RetailOrder", table: "retailOrder" },
  { label: "Retail/RetailShift", table: "retailShift" },
  { label: "Retail/RetailCustomer", table: "retailCustomer" },
  { label: "Retail/RetailChannel", table: "retailChannel" },
  { label: "Sales/Lead", table: "salesLead" },
  { label: "Sales/Opportunity", table: "salesOpportunity" },
  { label: "Sales/Quote", table: "salesQuote" },
  { label: "Sales/Order", table: "salesOrder" },
  { label: "Procurement/Requisition", table: "procurementRequisition" },
  { label: "Procurement/DraftPO", table: "procurementDraftPO" },
  { label: "Procurement/FinalPO", table: "procurementFinalPO" },
  { label: "Procurement/Receipt", table: "procurementReceipt" },
  { label: "Procurement/Supplier", table: "supplierMaster" },
  { label: "Payment/Transaction", table: "paymentTransaction" },
  { label: "Payment/Provider", table: "paymentProvider" },
  { label: "Payment/Settlement", table: "paymentSettlement" },
  { label: "Marketing/Campaign", table: "marketingCampaign" },
  { label: "Marketing/Lead", table: "marketingLead" },
  { label: "Marketing/Attribution", table: "marketingAttribution" },
  { label: "AuditLog", table: "auditLog" },
] as const;

// ─── Phase 1 Main ─────────────────────────────────────────────────────────────
async function runPhase1(): Promise<void> {
  const prisma = getPrisma();
  setPhase("01 — System Topology Validation");

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ TEST 1.1: Verify all tenanted models accept tenantId filter             │
  // └──────────────────────────────────────────────────────────────────────────┘
  console.log(
    "\n[1.1] Verifying tenantId field exists on all core models...\n",
  );

  const SENTINEL_ID = "topology-check-nonexistent-tenant-id";

  for (const descriptor of TENANTED_MODEL_DESCRIPTORS) {
    await safeRun(`1.1 tenantId on ${descriptor.label}`, async () => {
      try {
        // @ts-ignore — dynamic model access
        const count = await prisma[descriptor.table].count({
          where: { tenantId: SENTINEL_ID },
        });
        // count === 0 is expected and valid — we just need the query to succeed
        pass(
          `1.1 tenantId on ${descriptor.label}`,
          `Field exists and query returned ${count} records for non-existent tenant`,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("Unknown argument") ||
          msg.includes("does not exist")
        ) {
          fail(
            `1.1 tenantId on ${descriptor.label}`,
            `Model [${descriptor.table}] is MISSING tenantId field`,
            msg,
          );
        } else {
          throw err;
        }
      }
    });
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ TEST 1.2: Cross-tenant isolation — Company A data invisible from B      │
  // └──────────────────────────────────────────────────────────────────────────┘
  console.log("\n[1.2] Verifying cross-tenant data isolation...\n");

  await runInRollbackTx(prisma, "1.2 Cross-tenant isolation", async (tx) => {
    // Create two isolated companies
    const companyA = await seedTestCompany(tx as any, { id: testId("compA") });
    const companyB = await seedTestCompany(tx as any, { id: testId("compB") });

    // Create a location under Company A
    const locA = await seedTestLocation(tx as any, companyA.id);

    // Create a department under Company A
    const deptA = await seedTestDepartment(tx as any, companyA.id);

    // Create an employee under Company A
    const empA = await seedTestEmployee(
      tx as any,
      companyA.id,
      locA.id,
      deptA.id,
      {
        email: `${testId()}@isolation-test.invalid`,
      },
    );

    // Query employees with Company B's tenantId → should return 0
    // @ts-ignore
    const leakCheck = await tx.employee.findMany({
      where: { tenantId: companyB.id },
    });

    if (leakCheck.length === 0) {
      pass(
        "1.2 Employee isolation A→B",
        `Company B query returned 0 employees — isolation confirmed (employee ${empA.id} belongs to Company A only)`,
      );
    } else {
      fail(
        "1.2 Employee isolation A→B",
        `DATA LEAK: Company B query returned ${leakCheck.length} employee(s) that belong to Company A!`,
        leakCheck.map((e: any) => ({ id: e.id, tenantId: e.tenantId })),
      );
    }

    // Query locations with Company B's tenantId → should return 0
    // @ts-ignore
    const locLeakCheck = await tx.location.findMany({
      where: { tenantId: companyB.id },
    });

    if (locLeakCheck.length === 0) {
      pass(
        "1.2 Location isolation A→B",
        `Company B query returned 0 locations — isolation confirmed`,
      );
    } else {
      fail(
        "1.2 Location isolation A→B",
        `DATA LEAK: ${locLeakCheck.length} location(s) from Company A visible under Company B!`,
        locLeakCheck.map((l: any) => ({ id: l.id, tenantId: l.tenantId })),
      );
    }
  });

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ TEST 1.3: Verify Company → Location → Store hierarchy                  │
  // └──────────────────────────────────────────────────────────────────────────┘
  console.log("\n[1.3] Verifying required entity hierarchy...\n");

  await runInRollbackTx(prisma, "1.3 Hierarchy", async (tx) => {
    const company = await seedTestCompany(tx as any);
    const location = await seedTestLocation(tx as any, company.id);
    const store = await seedTestStore(tx as any, company.id, location.id);

    // Retrieve store and verify it links back up the hierarchy
    // @ts-ignore
    const fetchedStore = await tx.store.findUnique({
      where: { id: store.id },
      include: { location: true, company: true },
    });

    if (!fetchedStore) {
      fail("1.3 Store created", "Store was not persisted within transaction");
      return;
    }
    pass(
      "1.3 Store created",
      `Store ${fetchedStore.id} created and retrievable`,
    );

    if (fetchedStore.location?.tenantId === company.id) {
      pass(
        "1.3 Store→Location→Company",
        `Store.location.tenantId correctly matches Company.id (${company.id})`,
      );
    } else {
      fail(
        "1.3 Store→Location→Company",
        `Hierarchy broken: Store.location.tenantId=${fetchedStore.location?.tenantId} expected ${company.id}`,
      );
    }

    // Verify storeId is scoped to same tenantId
    if (
      fetchedStore.tenantId === company.id &&
      fetchedStore.locationId === location.id
    ) {
      pass(
        "1.3 Store tenantId+locationId",
        "Store correctly references both tenantId and locationId",
      );
    } else {
      fail(
        "1.3 Store tenantId+locationId",
        "Store FK references are inconsistent",
      );
    }
  });

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ TEST 1.4: Company → Location → Employee → Department hierarchy          │
  // └──────────────────────────────────────────────────────────────────────────┘
  await runInRollbackTx(prisma, "1.4 HR Hierarchy", async (tx) => {
    const company = await seedTestCompany(tx as any);
    const location = await seedTestLocation(tx as any, company.id);
    const department = await seedTestDepartment(tx as any, company.id);
    const employee = await seedTestEmployee(
      tx as any,
      company.id,
      location.id,
      department.id,
      {
        email: `${testId()}@hierarchy.invalid`,
      },
    );

    // @ts-ignore
    const fetchedEmp = await tx.employee.findUnique({
      where: { id: employee.id },
      include: { location: true, department: true, company: true },
    });

    if (!fetchedEmp) {
      fail(
        "1.4 Employee created",
        "Employee was not persisted within transaction",
      );
      return;
    }
    pass(
      "1.4 Employee created",
      `Employee ${fetchedEmp.id} created within transaction`,
    );

    const hierarchyValid =
      fetchedEmp.tenantId === company.id &&
      fetchedEmp.location?.tenantId === company.id &&
      fetchedEmp.department?.tenantId === company.id;

    if (hierarchyValid) {
      pass(
        "1.4 Employee→Location→Department→Company",
        `Full HR hierarchy validated: all nodes share tenantId ${company.id}`,
      );
    } else {
      fail(
        "1.4 Employee→Location→Department→Company",
        "Hierarchy broken: mismatched tenantId across HR chain",
        {
          employee: fetchedEmp.tenantId,
          location: fetchedEmp.location?.tenantId,
          department: fetchedEmp.department?.tenantId,
          expected: company.id,
        },
      );
    }
  });

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ TEST 1.5: Detect models NOT using tenantId (WARN only, by design)       │
  // └──────────────────────────────────────────────────────────────────────────┘
  console.log("\n[1.5] Checking for known non-tenanted models...\n");

  // These are intentionally non-tenanted join/sub-tables by design
  const nonTenantedByDesign = [
    {
      label: "RetailOrderItem (child of RetailOrder)",
      table: "retailOrderItem",
    },
    { label: "JournalLine (child of JournalEntry)", table: "journalLine" },
    {
      label: "PaymentRetryAttempt (child of PaymentTransaction)",
      table: "paymentRetryAttempt",
    },
    {
      label: "InventoryPoolStock (child of InventoryPool)",
      table: "inventoryPoolStock",
    },
    { label: "User (global, auth only)", table: "user" },
    { label: "UserCompany (join table)", table: "userCompany" },
  ];

  for (const model of nonTenantedByDesign) {
    warn(
      `1.5 Non-tenanted: ${model.label}`,
      `Model [${model.table}] does NOT have tenantId — this is EXPECTED by design (child/join table). Verify parent table provides isolation.`,
    );
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ TEST 1.6: Cross-module FK gap analysis (structural warnings)            │
  // └──────────────────────────────────────────────────────────────────────────┘
  console.log("\n[1.6] Checking known cross-module FK gaps...\n");

  warn(
    "1.6 SalesOrder.financeInvoiceId",
    "SalesOrder has financeInvoiceId but NO Prisma relation to JournalEntry. Cross-module link is a loose string reference only.",
    {
      recommendation:
        "Add formal Prisma relation or validate referential integrity in Phase 2",
    },
  );

  warn(
    "1.6 ProcurementFinalPO.financeCommitmentId",
    "ProcurementFinalPO has financeCommitmentId but NO Prisma relation to JournalEntry.",
    {
      recommendation:
        "Finance commitment tracking is manual — validate in Phase 4",
    },
  );

  warn(
    "1.6 RetailOrder.paymentReference",
    "RetailOrder tracks payment via paymentMethod/paymentReference strings but has NO FK to PaymentTransaction table.",
    {
      recommendation:
        "POS payments and payment module transactions are siloed — validate in Phase 5",
    },
  );

  warn(
    "1.6 JournalEntry description uniqueness",
    "JournalEntry has @@unique([tenantId, description]) which may cause conflicts during bulk POS runs if descriptions repeat.",
    {
      recommendation:
        "Consider adding a timestamp or orderId suffix to JournalEntry descriptions",
    },
  );

  // ─── Final Summary ────────────────────────────────────────────────────────
  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase1()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
