import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("--- VERIFICATION REPORT ---");

  const companies = await prisma.company.findMany({
    select: { id: true, name: true, code: true },
  });
  console.log("Companies:", JSON.stringify(companies, null, 2));

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  console.log("Users:", JSON.stringify(users, null, 2));

  const locations = await prisma.location.findMany({
    select: { id: true, name: true, tenantId: true },
  });
  console.log("Locations:", JSON.stringify(locations, null, 2));

  const stores = await prisma.store.findMany({
    select: { id: true, name: true, tenantId: true },
  });
  console.log("Stores:", JSON.stringify(stores, null, 2));

  console.log("--------------------------");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
