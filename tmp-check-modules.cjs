const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const status = await prisma.adminModuleStatus.findMany({
    where: { tenantId: "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f" },
  });
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
