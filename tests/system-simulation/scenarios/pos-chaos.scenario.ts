// @ts-nocheck
import { SimulationEngine } from "../simulation-engine/engine";
import { POSAgent } from "../agents/pos.agent";
import { ChaosController } from "../chaos-engine/chaos-controller";
import { ConsistencyChecker } from "../simulation-engine/consistency-checker";
import { FaultInjector } from "../chaos-engine/fault-injector";

export const POSChaosScenario = async (engine: SimulationEngine) => {
  const ctx = engine.getContext();
  const tenantId = ctx.get("tenantId");
  const baseURL = "http://localhost:3001/api";
  const branch = (ctx.get("branches") || [])[0]; // Use first branch from bootstrap

  if (!branch) {
    throw new Error("No branch available for POS Chaos scenario");
  }

  // 1. Setup Agents & Chaos
  const injector = new FaultInjector();
  const pos = new POSAgent("store-cashier", {
    baseURL,
    tenantId,
    locationId: branch.locationId || branch.id,
    faultInjector: injector,
  });
  const chaos = new ChaosController(injector);
  const checker = new ConsistencyChecker();

  engine.registerAgent(pos);

  // 2. Setup Data (No chaos yet)
  const prod = await pos.createProduct({
    name: "Chaos Phone 1",
    sku: `CPH-${Date.now()}`,
    basePrice: 999.99,
    category: "finished_good", // Must match InventoryCategory enum
  });

  await pos.intakeStock(prod.id, 100, branch.locationId || branch.id);

  // 3. Start Transactions with Chaos
  chaos.enablePOSChaos();

  for (let i = 0; i < 5; i++) {
    try {
      const order = await pos.createOrder(
        [{ productId: prod.id, quantity: 1 }],
        branch.id,
      );
      await pos.processPayment(order.id, 999.99);
    } catch (e: any) {
      engine
        .getContext()
        .push("chaos_failures", { iteration: i, error: e.message });
    }
  }

  chaos.stopChaos();

  // 4. Verify Consistency
  await checker.verifyFinancialLedger(tenantId);
  await checker.verifyInventoryConsistency(tenantId, prod.id);
};
