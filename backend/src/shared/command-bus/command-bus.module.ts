import { Global, Module } from '@nestjs/common';
import { CommandBusService } from './command-bus.service';

/**
 * CommandBusModule
 * Global module — imported once in AppModule, available everywhere.
 * Provides and exports CommandBusService for all feature modules.
 */
@Global()
@Module({
  providers: [CommandBusService],
  exports: [CommandBusService],
})
export class CommandBusModule {}
