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
import { RetailDbRepository } from "../../backend/src/modules/retail/repositories/retail.db.repository";
import { RetailService } from "../../backend/src/modules/retail/retail.service";
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
    mockPrismaService.$transaction = async (cb: (tx: any) => Promise<any>) => cb(tx);
    const eventBus = new EventBusService(mockPrismaService);
    
    // Core Retail Setup
    const retailRepo = new RetailDbRepository(mockPrismaService);
    const mockAudit = { log: async () => {} } as any;
    const mockSkuGen = {} as any;
    const mockInvService = {
        consumeStock: async (ctx: any, data: any, user_id: string, tx: any) => {
            // Update stock_levels
            await tx.stock_levels.updateMany({
                where: {
                    tenant_id: ctx.tenant_id,
                    product_id: data.item_id,
                    location_id: data.location_id,
                },
                data: {
                    on_hand: { decrement: data.quantity },
                    reserved: { decrement: data.quantity }
                }
            });

            // Mock stock consumption
            const move = await tx.stock_movements.create({
                data: {
                    tenant_id: ctx.tenant_id,
                    product_id: data.item_id,
                    from_location_id: data.location_id,
                    quantity: data.quantity,
                    type: "ISSUE",
                    reference_id: data.reference_id,
                    performed_by: data.performed_by,
                    location_id: data.location_id,
                }
            });

            // Publish STOCK_MOVEMENT_CREATED event
            await eventBus.publish({
                event_type: "STOCK_MOVEMENT_CREATED",
                tenant_id: ctx.tenant_id,
                entity_id: move.id,
                entity_type: "STOCK_MOVEMENT",
                source_module: "inventory",
                payload: {
                    movementId: move.id,
                    tenant_id: ctx.tenant_id,
                    product_id: data.item_id,
                    location_id: data.location_id,
                    type: "deduction",
                    quantity: data.quantity,
                    referenceId: data.reference_id,
                    referenceType: data.reference_type || "POS_SALE",
                    timestamp: new Date().toISOString(),
                },
                user_id: user_id,
            });

            return move;
        }
    } as any;
    const mockFinService = {
        createJournal: async () => {}
    } as any;
    const mockPaymentService = {} as any;
    const mockRetailPrint = {} as any;
    const mockEventEmitter = { emit: () => {} } as any;
    
    const retailService = new RetailService(
        retailRepo,
        mockInvService,
        mockFinService,
        mockPaymentService,
        mockAudit,
        mockSkuGen,
        mockPrismaService,
        eventBus,
        mockRetailPrint,
        mockEventEmitter
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

    await (tx as any).stock_levels.create({
        data: {
          tenant_id: company.id,
          location_id: location.id,
          product_id: product.id,
          department_id: department.id,
          on_hand: initialQty,
          available: initialQty,
          reserved: 0
        }
    });

    // Create an initial cost layer in subledger so FIFO has data
    const intakeMovement = await (tx as any).stock_movements.create({
        data: {
          tenant_id: company.id,
          product_id: product.id,
          to_location_id: location.id,
          to_department_id: department.id,
          quantity: initialQty,
          type: "INTAKE",
          reference_id: "INITIAL_SEED",
          performed_by: employee.id,
          location_id: location.id,
        },
    });

    const tenantCtx = {
      tenant_id: company.id,
      company_id: company.id,
      branch_id: "default",
      user_id: "system",
    };

    const intakeEntry = await subledgerRepo.createEntry(tenantCtx, {
        sourceEventId: intakeMovement.id,
        entryType: 'PROVISIONAL_ADJUSTMENT' as any,
        status: 'PENDING' as any,
        qty: initialQty as any,
        unitCost: unitPrice as any,
        skuId: product.id,
        location_id: location.id,
        inventoryTransactionId: intakeMovement.id
    }, tx as any);
    await costingEngine.processEntry(tenantCtx, intakeEntry.id, tx as any);

    pass("16.2 Initial Stock Established", "100 units @ $50 ready with Cost Layer.");

    // ────────────────────────────────────────────────────────────────────────
    // STEP 16.3: Create POS Order (Reserves 5 units)
    // ────────────────────────────────────────────────────────────────────────
    const orderQty = 5;
    
    // Mock the store object needed by retail logic
    const store = await (tx as any).stores.create({
        data: {
            tenant_id: company.id,
            location_id: location.id,
            name: "Test Branch",
            code: "TBR",
            type: "physical",
            currency: "USD"
        }
    });
    
    const posDevice = await (tx as any).pos_devices.create({
        data: {
            id: "TERM-1",
            tenant_id: company.id,
            store_id: store.id,
            name: "Terminal 1",
            type: "terminal",
            is_active: true
        }
    });

    // Seed Fiscal Period for Journal Entry
    await (tx as any).finance_fiscal_periods.create({
        data: {
            id: "FISCAL_AUTO",
            tenant_id: company.id,
            name: "Current POS Period",
            start_date: new Date(new Date().getFullYear(), 0, 1),
            end_date: new Date(new Date().getFullYear(), 11, 31),
            status: "OPEN",
            fiscal_year_id: "FY-POS-AUTO",
        }
    });

    // Seed Chart of Accounts for Journal Entry
    await (tx as any).finance_chart_of_accounts.createMany({
        data: [
            {
                id: "ACC-4000",
                tenant_id: company.id,
                code: "4000",
                name: "Sales Revenue",
                type: "REVENUE",
                status: "ACTIVE"
            },
            {
                id: "ACC-1001",
                tenant_id: company.id,
                code: "1001",
                name: "Cash in Hand",
                type: "ASSET",
                status: "ACTIVE"
            }
        ]
    });

    const order = await retailService.createOrder(tenantCtx, location.id, {
        store_id: store.id,
        terminal_id: "TERM-1",
        items: [{
            product_id: product.id,
            quantity: String(orderQty),
            unit_price: "60.0" // Selling price
        }],
        payment_method: "cash",
        grand_total: "300.0",
        currency: "USD"
    }, employee.id);

    // Verify Reservation
    const stockAfterRes = await (tx as any).stock_levels.findFirst({
        where: { product_id: product.id, location_id: location.id }
    });

    if (Number(stockAfterRes.reserved) === 5 && Number(stockAfterRes.available) === 95) {
        pass("16.3 Order Reserved", `Order for 5 units created. Available: ${stockAfterRes.available}, Reserved: ${stockAfterRes.reserved}`);
    } else {
        fail("16.3 Order Reserved", `Expected 5 reserved/95 available, got ${stockAfterRes.reserved}/${stockAfterRes.available}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 16.4: Complete Payment (Triggers Movement & Subledger)
    // ────────────────────────────────────────────────────────────────────────
    const paymentResult = await retailService.processPayment(tenantCtx, order.id, {
        amount: 300.0 as any,
        method: "CASH"
    }, employee.id);

    // Wait for asynchronous event handlers to complete processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 1. Verify StockLevel Reduction
    const stockAfterPay = await (tx as any).stock_levels.findFirst({
        where: { product_id: product.id, location_id: location.id }
    });

    if (Number(stockAfterPay.on_hand) === 95 && Number(stockAfterPay.reserved) === 0) {
        pass("16.4.1 StockLevel Finalized", `OH: ${stockAfterPay.on_hand}, Reserved: ${stockAfterPay.reserved} (Correct).`);
    } else {
        fail("16.4.1 StockLevel Finalized", `Expected 95 OH/0 Res, got ${stockAfterPay.on_hand}/${stockAfterPay.reserved}`);
    }

    // 2. Verify Finance Subledger Entry (Created via Event Listener)
    const financeEntries = await (tx as any).inventory_subledger_entries.findMany({
        where: {
            tenant_id: company.id,
            source_event_id: { in: (paymentResult as any).movements.map((m: any) => m.id) },
            entry_type: "INVENTORY_ISSUE",
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

    const layerAfter = await (tx as any).cost_layers.findFirst({
        where: { sku_id: product.id, location_id: location.id }
    });

    if (layerAfter && Number(layerAfter.remaining_qty) === 95) {
        pass("16.4.4 Layer Tracking OK", `FIFO Layer depleted: 100 -> ${layerAfter.remaining_qty}.`);
    } else {
        fail("16.4.4 Layer Tracking OK", `Expected 95, got ${layerAfter?.remaining_qty}`);
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
