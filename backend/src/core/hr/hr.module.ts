import { Module, OnModuleInit } from "@nestjs/common";
import { HRController } from "./hr.controller";
import { WorkflowController } from "../../shared/workflow/workflow.controller";
import { HRService } from "./hr.service";
import { IHRRepository } from "./repositories/hr.repository.interface";
import { HRDbRepository } from "./repositories/hr.db.repository";
import { TalentSourcingService } from "./talent-sourcing.service";
import { ComplianceService } from "./compliance.service";
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
import { PrismaService } from "../../persistence/prisma.service";

import { FileProcessingModule } from "../../shared/file-processing/file-processing.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { ComplianceEngineModule } from "../../modules/compliance/compliance.module";
import { ComplianceEngineService } from "../../modules/compliance/compliance.service";

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

/**
 * HR Module
 * Core module for Human Resources operations
 */
@Module({
  imports: [FileProcessingModule, AuditModule, ComplianceEngineModule, HRAutomationModule, TimeAndAttendanceModule],
  controllers: [HRController, WorkflowController],
  providers: [
    HRService,
    TalentSourcingService,
    ComplianceService,
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
    PrismaService,
    // Phase 1: Command Handlers
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
    // Phase 4: Compliance Engine
    ComplianceEngineService,
    {
      provide: IHRRepository,
      useClass: HRDbRepository,
    },
  ],
  exports: [HRService],
})
export class HRModule implements OnModuleInit {
  constructor(private readonly registrar: HRCommandRegistrar) {}

  onModuleInit(): void {
    this.registrar.register();
  }
}
