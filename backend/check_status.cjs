require("dotenv").config({ path: "../.env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkData() {
  const tenantId = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";

  const productCount = await prisma.product.count({
    where: { tenantId },
  });
  console.log(`Total products for tenant: ${productCount}`);

  const activeCount = await prisma.product.count({
    where: { tenantId, status: "active" },
  });
  console.log(`Active products for tenant: ${activeCount}`);

  const sampleProducts = await prisma.product.findMany({
    where: { tenantId },
    take: 5,
  });
  console.log(
    "Sample product statuses:",
    sampleProducts.map((p) => p.status),
  );

  const stockLevelCount = await prisma.stockLevel.count({
    where: { tenantId },
  });
  console.log(`Total stockLevel records: ${stockLevelCount}`);

  await prisma.$disconnect();
}

checkData();
