import { PrismaClient } from "@prisma/client";
import { RetailDbRepository } from "./src/core/retail/repositories/retail.db.repository";

const prisma = new PrismaClient();

// Create a dummy PrismaService wrapper since RetailDbRepository expects it
class DummyPrismaService extends PrismaClient {}

async function main() {
  const dummyPrisma = new DummyPrismaService();
  const repo = new RetailDbRepository(dummyPrisma as any);

  const tenantId = "comp-demo-a";

  // 1. Find a valid product from the 9K seed
  const product = await prisma.product.findFirst({ where: { tenantId } });
  if (!product) throw new Error("No products found to test with.");

  const store = await prisma.store.findFirst({
    where: { tenantId },
  });
  if (!store) throw new Error("No branch found to test with.");

  console.log(
    `Testing with Product: ${product.name} (ID: ${product.id}) at Store: ${store.name}`,
  );

  // 2. Create a dummy order directly via Prisma to bypass DTO/Controller checks for speed
  const orderData: any = {
    tenantId,
    storeId: store.id,
    status: "pending",
    subtotal: 50000,
    tax: 5000,
    totalAmount: 55000,
    items: {
      create: [
        {
          productId: product.id,
          quantity: 2,
          unitPrice: 25000,
          totalPrice: 50000,
        },
      ],
    },
  };
  const order = await prisma.retailOrder.create({ data: orderData });

  console.log(`Created test order: ${order.id}`);

  // 3. Check stock BEFORE
  const stockBefore = await prisma.stockLevel.findFirst({
    where: { tenantId, productId: product.id, locationId: store.id },
  });
  console.log(
    "Stock Before:",
    stockBefore ? stockBefore.onHand : "Not tracked (0)",
  );

  // 4. Run the newly refactored processPayment!
  console.log("--- Running processPayment ---");
  await repo.processPayment(tenantId, order.id, {
    amount: 55000,
    method: "cash",
  });
  console.log("--- processPayment SUCCESS ---");

  // 5. Verify Stock AFTER
  const stockAfter = await prisma.stockLevel.findFirst({
    where: { tenantId, productId: product.id, locationId: store.id },
  });
  console.log("Stock After:", stockAfter?.onHand);

  // 6. Verify Ledger AFTER
  const ledger = await prisma.journalEntry.findFirst({
    where: { tenantId, status: "POSTED" },
    orderBy: { createdAt: "desc" },
    include: { lines: true },
  });
  console.log("Latest Journal Entry:", JSON.stringify(ledger, null, 2));
}

main()
  .catch((e) => {
    console.error("FAILED WITH ERROR:", e);
  })
  .finally(() => prisma.$disconnect());
