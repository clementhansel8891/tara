import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenantId = "comp-demo-a";
  console.log(`Checking products for tenant: ${tenantId}`);

  const total = await prisma.product.count({ where: { tenantId } });
  console.log(`Total products: ${total}`);

  const sample = await prisma.product.findMany({
    where: { tenantId },
    take: 5,
    include: { category: true },
  });

  console.log("Sample Products:");
  console.log(JSON.stringify(sample, null, 2));

  const bagSearch = await prisma.product.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: "bag", mode: "insensitive" } },
        { sku: { contains: "bag", mode: "insensitive" } },
      ],
    },
  });
  console.log(`Products matching 'bag': ${bagSearch.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
