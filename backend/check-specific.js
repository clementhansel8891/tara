const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const stockLevels = await prisma.stockLevel.findMany({
    take: 5,
    select: {
      id: true,
      locationId: true,
      departmentId: true,
      productId: true,
    },
  });
  console.log("Sample StockLevels:", JSON.stringify(stockLevels, null, 2));

  const depts = await prisma.department.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
  console.log("Sample Departments:", JSON.stringify(depts, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
