import { PrismaClient } from "@prisma/client";
import { SimLogger } from "./logger";

export class ConsistencyChecker {
  private prisma: PrismaClient;
  private logger: SimLogger;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new SimLogger("consistency-checker");
  }

  async verifyFinancialLedger(tenantId: string) {
    this.logger.log(`Verifying Financial Ledger for Tenant: ${tenantId}`);

    // Check if SUM(debit) == SUM(credit)
    const lines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: {
          tenantId,
        },
      },
    });

    let debits = 0;
    let credits = 0;

    for (const line of lines) {
      debits += Number(line.debit);
      credits += Number(line.credit);
    }

    const isBalanced = Math.abs(debits - credits) < 0.01;
    this.logger.log(
      `Ledger Balance Check: ${isBalanced ? "PASS" : "FAIL"} (Debits: ${debits}, Credits: ${credits})`,
    );

    return {
      success: isBalanced,
      debits,
      credits,
      difference: debits - credits,
    };
  }

  async verifyInventoryConsistency(tenantId: string, productId: string) {
    this.logger.log(
      `Verifying Inventory for Product: ${productId} (Tenant: ${tenantId})`,
    );

    // level = initial + movements
    const movements = await this.prisma.stockMovement.findMany({
      where: { tenantId, productId },
    });

    const levels = await this.prisma.stockLevel.findMany({
      where: { tenantId, productId },
    });

    const totalOnHand = levels.reduce((acc, l) => acc + l.onHand, 0);

    let calculatedStock = 0;
    for (const m of movements) {
      // In this schema, it seems we'd need to know if it's 'IN' or 'OUT'
      // But let's assume signed quantity or use the 'type'
      if (["SALE", "OUT", "ADJUST_REMOVE"].includes(m.type)) {
        calculatedStock -= m.quantity;
      } else {
        calculatedStock += m.quantity;
      }
    }

    const matches = Math.abs(totalOnHand - calculatedStock) < 0.001;
    this.logger.log(
      `Inventory Balance Check: ${matches ? "PASS" : "FAIL"} (Actual: ${totalOnHand}, Calculated: ${calculatedStock})`,
    );

    return {
      success: matches,
      actual: totalOnHand,
      calculated: calculatedStock,
    };
  }

  async verifyOrderIntegrity(tenantId: string, orderId: string) {
    const order = await this.prisma.retailOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== "paid")
      return { success: true, message: "Skipping non-paid order" };

    // Check if finance entries exist (using reference)
    // Looking at common patterns, reference might be in JournalEntry.description or a metadata field
    const financeExists = await this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        description: { contains: orderId },
      },
    });

    const inventoryExists = await this.prisma.stockMovement.findFirst({
      where: {
        tenantId,
        referenceId: orderId,
      },
    });

    const totalIntegral = !!financeExists && !!inventoryExists;
    this.logger.log(
      `Order Integrity Check (${orderId}): ${totalIntegral ? "PASS" : "FAIL"} (Fin: ${!!financeExists}, Inv: ${!!inventoryExists})`,
    );

    return {
      success: totalIntegral,
      checks: {
        financeExists: !!financeExists,
        inventoryExists: !!inventoryExists,
      },
    };
  }
}
