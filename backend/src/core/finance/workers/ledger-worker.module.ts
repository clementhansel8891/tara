import { Module, forwardRef } from '@nestjs/common';
import { LedgerWorkerService } from './ledger-worker.service';
import { LedgerEventIngestionWorker } from '../services/ledger-event-ingestion-worker.service';
import { FinanceModule } from '../finance.module';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  providers: [LedgerWorkerService, LedgerEventIngestionWorker],
  exports: [LedgerWorkerService, LedgerEventIngestionWorker],
})
export class LedgerWorkerModule {}
