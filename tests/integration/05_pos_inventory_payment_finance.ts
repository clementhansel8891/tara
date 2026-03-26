/**
 * Phase 5: Retail POS → Inventory → Payment → Finance Chain
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Simulates a standard In-Store POS transaction:
 *   1. Store & POS Device identified
 *   2. Customer (Optional) selected
 *   3. RetailOrder created with multiple items
 *   4. StockLevel deducted via StockMovement (OUT)
 *   5. PaymentTransaction recorded
 *   6. Finance JournalEntry created (Revenue/Cash)
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
  seedTestStore,
  seedTestFiscalPeriod,
  seedTestAccount,
  testId,
} from "./helpers/seeds";

async function runPhase5(): Promise<void> {
  const prisma = getPrisma();
  setPhase("05 — Retail POS → Inventory → Payment → Finance Chain");

  await runInRollbackTx(prisma, "Phase 5", async (tx) => {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 5.1: Setup Retail Environment
    // ────────────────────────────────────────────────────────────────────────
    let company: any, location: any, store: any, posDevice: any, cashier: any;
    let products: any[] = [];
    let initialStock = 50;
    let fiscalPeriod: any;
    let accCash: any, accRevenue: any, accTax: any, accCogs: any, accInventory: any;

    try {
      company = await seedTestCompany(tx as any);
      location = await seedTestLocation(tx as any, company.id);
      store = await seedTestStore(tx as any, company.id, location.id);

      const dept = await seedTestDepartment(tx as any, company.id, {
        name: "Retail",
      });
      cashier = await seedTestEmployee(
        tx as any,
        company.id,
        location.id,
        dept.id,
        {
          firstName: "Cashier",
          lastName: "One",
        },
      );

      posDevice = await (tx as any).pOSDevice.create({
        data: {
          tenantId: company.id,
          storeId: store.id,
          name: "POS-01",
          type: "terminal",
          isActive: true,
        },
      });

      const cat = await seedTestCategory(tx as any, company.id, {
        name: "Electronics",
      });
      const p1 = await seedTestProduct(tx as any, company.id, cat.id, {
        name: "Smartphone",
        basePrice: 3000000,
      });
      const p2 = await seedTestProduct(tx as any, company.id, cat.id, {
        name: "Charger",
        basePrice: 200000,
      });
      products.push(p1, p2);

      // Seed accounting foundation
      fiscalPeriod = await seedTestFiscalPeriod(tx as any, company.id);
      accCash = await seedTestAccount(tx as any, company.id, '1000', 'Cash', 'ASSET');
      accRevenue = await seedTestAccount(tx as any, company.id, '4000', 'Sales Revenue', 'REVENUE');
      accTax = await seedTestAccount(tx as any, company.id, '2200', 'Sales Tax Payable', 'LIABILITY');
      accCogs = await seedTestAccount(tx as any, company.id, '5100', 'COGS', 'EXPENSE');
      accInventory = await seedTestAccount(tx as any, company.id, '1300', 'Inventory Asset', 'ASSET');

      // Initialize Stock
      for (const p of products) {
        await (tx as any).stockLevel.create({
          data: {
            tenantId: company.id,
            locationId: location.id,
            productId: p.id,
            onHand: initialStock,
            available: initialStock,
          },
        });
      }

      pass(
        "5.1 Retail Environment setup",
        `Store ${store.code} + POS ${posDevice.name} + 2 Products with ${initialStock} stock each READY`,
      );
    } catch (e: any) {
      fail("5.1 Retail Environment setup", `Setup failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 5.2: Create RetailOrder (Checkout)
    // ────────────────────────────────────────────────────────────────────────
    let order: any;
    const subtotal = 3200000;
    const tax = subtotal * 0.11;
    const totalAmount = subtotal + tax;
    const paymentRef = `TXN-${testId()}`;

    try {
      order = await (tx as any).retailOrder.create({
        data: {
          tenantId: company.id,
          storeId: store.id,
          deviceId: posDevice.id,
          cashierId: cashier.id,
          status: "paid",
          subtotal: subtotal,
          tax: tax,
          totalAmount: totalAmount,
          paymentMethod: "cash",
          paymentReference: paymentRef,
          items: {
            create: [
              {
                tenantId: company.id,
                productId: products[0].id,
                quantity: 1,
                unitPrice: 3000000,
                totalPrice: 3000000,
              },
              {
                tenantId: company.id,
                productId: products[1].id,
                quantity: 1,
                unitPrice: 200000,
                totalPrice: 200000,
              },
            ],
          },
        },
        include: { items: true },
      });
      pass(
        "5.2 RetailOrder created",
        `Order ${order.id} generated — Total: ${totalAmount} (${order.items.length} items)`,
      );
    } catch (e: any) {
      fail("5.2 RetailOrder created", `Checkout failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 5.3: Deduct Inventory (Simulate fulfillment/checkout hook)
    // ────────────────────────────────────────────────────────────────────────
    try {
      for (const item of order.items) {
        // Record Movement OUT
        await (tx as any).stockMovement.create({
          data: {
            tenantId: company.id,
            productId: item.productId,
            fromLocationId: location.id,
            toLocationId: null, // explicit for clarity
            quantity: item.quantity,
            type: "RETAIL_SALE",
            referenceId: order.id,
            performedBy: cashier.id,
          },
        });

        // Update Level - Find the specific stock level first to get its ID
        // This avoids Prisma's limitation with null values in composite unique keys
        const targetStock = await (tx as any).stockLevel.findFirst({
          where: {
            tenantId: company.id,
            locationId: location.id,
            productId: item.productId,
          },
        });

        if (targetStock) {
          await (tx as any).stockLevel.update({
            where: { id: targetStock.id },
            data: {
              onHand: { decrement: item.quantity },
              available: { decrement: item.quantity },
            },
          });
        }
      }
      pass(
        "5.3 Inventory deducted",
        `Stock deducted for ${order.items.length} products — Movements recorded (REF: ${order.id})`,
      );
    } catch (e: any) {
      fail("5.3 Inventory deducted", `Inventory update failed: ${e.message}`);
      // Note: In real app, this should be atomic with order creation
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 5.4: Verify StockLevels after sale
    // ────────────────────────────────────────────────────────────────────────
    try {
      const levels = await (tx as any).stockLevel.findMany({
        where: { tenantId: company.id, locationId: location.id },
      });
      const allCorrect = levels.every(
        (l: any) => Number(l.onHand) === initialStock - 1,
      );
      if (allCorrect) {
        pass(
          "5.4 Stock verification",
          `All products correctly decremented to ${initialStock - 1} on-hand`,
        );
      } else {
        fail(
          "5.4 Stock verification",
          `Stock mismatch detected after sale`,
          levels,
        );
      }
    } catch (e: any) {
      fail("5.4 Stock verification", `Query failed: ${e.message}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 5.5: Create PaymentTransaction
    // ────────────────────────────────────────────────────────────────────────
    let paymentTx: any;
    try {
      paymentTx = await (tx as any).paymentTransaction.create({
        data: {
          tenantId: company.id,
          externalReference: order.id, // Linking back to order
          type: "SALE",
          amount: totalAmount,
          currency: "IDR",
          destination: "MAIN_CASHIER",
          channel: "CASH",
          idempotencyKey: `PAY-${order.id}`,
          status: "SETTLED",
          createdBy: cashier.id,
        },
      });
      pass(
        "5.5 PaymentTransaction recorded",
        `Payment ${paymentTx.id} (SETTLED) linked to Order ${order.id}`,
      );
    } catch (e: any) {
      fail(
        "5.5 PaymentTransaction recorded",
        `Payment recording failed: ${e.message}`,
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 5.6: Finance JournalEntry (POS Revenue)
    // ────────────────────────────────────────────────────────────────────────
    let journalEntry: any;
    try {
      journalEntry = await (tx as any).journalEntry.create({
        data: {
          tenantId: company.id,
          fiscalPeriodId: (fiscalPeriod as any).id,
          ref: order.id,
          postingDate: new Date(),
          description: `POS Sale — Order ${order.id.slice(0, 8)}`,
          status: "POSTED",
          lines: {
            create: [
              {
                tenantId: company.id,
                accountId: accCash.id,
                accountCode: "1000",
                description: `Collections from POS-01`,
                side: "DEBIT",
                amount: totalAmount,
                debit: totalAmount,
                credit: 0,
              },
              {
                tenantId: company.id,
                accountId: accRevenue.id,
                accountCode: "4000",
                description: `Retail Sales Revenue`,
                side: "CREDIT",
                amount: subtotal,
                debit: 0,
                credit: subtotal,
              },
              {
                tenantId: company.id,
                accountId: accTax.id,
                accountCode: "2200",
                description: `VAT collections`,
                side: "CREDIT",
                amount: tax,
                debit: 0,
                credit: tax,
              },
              {
                tenantId: company.id,
                accountId: accCogs.id,
                accountCode: "5100",
                description: `Cost of goods sold`,
                side: "DEBIT",
                amount: Number(subtotal) * 0.6,
                debit: Number(subtotal) * 0.6,
                credit: 0,
              },
              {
                tenantId: company.id,
                accountId: accInventory.id,
                accountCode: "1300",
                description: `Inventory reduction`,
                side: "CREDIT",
                amount: Number(subtotal) * 0.6,
                debit: 0,
                credit: Number(subtotal) * 0.6,
              },
            ],
          },
        },
        include: { lines: true },
      });
      pass(
        "5.6 JournalEntry created",
        `Finance entry ${journalEntry.id} recorded for Order ${order.id}`,
      );
    } catch (e: any) {
      fail(
        "5.6 JournalEntry created",
        `Finance recording failed: ${e.message}`,
      );
    }

    // Validate double-entry balance
    try {
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
          "5.6 Double-entry balanced",
          `POS JournalEntry: Debits (${totalDebit}) = Credits (${totalCredit}) ✓`,
        );
      } else {
        fail(
          "5.6 Double-entry balanced",
          `IMBALANCE: Debits ${totalDebit} ≠ Credits ${totalCredit}`,
        );
      }
    } catch (e: any) {
      fail("5.6 Double-entry balance check failed", e.message);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 5.7: Verify Relation Gaps (Structural warnings)
    // ────────────────────────────────────────────────────────────────────────
    try {
      const refOrder = await (tx as any).retailOrder.findUnique({
        where: { id: order.id },
      });
      if (refOrder && !refOrder.paymentId) {
        // Checking if a 'paymentId' field even exists in schema
        warn(
          "5.7 RetailOrder→Payment link",
          "RetailOrder uses paymentReference string but lacks formal FK to PaymentTransaction table.",
        );
      }

      // Verify traceability
      const tracedTx = await (tx as any).paymentTransaction.findFirst({
        where: { externalReference: order.id },
      });
      if (tracedTx) {
        pass(
          "5.7 Traceability POS→Payment",
          `Can find PaymentTransaction using Order ID as externalReference`,
        );
      } else {
        fail(
          "5.7 Traceability POS→Payment",
          `PaymentTransaction lookup failed for Order ID`,
        );
      }
    } catch (e: any) {
      warn("5.7 Traceability check failed", e.message);
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase5()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
