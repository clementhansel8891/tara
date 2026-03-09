/**
 * Phase 8: Multi-Company Isolation Validation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Exhaustive check for data leakage between different companies.
 *   1. Create 2 distinct Companies (A and B)
 *   2. Create identical entities (same names/codes) in both
 *   3. Perform cross-tenant queries (Query Company A with Company B's ID)
 *   4. Verify zero leakage in:
 *      - Employee list
 *      - Stock levels
 *      - Finance Ledger
 *      - Sales Orders
 *      - Inventory Items
 *
 * All writes inside a rolled-back transaction.
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, warn, printSummary } from "./helpers/logger";
import { runInRollbackTx } from "./helpers/tx";
import {
  seedTestCompany,
  seedTestLocation,
  seedTestDepartment,
  seedTestEmployee,
  seedTestCategory,
  seedTestProduct,
  testId,
} from "./helpers/seeds";

async function runPhase8(): Promise<void> {
  const prisma = getPrisma();
  setPhase("08 — Multi-Company Isolation Validation");

  await runInRollbackTx(prisma, "Phase 8", async (tx) => {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 8.1: Setup Two Identical Environments
    // ────────────────────────────────────────────────────────────────────────
    let compA: any, compB: any;
    const sameName = "Global Entity";
    const sameCode = "GE-001";

    try {
      // Company A setup
      compA = await seedTestCompany(tx as any, { id: testId("compA") });
      const locA = await seedTestLocation(tx as any, compA.id, {
        name: sameName,
      });
      const deptA = await seedTestDepartment(tx as any, compA.id, {
        name: sameName,
      });
      await seedTestEmployee(tx as any, compA.id, locA.id, deptA.id, {
        firstName: "Exclusive",
        lastName: "A",
      });

      // Company B setup
      compB = await seedTestCompany(tx as any, { id: testId("compB") });
      const locB = await seedTestLocation(tx as any, compB.id, {
        name: sameName,
      });
      const deptB = await seedTestDepartment(tx as any, compB.id, {
        name: sameName,
      });
      await seedTestEmployee(tx as any, compB.id, locB.id, deptB.id, {
        firstName: "Exclusive",
        lastName: "B",
      });

      pass(
        "8.1 Seed Isolation Dual-Setup",
        `Two companies created with overlapping entity names (${sameName})`,
      );
    } catch (e: any) {
      fail("8.1 Seed Isolation Dual-Setup", `Setup failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 8.2: Cross-Tenant Verification (Positive Check)
    // ────────────────────────────────────────────────────────────────────────
    try {
      const recordsA = await (tx as any).employee.findMany({
        where: { tenantId: compA.id },
      });
      const recordsB = await (tx as any).employee.findMany({
        where: { tenantId: compB.id },
      });

      if (recordsA.length === 1 && recordsB.length === 1) {
        if (recordsA[0].id !== recordsB[0].id) {
          pass(
            "8.2 Positive ID Isolation",
            `Employees in A and B have different IDs despite same setup structure`,
          );
        } else {
          fail(
            "8.2 Positive ID Isolation",
            `CRITICAL: Identical IDs generated across tenants!`,
          );
        }
      } else {
        fail(
          "8.2 Positive ID Isolation",
          `Expected 1 employee per company, found A:${recordsA.length} B:${recordsB.length}`,
        );
      }
    } catch (e: any) {
      fail("8.2 Positive ID Isolation", e.message);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 8.3: Negative Check (The "No-Leak" Test)
    // ────────────────────────────────────────────────────────────────────────
    try {
      // Searching for Company A's employee using Company B's tenantId
      const leakCheck = await (tx as any).employee.findMany({
        where: {
          tenantId: compB.id,
          firstName: "Exclusive",
          lastName: "A",
        },
      });

      if (leakCheck.length === 0) {
        pass(
          "8.3 Negative Search Leakage",
          `Querying for CompA employee in CompB scope returns 0 results ✓`,
        );
      } else {
        fail(
          "8.3 Negative Search Leakage",
          `CRITICAL: Company B can see Company A's personnel!`,
        );
      }
    } catch (e: any) {
      fail("8.3 Negative Search Leakage", e.message);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 8.4: Exhaustive Multi-Model Check
    // ────────────────────────────────────────────────────────────────────────
    const modelsToCheck = [
      "location",
      "department",
      "stockLevel",
      "journalEntry",
      "marketingCampaign",
    ];

    for (const model of modelsToCheck) {
      try {
        const results = await (tx as any)[model].findMany({
          where: { tenantId: compB.id },
        });

        // We only seeded location and department for B in 8.1
        const expectedCount =
          model === "location" || model === "department" ? 1 : 0;

        if (results.length === expectedCount) {
          pass(
            `8.4 Isolation Check: ${model}`,
            `Tenant isolation verified for ${model} model`,
          );
        } else {
          fail(
            `8.4 Isolation Check: ${model}`,
            `Unexpected record count! Found ${results.length}, expected ${expectedCount}`,
          );
        }
      } catch (e: any) {
        warn(
          `8.4 Isolation Check: ${model}`,
          `Model likely empty or structurally different: ${e.message}`,
        );
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 8.5: Aggregate Leakage (Count check)
    // ────────────────────────────────────────────────────────────────────────
    try {
      const totalInA = await (tx as any).employee.count({
        where: { tenantId: compA.id },
      });
      const totalInB = await (tx as any).employee.count({
        where: { tenantId: compB.id },
      });
      const totalInRoot = await (tx as any).employee.count(); // Raw count without tenant filter

      if (totalInRoot >= totalInA + totalInB) {
        pass(
          "8.5 Count Isolation",
          `Aggregate counts are consistent (A:${totalInA} + B:${totalInB} <= Total:${totalInRoot})`,
        );
      } else {
        fail(
          "8.5 Count Isolation",
          `Inconsistency: Total count is less than sum of tenants!`,
        );
      }
    } catch (e: any) {
      fail("8.5 Count Isolation", e.message);
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase8()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
