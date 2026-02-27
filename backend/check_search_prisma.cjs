require("dotenv").config({ path: "../.env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSearch() {
  const tenantId = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";
  const q = "bag";

  const where = {
    tenantId: tenantId,
    status: "active",
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  };

  const count = await prisma.product.count({ where });
  console.log(`Matching products for 'bag': ${count}`);

  const sample = await prisma.product.findMany({
    where,
    take: 1,
  });
  if (sample.length > 0) {
    console.log(`Found: ${sample[0].name}`);
  }

  await prisma.$disconnect();
}

checkSearch();
