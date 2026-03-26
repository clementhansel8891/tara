import { Module } from '@nestjs/common';
import { ForecasterService } from './forecaster.service';
import { ReplenishmentService } from './replenishment.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { InventoryAgentListener } from './inventory-agent.listener';
import { EventsModule } from '../../shared/events/events.module';
import { PersistenceModule } from '../../persistence/persistence.module';
import { IInventoryRepository } from '../../core/inventory/repositories/inventory.repository.interface';
import { InventoryDbRepository } from '../../core/inventory/repositories/inventory.db.repository';

@Module({
  imports: [EventsModule, PersistenceModule],
  providers: [
    ForecasterService,
    ReplenishmentService,
    AnomalyDetectorService,
    InventoryAgentListener,
    {
      provide: IInventoryRepository,
      useClass: InventoryDbRepository,
    },
  ],
  exports: [ForecasterService, ReplenishmentService, AnomalyDetectorService],
})
export class InventoryAgentModule {}
