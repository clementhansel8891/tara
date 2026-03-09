const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const tenantId = "04bbc0e0-213d-4af4-9ce8-0e4674a58a90";
  const stock = await prisma.stockLevel.findMany({
    where: { tenantId },
  });
  console.log("Stock for tenant:", JSON.stringify(stock, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
