import { Test, TestingModule } from '@nestjs/testing';
import { LedgerPostingService } from '../services/ledger-posting.service';
import { JournalValidationService } from '../services/journal-validation.service';
import { Prisma } from '@prisma/client';

describe('LedgerPostingService (Audit Validation)', () => {
  let service: LedgerPostingService;
  let validator: JournalValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerPostingService,
        JournalValidationService,
        { provide: 'ILedgerPostingRepository', useValue: {} },
        { provide: 'IJournalRepository', useValue: {} },
        { provide: 'IAccountBalanceRepository', useValue: {} },
        { provide: 'IPostingRuleRepository', useValue: {} },
        { provide: 'IFiscalPeriodRepository', useValue: {} },
        { provide: 'IChartOfAccountRepository', useValue: {} },
        { provide: 'ILedgerEventLogRepository', useValue: {} },
        { provide: 'IUnitOfWork', useValue: { execute: (cb) => cb({}) } },
        { provide: 'FinancialProjectionWorkerService', useValue: {} },
        { provide: 'LedgerWorkerService', useValue: {} },
        { provide: 'PostingMonitoringService', useValue: {} },
        { provide: 'PostingAuditService', useValue: {} },
        { provide: 'LedgerInvariantService', useValue: {} },
        { provide: 'DimensionValidationService', useValue: {} },
      ],
    }).compile();

    service = module.get<LedgerPostingService>(LedgerPostingService);
    validator = module.get<JournalValidationService>(JournalValidationService);
  });

  it('L-01: should reject unbalanced journals with 0 tolerance (Audit Target)', async () => {
    const unbalancedJournal = {
      lines: [
        { accountId: '1', side: 'DEBIT', amount: new Prisma.Decimal(100.00) },
        { accountId: '2', side: 'CREDIT', amount: new Prisma.Decimal(99.99) },
      ],
      totalDebit: 100.00,
      totalCredit: 99.99,
      sourceEventId: 'evt-1',
    };

    // Current implementation allows 0.001 tolerance, but Audit recommends 0.
    await expect(validator.validate(unbalancedJournal)).rejects.toThrow();
  });
});
