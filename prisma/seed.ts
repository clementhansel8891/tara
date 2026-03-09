import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  console.log("Empty seed.ts - skipping default seeding.");
}
main().finally(async () => {
  await prisma.$disconnect();
});
