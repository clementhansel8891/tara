/**
 * Phase 4: Purchasing → Inventory → Accounting Chain
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Simulates the full procurement-to-stock-to-ledger workflow:
 *   ProcurementRequisition → DraftPO → FinalPO → Receipt →
 *   StockMovement (stock in) → StockLevel update → JournalEntry
 *
 * All writes are inside a rolled-back transaction.
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
  seedTestSupplier,
  seedTestFiscalPeriod,
  seedTestAccount,
  testId,
} from "./helpers/seeds";

async function runPhase4(): Promise<void> {
  const prisma = getPrisma();
  setPhase("04 — Purchasing → Inventory → Accounting Chain");

  await runInRollbackTx(prisma, "Phase 4", async (tx) => {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.1: Setup base entities
    // ────────────────────────────────────────────────────────────────────────
    let company: any,
      location: any,
      department: any,
      employee: any,
      product: any,
      supplier: any,
      supplierBranch: any,
      fiscalPeriod: any,
      accInventory: any,
      accPayable: any;

    try {
      company = await seedTestCompany(tx as any);
      location = await seedTestLocation(tx as any, company.id);
      department = await seedTestDepartment(tx as any, company.id);
      employee = await seedTestEmployee(
        tx as any,
        company.id,
        location.id,
        department.id,
        {
          email: `${testId()}@phase4.invalid`,
        },
      );
      const category = await seedTestCategory(tx as any, company.id);
      product = await seedTestProduct(tx as any, company.id, category.id, {
        name: "Test Inventory Item",
        basePrice: 50000,
      });
      const { supplier: s, branch: b } = await seedTestSupplier(
        tx as any,
        company.id,
      );
      supplier = s;
      supplierBranch = b;

      // Seed accounting foundation
      fiscalPeriod = await seedTestFiscalPeriod(tx as any, company.id);
      accInventory = await seedTestAccount(tx as any, company.id, '1300', 'Inventory Asset', 'ASSET');
      accPayable = await seedTestAccount(tx as any, company.id, '2100', 'Accounts Payable', 'LIABILITY');

      pass(
        "4.1 Base entities created",
        `Company, Location, Dept, Employee, Product, Supplier, FiscalPeriod, and Accounts created`,
      );
    } catch (e: any) {
      fail("4.1 Base entities created", `Setup failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.2: Create StockLevel (initial: 0 on hand)
    // ────────────────────────────────────────────────────────────────────────
    let stockLevel: any;
    try {
      stockLevel = await (tx as any).stockLevel.create({
        data: {
          tenantId: company.id,
          locationId: location.id,
          productId: product.id,
          departmentId: department.id,
          onHand: 0,
          reserved: 0,
          available: 0,
          minBuffer: 10,
          maxCapacity: 1000,
        },
      });
      pass(
        "4.2 StockLevel initialized",
        `StockLevel ${stockLevel.id} created — onHand: 0`,
      );
    } catch (e: any) {
      fail(
        "4.2 StockLevel initialized",
        `Failed to create stock level: ${e.message}`,
      );
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.3: Create ProcurementRequisition
    // ────────────────────────────────────────────────────────────────────────
    let requisition: any;
    try {
      requisition = await (tx as any).procurementRequisition.create({
        data: {
          tenantId: company.id,
          requesterId: employee.id,
          departmentId: department.id,
          branchCode: supplierBranch.branchCode,
          title: "Purchase Test Items",
          description: "Integration test purchase requisition",
          category: "general",
          budgetClass: "OPEX",
          amount: 500000,
          currency: "IDR",
          status: "APPROVED",
          supplierId: supplier.id,
          supplierBranchId: supplierBranch.id,
        },
      });
      pass(
        "4.3 Requisition created",
        `ProcurementRequisition ${requisition.id} (APPROVED)`,
      );
    } catch (e: any) {
      fail("4.3 Requisition created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.4: Create Draft PO
    // ────────────────────────────────────────────────────────────────────────
    let draftPo: any;
    try {
      draftPo = await (tx as any).procurementDraftPO.create({
        data: {
          tenantId: company.id,
          requisitionId: requisition.id,
          branchCode: supplierBranch.branchCode,
          supplierId: supplier.id,
          supplierBranchId: supplierBranch.id,
          contractType: "SPOT",
          status: "SUBMITTED",
          lineItems: [{ productId: product.id, qty: 10, unitPrice: 50000 }],
          quotedTotal: 500000,
          quoteReference: `QR-${testId()}`,
          createdBy: employee.id,
        },
      });
      pass("4.4 DraftPO created", `ProcurementDraftPO ${draftPo.id}`);
    } catch (e: any) {
      fail("4.4 DraftPO created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.5: Create Final PO
    // ────────────────────────────────────────────────────────────────────────
    let finalPo: any;
    try {
      finalPo = await (tx as any).procurementFinalPO.create({
        data: {
          tenantId: company.id,
          requisitionId: requisition.id,
          draftPoId: draftPo.id,
          supplierId: supplier.id,
          supplierBranchId: supplierBranch.id,
          branchCode: supplierBranch.branchCode,
          status: "RELEASED",
          totalAmount: 500000,
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      pass(
        "4.5 FinalPO created",
        `ProcurementFinalPO ${finalPo.id} (RELEASED)`,
      );
    } catch (e: any) {
      fail("4.5 FinalPO created", `Failed: ${e.message}`);
      return;
    }

    // Validate the full procurement chain linkage
    const fetchedFinalPo = await (tx as any).procurementFinalPO.findUnique({
      where: { id: finalPo.id },
      include: {
        requisition: true,
        draftPo: true,
        supplier: true,
        supplierBranch: true,
      },
    });
    if (
      fetchedFinalPo?.requisition?.id === requisition.id &&
      fetchedFinalPo?.draftPo?.id === draftPo.id &&
      fetchedFinalPo?.supplier?.id === supplier.id
    ) {
      pass(
        "4.5 FinalPO chain",
        `FinalPO → DraftPO → Requisition → Supplier all linked correctly`,
      );
    } else {
      fail("4.5 FinalPO chain", `PO relational chain is broken`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.6: Create ProcurementReceipt (goods received)
    // ────────────────────────────────────────────────────────────────────────
    let receipt: any;
    try {
      receipt = await (tx as any).procurementReceipt.create({
        data: {
          tenantId: company.id,
          finalPoId: finalPo.id,
          supplierId: supplier.id,
          supplierBranchId: supplierBranch.id,
          receivedAt: new Date(),
          deliveryOnTime: true,
          quantityAccuracy: 100,
          qualityScore: 95,
          issueCount: 0,
          invoiceMismatch: false,
        },
      });
      pass(
        "4.6 ProcurementReceipt created",
        `GRN Receipt ${receipt.id} — quality: ${receipt.qualityScore}, onTime: true`,
      );
    } catch (e: any) {
      fail("4.6 ProcurementReceipt created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.7: Record StockMovement (stock in from PO)
    // ────────────────────────────────────────────────────────────────────────
    const receivedQty = 10;
    const unitCost = 50000;
    let stockMovement: any;
    try {
      stockMovement = await (tx as any).stockMovement.create({
        data: {
          tenantId: company.id,
          productId: product.id,
          toLocationId: location.id,
          toDepartmentId: department.id,
          quantity: receivedQty,
          unitCost: unitCost,
          type: "PURCHASE_RECEIPT",
          referenceId: receipt.id,
          performedBy: employee.id,
        },
      });
      pass(
        "4.7 StockMovement created",
        `StockMovement ${stockMovement.id} — IN ${receivedQty} units at cost ${unitCost}`,
      );
    } catch (e: any) {
      fail("4.7 StockMovement created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.8: Update StockLevel (simulate stock-in)
    // ────────────────────────────────────────────────────────────────────────
    try {
      const updatedStock = await (tx as any).stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          onHand: { increment: receivedQty },
          available: { increment: receivedQty },
        },
      });
      if (Number(updatedStock.onHand) === receivedQty) {
        pass(
          "4.8 StockLevel updated",
          `onHand incremented to ${updatedStock.onHand} (was 0) — stock-in confirmed`,
        );
      } else {
        fail(
          "4.8 StockLevel updated",
          `onHand is ${updatedStock.onHand} but expected ${receivedQty}`,
        );
      }
    } catch (e: any) {
      fail("4.8 StockLevel updated", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.9: Create Finance JournalEntry for inventory purchase
    // ────────────────────────────────────────────────────────────────────────
    const totalCost = receivedQty * unitCost;
    let journalEntry: any;
    try {
      journalEntry = await (tx as any).journalEntry.create({
        data: {
          tenantId: company.id,
          fiscalPeriodId: (fiscalPeriod as any).id,
          ref: `GRN-${receipt.id.slice(0, 8)}`,
          postingDate: new Date(),
          description: `Inventory purchase — FinalPO ${finalPo.id.slice(0, 8)}`,
          status: "POSTED",
          lines: {
            create: [
              {
                tenantId: company.id,
                accountId: (accInventory as any).id,
                accountCode: "1300",
                description: `10x ${product.name} received`,
                side: "DEBIT",
                amount: totalCost,
                debit: totalCost,
                credit: 0,
              },
              {
                tenantId: company.id,
                accountId: (accPayable as any).id,
                accountCode: "2100",
                description: `Payable to ${supplier.name}`,
                side: "CREDIT",
                amount: totalCost,
                debit: 0,
                credit: totalCost,
              },
            ],
          },
        },
        include: { lines: true },
      });
      pass(
        "4.9 JournalEntry created",
        `Inventory purchase JournalEntry ${journalEntry.id} with ${journalEntry.lines.length} lines`,
      );
    } catch (e: any) {
      fail(
        "4.9 JournalEntry created",
        `Failed to create journal entry: ${e.message}`,
      );
      return;
    }

    // Validate double-entry balance
    const totalDebit = journalEntry.lines.reduce(
      (s: number, l: any) => s + Number(l.debit),
      0,
    );
    const totalCredit = journalEntry.lines.reduce(
      (s: number, l: any) => s + Number(l.credit),
      0,
    );
    if (Math.abs(totalDebit - totalCredit) < 0.01) {
      pass(
        "4.9 Double-entry balanced",
        `Purchase JournalEntry: Debits (${totalDebit}) = Credits (${totalCredit})`,
      );
    } else {
      fail(
        "4.9 Double-entry balanced",
        `IMBALANCE: Debits ${totalDebit} ≠ Credits ${totalCredit}`,
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.10: Validate financeCommitmentId gap (known structural warning)
    // ────────────────────────────────────────────────────────────────────────
    const refetchedFinalPo = await (tx as any).procurementFinalPO.findUnique({
      where: { id: finalPo.id },
    });
    if (!refetchedFinalPo?.financeCommitmentId) {
      warn(
        "4.10 FinalPO.financeCommitmentId",
        `FinalPO has no financeCommitmentId — there is NO Prisma FK linking PO to JournalEntry. Finance integration is manual string reference.`,
        {
          recommendation:
            "Store journalEntry.id in financeCommitmentId after PO release for full traceability",
        },
      );
    } else {
      pass(
        "4.10 FinalPO.financeCommitmentId",
        `financeCommitmentId is populated: ${refetchedFinalPo.financeCommitmentId}`,
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4.11: Validate full chain traceable
    // ────────────────────────────────────────────────────────────────────────
    const [sm, sl] = await Promise.all([
      (tx as any).stockMovement.findUnique({
        where: { id: stockMovement.id },
        include: { product: true, toLocation: true },
      }),
      (tx as any).stockLevel.findUnique({
        where: { id: stockLevel.id },
        include: { product: true, location: true },
      }),
    ]);

    if (sm?.product?.id === product.id && sm?.toLocation?.id === location.id) {
      pass(
        "4.11 StockMovement→Product→Location",
        `StockMovement relational chain resolved: product "${sm.product.name}" → location "${sm.toLocation.name}"`,
      );
    } else {
      fail(
        "4.11 StockMovement→Product→Location",
        `Relational chain broken on StockMovement`,
      );
    }

    if (Number(sl?.onHand) === receivedQty) {
      pass(
        "4.11 StockLevel confirms receipt",
        `StockLevel.onHand = ${sl.onHand} (matches received qty ${receivedQty})`,
      );
    } else {
      fail(
        "4.11 StockLevel confirms receipt",
        `StockLevel.onHand = ${sl?.onHand} but expected ${receivedQty}`,
      );
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase4()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
