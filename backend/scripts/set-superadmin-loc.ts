import { PrismaClient } from "@prisma/client";

async function set_default_location() {
  const prisma = new PrismaClient();
  const userId = "usr-superadmin-001";
  const tenantId = "comp-demo-a";
  const locationId = "loc-bali-demo";

  // Check if store exists
  const store = await prisma.store.findFirst({
    where: { id: "sto-bali-demo", tenantId: tenantId },
  });

  if (!store) {
    console.error(
      "Bali store doesn't exist for this tenant. Cannot set default location.",
    );
    await prisma.$disconnect();
    return;
  }

  // Update user company default location
  await prisma.userCompany.update({
    where: { userId_tenantId: { userId, tenantId } },
    data: { locationId: "loc-bali-demo" },
  });

  console.log(
    `Updated usr-superadmin-001 default location to loc-bali-demo for tenant ${tenantId}.`,
  );
  await prisma.$disconnect();
}

set_default_location().catch(console.error);
