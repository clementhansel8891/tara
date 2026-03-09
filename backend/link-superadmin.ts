import { PrismaClient } from "@prisma/client";

async function link() {
  const prisma = new PrismaClient();
  const userId = "usr-superadmin-001";
  const tenantId = "comp-demo-a";

  // Check if they already have access
  const existing = await prisma.userCompany.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });

  // Remove default status from all existing companies
  await prisma.userCompany.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  if (existing) {
    // Make it default
    await prisma.userCompany.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { isDefault: true, role: "SUPERADMIN" },
    });
    console.log("Updated existing link to default.");
  } else {
    // Create new link
    await prisma.userCompany.create({
      data: {
        userId,
        tenantId,
        role: "SUPERADMIN",
        isDefault: true,
      },
    });
    console.log("Created new link to comp-demo-a and set as default.");
  }

  await prisma.$disconnect();
}

link().catch(console.error);
