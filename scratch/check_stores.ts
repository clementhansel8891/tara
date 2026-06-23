import { PrismaClient } from '@prisma/client';

async function run() {
  const prodPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://zenvix:zenvix_secure_2026!@150.109.15.108:5433/zenvix_prod?schema=public"
      }
    }
  });

  try {
    const tenantId = "tnt-3rlhko";
    
    // 1. Get all stores for tenant
    const stores = await prodPrisma.stores.findMany({
      where: { tenant_id: tenantId }
    });
    console.log("Stores in tenant:", stores.map(s => ({ id: s.id, name: s.name, location_id: s.location_id })));

    // 2. Search for any store with location_id = 8cc63392-2c19-4823-b6a0-0baa4eb2205e
    const storeWithLoc = await prodPrisma.stores.findFirst({
      where: { location_id: "8cc63392-2c19-4823-b6a0-0baa4eb2205e" }
    });
    console.log("Store with location_id 8cc63392-2c19-4823-b6a0-0baa4eb2205e:", storeWithLoc);

  } catch (err: any) {
    console.error("Error running script:", err.message);
  } finally {
    await prodPrisma.$disconnect();
  }
}

run();
