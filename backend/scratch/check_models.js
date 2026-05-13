const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const keys = Object.keys(prisma);
  console.log('Audit Cycles Model:', keys.find(k => k.includes('audit_cycles')));
  console.log('Audit Items Model:', keys.find(k => k.includes('audit_items')));
  console.log('Stock Levels Model:', keys.find(k => k.includes('stock_levels')));
  console.log('Item Masters Model:', keys.find(k => k.includes('item_masters')));
  prisma.$disconnect();
}
check();
