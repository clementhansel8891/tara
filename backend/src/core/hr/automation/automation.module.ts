import { Module } from '@nestjs/common';
import { HRAutomationService } from './automation.service';
import { EmployeeCreatedListener } from './listeners/employee-created.listener';
import { PayrollExecutedListener } from './listeners/payroll-executed.listener';

@Module({
  providers: [
    HRAutomationService,
    EmployeeCreatedListener,
    PayrollExecutedListener,
  ],
  exports: [HRAutomationService],
})
export class HRAutomationModule {}
