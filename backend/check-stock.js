const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const stockLevels = await prisma.stockLevel.findMany({
    where: {
      locationId: "loc-bali",
      productId: "var-8c64991b",
    },
  });
  console.log("StockLevels found:", JSON.stringify(stockLevels, null, 2));

  // Also check if there are any departments at all
  const departments = await prisma.department.findMany({
    where: { tenantId: "04bbc0e0-213d-4af4-9ce8-0e4674a58a90" }, // The tenant ID from logs
  });
  console.log("Departments found:", JSON.stringify(departments, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
