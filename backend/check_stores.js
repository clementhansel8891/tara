const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.stores.count();
  console.log(`Total stores: ${count}`);
  const first = await prisma.stores.findFirst();
  console.log('First store:', JSON.stringify(first, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
