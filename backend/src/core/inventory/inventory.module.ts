import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryDbRepository } from './repositories/inventory.db.repository';
import { IInventoryRepository } from './repositories/inventory.repository.interface';
import { FileProcessingModule } from '../../shared/file-processing/file-processing.module';

@Module({
  imports: [PersistenceModule, FileProcessingModule],
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

