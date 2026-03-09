const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { code: "ZENVIX" },
  });
  console.log("Company ID:", company.id);

  const status = await prisma.adminModuleStatus.findFirst({
    where: { tenantId: company.id, moduleKey: "retail" },
  });
  console.log("Module Status:", JSON.stringify(status, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
