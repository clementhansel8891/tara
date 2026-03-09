const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const status = await prisma.adminModuleStatus.findMany();
  console.log(JSON.stringify(status, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
