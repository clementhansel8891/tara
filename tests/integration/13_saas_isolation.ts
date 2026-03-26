/**
 * PHASE 13 — SaaS Isolation & Multi-Company Test Suite
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Verifies that the Finance Domain correctly enforces legal entity
 * boundaries and cross-tenant isolation according to Zenvix SaaS architecture.
 */

import { ReportDefinitionRegistry } from "../../backend/src/core/finance/domain/report-definition.registry";
import { ProjectionCheckpointService } from "../../backend/src/core/finance/services/projection-checkpoint.service";
import { ProfitLossService } from "../../backend/src/core/finance/services/profit-loss.service";
import { BalanceSheetService } from "../../backend/src/core/finance/services/balance-sheet.service";
import { CashFlowService } from "../../backend/src/core/finance/services/cash-flow.service";
import { FinancialReportService } from "../../backend/src/core/finance/services/financial-report.service";
import { TrialBalanceProjectionMockRepository } from "../../backend/src/core/finance/repositories/trial-balance-projection.mock.repository";
import { AccountStatementProjectionMockRepository } from "../../backend/src/core/finance/repositories/account-statement-projection.mock.repository";
import { GeneralLedgerProjectionMockRepository } from "../../backend/src/core/finance/repositories/general-ledger-projection.mock.repository";
import { FinancialReportSnapshotMockRepository } from "../../backend/src/core/finance/repositories/financial-report-snapshot.mock.repository";
import { LedgerProjectionCheckpointMockRepository } from "../../backend/src/core/finance/repositories/ledger-projection-checkpoint.mock.repository";
import { JournalMockRepository } from "../../backend/src/core/finance/repositories/journal.mock.repository";
import { CoaMockRepository } from "../../backend/src/core/finance/repositories/coa.mock.repository";
import { PostingContextFactory } from "../../backend/src/core/finance/domain/posting-context-factory";
import { LedgerPostingService } from "../../backend/src/core/finance/services/ledger-posting.service";
import { FinancialProjectionWorkerService } from "../../backend/src/core/finance/services/financial-projection-worker.service";
import { AccountType, PostingSide, NormalBalance, PostingRuleStatus, FiscalPeriodStatus } from "../../backend/src/core/finance/domain/finance.constants";
import { LedgerPostingMockRepository } from "../../backend/src/core/finance/repositories/ledger-posting.mock.repository";
import { AccountBalanceMockRepository } from "../../backend/src/core/finance/repositories/account-balance.mock.repository";
import { FiscalMockRepository } from "../../backend/src/core/finance/repositories/fiscal.mock.repository";
import { PostingRuleMockRepository } from "../../backend/src/core/finance/repositories/posting-rule.mock.repository";
import { JournalValidationService } from "../../backend/src/core/finance/services/journal-validation.service";
import { DimensionValidationService } from "../../backend/src/core/finance/services/dimension-validation.service";
import { LedgerInvariantService } from "../../backend/src/core/finance/services/ledger-invariant.service";

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
  section("PHASE 13 — SAAS ISOLATION & MULTI-COMPANY");
  
  const tenant1 = "TENANT_A";
  const tenant2 = "TENANT_B";
  const company1_T1 = "COMP_A_1";
  const company2_T1 = "COMP_A_2";
  const fiscalPeriodId = "2026-M01";

  // 1. Setup Mock Repositories
  const journalRepo = new JournalMockRepository();
  const trialBalanceRepo = new TrialBalanceProjectionMockRepository();
  const glRepo = new GeneralLedgerProjectionMockRepository();
  const statementRepo = new AccountStatementProjectionMockRepository();
  const checkpointRepo = new LedgerProjectionCheckpointMockRepository();
  const coaRepo = new CoaMockRepository();
  const postingRepo = new LedgerPostingMockRepository();
  const balanceRepo = new AccountBalanceMockRepository();
  const fiscalRepo = new FiscalMockRepository();
  const reportSnapshotRepo = new FinancialReportSnapshotMockRepository();
  const ruleRepo = new PostingRuleMockRepository();
  const eventLogRepo = {
    create: async (t: string, d: any) => ({ id: 'evt-log-1', ...d }),
    findBySourceEventId: async (t: string, s: string) => null,
    updateStatus: async (id: string, s: string) => {},
  } as any;

  // 2. Setup Services
  const registry = new ReportDefinitionRegistry();
  const checkpointService = new ProjectionCheckpointService(checkpointRepo);
  const plService = new ProfitLossService(trialBalanceRepo);
  const bsService = new BalanceSheetService(trialBalanceRepo);
  const cfService = new CashFlowService(statementRepo, journalRepo, coaRepo);
  const reportService = new FinancialReportService(registry, checkpointService, plService, bsService, cfService, reportSnapshotRepo);
  
  const journalValidator = new JournalValidationService();
  const dimensionValidator = new DimensionValidationService();
  const ledgerInvariant = new LedgerInvariantService(journalRepo, balanceRepo);

  const projectionWorker = new FinancialProjectionWorkerService(
    trialBalanceRepo,
    glRepo,
    statementRepo,
    checkpointRepo,
    journalRepo,
    coaRepo
  );

  const postingService = new LedgerPostingService(
    postingRepo,
    journalRepo,
    balanceRepo,
    ruleRepo,
    fiscalRepo,
    coaRepo,
    eventLogRepo,
    { execute: async (fn: any) => await fn() } as any, // Mock UOW
    journalValidator,
    dimensionValidator,
    ledgerInvariant,
    projectionWorker,
    { log: async () => {} } as any // Mock Audit
  );

  // Setup Fiscal Period
  await fiscalRepo.createYear(tenant1, company1_T1, { id: '2026', year: 2026, status: FiscalPeriodStatus.OPEN as any });
  await fiscalRepo.createPeriod(tenant1, company1_T1, { id: fiscalPeriodId, fiscalYearId: '2026', name: 'Jan 2026', status: FiscalPeriodStatus.OPEN });
  await fiscalRepo.createYear(tenant1, company2_T1, { id: '2026', year: 2026, status: FiscalPeriodStatus.OPEN as any });
  await fiscalRepo.createPeriod(tenant1, company2_T1, { id: fiscalPeriodId, fiscalYearId: '2026', name: 'Jan 2026', status: FiscalPeriodStatus.OPEN });
  await fiscalRepo.createYear(tenant2, company1_T1, { id: '2026', year: 2026, status: FiscalPeriodStatus.OPEN as any });
  await fiscalRepo.createPeriod(tenant2, company1_T1, { id: fiscalPeriodId, fiscalYearId: '2026', name: 'Jan 2026', status: FiscalPeriodStatus.OPEN });

  // Setup Posting Rules
  await ruleRepo.createRule(tenant1, company1_T1, { 
    eventType: 'SALES_ORDER', 
    status: PostingRuleStatus.ACTIVE,
    lines: [
      { id: '1', accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount', createdAt: new Date(), updatedAt: new Date() } as any,
      { id: '2', accountId: 'SALES', side: PostingSide.CREDIT, amountExpression: 'payload.amount', createdAt: new Date(), updatedAt: new Date() } as any
    ]
  } as any);
  await ruleRepo.createRule(tenant1, company2_T1, { 
    eventType: 'SALES_ORDER', 
    status: PostingRuleStatus.ACTIVE,
    lines: [
      { id: '1', accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount', createdAt: new Date(), updatedAt: new Date() } as any,
      { id: '2', accountId: 'SALES', side: PostingSide.CREDIT, amountExpression: 'payload.amount', createdAt: new Date(), updatedAt: new Date() } as any
    ]
  } as any);
  await ruleRepo.createRule(tenant2, company1_T1, { 
    eventType: 'SALES_ORDER', 
    status: PostingRuleStatus.ACTIVE,
    lines: [
      { id: '1', accountId: 'CASH', side: PostingSide.DEBIT, amountExpression: 'payload.amount', createdAt: new Date(), updatedAt: new Date() } as any,
      { id: '2', accountId: 'SALES', side: PostingSide.CREDIT, amountExpression: 'payload.amount', createdAt: new Date(), updatedAt: new Date() } as any
    ]
  } as any);

  // ── 13.1 Multi-Company Ledger Separation ──────────────────────────────────
  {
    section("13.1 Multi-Company Ledger Separation");
    try {
      // Setup Accounts in Company 1 & 2
      const cash_C1 = await coaRepo.create(tenant1, company1_T1, { id: 'CASH', name: 'Cash C1', accountCode: '1001', accountType: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, isActive: true, accountLevel: 1, accountPath: 'CASH' } as any);
      const rev_C1 = await coaRepo.create(tenant1, company1_T1, { id: 'SALES', name: 'Sales C1', accountCode: '4001', accountType: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, isActive: true, accountLevel: 1, accountPath: 'SALES' } as any);
      
      const cash_C2 = await coaRepo.create(tenant1, company2_T1, { id: 'CASH', name: 'Cash C2', accountCode: '1001', accountType: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, isActive: true, accountLevel: 1, accountPath: 'CASH' } as any);
      const rev_C2 = await coaRepo.create(tenant1, company2_T1, { id: 'SALES', name: 'Sales C2', accountCode: '4001', accountType: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, isActive: true, accountLevel: 1, accountPath: 'SALES' } as any);

      // Post 1000 to Company 1
      const p1 = await postingService.enqueuePosting(tenant1, company1_T1, 'SALES_ORDER', 'EVT-C1-01', { fiscalPeriodId, amount: 1000 });
      await postingService.processEvent(tenant1, company1_T1, p1);

      // Post 5000 to Company 2
      const p2 = await postingService.enqueuePosting(tenant1, company2_T1, 'SALES_ORDER', 'EVT-C2-01', { fiscalPeriodId, amount: 5000 });
      await postingService.processEvent(tenant1, company2_T1, p2);
      
      // Wait for async projections
      await new Promise(r => setTimeout(r, 100));

      // Verify TB Separation
      const tbC1 = await plService.generate(tenant1, company1_T1, fiscalPeriodId);
      const tbC2 = await plService.generate(tenant1, company2_T1, fiscalPeriodId);

      if (tbC1.summary.totalRevenue === 1000 && tbC2.summary.totalRevenue === 5000) {
        PASS("Independent Trial Balances for different companies under same tenant", `Company 1: 1000, Company 2: 5000`);
      } else {
        FAIL("Ledger Leakage detected between companies", `C1 Revenue: ${tbC1.summary.totalRevenue}, C2 Revenue: ${tbC2.summary.totalRevenue}`);
      }
    } catch (err: any) {
      FAIL("13.1 threw unexpectedly", err.message);
    }
  }

  // ── 13.2 Cross-Tenant Isolation ───────────────────────────────────────────
  {
    section("13.2 Cross-Tenant Isolation");
    try {
      // Setup same account in Tenant B
      const cash_T2 = await coaRepo.create(tenant2, company1_T1, { id: 'CASH', name: 'Cash T2', accountCode: '1001', accountType: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, isActive: true, accountLevel: 1, accountPath: 'CASH' } as any);
      const rev_T2 = await coaRepo.create(tenant2, company1_T1, { id: 'SALES', name: 'Sales T2', accountCode: '4001', accountType: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, isActive: true, accountLevel: 1, accountPath: 'SALES' } as any);

      // Post 99000 to Tenant B
      const pB = await postingService.enqueuePosting(tenant2, company1_T1, 'SALES_ORDER', 'EVT-T2-01', { fiscalPeriodId, amount: 99000 });
      await postingService.processEvent(tenant2, company1_T1, pB);
      
      // Wait for async projections
      await new Promise(r => setTimeout(r, 100));

      // Query Tenant A - should NOT see Tenant B data
      const tbT1 = await plService.generate(tenant1, company1_T1, fiscalPeriodId);
      if (tbT1.summary.totalRevenue === 1000) {
        PASS("Tenant A cannot see Tenant B data", "Tenant A remains isolated at 1000");
      } else {
        FAIL("Cross-Tenant leakage detected", `Tenant A now has ${tbT1.summary.totalRevenue}`);
      }
    } catch (err: any) {
      FAIL("13.2 threw unexpectedly", err.message);
    }
  }

  // ── 13.3 Dimension-Specific Reporting ─────────────────────────────────────
  {
    section("13.3 Dimension-Specific Reporting");
    try {
      const branchId = "BRANCH_SOUTH";
      const channelId = "ECOMMERCE";
      
      const cash_C1 = (await coaRepo.findById(tenant1, company1_T1, 'CASH'))!;

      // Post with dimensions
      const pDim = await postingService.enqueuePosting(tenant1, company1_T1, 'SALES_ORDER', 'EVT-DIM-01', { 
        fiscalPeriodId, 
        amount: 250,
        dimensionBranchId: branchId,
        dimensionChannelId: channelId
      });
      await postingService.processEvent(tenant1, company1_T1, pDim);
      
      // Wait for async projections
      await new Promise(r => setTimeout(r, 100));

      // Verify GL Projections store dimensions
      const glRecords = await glRepo.findHistory(tenant1, company1_T1, cash_C1.id, 0, 9999);
      const dimRecord = glRecords.find(r => r.dimensionBranchId === branchId);

      if (dimRecord && dimRecord.dimensionChannelId === channelId) {
        PASS("Operational dimensions correctly persisted in GL history", `Branch: ${branchId}, Channel: ${channelId}`);
      } else {
        FAIL("Dimension persistence failed", `Record found: ${!!dimRecord}`);
      }
    } catch (err: any) {
      FAIL("13.3 threw unexpectedly", err.message);
    }
  }

  console.log(`\n\x1b[1m${'━'.repeat(48)}`);
  console.log(`  PHASE SUMMARY: 13 — SaaS Isolation & Multi-Company`);
  console.log(`${'━'.repeat(48)}\x1b[0m`);
  console.log(`  \x1b[32mPASS: ${pass}\x1b[0m`);
  console.log(`  \x1b[31mFAIL: ${fail}\x1b[0m`);
  
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
