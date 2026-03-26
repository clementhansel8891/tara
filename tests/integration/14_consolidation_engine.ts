import { LedgerPostingService } from '../../backend/src/core/finance/services/ledger-posting.service';
import { FinancialProjectionWorkerService } from '../../backend/src/core/finance/services/financial-projection-worker.service';
import { ProfitLossService } from '../../backend/src/core/finance/services/profit-loss.service';
import { BalanceSheetService } from '../../backend/src/core/finance/services/balance-sheet.service';
import { ConsolidationReportService } from '../../backend/src/core/finance/services/consolidation-report.service';
import { ProjectionCheckpointService } from '../../backend/src/core/finance/services/projection-checkpoint.service';

import { JournalMockRepository } from '../../backend/src/core/finance/repositories/journal.mock.repository';
import { CoaMockRepository } from '../../backend/src/core/finance/repositories/coa.mock.repository';
import { FiscalMockRepository } from '../../backend/src/core/finance/repositories/fiscal.mock.repository';
import { PostingRuleMockRepository } from '../../backend/src/core/finance/repositories/posting-rule.mock.repository';
import { TrialBalanceProjectionMockRepository } from '../../backend/src/core/finance/repositories/trial-balance-projection.mock.repository';
import { GeneralLedgerProjectionMockRepository } from '../../backend/src/core/finance/repositories/general-ledger-projection.mock.repository';
import { AccountStatementProjectionMockRepository } from '../../backend/src/core/finance/repositories/account-statement-projection.mock.repository';
import { LedgerProjectionCheckpointMockRepository } from '../../backend/src/core/finance/repositories/ledger-projection-checkpoint.mock.repository';
import { LedgerEventLogMockRepository } from '../../backend/src/core/finance/repositories/ledger-event-log.mock.repository';
import { AccountBalanceMockRepository } from '../../backend/src/core/finance/repositories/account-balance.mock.repository';
import { FinancialSnapshotMockRepository } from '../../backend/src/core/finance/repositories/financial-snapshot.mock.repository';

import { LedgerPostingMockRepository } from '../../backend/src/core/finance/repositories/ledger-posting.mock.repository';
// Consolidation Mocks
import { CompanyGroupMockRepository } from '../../backend/src/core/finance/repositories/company-group.mock.repository';
import { IntercompanyEliminationMockRepository } from '../../backend/src/core/finance/repositories/intercompany-elimination.mock.repository';
import { ConsolidatedSnapshotMockRepository } from '../../backend/src/core/finance/repositories/consolidated-snapshot.mock.repository';

import { LedgerInvariantService } from '../../backend/src/core/finance/services/ledger-invariant.service';
import { PostingContextFactory } from '../../backend/src/core/finance/domain/posting-context-factory';
import { 
  JournalStatus, 
  JournalType, 
  AccountType, 
  NormalBalance, 
  PostingSide,
  PostingRuleStatus
} from '../../backend/src/core/finance/domain/finance.constants';

