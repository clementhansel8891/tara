import { PrismaClient } from "@prisma/client";

async function check() {
  const prisma = new PrismaClient();

  const superadmin = await prisma.user.findUnique({
    where: { email: "superadmin@zenvix.com" },
    include: { userCompanies: { include: { company: true } } },
  });

  console.log("Superadmin user:", JSON.stringify(superadmin, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
