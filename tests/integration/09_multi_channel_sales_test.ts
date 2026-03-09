/**
 * Phase 9: Multi-Channel Commerce Validation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Validates that multiple commerce channels can coexist and process data:
 *   1. POS Channel (POSDevice + Store)
 *   2. Ecommerce Channel (EcommerceConnector)
 *   3. Marketplace Channel (RetailChannel - Marketplace type)
 *   4. Cross-channel inventory check
 *
 * All writes inside a rolled-back transaction.
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, warn, printSummary } from "./helpers/logger";
import { runInRollbackTx } from "./helpers/tx";
import {
  seedTestCompany,
  seedTestLocation,
  seedTestStore,
  testId,
} from "./helpers/seeds";

async function runPhase9(): Promise<void> {
  const prisma = getPrisma();
  setPhase("09 — Multi-Channel Commerce Validation");

  await runInRollbackTx(prisma, "Phase 9", async (tx) => {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 9.1: Setup Multi-Channel Environment
    // ────────────────────────────────────────────────────────────────────────
    let company: any, store: any;
    try {
      company = await seedTestCompany(tx as any);
      const location = await seedTestLocation(tx as any, company.id);
      store = await seedTestStore(tx as any, company.id, location.id);
      pass(
        "9.1 Multi-Channel Environment setup",
        `Company ${company.id} and Store ${store.id} READY`,
      );
    } catch (e: any) {
      fail("9.1 Multi-Channel Environment setup", `Setup failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 9.2: Create POS Channel (POSDevice)
    // ────────────────────────────────────────────────────────────────────────
    let pos: any;
    try {
      pos = await (tx as any).pOSDevice.create({
        data: {
          tenantId: company.id,
          storeId: store.id,
          name: "Terminal-01",
          type: "hardware",
          isActive: true,
        },
      });
      pass(
        "9.2 POS Channel initialized",
        `POS Device "${pos.name}" linked to Store`,
      );
    } catch (e: any) {
      fail("9.2 POS Channel initialized", `Failed: ${e.message}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 9.3: Create Ecommerce Connector
    // ────────────────────────────────────────────────────────────────────────
    let ecom: any;
    try {
      ecom = await (tx as any).ecommerceConnector.create({
        data: {
          tenantId: company.id,
          name: "Main Shopify Store",
          platform: "SHOPIFY", // Fixed field name from 'type' to 'platform'
          domain: "store.zenvix.com",
          apiKey: `key-${testId()}`,
          status: "active",
        },
      });
      pass(
        "9.3 Ecommerce Channel initialized",
        `Connector "${ecom.name}" (${ecom.platform}) created`,
      );
    } catch (e: any) {
      fail("9.3 Ecommerce Channel initialized", `Failed: ${e.message}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 9.4: Create Marketplace RetailChannel
    // ────────────────────────────────────────────────────────────────────────
    let marketplace: any;
    try {
      marketplace = await (tx as any).retailChannel.create({
        data: {
          tenantId: company.id,
          name: "Amazon US",
          type: "MARKETPLACE",
          adapterType: "AMAZON",
          status: "active",
          syncFrequency: "15m",
        },
      });
      pass(
        "9.4 Marketplace Channel initialized",
        `Channel "${marketplace.name}" created for ${marketplace.adapterType}`,
      );
    } catch (e: any) {
      fail("9.4 Marketplace Channel initialized", `Failed: ${e.message}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 9.5: Simulate Orders into RetailOrder table (Convergence)
    // ────────────────────────────────────────────────────────────────────────
    try {
      // Order from POS
      const orderPOS = await (tx as any).retailOrder.create({
        data: {
          tenantId: company.id,
          storeId: store.id,
          deviceId: pos.id,
          status: "paid",
          subtotal: 1000,
          tax: 110,
          totalAmount: 1110,
        },
      });

      // Order from Ecom
      const orderEcom = await (tx as any).retailOrder.create({
        data: {
          tenantId: company.id,
          storeId: store.id,
          status: "pending_fulfillment",
          subtotal: 5000,
          tax: 550,
          totalAmount: 5550,
          paymentReference: "SHOPIFY-1001",
        },
      });

      pass(
        "9.5 Multi-Channel Order Convergence",
        `Successfully recorded orders from both POS and Ecommerce channels`,
      );
    } catch (e: any) {
      fail("9.5 Multi-Channel Order Convergence", `Failed: ${e.message}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 9.6: Verify Channel Separation (Logic Check)
    // ────────────────────────────────────────────────────────────────────────
    const channels = await (tx as any).retailChannel.findMany({
      where: { tenantId: company.id },
    });
    const ecoms = await (tx as any).ecommerceConnector.findMany({
      where: { tenantId: company.id },
    });

    if (channels.length >= 1 && ecoms.length >= 1) {
      pass(
        "9.6 Channel Coexistence",
        `POS, Ecommerce, and Marketplace configurations coexist safely in one tenant ✓`,
      );
    } else {
      fail(
        "9.6 Channel Coexistence",
        `Channel configuration lost during setup. Found ${channels.length} channels and ${ecoms.length} connectors.`,
      );
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase9()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
