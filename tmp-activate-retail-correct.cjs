const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenantId = "04bbc0e0-213d-4af4-9ce8-0e4674a58a90";
  const moduleKey = "retail";

  const status = await prisma.adminModuleStatus.upsert({
    where: {
      tenantId_moduleKey: {
        tenantId,
        moduleKey,
      },
    },
    update: { enabled: true, updatedBy: "dev" },
    create: {
      tenantId,
      moduleKey,
      enabled: true,
      updatedBy: "dev",
    },
  });
  console.log("Module status updated:", JSON.stringify(status, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
