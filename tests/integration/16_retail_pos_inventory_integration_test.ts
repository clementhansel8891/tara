/**
 * Phase 16: POS & Retail Inventory Integration Verification
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Verifies:
 * 1. POS Order Creation reserves stock.
 * 2. POS Payment completion:
 *    - Reduces StockLevel onHand and reserved atomically.
 *    - Records StockMovement (OUT).
 *    - Emits STOCK_MOVEMENT_CREATED event.
 * 3. Finance Domain:
 *    - Listener creates InventorySubledgerEntry.
 *    - CostingEngine depletes FIFO layers.
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, printSummary } from "./helpers/logger";
import { runInRollbackTx } from "./helpers/tx";
import {
  seedTestCompany,
  seedTestLocation,
  seedTestDepartment,
  seedTestCategory,
  seedTestProduct,
  seedTestEmployee,
  testId,
} from "./helpers/seeds";
import { RetailDbRepository } from "../../backend/src/core/retail/repositories/retail.db.repository";
import { RetailService } from "../../backend/src/core/retail/retail.service";
import { InventorySubledgerDbRepository } from "../../backend/src/core/finance/subledger/repositories/inventory-subledger.db.repository";
import { CostingEngineService } from "../../backend/src/core/finance/subledger/costing-engine.service";
import { InventoryMovementListener } from "../../backend/src/core/finance/subledger/listeners/inventory-movement.listener";
import { EventBusService } from "../../backend/src/shared/events/event-bus.service";

async function runPhase16(): Promise<void> {
  const prisma = getPrisma();
  setPhase("16 — POS & Retail Inventory Integration");

  await runInRollbackTx(prisma, "Phase 16", async (tx) => {
    // 1. Setup Base Data
    const company = await seedTestCompany(tx as any);
    const location = await seedTestLocation(tx as any, company.id);
    const department = await seedTestDepartment(tx as any, company.id);
    const category = await seedTestCategory(tx as any, company.id);
    const product = await seedTestProduct(tx as any, company.id, category.id);
    const employee = await seedTestEmployee(tx as any, company.id, location.id, department.id);

    // 2. Setup Infrastructure
    const mockPrismaService = (tx as any);
    const eventBus = new EventBusService(mockPrismaService);
    
    // Core Retail Setup
    const retailRepo = new RetailDbRepository(mockPrismaService);
    const mockAudit = { log: async () => {} } as any;
    const mockSkuGen = {} as any;
    const mockInvService = {} as any;
    const mockFinService = {} as any;
    
    const retailService = new RetailService(
        retailRepo,
        mockAudit,
        mockSkuGen,
        mockInvService,
        mockFinService,
        mockPrismaService,
        eventBus
    );

    // Finance Subledger Setup
    const subledgerRepo = new InventorySubledgerDbRepository(mockPrismaService);
    const mockIntegration = { handleCostFinalized: async () => {} } as any;
    const costingEngine = new CostingEngineService(subledgerRepo, mockIntegration);
    const listener = new InventoryMovementListener(eventBus, subledgerRepo, costingEngine);
    
    // Wire up the listener
    listener.onModuleInit();

    pass("16.1 Infrastructure Ready", "POS, Inventory, and Finance components wired with EventBus.");

    // ────────────────────────────────────────────────────────────────────────
    // STEP 16.2: Initial Stock Setup (Intake 100 @ $50)
    // ────────────────────────────────────────────────────────────────────────
    const initialQty = 100;
    const unitPrice = 50.0;

    await (tx as any).stockLevel.create({
        data: {
          tenantId: company.id,
          locationId: location.id,
          productId: product.id,
          departmentId: department.id,
          onHand: initialQty,
          available: initialQty,
          reserved: 0
        }
    });

    // Create an initial cost layer in subledger so FIFO has data
    const intakeMovement = await (tx as any).stockMovement.create({
        data: {
          tenantId: company.id,
          productId: product.id,
          toLocationId: location.id,
          toDepartmentId: department.id,
          quantity: initialQty,
          unitCost: unitPrice,
          type: "INTAKE",
          referenceId: "INITIAL_SEED",
          performedBy: employee.id,
        },
    });

    const intakeEntry = await subledgerRepo.createEntry(company.id, {
        sourceEventId: intakeMovement.id,
        entryType: 'PROVISIONAL_ADJUSTMENT' as any,
        status: 'PENDING' as any,
        qty: initialQty,
        unitCost: unitPrice,
        skuId: product.id,
        locationId: location.id,
        inventoryTransactionId: intakeMovement.id
    });
    await costingEngine.processEntry(company.id, intakeEntry.id);

    pass("16.2 Initial Stock Established", "100 units @ $50 ready with Cost Layer.");

    // ────────────────────────────────────────────────────────────────────────
    // STEP 16.3: Create POS Order (Reserves 5 units)
    // ────────────────────────────────────────────────────────────────────────
    const orderQty = 5;
    
    // Mock the store object needed by retail logic
    const store = await (tx as any).store.create({
        data: {
            tenantId: company.id,
            locationId: location.id,
            name: "Test Branch",
            code: "TBR",
            type: "physical",
            currency: "USD"
        }
    });
    
    const posDevice = await (tx as any).pOSDevice.create({
        data: {
            id: "TERM-1",
            tenantId: company.id,
            storeId: store.id,
            name: "Terminal 1",
            type: "terminal",
            isActive: true
        }
    });

    // Seed Fiscal Period for Journal Entry
    await (tx as any).fiscalPeriod.create({
        data: {
            id: "FISCAL_AUTO",
            tenantId: company.id,
            name: "Current POS Period",
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date(new Date().getFullYear(), 11, 31),
            status: "OPEN",
        }
    });

    // Seed Chart of Accounts for Journal Entry
    await (tx as any).chartOfAccount.createMany({
        data: [
            {
                id: "ACC-4000",
                tenantId: company.id,
                code: "4000",
                name: "Sales Revenue",
                type: "REVENUE",
                status: "ACTIVE"
            },
            {
                id: "ACC-1001",
                tenantId: company.id,
                code: "1001",
                name: "Cash in Hand",
                type: "ASSET",
                status: "ACTIVE"
            }
        ]
    });

    const order = await retailService.createOrder(company.id, location.id, {
        storeId: store.id,
        terminalId: "TERM-1",
        items: [{
            productId: product.id,
            quantity: orderQty,
            unitPrice: 60.0 // Selling price
        }],
        paymentMethod: "CASH",
        grandTotal: 300.0,
        currency: "USD"
    }, employee.id);

    // Verify Reservation
    const stockAfterRes = await (tx as any).stockLevel.findFirst({
        where: { productId: product.id, locationId: location.id }
    });

    if (stockAfterRes.reserved === 5 && stockAfterRes.available === 95) {
        pass("16.3 Order Reserved", `Order for 5 units created. Available: ${stockAfterRes.available}, Reserved: ${stockAfterRes.reserved}`);
    } else {
        fail("16.3 Order Reserved", `Expected 5 reserved/95 available, got ${stockAfterRes.reserved}/${stockAfterRes.available}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 16.4: Complete Payment (Triggers Movement & Subledger)
    // ────────────────────────────────────────────────────────────────────────
    const paymentResult = await retailService.processPayment(company.id, order.id, {
        amount: 300.0,
        method: "CASH"
    }, employee.id);

    // 1. Verify StockLevel Reduction
    const stockAfterPay = await (tx as any).stockLevel.findFirst({
        where: { productId: product.id, locationId: location.id }
    });

    if (stockAfterPay.onHand === 95 && stockAfterPay.reserved === 0) {
        pass("16.4.1 StockLevel Finalized", `OH: ${stockAfterPay.onHand}, Reserved: ${stockAfterPay.reserved} (Correct).`);
    } else {
        fail("16.4.1 StockLevel Finalized", `Expected 95 OH/0 Res, got ${stockAfterPay.onHand}/${stockAfterPay.reserved}`);
    }

    // 2. Verify Finance Subledger Entry (Created via Event Listener)
    const financeEntries = await (tx as any).inventorySubledgerEntry.findMany({
        where: {
            tenantId: company.id,
            sourceEventId: { in: (paymentResult as any).movements.map((m: any) => m.id) },
            entryType: "INVENTORY_ISSUE",
        }
    });

    const subledgerMetadata = financeEntries.length > 0 ? (financeEntries[0].metadata as any) : {};
    const subledgerQty = Math.abs(Number(subledgerMetadata?.qty || 0));
    const subledgerAmount = Number(subledgerMetadata?.amount || 0);

    if (financeEntries.length === 1 && subledgerQty === 5) {
        pass("16.4.2 Finance Subledger Created", "ISSUE entry automatically created via EventBus listener.");
    } else {
        fail("16.4.2 Finance Subledger Created", `Expected 1 entry with qty 5, found ${financeEntries.length} entries, qty: ${subledgerQty}`);
    }

    // 3. Verify COGS & FIFO Cost Layer Depletion
    if (subledgerAmount === 5 * unitPrice) {
        pass("16.4.3 FIFO COGS Verified", `COGS calculated at $${subledgerAmount} (5 units @ $${unitPrice}).`);
    } else {
        fail("16.4.3 FIFO COGS Verified", `Expected $${5 * unitPrice}, got $${subledgerAmount}`);
    }

    const layerAfter = await (tx as any).costLayer.findFirst({
        where: { skuId: product.id, locationId: location.id }
    });

    if (layerAfter && layerAfter.remainingQty === 95) {
        pass("16.4.4 Layer Tracking OK", `FIFO Layer depleted: 100 -> ${layerAfter.remainingQty}.`);
    } else {
        fail("16.4.4 Layer Tracking OK", `Expected 95, got ${layerAfter?.remainingQty}`);
    }

  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase16()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
