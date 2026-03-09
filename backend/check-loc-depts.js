const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const tenantId = "04bbc0e0-213d-4af4-9ce8-0e4674a58a90";

  const location = await prisma.location.findFirst({
    where: {
      OR: [{ id: "loc-bali" }, { code: "bali" }],
      tenantId: tenantId,
    },
  });
  console.log("Location bali:", JSON.stringify(location, null, 2));

  const depts = await prisma.department.findMany({
    where: { tenantId: tenantId },
  });
  console.log("All departments for tenant:", JSON.stringify(depts, null, 2));

  // If no loc-bali, find all locations
  if (!location) {
    const allLocs = await prisma.location.findMany({ where: { tenantId } });
    console.log("All locations for tenant:", JSON.stringify(allLocs, null, 2));
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
