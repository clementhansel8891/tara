import { Module } from '@nestjs/common';
import { EventsModule } from '../../../shared/events/events.module';
import { CommandBusModule } from '../../../shared/command-bus/command-bus.module';
import { HRAutomationService } from './automation.service';
import { EmployeeCreatedListener } from './listeners/employee-created.listener';
import { PayrollExecutedListener } from './listeners/payroll-executed.listener';

@Module({
  imports: [EventsModule, CommandBusModule],
  providers: [
    HRAutomationService,
    EmployeeCreatedListener,
    PayrollExecutedListener,
  ],
  exports: [HRAutomationService],
})
export class HRAutomationModule {}
