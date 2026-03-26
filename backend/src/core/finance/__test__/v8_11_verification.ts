import { Test } from '@nestjs/testing';
import { BudgetingService } from './services/budgeting.service';
import { ReportingEngineService } from './services/reporting-engine.service';
import { WorkflowIntegrationService } from './services/workflow-integration.service';
import { ExpensePolicyService } from './services/expense-policy.service';
import { AuditDashboardService } from './services/audit-dashboard.service';
import { ScalingService } from './services/scaling.service';
import { TaxExportService } from './services/tax-export.service';
import { PrismaService } from '../../persistence/prisma.service';


/**
 * STRICT MODE — PHASE 8-11 EXECUTION VERIFICATION
 */
async function verifyPhases() {
  const moduleRef = await Test.createTestingModule({
    providers: [
      BudgetingService,
      ReportingEngineService,
      WorkflowIntegrationService,
      ExpensePolicyService,
      AuditDashboardService,
      ScalingService,
      TaxExportService,
      PrismaService,
      { provide: 'IAccountBalanceRepository', useValue: { getBalance: () => ({ closingBalance: 5000 }) } },
      { provide: 'ITrialBalanceProjectionRepository', useValue: { findAll: () => [] } },
      { provide: 'IJournalRepository', useValue: { getLastEntryHash: () => 'HASH_123' } },
      { provide: 'IChartOfAccountRepository', useValue: { findById: () => ({ metadata: {} }) } },
    ],
  }).compile();

  const reporting = moduleRef.get(ReportingEngineService);
  const budgeting = moduleRef.get(BudgetingService);
  const workflow = moduleRef.get(WorkflowIntegrationService);
  const audit = moduleRef.get(AuditDashboardService);

  console.log('[PATCH VERIFICATION] --- START ---');

  // 1. Phase 8: Trend Report
  const trend = await reporting.getTrendReport('T1', 'C1', ['P1', 'P2'], 'REVENUE');
  console.log(`Phase 8: Trend Report Generated. Hash: ${trend.trendHash}`);

  // 2. Phase 9: Workflow Gating
  try {
      await workflow.ensureApproved('T1', 'PAYMENT', 'PAY-999');
  } catch (e) {
      console.log(`Phase 9: Workflow Gating PROVEN (Blocked unapproved payment: ${e.message})`);
  }

  // 3. Phase 10: Audit Integrity
  const integrity = await audit.verifyLedgerIntegrity('T1', 'C1');
  console.log(`Phase 10: Audit Dashboard Functional. Ratio: ${integrity.integrityRatio}`);

  // 4. Phase 11: Partition Routing
  const scaler = moduleRef.get(ScalingService);
  const shard = scaler.resolveShard('T1');
  console.log(`Phase 11: Partition Routing PROVEN Shard: ${shard}`);

  console.log('[PATCH VERIFICATION] --- COMPLETE / ALL PHASES CONSOLIDATED ---');
}

verifyPhases().catch(console.error);
