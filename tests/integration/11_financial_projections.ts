/**
 * PHASE 11 — Financial Projections & Safeguards Test Suite
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Verifies the production safeguards and high-performance read models.
 *
 * Test scenarios:
 *  11.1 eventIdempotencyTest          — atomic insert-first duplicate prevention
 *  11.2 fiscalPeriodLockTest          — HARD_LOCK validation
 *  11.3 projectionWorkerTest          — idempotent read model updates
 *  11.4 projectionRebuildTest         — streaming batch recovery
 *  11.5 financialSnapshotTest         — sequence-based checkpoints
 */

import { PrismaClient } from "@prisma/client";
import { LedgerPostingService } from "../../backend/src/core/finance/services/ledger-posting.service";
import { ProjectionRebuildService } from "../../backend/src/core/finance/services/projection-rebuild.service";
import { FinancialSnapshotService } from "../../backend/src/core/finance/services/financial-snapshot.service";
import { FinancialProjectionWorkerService } from "../../backend/src/core/finance/services/financial-projection-worker.service";
import { LedgerPostingStatus, FiscalPeriodStatus, PostingSide } from "../../backend/src/core/finance/domain/finance.constants";
import { LedgerPostingMockRepository } from "../../backend/src/core/finance/repositories/ledger-posting.mock.repository";
import { LedgerEventLogMockRepository } from "../../backend/src/core/finance/repositories/ledger-event-log.mock.repository";
import { TrialBalanceProjectionMockRepository } from "../../backend/src/core/finance/repositories/trial-balance-projection.mock.repository";
import { GeneralLedgerProjectionMockRepository } from "../../backend/src/core/finance/repositories/general-ledger-projection.mock.repository";
import { AccountStatementProjectionMockRepository } from "../../backend/src/core/finance/repositories/account-statement-projection.mock.repository";
import { LedgerProjectionCheckpointMockRepository } from "../../backend/src/core/finance/repositories/ledger-projection-checkpoint.mock.repository";
import { FiscalMockRepository } from "../../backend/src/core/finance/repositories/fiscal.mock.repository";
import { JournalMockRepository } from "../../backend/src/core/finance/repositories/journal.mock.repository";
import { AccountBalanceMockRepository } from "../../backend/src/core/finance/repositories/account-balance.mock.repository";
import { FinancialSnapshotMockRepository } from "../../backend/src/core/finance/repositories/financial-snapshot.mock.repository";
import { PostingContextFactory } from "../../backend/src/core/finance/domain/posting-context-factory";
import { MockUnitOfWork } from "../../backend/src/core/finance/repositories/uow.mock";

const prisma = new PrismaClient();

