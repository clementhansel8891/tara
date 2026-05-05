const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.retail_shifts.count();
  console.log(`Total shifts: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