async function main() {
  console.log(`\n\x1b[1m${'━'.repeat(48)}`);
  console.log(`  PHASE 13 — CONSOLIDATION ENGINE VERIFICATION`);
  console.log(`${'━'.repeat(48)}\x1b[0m`);

  let pass = 0;
  let fail = 0;

  const PASS = (msg: string, detail?: string) => {
    pass++;
    console.log(`   \x1b[32m✔ [PASS]\x1b[0m ${msg}`);
    if (detail) console.log(`     \x1b[2m${detail}\x1b[0m`);
  };

  const FAIL = (msg: string, detail?: string) => {
    fail++;
    console.log(`   \x1b[31m✘ [FAIL]\x1b[0m ${msg}`);
    if (detail) console.log(`     \x1b[31m${detail}\x1b[0m`);
  };

  const section = (name: string) => {
    console.log(`\n  \x1b[1m${'━'.repeat(48)}\n  ${name}\n  ${'━'.repeat(48)}\x1b[0m`);
  };

  // ── Infrastructure Setup ──────────────────────────────────────────────────
  
  const tenantId = "TENANT_GROUP_X";
  const groupAId = "GROUP_HOLDING";
  const subA = "COMPANY_SUB_A";
  const subB = "COMPANY_SUB_B";
  const fiscalPeriodId = "2026-03";

  // Repositories
  const journalRepo = new JournalMockRepository();
  const coaRepo = new CoaMockRepository();
  const fiscalRepo = new FiscalMockRepository();
  const ruleRepo = new PostingRuleMockRepository();
  const tbRepo = new TrialBalanceProjectionMockRepository();
  const glRepo = new GeneralLedgerProjectionMockRepository();
  const statementRepo = new AccountStatementProjectionMockRepository();
  const checkpointRepo = new LedgerProjectionCheckpointMockRepository();
  const eventLogRepo = new LedgerEventLogMockRepository();
  const balanceRepo = new AccountBalanceMockRepository();
  const snapshotRepo = new FinancialSnapshotMockRepository();
  
  const groupRepo = new CompanyGroupMockRepository();
  const eliminationRepo = new IntercompanyEliminationMockRepository();
  const consolidatedSnapshotRepo = new ConsolidatedSnapshotMockRepository();

  const ledgerRepo = new LedgerPostingMockRepository();

  // Services
  const invariantService = new LedgerInvariantService(journalRepo as any, balanceRepo as any);
  const workerService = new FinancialProjectionWorkerService(
    tbRepo as any, glRepo as any, statementRepo as any, checkpointRepo as any, journalRepo as any, coaRepo as any
  );
  const checkpointService = new ProjectionCheckpointService(checkpointRepo as any);
  const plService = new ProfitLossService(tbRepo as any);
  const bsService = new BalanceSheetService(tbRepo as any);

  const postingService = new LedgerPostingService(
    ledgerRepo as any,         // 1: ledgerRepo
    journalRepo as any,        // 2: journalRepo
    balanceRepo as any,        // 3: balanceRepo
    ruleRepo as any,           // 4: ruleRepo
    fiscalRepo as any,         // 5: fiscalRepo
    coaRepo as any,            // 6: coaRepo
    eventLogRepo as any,       // 7: eventLogRepo
    { execute: (fn: any) => fn() } as any, // 8: uow
    { validate: () => ({ valid: true, errors: [] }) } as any, // 9: journalValidator
    { validateDimensions: () => true } as any, // 10: dimensionValidator
    invariantService,          // 11: ledgerInvariant
    workerService,             // 12: projectionWorker
    {} as any                  // 13: auditService
  );

  const consolidationService = new ConsolidationReportService(
    groupRepo as any,
    eliminationRepo as any,
    consolidatedSnapshotRepo as any,
    plService,
    bsService,
    checkpointService
  );

  // ── Data Setup ────────────────────────────────────────────────────────────
  
  await coaRepo.create(tenantId, subA, { id: 'CASH', name: 'Cash', accountType: AccountType.ASSET } as any);
  await coaRepo.create(tenantId, subA, { id: 'REVENUE', name: 'Revenue', accountType: AccountType.REVENUE } as any);
  await coaRepo.create(tenantId, subA, { id: 'IC_PAYABLE', name: 'Intercompany Payable', accountType: AccountType.LIABILITY } as any);

  await coaRepo.create(tenantId, subB, { id: 'CASH', name: 'Cash', accountType: AccountType.ASSET } as any);
  await coaRepo.create(tenantId, subB, { id: 'REVENUE', name: 'Revenue', accountType: AccountType.REVENUE } as any);
  await coaRepo.create(tenantId, subB, { id: 'IC_RECEIVABLE', name: 'Intercompany Receivable', accountType: AccountType.ASSET } as any);

  await fiscalRepo.createPeriod(tenantId, subA, { id: fiscalPeriodId, status: 'OPEN' } as any);
  await fiscalRepo.createPeriod(tenantId, subB, { id: fiscalPeriodId, status: 'OPEN' } as any);

  await ruleRepo.createRule(tenantId, subA, {
    id: 'SALES_ORDER',
    eventType: 'SALES_ORDER',
    status: PostingRuleStatus.ACTIVE,
    lines: [
      { accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount' },
      { accountId: 'REVENUE', side: PostingSide.CREDIT, amountExpression: 'payload.amount' }
    ]
  } as any);

  await ruleRepo.createRule(tenantId, subB, {
    id: 'SALES_ORDER',
    eventType: 'SALES_ORDER',
    status: PostingRuleStatus.ACTIVE,
    lines: [
      { accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount' },
      { accountId: 'REVENUE', side: PostingSide.CREDIT, amountExpression: 'payload.amount' }
    ]
  } as any);

  // Group Setup
  await groupRepo.createGroup(tenantId, { id: groupAId, name: 'Holding Group' });
  await groupRepo.addMember(groupAId, subA, 1.0); // 100% Sub A
  await groupRepo.addMember(groupAId, subB, 0.6); // 60% Sub B (Minority Interest scenario)

  // Post 1000 in Sub A
  const pA = await postingService.enqueuePosting(tenantId, subA, 'SALES_ORDER', 'EVT-A-01', { amount: 1000, fiscalPeriodId });
  await postingService.processEvent(tenantId, subA, pA);

  // Post 2000 in Sub B
  const pB = await postingService.enqueuePosting(tenantId, subB, 'SALES_ORDER', 'EVT-B-01', { amount: 2000, fiscalPeriodId });
  await postingService.processEvent(tenantId, subB, pB);
  
  // Wait for async projections
  await new Promise(r => setTimeout(r, 100));

  // ── 13.1 Consolidated Profit & Loss ──────────────────────────────────────
  {
    section("13.1 Consolidated Profit & Loss");
    try {
      const report = await consolidationService.getConsolidatedReport(tenantId, groupAId, 'PROFIT_LOSS', fiscalPeriodId);
      
      // Expected: A(1000) + B(2000). Group Net Profit: 3000. Parent: 1000 + 0.6*2000 = 2200. NCI: 800.
      if (report.summary.parentNetProfit === 2200) {
        PASS("Consolidated P&L with ownership weighting", `Parent Share: ${report.summary.parentNetProfit}, NCI: ${report.summary.nonControllingInterest}`);
      } else {
        FAIL("Consolidated P&L value mismatch", `Expected 2200 (Parent Share), Found ${report.summary.parentNetProfit}`);
      }
    } catch (err: any) {
      FAIL("13.1 threw unexpectedly", err.message);
    }
  }

  // ── 13.2 Intercompany Eliminations ────────────────────────────────────────
  {
    section("13.2 Intercompany Eliminations");
    try {
      await consolidatedSnapshotRepo.deleteByPeriod(tenantId, groupAId, fiscalPeriodId);

      await eliminationRepo.createRule(tenantId, {
        companyA: subA,
        companyB: subB,
        accountMapping: { 'REVENUE': 'INTERNAL_EXPENSE' }
      });

      const report = await consolidationService.getConsolidatedReport(tenantId, groupAId, 'PROFIT_LOSS', fiscalPeriodId);
      
      // Sub A revenue (1000) should be eliminated from the gross 3000 -> 2000.
      if (report.summary.totalRevenue === 2000) {
        PASS("Intercompany transactions correctly eliminated via virtual journal", "Revenue netted for inter-group trade");
      } else {
        FAIL("Elimination failed to adjust totals", `Revenue: ${report.summary.totalRevenue}`);
      }
    } catch (err: any) {
      FAIL("13.2 threw unexpectedly", err.message);
    }
  }

  // ── 13.3 Consolidated Balance Sheet & Snapshot ────────────────────────────
  {
    section("13.3 Consolidated Balance Sheet & Snapshot");
    try {
      await consolidatedSnapshotRepo.deleteByPeriod(tenantId, groupAId, fiscalPeriodId);

      // Restore missing rules
      await ruleRepo.createRule(tenantId, subA, {
        id: 'EQUITY_INIT', eventType: 'EQUITY_INIT', status: PostingRuleStatus.ACTIVE,
        lines: [{ accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount' }, { accountId: 'EQUITY_RES', side: PostingSide.CREDIT, amountExpression: 'payload.amount' }]
      } as any);
      await ruleRepo.createRule(tenantId, subB, {
        id: 'EQUITY_INIT', eventType: 'EQUITY_INIT', status: PostingRuleStatus.ACTIVE,
        lines: [{ accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount' }, { accountId: 'EQUITY_RES', side: PostingSide.CREDIT, amountExpression: 'payload.amount' }]
      } as any);

      // Equity initialization
      await coaRepo.create(tenantId, subA, { id: 'EQUITY_RES', name: 'Equity', accountType: AccountType.EQUITY } as any);
      await coaRepo.create(tenantId, subB, { id: 'EQUITY_RES', name: 'Equity', accountType: AccountType.EQUITY } as any);
      
      const pE1 = await postingService.enqueuePosting(tenantId, subA, 'EQUITY_INIT', 'EVT-E-01', { amount: 1000, fiscalPeriodId });
      await postingService.processEvent(tenantId, subA, pE1);
      const pE2 = await postingService.enqueuePosting(tenantId, subB, 'EQUITY_INIT', 'EVT-E-02', { amount: 2000, fiscalPeriodId });
      await postingService.processEvent(tenantId, subB, pE2);

      await new Promise(r => setTimeout(r, 100));

      const report = await consolidationService.getConsolidatedReport(tenantId, groupAId, 'BALANCE_SHEET', fiscalPeriodId);
      
      if (report.summary.isBalanced) {
        PASS("Consolidated Balance Sheet maintains A=L+E invariant", `Total Assets: ${report.summary.totalAssets}`);
      } else {
        FAIL("Consolidated Balance Sheet is unbalanced", `A: ${report.summary.totalAssets}, L+E: ${report.summary.totalLiabilities + report.summary.totalEquity}`);
      }

      // 13.4 NCI Verification
      if (report.summary.nonControllingInterest === 1600) { // 40% of (2000 initial + 2000 profit)
        PASS("Non-Controlling Interest (NCI) correctly calculated", `NCI: ${report.summary.nonControllingInterest}`);
      } else {
        FAIL("NCI calculation mismatch", `Expected 1600, Found ${report.summary.nonControllingInterest}`);
      }

      // Snapshot Check
      const snapshot = await consolidatedSnapshotRepo.getLatest(tenantId, groupAId, fiscalPeriodId);
      if (snapshot) {
        PASS("Consolidated snapshot successfully cached", `Hash: ${snapshot.reportParametersHash.substr(0, 8)}`);
      }
    } catch (err: any) {
      FAIL("13.3/13.4 threw unexpectedly", err.message);
    }
  }

  // ── 13.5 Multi-Level Hierarchy ───────────────────────────────────────────
  {
    section("13.5 Multi-Level Hierarchy Test");
    try {
      const subC = "COMPANY_SUB_C";
      // Clear persistence to avoid interference from 13.2
      await consolidatedSnapshotRepo.deleteByPeriod(tenantId, groupAId, fiscalPeriodId);
      // Logic for 13.5 (Intercompany rules should be cleared or ignored)
      // For this mock, we'll just delete the rule we added in 13.2
      const rules = await eliminationRepo.listRules(tenantId);
      for (const r of rules) await eliminationRepo.deleteRule?.(tenantId, r.id); 
      // Note: If deleteRule is missing in interface, I'll just use a fresh tenant or ignore.
      // Actually, I'll just use a new Group/Tenant or assume fresh repo if I can.
      // Better: Reset the repo if possible.
      const branchGroup = "GROUP_BRANCH_X";
      
      await groupRepo.createGroup(tenantId, { id: branchGroup, name: 'Intermediate Group', parentGroupId: groupAId });
      await groupRepo.addMember(branchGroup, subC, 1.0); // 100% of C in Intermediate

      // Sub C earns 500
      await coaRepo.create(tenantId, subC, { id: 'CASH', name: 'Cash', accountType: AccountType.ASSET } as any);
      await coaRepo.create(tenantId, subC, { id: 'REVENUE', name: 'Revenue', accountType: AccountType.REVENUE } as any);
      await fiscalRepo.createPeriod(tenantId, subC, { id: fiscalPeriodId, status: 'OPEN' } as any);
      await ruleRepo.createRule(tenantId, subC, {
        id: 'SALES_ORDER', eventType: 'SALES_ORDER', status: PostingRuleStatus.ACTIVE,
        lines: [{ accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount' }, { accountId: 'REVENUE', side: PostingSide.CREDIT, amountExpression: 'payload.amount' }]
      } as any);

      const pC = await postingService.enqueuePosting(tenantId, subC, 'SALES_ORDER', 'EVT-C-01', { amount: 500, fiscalPeriodId });
      await postingService.processEvent(tenantId, subC, pC);
      
      await new Promise(r => setTimeout(r, 100));

      const report = await consolidationService.getConsolidatedReport(tenantId, groupAId, 'PROFIT_LOSS', fiscalPeriodId);
      
      // Totals: A(1000) + B(2000) + C(500) = 3500 gross
      if (report.summary.totalRevenue === 3500) {
        PASS("Multi-level hierarchy traversal (Recursive member resolution)", `Total Group Revenue: ${report.summary.totalRevenue}`);
      } else {
        FAIL("Multi-level aggregation failed", `Expected 3500, Found ${report.summary.totalRevenue}`);
      }
    } catch (err: any) {
      FAIL("13.5 threw unexpectedly", err.message);
    }
  }

  console.log(`\n\x1b[1m${'━'.repeat(48)}`);
  console.log(`  PHASE SUMMARY: 13 — CONSOLIDATION ENGINE`);
  console.log(`${'━'.repeat(48)}\x1b[0m`);
  console.log(`  \x1b[32mPASS: ${pass}\x1b[0m`);
  console.log(`  \x1b[31mFAIL: ${fail}\x1b[0m`);
  
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
