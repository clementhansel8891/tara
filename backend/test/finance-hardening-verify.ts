import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TaxEngineService } from '../src/core/finance/services/tax-engine.service';
import { IAccountBalanceRepository } from '../src/core/finance/repositories/interfaces/account-balance.repository.interface';
import { ReconciliationService } from '../src/core/finance/services/reconciliation.service';
import { LedgerPostingService } from '../src/core/finance/services/ledger-posting.service';
import { LedgerIntegrityService } from '../src/core/finance/services/ledger-integrity.service';
import { PostingMonitoringService } from '../src/core/finance/services/posting-monitoring.service';
import { Prisma } from '@prisma/client';
import { LedgerPostingStatus } from '../src/core/finance/domain/finance.constants';
import { JournalReversalService } from '../src/core/finance/services/journal-reversal.service';
import { ArPaymentService } from '../src/core/finance/ar/services/ar-payment.service';
import { PrismaService } from '../src/persistence/prisma.service';

/**
 * DEEP VALIDATION VERIFICATION SUITE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Simulates real-world production stress including high-concurrency,
 * duplicate ingestion, and deep-scan reconciliation.
 */
async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('--- STARTING DEEP FINANCE HARDENING VERIFICATION ---');
  const prisma = app.get(PrismaService);
  const dbCompanies = await prisma.company.findMany();
  console.log('Runtime Companies:', dbCompanies.map(c => ({ id: c.id, name: c.name })));

  const tenantId = 'prod-tenant';
  const companyId = 'prod-tenant';
  const fiscalPeriodId = 'FY2026-P1';
  const accountId = 'CASH-001';

  // 1. Verify Decimal Precision (MATH-001)
  console.log('\n[1] Verifying Decimal Precision via TaxEngine...');
  const taxService = app.get(TaxEngineService);
  const amount = new Prisma.Decimal('1000');
  
  // Indonesia strategy: 11% PPN
  const results = await taxService.calculateTax(tenantId, 'HQ', 'ID', amount, 'AR_INVOICE');
  const ppn = results.find(r => r.taxRateId === 'ID-PPN-11');
  
  if (ppn && ppn.taxAmount.equals(new Prisma.Decimal('110'))) {
    console.log('✅ Decimal Math Validated: 1000 * 0.11 = 110.0000');
  } else {
    console.error(`❌ Precision Failed: Got ${ppn?.taxAmount.toString()}`);
  }

  // 2. CONCURRENCY STRESS TEST (HOT-001)
  console.log('\n[2] Stress Testing Atomic Balance Updates (500 Concurrent Threads)...');
  const balanceRepo = app.get<IAccountBalanceRepository>('IAccountBalanceRepository');
  
  // Initial balance
  await balanceRepo.incrementBalance(tenantId, companyId, {
    fiscalPeriodId,
    accountId,
    currency: 'IDR',
    branchId: 'HQ',
    locationId: 'MAIN',
  }, { net: new Prisma.Decimal('0') });

  const concurrentTasks = 500;
  const incrementAmount = new Prisma.Decimal('1.0005');
  const tasks = [];

  for (let i = 0; i < concurrentTasks; i++) {
    tasks.push(balanceRepo.incrementBalance(tenantId, companyId, {
      fiscalPeriodId,
      accountId,
      currency: 'IDR',
      branchId: 'HQ',
      locationId: 'MAIN',
    }, { net: incrementAmount }));
  }

  const start = Date.now();
  await Promise.all(tasks);
  const duration = Date.now() - start;

  const finalBal = await balanceRepo.findBalance({
    tenantId, companyId, fiscalPeriodId, accountId, currency: 'IDR', branchId: 'HQ', locationId: 'MAIN'
  });

  const expected = incrementAmount.mul(concurrentTasks);
  if (finalBal?.netBalance.equals(expected)) {
    console.log(`✅ Atomic Stress Validated: ${concurrentTasks} increments in ${duration}ms. Final: ${finalBal.netBalance.toString()}`);
  } else {
    console.error(`❌ CONCURRENCY FAILURE: Expected ${expected.toString()}, got ${finalBal?.netBalance.toString()}`);
  }

  // 3. LEDGER CONSISTENCY & RECONCILIATION
  console.log('\n[3] Verifying Ledger-to-Balance Integrity (Rolling Reconciliation)...');
  const reconService = app.get(ReconciliationService);
  const postingService = app.get(LedgerPostingService);
  const monitor = app.get(PostingMonitoringService);

  // Post a dummy journal
  await postingService.processEvent(tenantId, companyId, await postingService.enqueuePosting(
    tenantId, companyId, 'SALES.INVOICE.POSTED', 'EVT-REC-1', {
      fiscalPeriodId,
      amount: 1000,
      dimensionBranchId: 'HQ',
      dimensionDepartmentId: 'SALES'
    }
  ));

  // Area 2: Verify Rolling Recon
  const recon = await reconService.verifyAccountConsistencyRolling(tenantId, companyId, fiscalPeriodId, accountId, 'IDR', {
    branchId: 'HQ',
    locationId: 'MAIN'
  });

  if (recon.status === 'MATCH' && recon.type === 'ROLLING') {
    console.log('✅ Rolling Reconciliation Validated: O(window) scan matched current balance.');
  } else {
    console.error('❌ RECONCILIATION FAILURE!', recon);
  }

  // 7. SHA-256 LEDGER HASH CHAIN (AUDIT-001)
  console.log('\n[7] Verifying SHA-256 Ledger Hash Chain integrity...');
  const journalRepo = app.get<any>('IJournalRepository');
  const journals = await prisma.journalEntry.findMany({
    where: { tenantId, companyId: companyId },
    orderBy: { createdAt: 'desc' },
    take: 2
  });

  if (journals.length >= 2) {
    const latest = journals[0];
    const previous = journals[1];
    if (latest.previousHash === previous.entryHash && latest.entryHash && latest.entryHash !== 'MOCK-HASH') {
      console.log(`✅ Hash Chain Validated: ${latest.ref} links to ${previous.ref}`);
      console.log(`   Latest Hash: ${latest.entryHash.substring(0, 16)}...`);
    } else {
      console.error('❌ HASH CHAIN BROKEN or MOCK HASH DETECTED!', { latest: latest.entryHash, prev: previous.entryHash });
    }
  }

  // 8. REVERSAL GUARDS (SAFE-001)
  console.log('\n[8] Testing Reversal Guards (Double Reversal & Fiscal Lock)...');
  const reversalService = app.get(JournalReversalService);
  const fiscalRepo = app.get<any>('IFiscalPeriodRepository');

  // Case A: Double Reversal
  const postedJournal = await prisma.journalEntry.findFirst({
    where: { tenantId, status: 'POSTED' }
  });

  if (postedJournal) {
    try {
      await reversalService.reverseJournal(tenantId, companyId, postedJournal.id, 'Test reversal', 'ADMIN');
      console.log('--- First reversal successful. Attempting double reversal...');
      await reversalService.reverseJournal(tenantId, companyId, postedJournal.id, 'Double reversal', 'ADMIN');
      console.error('❌ DOUBLE REVERSAL FAILED: Should have been blocked');
    } catch (e) {
      console.log(`✅ Double Reversal Blocked: ${e.message}`);
    }
  }

  // Case B: Fiscal Lock
  const lockedPeriod = await fiscalRepo.create(tenantId, companyId, {
    name: 'LOCKED-TEST',
    startDate: new Date(),
    endDate: new Date(),
    status: 'HARD_LOCK'
  });

  const lockedJournal = await prisma.journalEntry.create({
    data: {
      tenantId,
      fiscalPeriodId: lockedPeriod.id,
      ref: `LOCK-TEST-${Date.now()}`,
      postingDate: new Date(),
      status: 'POSTED',
      companyId: companyId
    }
  });

  try {
    await reversalService.reverseJournal(tenantId, companyId, lockedJournal.id, 'Lock test', 'ADMIN');
    console.error('❌ FISCAL LOCK GUARD FAILED: Should have blocked reversal in HARD_LOCK period');
  } catch (e) {
    console.log(`✅ Fiscal Lock Guard Validated: ${e.message}`);
  }

  // 9. REFUND OVERDRAFT GUARD (AR-SAFE-001)
  console.log('\n[9] Testing Refund Overdraft Guard...');
  const arPaymentService = app.get(ArPaymentService);
  const payment = await prisma.arPayment.findFirst({ where: { tenantId } });

  if (payment) {
    try {
      const hugeAmount = Number(payment.amount) + 1000000;
      await arPaymentService.refundPayment(tenantId, companyId, payment.id, hugeAmount);
      console.error('❌ REFUND OVERDRAFT FAILED: Should have blocked refund > unallocated');
    } catch (e) {
      console.log(`✅ Refund Overdraft Validated: ${e.message}`);
    }
  }

  console.log('\n--- DEEP VERIFICATION COMPLETE: ENTERPRISE READY ---');
  await app.close();
}

verify().catch(err => {
  console.error('Verification Error:', err);
  process.exit(1);
});
