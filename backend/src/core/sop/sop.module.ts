import { Module } from '@nestjs/common';
import { SopController } from './sop.controller';
import { SopService } from './sop.service';
import { PersistenceModule } from '../../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [SopController],
  providers: [SopService],
  exports: [SopService],
})
export class SopModule {}
