
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  
  console.log("Listing all users...");
  const users = await prisma.users.findMany({
    select: { email: true, tenant_id: true }
  });
  
  console.log(`Total users: ${users.length}`);
  users.forEach(u => console.log(`- ${u.email} (Tenant: ${u.tenant_id})`));
  
  await prisma.$disconnect();
}

main().catch(console.error);
