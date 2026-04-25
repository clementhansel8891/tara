import { PrismaClient } from "@prisma/client";

async function check() {
  const prisma = new PrismaClient();
  const tenantId = "comp-demo-a";

  console.log("--- Locations ---");
  const locs = await prisma.location.findMany({ where: { tenantId } });
  console.log(locs.map((l) => ({ id: l.id, name: l.name, type: l.type })));

  console.log("--- Stores ---");
  const stores = await prisma.store.findMany({ where: { tenantId } });
  console.log(
    stores.map((s) => ({ id: s.id, name: s.name, locationId: s.locationId })),
  );

  console.log("--- Products ---");
  const prods = await prisma.product.findMany({ where: { tenantId } });
  console.log(prods.map((p) => ({ id: p.id, name: p.name })));

  console.log("--- Stock Levels for Bali Store (loc-bali) ---");
  const stock = await prisma.stockLevel.findMany({
    where: { locationId: "loc-bali" },
  });
  console.log(stock.map((s) => ({ productId: s.productId, onHand: s.onHand })));

  console.log("--- Retail Orders ---");
  const orders = await prisma.retailOrder.findMany({ where: { tenantId } });
  console.log(
    `Found ${orders.length} orders. Sample of first 2:`,
    orders
      .slice(0, 2)
      .map((o) => ({ id: o.id, storeId: o.storeId, status: o.status })),
  );

  await prisma.$disconnect();
}

check().catch(console.error);
