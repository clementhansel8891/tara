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
    
    // 1. Get user details
    const user = await prodPrisma.users.findUnique({
      where: { id: "f8591842-777d-47b0-8ac4-f10fff1008dd" }
    });
    console.log("User details:", user);

    // 2. Get locations for tenant
    const locations = await prodPrisma.locations.findMany({
      where: { tenant_id: tenantId }
    });
    console.log("Locations in tenant:", locations.map(l => ({ id: l.id, name: l.name, code: l.code })));

    // 3. Get employees for tenant
    const employees = await prodPrisma.employees.findMany({
      where: { tenant_id: tenantId }
    });
    console.log("Employees in tenant:", employees.map(e => ({ id: e.id, email: e.email, location_id: e.location_id })));

    // 4. See if location 8cc63392-2c19-4823-b6a0-0baa4eb2205e exists at all in db
    const targetLoc = await prodPrisma.locations.findUnique({
      where: { id: "8cc63392-2c19-4823-b6a0-0baa4eb2205e" }
    });
    console.log("Target location exists details:", targetLoc);

  } catch (err: any) {
    console.error("Error running script:", err.message);
  } finally {
    await prodPrisma.$disconnect();
  }
}

run();
