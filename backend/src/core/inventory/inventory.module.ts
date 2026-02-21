import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryDbRepository } from './repositories/inventory.db.repository';
import { IInventoryRepository } from './repositories/inventory.repository.interface';

@Module({
  imports: [PersistenceModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: IInventoryRepository,
      useClass: InventoryDbRepository,
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}

