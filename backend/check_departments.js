const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.departments.count();
  console.log(`Total departments: ${count}`);
  const first = await prisma.departments.findFirst();
  console.log('First department:', JSON.stringify(first, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
