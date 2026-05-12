import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING INVENTORY DATA SANITIZATION ---');

  // 1. Get all locations
  const locations = await prisma.locations.findMany();
  const locMapByCode = new Map(locations.map(l => [l.code, l.id]));
  const locMapByName = new Map(locations.map(l => [l.name, l.id]));

  console.log('Available Locations:');
  locations.forEach(l => console.log(`- ${l.name} (Code: ${l.code}, ID: ${l.id})`));

  // 2. Identify and fix bad stock_levels
  // We're looking for stock_levels where location_id is NOT a UUID or doesn't exist in locations table
  const allStockLevels = await prisma.stock_levels.findMany({
    select: { id: true, location_id: true, product_id: true }
  });

  const validLocationIds = new Set(locations.map(l => l.id));
  const badStockLevels = allStockLevels.filter(sl => !validLocationIds.has(sl.location_id));

  console.log(`Found ${badStockLevels.length} stock levels with invalid location_id.`);

  for (const sl of badStockLevels) {
    console.log(`Fixing stock level ${sl.id} (Location: ${sl.location_id})`);
    
    // Try to resolve correct location id
    let correctId = locMapByCode.get(sl.location_id) || locMapByName.get(sl.location_id);
    
    // Handle special cases mentioned by user
    if (!correctId) {
      if (sl.location_id === 'SS') correctId = locMapByCode.get('BS-SS-LOC');
      if (sl.location_id === 'ANCHOR') correctId = locMapByCode.get('BS-ANC-LOC');
    }

    if (correctId) {
      console.log(`Mapped ${sl.location_id} -> ${correctId}`);
      // Check if a stock level already exists for the correct ID and product
      const existing = await prisma.stock_levels.findFirst({
        where: { location_id: correctId, product_id: sl.product_id }
      });

      if (existing) {
        // Merge them
        const source = await prisma.stock_levels.findUnique({ where: { id: sl.id } });
        await prisma.stock_levels.update({
          where: { id: existing.id },
          data: {
            on_hand: Number(existing.on_hand) + Number(source?.on_hand || 0),
            available: Number(existing.available) + Number(source?.available || 0),
          }
        });
        await prisma.stock_levels.delete({ where: { id: sl.id } });
        console.log(`Merged ${sl.id} into ${existing.id}`);
      } else {
        // Just update the location_id
        await prisma.stock_levels.update({
          where: { id: sl.id },
          data: { location_id: correctId }
        });
        console.log(`Updated location_id for ${sl.id}`);
      }
    } else {
      console.warn(`Could not resolve location for ${sl.location_id}. Skipping.`);
    }
  }

  // 3. Fix Audit Cycles that might have bad location_code
  const auditCycles = await prisma.inventory_audit_cycles.findMany();
  for (const cycle of auditCycles) {
    let correctId = locMapByCode.get(cycle.location_code) || locMapByName.get(cycle.location_code);
    if (!correctId) {
       if (cycle.location_code === 'SS') correctId = locMapByCode.get('BS-SS-LOC');
       if (cycle.location_code === 'ANCHOR') correctId = locMapByCode.get('BS-ANC-LOC');
    }

    if (correctId && correctId !== cycle.location_code) {
      await prisma.inventory_audit_cycles.update({
        where: { id: cycle.id },
        data: { location_code: correctId }
      });
      console.log(`Updated Audit Cycle ${cycle.id} location_code: ${cycle.location_code} -> ${correctId}`);
    }
  }

  console.log('--- SANITIZATION COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