// ── Test reporter ─────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function PASS(label: string, detail?: string) {
  console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${label}`);
  if (detail) console.log(`    \x1b[2m${detail}\x1b[0m`);
  pass++;
}
function FAIL(label: string, detail?: string) {
  console.error(`  \x1b[31m✘ [FAIL]\x1b[0m ${label}`);
  if (detail) console.error(`    \x1b[2m${detail}\x1b[0m`);
  fail++;
}
function section(title: string) {
  console.log(`\n\x1b[1m${'━'.repeat(48)}\n  ${title}\n${'━'.repeat(48)}\x1b[0m`);
}

async function main() {
  console.log(`\x1b[1m${'━'.repeat(48)}`);
  console.log(`  PHASE: 11 — Financial Projections & Safeguards`);
  console.log(`${'━'.repeat(48)}\x1b[0m\n`);

  const baseTenantId = `safeguard-test-${Date.now()}`;

  // 1. Setup Mock Environment
  const eventLogRepo = new LedgerEventLogMockRepository();
  const ledgerRepo = new LedgerPostingMockRepository();
  const trialBalanceRepo = new TrialBalanceProjectionMockRepository();
  const glRepo = new GeneralLedgerProjectionMockRepository();
  const statementRepo = new AccountStatementProjectionMockRepository();
  const checkpointRepo = new LedgerProjectionCheckpointMockRepository();
  const fiscalRepo = new FiscalMockRepository();
  const journalRepo = new JournalMockRepository();
  const balanceRepo = new AccountBalanceMockRepository();
  const snapshotRepo = new FinancialSnapshotMockRepository();
  const uow = new MockUnitOfWork();

  const projectionWorker = new FinancialProjectionWorkerService(
    trialBalanceRepo,
    glRepo,
    statementRepo,
    checkpointRepo,
    journalRepo,
  );

  const postingService = new LedgerPostingService(
    ledgerRepo,       // 1. ledgerRepo
    journalRepo,      // 2. journalRepo
    balanceRepo,      // 3. balanceRepo
    { findRule: () => ({ lines: [] }) } as any, // 4. ruleRepo
    fiscalRepo,       // 5. fiscalRepo
    {} as any,        // 6. coaRepo
    eventLogRepo,     // 7. eventLogRepo
    uow,              // 8. uow
    { validate: () => ({ valid: true, errors: [] }) } as any, // 9. journalValidator
    {} as any,        // 10. dimensionValidator
    { validateDeltaBalance: () => ({ passed: true }), validatePreviousHashLink: () => ({ passed: true }) } as any, // 11. ledgerInvariant
    projectionWorker, // 12. projectionWorker
    {} as any,        // 13. auditService
  );

  const rebuildService = new ProjectionRebuildService(
    journalRepo,
    balanceRepo,
    trialBalanceRepo,
    glRepo,
    statementRepo,
    checkpointRepo,
    snapshotRepo,
  );

  const snapshotService = new FinancialSnapshotService(
    snapshotRepo,
    journalRepo,
    trialBalanceRepo,
    checkpointRepo,
  );

  // ── 11.1 eventIdempotencyTest ───────────────────────────────────────────
  {
    section("11.1 eventIdempotencyTest");
    try {
      const tenantId = `${baseTenantId}-11.1`;
      const sourceEventId = 'EVT-DUP-11';
      
      // Create initial posting
      const p1 = await ledgerRepo.createPosting(tenantId, {
        eventType: 'test.event',
        sourceEventId,
        payload: { fiscalPeriodId: 'P1' },
      });

      // Mock resolveRule and resolveFiscalPeriod to avoid errors
      (postingService as any).ruleRepo = { findRule: () => ({ lines: [] }) };
      (fiscalRepo as any).findById = () => ({ id: 'P1', status: FiscalPeriodStatus.OPEN });

      await postingService.processEvent(tenantId, p1.id);
      
      const log = await eventLogRepo.findBySourceEventId(tenantId, sourceEventId);
      if (log?.status === 'POSTED') {
        PASS("Log marked as POSTED after first processing");
      } else {
        FAIL("Log status incorrect", log?.status);
      }

      // Duplicate event
      const p2 = await ledgerRepo.createPosting(tenantId, {
        eventType: 'test.event',
        sourceEventId,
        payload: { fiscalPeriodId: 'P1' },
      });

      await postingService.processEvent(tenantId, p2.id);
      const p2After = await ledgerRepo.findById(tenantId, p2.id);
      
      if (p2After?.status === LedgerPostingStatus.COMPLETED) {
        PASS("Duplicate event skipped and marked COMPLETED");
      } else {
        FAIL("Duplicate event not handled correctly", p2After?.status);
      }
    } catch (err: any) {
      FAIL("11.1 threw unexpectedly", err.message);
    }
  }

  // ── 11.2 fiscalPeriodLockTest ───────────────────────────────────────────
  {
    section("11.2 fiscalPeriodLockTest");
    try {
      const tenantId = `${baseTenantId}-11.2`;
      const periodId = 'LOCKED-P';
      (fiscalRepo as any).findById = () => ({ id: periodId, status: FiscalPeriodStatus.HARD_LOCK });

      const p3 = await ledgerRepo.createPosting(tenantId, {
        eventType: 'test.event',
        sourceEventId: 'EVT-LOCK-11',
        payload: { fiscalPeriodId: periodId },
      });

      try {
        await postingService.processEvent(tenantId, p3.id);
        FAIL("Should have thrown FiscalPeriodLockedError");
      } catch (e: any) {
        if (e.name === 'FiscalPeriodLockedError' || e.message.includes('HARD LOCKED')) {
          PASS("FiscalPeriodLockedError thrown correctly", e.message);
        } else {
          FAIL("Wrong error thrown", e.message);
        }
      }
    } catch (err: any) {
      FAIL("11.2 threw unexpectedly", err.message);
    }
  }

  // ── 11.3 projectionWorkerTest ───────────────────────────────────────────
  {
    section("11.3 projectionWorkerTest");
    try {
      const tenantId = `${baseTenantId}-11.3`;
      const ctx = PostingContextFactory.issue(tenantId);
      const journalId = 'J-11-PROJ';
      
      // Create actual journal entries in the repo
      const entry = await journalRepo.createEntry(ctx, {
        fiscalPeriodId: 'P1',
        sourceEventId: 'EVT-PWT-11',
      });

      await journalRepo.createLines(ctx, entry.id, [
        { accountId: 'CASH', side: PostingSide.DEBIT, amount: 1000 },
        { accountId: 'REV', side: PostingSide.CREDIT, amount: 1000 },
      ]);

      await projectionWorker.onJournalPosted({
        tenantId,
        journalId: entry.id,
        ledgerSequence: entry.ledgerSequence,
        postingDate: new Date(),
      });

      const tb = await trialBalanceRepo.getBalance(tenantId, 'CASH');
      if (tb?.balance === 1000) {
        PASS("Trial Balance updated correctly", "Balance: 1000");
      } else {
        FAIL("Trial Balance update failed", `Got: ${tb?.balance}`);
      }

      const checkpoint = await checkpointRepo.getCheckpoint(tenantId, 'ALL_PROJECTIONS');
      if (checkpoint === entry.ledgerSequence) {
        PASS(`Projection checkpoint updated to ${entry.ledgerSequence}`);
      } else {
        FAIL("Checkpoint update failed", `Got: ${checkpoint}`);
      }

      // Test Idempotency
      await projectionWorker.onJournalPosted({
        tenantId,
        journalId: entry.id,
        ledgerSequence: entry.ledgerSequence,
        postingDate: new Date(),
      });
      const tbAfter = await trialBalanceRepo.getBalance(tenantId, 'CASH');
      if (tbAfter?.balance === 1000) {
        PASS("Worker idempotency verified (balance stayed at 1000)");
      } else {
        FAIL("Worker idempotency failed (balance double-counted)", `Got: ${tbAfter?.balance}`);
      }
    } catch (err: any) {
      FAIL("11.3 threw unexpectedly", err.message);
    }
  }

  // ── 11.4 projectionRebuildTest ─────────────────────────────────────────
  {
    section("11.4 projectionRebuildTest");
    const tenantId = `${baseTenantId}-11.4`;
    const originalFindRange = journalRepo.findBySequenceRange.bind(journalRepo);
    const originalFindLines = journalRepo.findLines.bind(journalRepo);
    const originalFindAll = (journalRepo as any).findAllOrderedByDate?.bind(journalRepo);
    
    try {
      // Seed journal repo for rebuild
      (journalRepo as any).findAllOrderedByDate = () => [{ ledgerSequence: 101, id: 'J-101', fiscalPeriodId: 'P1' }];
      let rebuildCalled = false;
      (journalRepo as any).findBySequenceRange = () => {
        if (rebuildCalled) return [];
        rebuildCalled = true;
        return [{ ledgerSequence: 101, id: 'J-101', fiscalPeriodId: 'P1' }];
      };
      (journalRepo as any).findLines = () => [
        { accountId: 'CASH', side: PostingSide.DEBIT, amount: 500, branchId: 'B1', locationId: 'L1' }
      ];

      await rebuildService.rebuildProjections(tenantId);
      
      const tb = await trialBalanceRepo.getBalance(tenantId, 'CASH');
      if (tb?.balance === 500) {
        PASS("Rebuild streaming batch successful", "Balance: 500");
      } else {
        FAIL("Rebuild failed", `Got: ${tb?.balance}`);
      }
    } catch (err: any) {
      FAIL("11.4 threw unexpectedly", err.message);
    } finally {
      journalRepo.findBySequenceRange = originalFindRange;
      journalRepo.findLines = originalFindLines;
      if (originalFindAll) (journalRepo as any).findAllOrderedByDate = originalFindAll;
    }
  }

  // ── 11.5 financialSnapshotTest ─────────────────────────────────────────
  {
    section("11.5 financialSnapshotTest");
    try {
      const tenantId = `${baseTenantId}-11.5`;
      const snapshot = await snapshotService.generateCheckpoint(tenantId);
      if (snapshot.snapshotSequence >= 0 && snapshot.trialBalanceStateHash) {
        PASS("Snapshot checkpoint generated with state hash", `Seq: ${snapshot.snapshotSequence}, Hash: ${snapshot.trialBalanceStateHash.substring(0, 8)}`);
      } else {
        FAIL("Snapshot generation failed (missing sequence or state hash)");
      }
    } catch (err: any) {
      FAIL("11.5 threw unexpectedly", err.message);
    }
  }

  // ── 11.6 dimensionProjectionTest ───────────────────────────────────────
  {
    section("11.6 dimensionProjectionTest");
    try {
      const tenantId = `${baseTenantId}-11.6`;
      const ctx = PostingContextFactory.issue(tenantId);
      const costCenterId = 'CC-PRODUCTION';
      
      // Create actual journal entry with dimensions
      const entry = await journalRepo.createEntry(ctx, {
        fiscalPeriodId: 'P1',
        sourceEventId: 'EVT-DIM-11',
      });

      await journalRepo.createLines(ctx, entry.id, [
        { accountId: 'EXPENSE', side: PostingSide.DEBIT, amount: 500, dimensionCostCenterId: costCenterId },
        { accountId: 'CASH', side: PostingSide.CREDIT, amount: 500 }
      ]);

      await projectionWorker.onJournalPosted({
        tenantId,
        journalId: entry.id,
        ledgerSequence: entry.ledgerSequence,
        postingDate: new Date(),
      });

      const glHistory = await glRepo.findHistory(tenantId, 'EXPENSE', entry.ledgerSequence, entry.ledgerSequence);
      const glEntry = glHistory[0];
      
      if (glEntry?.dimensionCostCenterId === costCenterId) {
        PASS("Accounting dimensions propagated to General Ledger");
      } else {
        FAIL("Dimension mismatch in GL", `Expected: ${costCenterId}, Got: ${glEntry?.dimensionCostCenterId}`);
      }

      const statement = await statementRepo.findStatement(tenantId, 'EXPENSE', entry.ledgerSequence, entry.ledgerSequence);
      const stmtEntry = statement[0];
      if (stmtEntry?.dimensionCostCenterId === costCenterId) {
        PASS("Accounting dimensions propagated to Account Statement");
      } else {
        FAIL("Dimension mismatch in Statement", stmtEntry?.dimensionCostCenterId);
      }

      const tb = await trialBalanceRepo.getBalance(tenantId, 'EXPENSE');
      if (!tb) {
        FAIL("Trial Balance not found for EXPENSE journal");
      } else if (!tb.hasOwnProperty('dimensionCostCenterId')) {
        PASS("Trial Balance remains dimension-agnostic (account-level only)");
      } else {
        FAIL("Trial Balance unexpectedly contains dimensions");
      }
    } catch (err: any) {
      FAIL("11.6 threw unexpectedly", err.message);
    }
  }

  // ── 11.7 projectionOrderingTest ────────────────────────────────────────
  {
    section("11.7 projectionOrderingTest");
    const tenantId = `${baseTenantId}-11.7`;
    const originalFindRange7 = journalRepo.findBySequenceRange.bind(journalRepo);
    const originalFindLines7 = journalRepo.findLines.bind(journalRepo);

    try {
      // Reset checkpoint to simulate pending work
      await checkpointRepo.upsert(tenantId, 'ALL_PROJECTIONS', 500);
      
      // Setup journals in "wrong" arrival order
      let callCount = 0;
      (journalRepo as any).findBySequenceRange = (_tid: string, from: number) => {
        if (callCount > 0) return [];
        callCount++;
        return [
          { id: 'J-502', ledgerSequence: 502, tenantId }, // Arrives "early"
          { id: 'J-501', ledgerSequence: 501, tenantId }  // Arrives "late"
        ];
      };

      (journalRepo as any).findLines = (id: string) => [
        { accountId: 'ORDER-TEST', side: 'DEBIT', amount: id === 'J-501' ? 1 : 2 }
      ];

      // Trigger processing
      await projectionWorker.onJournalPosted({ tenantId, journalId: 'EVENT-TRIGGER', ledgerSequence: 502, postingDate: new Date() });

      const latestRunningBal = await glRepo.getLatestRunningBalance(tenantId, 'ORDER-TEST');
      // If Seq 501 processed first (amount 1), then 502 (amount 2), total should be 3.
      // AND Checkpoint should be 502.
      const checkpoint = await checkpointRepo.getCheckpoint(tenantId, 'ALL_PROJECTIONS');
      
      if (checkpoint === 502 && latestRunningBal === 3) {
        PASS("Deterministic batch ordering verified (out-of-order journals sorted by sequence)");
      } else {
        FAIL("Ordering check failed", `Checkpoint: ${checkpoint}, Balance: ${latestRunningBal}`);
      }
    } catch (err: any) {
      FAIL("11.7 threw unexpectedly", err.message);
    } finally {
      journalRepo.findBySequenceRange = originalFindRange7;
      journalRepo.findLines = originalFindLines7;
    }
  }

  console.log(`\n\x1b[1m${'━'.repeat(48)}`);
  console.log(`  PHASE SUMMARY: 11 — Financial Projections & Safeguards`);
  console.log(`${'━'.repeat(48)}\x1b[0m`);
  console.log(`  \x1b[32mPASS: ${pass}\x1b[0m`);
  console.log(`  \x1b[31mFAIL: ${fail}\x1b[0m`);
  
  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("FATAL:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
