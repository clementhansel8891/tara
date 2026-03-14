import { Module, Global } from "@nestjs/common";
import { AutomationService } from "./automation.service";
import { EventsModule } from "../events/events.module";
import { LoggerModule } from "../logger/logger.module";
import { AuditModule } from "../audit/audit.module";

@Global()
@Module({
  imports: [EventsModule, LoggerModule, AuditModule],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
