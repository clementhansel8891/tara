const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const levels = await prisma.stock_levels.findMany();
  console.log("STOCK LEVELS:");
  levels.forEach(l => {
    console.log(`L: ${l.location_id}, P: ${l.product_id}, D: ${l.department_id}, Qty: ${l.on_hand.toString()}`);
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
