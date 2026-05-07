const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.companies.findUnique({
    where: { id: 'default' }
  });
  console.log('Company "default":', company);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
