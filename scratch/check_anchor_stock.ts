import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const location = await prisma.locations.findFirst({
    where: { name: { contains: 'ANCHOR', mode: 'insensitive' } }
  });
  console.log('Location:', location);

  if (location) {
    const stockLevels = await prisma.stock_levels.findMany({
      where: { location_id: location.id },
      include: { item: true },
      take: 5
    });
    console.log('Total Stock Levels for ANCHOR:', await prisma.stock_levels.count({ where: { location_id: location.id } }));
    console.log('Sample Stock Levels:', stockLevels);
    
    // Also check total items in the system
    console.log('Total items in system:', await prisma.item_masters.count({ where: { deleted_at: null } }));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
