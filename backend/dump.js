const { PrismaClient } = require("@prisma/client");
process.env.DATABASE_URL =
  "postgresql://zenvix:zenvix_dev_password@localhost:5433/zenvix_dev?schema=public";
const prisma = new PrismaClient();

async function main() {
  const tenantId = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";
  console.log("--- Inspecting Products for Tenant:", tenantId);

  const total = await prisma.product.count({ where: { tenantId } });
  console.log("Total products:", total);

  const productWithMetadata = await prisma.product.findFirst({
    where: { tenantId, name: { contains: "BAG" } },
    select: { id: true, name: true, metadata: true },
  });
  console.log(
    "Product Metadata:",
    JSON.stringify(productWithMetadata, null, 2),
  );

  const sample = await prisma.product.findMany({
    where: { tenantId },
    take: 5,
    select: { id: true, name: true, sku: true, barcode: true, status: true },
  });
  console.log("Sample:", JSON.stringify(sample, null, 2));

  const q = "BAG";
  const bagSearch = await prisma.product.findMany({
    where: {
      tenantId,
      status: "active",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ],
    },
  });
  console.log(`Matching 'BAG' (active):`, bagSearch.length);
  if (bagSearch.length > 0) {
    console.log("First match:", JSON.stringify(bagSearch[0], null, 2));
  }

  const anyBag = await prisma.product.findMany({
    where: {
      tenantId,
      name: { contains: "BAG" },
    },
  });
  console.log(`Any match with 'BAG' (case-sensitive):`, anyBag.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
