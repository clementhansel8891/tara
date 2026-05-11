import { PrismaClient } from '@prisma/client';

// Hardcode the connection string to try port 5433
const databaseUrl = "postgresql://zenvix:zenvix_secure_2026!@localhost:5433/zenvix_prod?schema=public";
process.env.DATABASE_URL = databaseUrl;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log("Connecting to:", databaseUrl);
  try {
    console.log("--- Tenants ---");
    const tenants = await prisma.companies.findMany({
      select: { id: true, name: true, code: true }
    });
    console.table(tenants);

    console.log("--- ALL Locations ---");
    const allLocations = await prisma.locations.findMany({
      select: { id: true, name: true, code: true, type: true, tenant_id: true }
    });
    console.table(allLocations);

    console.log("--- ALL Stores ---");
    const allStores = await prisma.stores.findMany({
      select: { id: true, name: true, code: true, location_id: true, tenant_id: true }
    });
    console.table(allStores);
  } catch (err) {
    console.error("Failed to query DB:", err);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
