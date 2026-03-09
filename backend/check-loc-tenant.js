const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const loc = await prisma.location.findUnique({
    where: { id: "loc-bali" },
  });
  console.log("Location loc-bali:", JSON.stringify(loc, null, 2));

  if (loc) {
    const depts = await prisma.department.findMany({
      where: { tenantId: loc.tenantId },
    });
    console.log(
      `Departments for tenant ${loc.tenantId}:`,
      JSON.stringify(depts, null, 2),
    );
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
