const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const tenantId = "comp-demo-a";
  const store = await prisma.store.findFirst({ where: { tenantId } });

  if (!store) {
    console.log("Store not found");
    return;
  }

  try {
    const device = await prisma.pOSDevice.upsert({
      where: { id: "terminal-pos" },
      update: {},
      create: {
        id: "terminal-pos",
        tenantId,
        storeId: store.id,
        name: "Main POS Terminal",
        type: "terminal",
        isActive: true,
      },
    });
    console.log("Device seeded:", device.id);
  } catch (e) {
    console.log("Tried pOSDevice:", e.message);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
