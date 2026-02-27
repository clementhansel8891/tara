require("dotenv").config({ path: "../.env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkData() {
  const tenants = ["03bbc0e0-213d-4af4-9ce8-0e4674a58a8f", "comp-demo-a"];

  for (const tid of tenants) {
    const productCount = await prisma.product.count({
      where: { tenantId: tid },
    });
    console.log(`Tenant ${tid}: ${productCount} products`);
  }

  await prisma.$disconnect();
}

checkData();
