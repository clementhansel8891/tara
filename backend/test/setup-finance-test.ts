import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setup() {
  console.log('--- Setting up Finance Test Data ---');
  
  const tenantId = 'prod-tenant';
  const fiscalPeriodId = 'FY2026-P1';
  const accountId = 'CASH-001';

  // 0. Clean slate
  await prisma.$executeRaw`TRUNCATE TABLE "finance_account_balances" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_journal_entries" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_journal_lines" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_ledger_postings" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_ledger_event_log" CASCADE`;

  // 1. Ensure Company exists
  await prisma.company.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Production Test Tenant',
      code: 'PROD-T1'
    }
  });

  // 2. Ensure Fiscal Period exists
  await prisma.fiscalPeriod.upsert({
    where: { id: fiscalPeriodId },
    update: { tenantId },
    create: {
      id: fiscalPeriodId,
      tenantId: tenantId,
      name: 'FY 2026 Period 1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      status: 'OPEN'
    }
  });

  // 3. Ensure Chart of Account exists
  await prisma.chartOfAccount.upsert({
    where: { id: accountId },
    update: { tenantId },
    create: {
      id: accountId,
      tenantId: tenantId,
      code: '1001',
      name: 'Cash at Bank (Test)',
      type: 'ASSET',
      status: 'ACTIVE'
    }
  });

  // 4. Ensure Posting Rules exist for SALES.INVOICE.POSTED
  const existingRule = await prisma.ledgerPostingRule.findUnique({
    where: {
      tenantId_companyId_eventType: {
        tenantId,
        companyId: tenantId,
        eventType: 'SALES.INVOICE.POSTED'
      }
    }
  });

  if (!existingRule) {
    await prisma.ledgerPostingRule.create({
      data: {
        tenantId,
        companyId: tenantId,
        eventType: 'SALES.INVOICE.POSTED',
        description: 'Test Sales Rule',
        status: 'ACTIVE',
        lines: {
          create: [
            {
              accountId: 'CASH-001',
              side: 'DEBIT',
              amountExpression: '{{amount}}',
            }
          ]
        }
      }
    });
  }

  console.log('✅ Test Data Setup Complete.');
  console.log('Final Counts:', {
    companies: await prisma.company.count(),
    periods: await prisma.fiscalPeriod.count(),
    accounts: await prisma.chartOfAccount.count(),
    rules: await prisma.ledgerPostingRule.count({ where: { tenantId } })
  });
}

setup()
  .catch(e => {
    console.error('Setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
