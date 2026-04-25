import { PrismaService } from "./src/persistence/prisma.service";
import { RetailSeeder } from "./src/core/retail/seeders/retail.seeder";

async function run() {
  console.log("Initializing Prisma and RetailSeeder...");
  const prisma = new PrismaService();
  const seeder = new RetailSeeder(prisma);

  try {
    await seeder.seed();
    console.log("Retail check/seed complete.");
  } catch (error) {
    console.error("Error during seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
