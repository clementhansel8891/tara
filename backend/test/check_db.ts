const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const tenantId = '9b531c3f-7874-4cab-8687-e6c92ddd75f1';
  const company = await prisma.company.findUnique({ where: { id: tenantId } });
  console.log('Target Company:', company);
  const period = await prisma.fiscalPeriod.findUnique({ where: { id: 'FY2026-P1' } });
  console.log('Target Period:', period);
  const balances = await prisma.accountBalance.findMany({ where: { tenantId } });
  console.log('Target Balances:', balances.length);
}
check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
