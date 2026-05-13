const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAuditSync() {
  console.log('--- DEBUGGING AUDIT SYNC ---');
  
  // 1. Get latest completed audit cycles
  const cycles = await prisma.inventory_audit_cycles.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { created_at: 'desc' },
    take: 5
  });

  for (const cycle of cycles) {
    console.log(`Cycle ID: ${cycle.id} | Location: ${cycle.location_code} | Counted: ${cycle.counted_value}`);
    
    // 2. Check audit items
    const items = await prisma.inventory_audit_items.findMany({
      where: { cycle_id: cycle.id }
    });
    console.log(`- Audit Items: ${items.length}`);

    // 3. Check if stock levels exist for these items at this location
    for (const item of items) {
       const level = await prisma.stock_levels.findFirst({
         where: {
           product_id: item.product_id || item.id, // check both fields if schema varies
           location_id: cycle.location_code
         }
       });
       if (level) {
         console.log(`  - Found stock level for SKU ${item.sku}: ${level.on_hand}`);
       } else {
         console.log(`  - MISSING stock level for SKU ${item.sku} at ${cycle.location_code}`);
       }
    }
  }

  // 4. Check items for SS
  const ssLocations = await prisma.locations.findMany({
    where: { code: 'BS-SS-LOC' }
  });
  console.log(`SS Locations found: ${ssLocations.length}`);
  for (const loc of ssLocations) {
    const levels = await prisma.stock_levels.count({ where: { location_id: loc.id } });
    console.log(`Location ${loc.id} (${loc.name}) has ${levels} stock levels.`);
  }

  await prisma.$disconnect();
}

debugAuditSync();
