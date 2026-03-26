import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const company = await prisma.company.findFirst();
    if (company) {
      console.log(`VALID_TENANT_ID=${company.id}`);
    } else {
      console.log('NO_COMPANY_FOUND');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
