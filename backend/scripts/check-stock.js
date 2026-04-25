const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const levels = await prisma.stock_levels.findMany();
  console.log("STOCK LEVELS:");
  console.dir(levels, { depth: null });
  
  const movements = await prisma.stock_movements.findMany();
  console.log("MOVEMENTS:");
  console.dir(movements, { depth: null });
  
  await prisma.$disconnect();
}

check().catch(console.error);
