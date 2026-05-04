const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shiftId = 'a910d816-41aa-4cad-a0c9-99477df56307';
  const s = await prisma.retail_shifts.findUnique({ where: { id: shiftId } });
  console.log('--- SHIFT DATA ---');
  console.log(JSON.stringify(s, null, 2));
  
  const o = await prisma.retail_orders.findMany({ where: { shift_id: shiftId } });
  console.log('--- ORDERS DATA ---');
  console.log(JSON.stringify(o, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
