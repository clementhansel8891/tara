const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const tenantId = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";
  console.log(`Checking stock levels for tenant: ${tenantId}`);

  const count = await prisma.stockLevel.count({ where: { tenantId } });
  console.log(`Total stock levels: ${count}`);

  const sample = await prisma.stockLevel.findMany({
    where: { tenantId },
    take: 5,
    include: { product: { select: { name: true, sku: true } } },
  });
  console.log("Sample Stock Levels:");
  console.log(JSON.stringify(sample, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
