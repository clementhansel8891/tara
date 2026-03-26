import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAll() {
  console.log('--- [STAGE 1] Cleaning & Seeding ---');
  const tenantId = '9b531c3f-7874-4cab-8687-e6c92ddd75f1';
  const fiscalPeriodId = 'FY2026-P1';
  const accountId = 'CASH-001';

  console.log('--- [STAGE 0] Checking SQL Constraints ---');
  const fks: any = await prisma.$queryRawUnsafe(`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'finance_journal_entries'::regclass
  `);
  fks.forEach((fk: any) => console.log(`- ${fk.conname}: ${fk.pg_get_constraintdef}`));

  await prisma.$executeRaw`TRUNCATE TABLE "finance_account_balances" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_journal_entries" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_journal_lines" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_ledger_postings" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "finance_ledger_event_log" CASCADE`;

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

  console.log('--- [STAGE 2] Immediate Verification ---');
  const period = await prisma.fiscalPeriod.findUnique({ where: { id: fiscalPeriodId } });
  console.log('Period Found:', !!period, period?.id);
  
  if (!period) throw new Error('CRITICAL: FiscalPeriod failed to persist!');

  console.log('--- [STAGE 3] Creating Journal Entry Test ---');
  try {
    const entry = await prisma.journalEntry.create({
      data: {
        id: 'TEST-ENTRY-001',
        tenantId: tenantId,
        companyId: tenantId,
        fiscalPeriodId: fiscalPeriodId,
        ref: 'REF-001',
        description: 'Test Creation',
        postingDate: new Date(),
        status: 'POSTED'
      }
    });
    console.log('✅ Journal Entry Created Successfully:', entry.id);
  } catch (e) {
    console.error('❌ Journal Entry Creation FAILED:', e);
  }
}

runAll().finally(() => prisma.$disconnect());
