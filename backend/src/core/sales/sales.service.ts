import { Injectable } from "@nestjs/common";
import { CloseOpportunityDto } from "./dto/close-opportunity.dto";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { CreateQuoteDto } from "./dto/create-quote.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { CreateTimelineEventDto } from "./dto/create-timeline-event.dto";
import { MoveOpportunityStageDto } from "./dto/move-opportunity-stage.dto";
import { QuoteDecisionDto } from "./dto/quote-decision.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { SalesNextAction } from "./entities/sales-next-action.entity";
import { ISalesRepository } from "./repositories/sales.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class SalesService {
  constructor(
    private readonly repository: ISalesRepository,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard(tenantId: string) {
    return this.repository.getDashboard(tenantId);
  }

  async getManagerMetrics(tenantId: string) {
    return this.repository.getManagerMetrics(tenantId);
  }

  async getExecutiveForecast(tenantId: string) {
    return this.repository.getExecutiveForecast(tenantId);
  }

  async getNextBestActions(tenantId: string) {
    return this.repository.getNextBestActions(tenantId);
  }

  async getLeads(tenantId: string) {
    return this.repository.getLeads(tenantId);
  }

  async createLead(tenantId: string, dto: CreateLeadDto, userId?: string) {
    const lead = await this.repository.createLead(tenantId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "CREATE",
        entityType: "LEAD",
        entityId: lead.id,
        metadata: { name: dto.contactName, company: dto.companyName },
      });
    }
    return lead;
  }

  async updateLeadStatus(
    tenantId: string,
    leadId: string,
    dto: UpdateLeadStatusDto,
    userId?: string,
  ) {
    const lead = await this.repository.updateLeadStatus(tenantId, leadId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "UPDATE_STATUS",
        entityType: "LEAD",
        entityId: leadId,
        metadata: { status: dto.status },
      });
    }
    return lead;
  }

  async convertLead(tenantId: string, leadId: string, actorId: string) {
    const opportunity = await this.repository.convertLead(
      tenantId,
      leadId,
      actorId,
    );
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "sales",
      action: "CONVERT",
      entityType: "LEAD",
      entityId: leadId,
      metadata: { opportunityId: opportunity.id },
    });
    return opportunity;
  }

  async getOpportunities(tenantId: string) {
    return this.repository.getOpportunities(tenantId);
  }

  async createOpportunity(
    tenantId: string,
    dto: CreateOpportunityDto,
    userId?: string,
  ) {
    const opportunity = await this.repository.createOpportunity(tenantId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "CREATE",
        entityType: "OPPORTUNITY",
        entityId: opportunity.id,
        metadata: { title: dto.accountName, value: dto.amount },
      });
    }
    return opportunity;
  }

  async moveOpportunityStage(
    tenantId: string,
    opportunityId: string,
    dto: MoveOpportunityStageDto,
    userId?: string,
  ) {
    const opportunity = await this.repository.moveOpportunityStage(
      tenantId,
      opportunityId,
      dto,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "MOVE_STAGE",
        entityType: "OPPORTUNITY",
        entityId: opportunityId,
        metadata: { stage: dto.stage },
      });
    }
    return opportunity;
  }

  async closeOpportunity(
    tenantId: string,
    opportunityId: string,
    dto: CloseOpportunityDto,
    userId?: string,
  ) {
    const opportunity = await this.repository.closeOpportunity(
      tenantId,
      opportunityId,
      dto,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "CLOSE",
        entityType: "OPPORTUNITY",
        entityId: opportunityId,
        metadata: { status: dto.result, reason: dto.reason },
      });
    }
    return opportunity;
  }

  async getQuotes(tenantId: string) {
    return this.repository.getQuotes(tenantId);
  }

  async createQuote(tenantId: string, dto: CreateQuoteDto, userId?: string) {
    const quote = await this.repository.createQuote(tenantId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "CREATE",
        entityType: "QUOTE",
        entityId: quote.id,
        metadata: {
          opportunityId: dto.opportunityId,
          amount: dto.amount,
        },
      });
    }
    return quote;
  }

  async submitQuote(tenantId: string, quoteId: string, userId?: string) {
    const quote = await this.repository.submitQuote(tenantId, quoteId);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "SUBMIT",
        entityType: "QUOTE",
        entityId: quoteId,
      });
    }
    return quote;
  }

  async decideQuote(
    tenantId: string,
    quoteId: string,
    dto: QuoteDecisionDto,
    userId?: string,
  ) {
    const quote = await this.repository.decideQuote(tenantId, quoteId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "DECIDE",
        entityType: "QUOTE",
        entityId: quoteId,
        metadata: { approved: dto.approved },
      });
    }
    return quote;
  }

  async getTimeline(tenantId: string) {
    return this.repository.getTimeline(tenantId);
  }

  async createTimelineEvent(
    tenantId: string,
    dto: CreateTimelineEventDto,
    userId?: string,
  ) {
    const event = await this.repository.createTimelineEvent(tenantId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "CREATE_EVENT",
        entityType: "TIMELINE",
        entityId: event.id,
        metadata: { channel: dto.channel, summary: dto.summary },
      });
    }
    return event;
  }

  async getTasks(tenantId: string) {
    return this.repository.getTasks(tenantId);
  }

  async createTask(tenantId: string, dto: CreateTaskDto, userId?: string) {
    const task = await this.repository.createTask(tenantId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "CREATE",
        entityType: "TASK",
        entityId: task.id,
        metadata: { title: dto.title, dueAt: dto.dueAt },
      });
    }
    return task;
  }

  async completeTask(tenantId: string, taskId: string, userId?: string) {
    const task = await this.repository.completeTask(tenantId, taskId);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "sales",
        action: "COMPLETE",
        entityType: "TASK",
        entityId: taskId,
      });
    }
    return task;
  }

  async getOrders(tenantId: string) {
    return this.repository.getOrders(tenantId);
  }

  async getAlerts(tenantId: string) {
    return this.repository.getAlerts(tenantId);
  }

  async runSlaSweep(tenantId: string, actorId: string) {
    const alerts = await this.repository.runSlaSweep(tenantId, actorId);
    await this.auditService.log({
      tenantId,
      userId: actorId,
      module: "sales",
      action: "RUN_SLA_SWEEP",
      entityType: "SYSTEM",
      entityId: "sla-engine",
      metadata: { alertsFound: alerts.length },
    });
    return alerts;
  }

  async getAuditEvents(tenantId: string) {
    return this.repository.getAuditEvents(tenantId);
  }
}
