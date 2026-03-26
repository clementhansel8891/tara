import { Module, forwardRef } from '@nestjs/common';
import { ArController } from './ar.controller';
import { ArCustomerService } from './services/ar-customer.service';
import { ArInvoiceService } from './services/ar-invoice.service';
import { ArPaymentService } from './services/ar-payment.service';
import { ArCreditMemoService } from './services/ar-credit-memo.service';
import { ArAgingReportService } from './services/ar-aging-report.service';
import { ArCustomerMockRepository } from './repositories/ar-customer.mock.repository';
import { ArInvoiceMockRepository } from './repositories/ar-invoice.mock.repository';
import { ArPaymentMockRepository } from './repositories/ar-payment.mock.repository';
import { ArCreditMemoMockRepository } from './repositories/ar-credit-memo.mock.repository';
import { ArCustomerCreditMockRepository } from './repositories/ar-customer-credit.mock.repository';
import { LedgerWorkerModule } from '../workers/ledger-worker.module';
import { FinanceModule } from '../finance.module';

@Module({
  imports: [
    forwardRef(() => FinanceModule),
  ],
  controllers: [ArController],
  providers: [
    ArCustomerService,
    ArInvoiceService,
    ArPaymentService,
    ArCreditMemoService,
    ArAgingReportService,
    {
      provide: 'IArCustomerRepository',
      useClass: ArCustomerMockRepository,
    },
    {
      provide: 'IArInvoiceRepository',
      useClass: ArInvoiceMockRepository,
    },
    {
      provide: 'IArPaymentRepository',
      useClass: ArPaymentMockRepository,
    },
    {
      provide: 'IArCreditMemoRepository',
      useClass: ArCreditMemoMockRepository,
    },
    {
      provide: 'IArCustomerCreditRepository',
      useClass: ArCustomerCreditMockRepository,
    },
  ],
  exports: [ArCustomerService, ArInvoiceService],
})
export class ArModule {}
