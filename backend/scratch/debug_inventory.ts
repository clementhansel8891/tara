import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.locations.findMany({
    select: { id: true, name: true, code: true }
  });
  console.log('--- LOCATIONS ---');
  console.table(locations);

  const itemsCount = await prisma.item_masters.count();
  console.log('--- ITEM MASTERS ---');
  console.log(`Total items: ${itemsCount}`);

  const stockLevelsCount = await prisma.stock_levels.count();
  console.log(`Total stock levels: ${stockLevelsCount}`);

  if (stockLevelsCount > 0) {
    const stockLevels = await prisma.stock_levels.findMany({
      take: 20,
      select: { location_id: true, product_id: true, on_hand: true }
    });
    console.log('--- STOCK LEVELS (First 20) ---');
    console.table(stockLevels);
  }

  const auditCyclesCount = await prisma.inventory_audit_cycles.count();
  console.log(`Total audit cycles: ${auditCyclesCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
