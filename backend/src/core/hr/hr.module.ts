import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { HRController } from "./hr.controller";
import { WorkflowController } from "../../shared/workflow/workflow.controller";
import { HRService } from "./hr.service";
import { IHRRepository } from "./repositories/hr.repository.interface";
import { HRDbRepository } from "./repositories/hr.db.repository";
import { TalentSourcingService } from "./talent-sourcing.service";
import { ComplianceService } from "./compliance.service";
import { ContractGeneratorService } from "./contract-generator.service";
import { AnalyticsService } from "./analytics.service";
import { WorkforcePlannerService } from "./workforce-planner.service";
import { PayrollConsolidationService } from "./payroll-consolidation.service";
import { OcrService } from "./ocr.service";
import { SuccessionService } from "./succession.service";
import { SkillsService } from "./skills.service";
import { TotalRewardsService } from "./total-rewards.service";
import { CareerPathService } from "./career-path.service";
import { JobDescriptionService } from "./job-description.service";
import { PerformancePredictorService } from "./performance-predictor.service";
import { LearningService } from "./learning.service";
import { LaborCostService } from "./labor-cost.service";
import { HRInsightService } from "./hr-insight.service";
import { HRActionService } from "./hr-action.service";
import { HRConsistencyService } from "./hr-consistency.service";
import { HRMetricService } from "./hr-metric.service";
import { SchedulingService } from "./scheduling.service";
import { HrSettlementService } from "./hr-settlement.service";
import { HrPayrollService } from "./hr-payroll.service";
import { HrPayrollController } from "./controllers/hr-payroll.controller";
import { ComplianceController } from "./controllers/compliance.controller";
import { HrSchedulingController } from "./controllers/hr-scheduling.controller";
import { HrLeaveController } from "./controllers/hr-leave.controller";
import { HrRecruitmentController } from "./controllers/hr-recruitment.controller";
import { HrRecruitmentService } from "./hr-recruitment.service";
import { HrLeaveService } from "./hr-leave.service";
import { PayrollEngineService } from "./payroll-engine.service";
import { PayslipService } from "./payslip.service";
import { FinanceModule } from "../finance/finance.module";
import { HRMutationInterceptor } from "./interceptors/hr-mutation.interceptor";
import { IdempotencyInterceptor } from "../../shared/interceptors/idempotency.interceptor";
import { PrismaService } from "../../persistence/prisma.service";
import { TimeAndAttendanceService } from "./time/time.service";
import { TenantScopeResolver } from "./scope/tenant-scope.resolver";
import { AtomicOperationService } from "./utils/atomic-operation.service";

import { FileProcessingModule } from "../../shared/file-processing/file-processing.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { LoggerModule } from "../../shared/logger/logger.module";
import { ComplianceEngineModule } from "../../modules/compliance/compliance.module";

// Phase 3: Automation Hooks
import { HRAutomationModule } from "./automation/automation.module";

// Phase 4: Time & Attendance
import { TimeAndAttendanceModule } from "./time/time.module";

// Phase 1: Command Layer
import {
  HireEmployeeCommandHandler,
  PromoteEmployeeCommandHandler,
  TransferEmployeeCommandHandler,
  TerminateEmployeeCommandHandler,
  SuspendEmployeeCommandHandler,
  CreateJobOpeningCommandHandler,
  ConvertLeadToCandidateCommandHandler,
  ScheduleInterviewCommandHandler,
  ExecutePayrollCommandHandler,
  AdjustCompensationCommandHandler,
  GeneratePayslipCommandHandler,
  GenerateComplianceReportCommandHandler,
  ExportGovernmentReportCommandHandler,
  EnableComplianceModuleCommandHandler,
  HRCommandRegistrar,
} from "./commands/hr.command-handlers";

import { CommsModule } from "../../shared/comms/comms.module";

/**
 * HR Module
 * Core module for Human Resources operations
 */
@Module({
  imports: [
    FileProcessingModule, 
    AuditModule, 
    LoggerModule, 
    ComplianceEngineModule, 
    HRAutomationModule, 
    forwardRef(() => TimeAndAttendanceModule), 
    CommsModule, 
    forwardRef(() => FinanceModule)
  ],
  controllers: [
    HRController, 
    WorkflowController, 
    ComplianceController, 
    HrPayrollController, 
    HrSchedulingController,
    HrLeaveController,
    HrRecruitmentController
  ],
  providers: [
    {
      provide: IHRRepository,
      useClass: HRDbRepository,
    },
    HRService,
    TalentSourcingService,
    ComplianceService,
    ContractGeneratorService,
    AnalyticsService,
    WorkforcePlannerService,
    PayrollConsolidationService,
    OcrService,
    SuccessionService,
    SkillsService,
    TotalRewardsService,
    CareerPathService,
    JobDescriptionService,
    PerformancePredictorService,
    LearningService,
    LaborCostService,
    HRInsightService,
    TimeAndAttendanceService,
    HRActionService,
    HRConsistencyService,
    HRMetricService,
    SchedulingService,
    HrSettlementService,
    HrLeaveService,
    HrRecruitmentService,
    HrPayrollService,
    PayrollEngineService,
    PayslipService,
    PrismaService,
    TenantScopeResolver,
    HRMutationInterceptor,
    IdempotencyInterceptor,
    AtomicOperationService,
    HireEmployeeCommandHandler,
    PromoteEmployeeCommandHandler,
    TransferEmployeeCommandHandler,
    TerminateEmployeeCommandHandler,
    SuspendEmployeeCommandHandler,
    CreateJobOpeningCommandHandler,
    ConvertLeadToCandidateCommandHandler,
    ScheduleInterviewCommandHandler,
    ExecutePayrollCommandHandler,
    AdjustCompensationCommandHandler,
    GeneratePayslipCommandHandler,
    GenerateComplianceReportCommandHandler,
    ExportGovernmentReportCommandHandler,
    EnableComplianceModuleCommandHandler,
    HRCommandRegistrar,
  ],
  exports: [
    IHRRepository,
    HRService,
    HrSettlementService,
    HRInsightService,
    TimeAndAttendanceService,
    AtomicOperationService,
    TenantScopeResolver,
  ],
})
export class HRModule implements OnModuleInit {
  constructor(
    private readonly registrar: HRCommandRegistrar
  ) {}

  onModuleInit(): void {
    this.registrar.register();
  }
}
