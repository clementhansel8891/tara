import { Injectable } from "@nestjs/common";
import { CaptureLeadDto } from "./dto/capture-lead.dto";
import { ConnectAccountDto } from "./dto/connect-account.dto";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { RunExecutionDto } from "./dto/run-execution.dto";
import { ScheduleExecutionDto } from "./dto/schedule-execution.dto";
import { UpdateAccountStatusDto } from "./dto/update-account-status.dto";
import { UpdateCampaignStatusDto } from "./dto/update-campaign-status.dto";
import { UpdateWorkflowStatusDto } from "./dto/update-workflow-status.dto";
import { IMarketingRepository } from "./repositories/marketing.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class MarketingService {
  constructor(
    private readonly repository: IMarketingRepository,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard(tenantId: string) {
    return this.repository.getDashboard(tenantId);
  }

  async getChannelPerformance(tenantId: string) {
    return this.repository.getChannelPerformance(tenantId);
  }

  async getCampaigns(tenantId: string) {
    return this.repository.getCampaigns(tenantId);
  }

  async createCampaign(
    tenantId: string,
    dto: CreateCampaignDto,
    actorId: string,
  ) {
    const campaign = await this.repository.createCampaign(
      tenantId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "CREATE",
      entityType: "CAMPAIGN",
      entityId: campaign.id,
      metadata: { name: dto.name, objective: dto.objective },
    });
    return campaign;
  }

  async updateCampaignStatus(
    tenantId: string,
    campaignId: string,
    dto: UpdateCampaignStatusDto,
    actorId: string,
  ) {
    const campaign = await this.repository.updateCampaignStatus(
      tenantId,
      campaignId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "UPDATE_STATUS",
      entityType: "CAMPAIGN",
      entityId: campaignId,
      metadata: { status: dto.status },
    });
    return campaign;
  }

  async getExecutions(tenantId: string) {
    return this.repository.getExecutions(tenantId);
  }

  async scheduleExecution(
    tenantId: string,
    dto: ScheduleExecutionDto,
    actorId: string,
  ) {
    const execution = await this.repository.scheduleExecution(
      tenantId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "SCHEDULE",
      entityType: "EXECUTION",
      entityId: execution.id,
      metadata: { campaignId: dto.campaignId, scheduledAt: dto.scheduledAt },
    });
    return execution;
  }

  async runExecution(
    tenantId: string,
    executionId: string,
    dto: RunExecutionDto,
    actorId: string,
  ) {
    const execution = await this.repository.runExecution(
      tenantId,
      executionId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "RUN",
      entityType: "EXECUTION",
      entityId: executionId,
      metadata: { failed: dto.failed },
    });
    return execution;
  }

  async getLeads(tenantId: string) {
    return this.repository.getLeads(tenantId);
  }

  async captureLead(tenantId: string, dto: CaptureLeadDto, actorId: string) {
    const lead = await this.repository.captureLead(tenantId, dto, actorId);
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "CAPTURE",
      entityType: "LEAD",
      entityId: lead.id,
      metadata: { source: dto.source, email: dto.email },
    });
    return lead;
  }

  async markLeadHandoffReady(
    tenantId: string,
    leadId: string,
    actorId: string,
  ) {
    const lead = await this.repository.markLeadHandoffReady(
      tenantId,
      leadId,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "HANDOFF_READY",
      entityType: "LEAD",
      entityId: leadId,
    });
    return lead;
  }

  async handoffLeadToSales(tenantId: string, leadId: string, actorId: string) {
    const lead = await this.repository.handoffLeadToSales(
      tenantId,
      leadId,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "HANDOFF_TO_SALES",
      entityType: "LEAD",
      entityId: leadId,
    });
    return lead;
  }

  async getWorkflows(tenantId: string) {
    return this.repository.getWorkflows(tenantId);
  }

  async createWorkflow(
    tenantId: string,
    dto: CreateWorkflowDto,
    actorId: string,
  ) {
    const workflow = await this.repository.createWorkflow(
      tenantId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "CREATE",
      entityType: "WORKFLOW",
      entityId: workflow.id,
      metadata: { name: dto.name, trigger: dto.trigger },
    });
    return workflow;
  }

  async updateWorkflowStatus(
    tenantId: string,
    workflowId: string,
    dto: UpdateWorkflowStatusDto,
    actorId: string,
  ) {
    const workflow = await this.repository.updateWorkflowStatus(
      tenantId,
      workflowId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "UPDATE_STATUS",
      entityType: "WORKFLOW",
      entityId: workflowId,
      metadata: { status: dto.status },
    });
    return workflow;
  }

  async getConnectedAccounts(tenantId: string) {
    return this.repository.getConnectedAccounts(tenantId);
  }

  async connectAccount(
    tenantId: string,
    dto: ConnectAccountDto,
    actorId: string,
  ) {
    const account = await this.repository.connectAccount(
      tenantId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "CONNECT",
      entityType: "ACCOUNT",
      entityId: account.id,
      metadata: { provider: dto.provider, accountName: dto.accountName },
    });
    return account;
  }

  async updateAccountStatus(
    tenantId: string,
    accountId: string,
    dto: UpdateAccountStatusDto,
    actorId: string,
  ) {
    const account = await this.repository.updateAccountStatus(
      tenantId,
      accountId,
      dto,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "UPDATE_STATUS",
      entityType: "ACCOUNT",
      entityId: accountId,
      metadata: { status: dto.status },
    });
    return account;
  }

  async getAttribution(tenantId: string) {
    return this.repository.getAttribution(tenantId);
  }

  async getAlerts(tenantId: string) {
    return this.repository.getAlerts(tenantId);
  }

  async acknowledgeAlert(tenantId: string, alertId: string) {
    return this.repository.acknowledgeAlert(tenantId, alertId);
  }

  async runHealthSweep(tenantId: string, actorId: string) {
    const findings = await this.repository.runHealthSweep(tenantId, actorId);
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "marketing",
      action: "RUN_HEALTH_SWEEP",
      entityType: "SYSTEM",
      entityId: "marketing-health",
      metadata: { findingsCount: findings.length },
    });
    return findings;
  }

  async getAuditEvents(tenantId: string) {
    return this.repository.getAuditEvents(tenantId);
  }
}
