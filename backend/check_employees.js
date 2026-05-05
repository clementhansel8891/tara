const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.employees.count();
  console.log(`Total employees: ${count}`);
  const first = await prisma.employees.findFirst();
  console.log('First employee:', JSON.stringify(first, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
