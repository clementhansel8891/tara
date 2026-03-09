const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenantId = "comp-demo-a";
  console.log(
    `Deep cleanup of products, categories, and dependencies for tenant: ${tenantId}`,
  );

  // 1. Projections
  await prisma.productProjection.deleteMany({ where: { tenantId } });

  // 2. Retail related
  await prisma.retailOrderItem.deleteMany({ where: { order: { tenantId } } });
  await prisma.retailCartItem.deleteMany({ where: { cart: { tenantId } } });
  await prisma.retailWishlistItem.deleteMany({
    where: { wishlist: { tenantId } },
  });

  // 3. Inventory related
  await prisma.stockLevel.deleteMany({ where: { tenantId } });
  await prisma.stockMovement.deleteMany({ where: { tenantId } });
  await prisma.inventoryAdjustment.deleteMany({ where: { tenantId } });
  await prisma.inventoryPoolStock.deleteMany({
    where: { product: { tenantId } },
  });

  // 4. Products
  await prisma.product.deleteMany({ where: { tenantId } });

  // 5. Categories (Hierarchy handled by nullifying parentId first)
  await prisma.productCategory.updateMany({
    where: { tenantId },
    data: { parentId: null },
  });
  await prisma.productCategory.deleteMany({ where: { tenantId } });

  console.log("Cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
