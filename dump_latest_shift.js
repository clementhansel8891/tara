const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shifts = await prisma.retail_shifts.findMany({
    orderBy: { created_at: 'desc' },
    take: 1
  });
  if (shifts.length > 0) {
    console.log(JSON.stringify(shifts[0], null, 2));
  } else {
    console.log('No shifts found');
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
