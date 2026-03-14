import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EmployeeCreatedListener } from './listeners/employee-created.listener';
import { PayrollExecutedListener } from './listeners/payroll-executed.listener';

/**
 * HR Automation Service
 * 
 * Central registry to initialize all event-to-workflow automation hooks.
 */
@Injectable()
export class HRAutomationService implements OnModuleInit {
  private readonly logger = new Logger(HRAutomationService.name);

  constructor(
    private readonly employeeCreatedListener: EmployeeCreatedListener,
    private readonly payrollExecutedListener: PayrollExecutedListener,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing HR Automation Hooks...');
    this.employeeCreatedListener.register();
    this.payrollExecutedListener.register();
    this.logger.log('HR Automation Hooks registered successfully.');
  }
}
