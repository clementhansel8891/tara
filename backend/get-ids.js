const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.company.findMany();
  const l = await prisma.location.findMany();
  console.log("--- COMPANIES ---");
  console.log(JSON.stringify(c, null, 2));
  console.log("--- LOCATIONS ---");
  console.log(JSON.stringify(l, null, 2));
}

main().finally(() => prisma.$disconnect());
