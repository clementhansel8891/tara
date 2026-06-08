import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
  console.log(JSON.stringify(keys, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
