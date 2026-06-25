import { Module } from '@nestjs/common';
import { SopController } from './sop.controller';
import { SopService } from './sop.service';
import { SopAgentService } from './sop-agent.service';
import { PersistenceModule } from '../../persistence/persistence.module';
import { EventBusService } from '../hr/services/event-bus.service';

@Module({
  imports: [PersistenceModule],
  controllers: [SopController],
  providers: [SopService, SopAgentService, EventBusService],
  exports: [SopService, SopAgentService],
})
export class SopModule {}
