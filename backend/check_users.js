const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.users.count();
  console.log(`Total users: ${count}`);
  const first = await prisma.users.findFirst();
  console.log('First user:', JSON.stringify(first, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
