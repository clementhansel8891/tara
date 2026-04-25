import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { LocalEmitterService } from './local-emitter.service';

@Global()
@Module({
  providers: [EventBusService, LocalEmitterService],
  exports: [EventBusService, LocalEmitterService],
})
export class EventsModule {}
