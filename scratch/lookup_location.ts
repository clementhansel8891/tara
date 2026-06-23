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
    // 1. Search for location 8cc63392-2c19-4823-b6a0-0baa4eb2205e in all tenants
    const anyLocation = await prodPrisma.locations.findFirst({
      where: { id: "8cc63392-2c19-4823-b6a0-0baa4eb2205e" }
    });
    console.log("Location lookup in all tenants:", anyLocation);

    // 2. Search for any employees with user_id = f8591842-777d-47b0-8ac4-f10fff1008dd
    const empByUserId = await prodPrisma.employees.findFirst({
      where: { user_id: "f8591842-777d-47b0-8ac4-f10fff1008dd" }
    });
    console.log("Employee with user_id = f8591842-777d-47b0-8ac4-f10fff1008dd:", empByUserId);

    // 3. Let's see if the user's email has a corresponding employee record and if it has user_id set
    const empByEmail = await prodPrisma.employees.findFirst({
      where: { email: "bambusilverkedonganan@gmail.com" }
    });
    console.log("Employee with email = bambusilverkedonganan@gmail.com:", empByEmail);

  } catch (err: any) {
    console.error("Error running script:", err.message);
  } finally {
    await prodPrisma.$disconnect();
  }
}

run();
