const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const stores = await prisma.stores.findMany();
  console.log("STORES:");
  stores.forEach(s => {
    console.log(`Store ID: ${s.id}, Location ID: ${s.location_id}, Name: ${s.name}`);
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
