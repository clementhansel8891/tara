import { Module } from '@nestjs/common';
import { IdempotencyCleanupService } from './idempotency-cleanup.service';
import { OutboxWorkerService } from './outbox-worker.service';
import { PersistenceModule } from '../../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [IdempotencyCleanupService, OutboxWorkerService],
  exports: [IdempotencyCleanupService, OutboxWorkerService],
})
export class MaintenanceModule {}
