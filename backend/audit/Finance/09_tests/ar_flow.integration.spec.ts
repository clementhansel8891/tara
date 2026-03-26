import { Test, TestingModule } from '@nestjs/testing';
import { ArInvoiceService } from '../ar/services/ar-invoice.service';
import { LedgerPostingService } from '../services/ledger-posting.service';
import { ArInvoiceStatus } from '../ar/domain/ar.constants';

describe('AR Lifecycle Integration (Audit)', () => {
  let service: ArInvoiceService;
  let ledger: LedgerPostingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArInvoiceService,
        { provide: 'IArInvoiceRepository', useValue: { 
            findById: jest.fn().mockResolvedValue({ id: 'inv-1', status: 'DRAFT', totalAmount: 100 }),
            updateStatus: jest.fn().mockResolvedValue({ id: 'inv-1', status: 'ISSUED' })
          } 
        },
        { provide: LedgerPostingService, useValue: { enqueuePosting: jest.fn() } },
        { provide: 'IFiscalPeriodRepository', useValue: {} },
        { provide: 'IAccountingMappingRepository', useValue: {} },
        { provide: 'ITaxEngineService', useValue: {} },
        { provide: 'IWorkflowIntegrationService', useValue: {} },
      ],
    }).compile();

    service = module.get<ArInvoiceService>(ArInvoiceService);
    ledger = module.get<LedgerPostingService>(LedgerPostingService);
  });

  it('AR-01: should trigger Ledger Posting on Invoice Issuance', async () => {
    await service.issueInvoice('tenant-1', 'company-1', 'inv-1');
    expect(ledger.enqueuePosting).toHaveBeenCalledWith(
        'tenant-1',
        'company-1',
        expect.stringContaining('INVOICE_ISSUED'),
        expect.any(String),
        expect.objectContaining({ invoiceId: 'inv-1' })
    );
  });
});
