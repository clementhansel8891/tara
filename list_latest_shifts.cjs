const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shifts = await prisma.retail_shifts.findMany({
    orderBy: { start_time: 'desc' },
    take: 5
  });
  console.log('--- LATEST SHIFTS ---');
  console.log(JSON.stringify(shifts, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
