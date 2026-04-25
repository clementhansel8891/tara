import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ISalesRepository,
  SalesDashboard,
  SalesManagerMetrics,
  SalesExecutiveForecast,
  SalesNextAction,
} from "./sales.repository.interface";
import { TenantContext } from "../../../gateway/tenant-context.interface";
import { MultiTenancyUtil } from "../../../shared/utils/multi-tenancy.util";
import { PrismaService } from "../../../persistence/prisma.service";
import { SalesLead } from "../entities/sales-lead.entity";
import { SalesOpportunity } from "../entities/sales-opportunity.entity";
import { SalesOrder } from "../entities/sales-order.entity";
import { SalesQuote } from "../entities/sales-quote.entity";
import { SalesTask } from "../entities/sales-task.entity";
import { SalesTimelineEvent } from "../entities/sales-timeline-event.entity";
import { SalesAlert } from "../entities/sales-alert.entity";
import { SalesAuditEvent } from "../entities/sales-audit.entity";
import { CreateLeadDto } from "../dto/create-lead.dto";
import { UpdateLeadStatusDto } from "../dto/update-lead-status.dto";
import { CreateOpportunityDto } from "../dto/create-opportunity.dto";
import { MoveOpportunityStageDto } from "../dto/move-opportunity-stage.dto";
import { CloseOpportunityDto } from "../dto/close-opportunity.dto";
import { CreateQuoteDto } from "../dto/create-quote.dto";
import { QuoteDecisionDto } from "../dto/quote-decision.dto";
import { CreateTimelineEventDto } from "../dto/create-timeline-event.dto";
import { CreateTaskDto } from "../dto/create-task.dto";

@Injectable()
export class SalesDbRepository implements ISalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(ctx: TenantContext): Promise<SalesDashboard> {
    const [leads, opportunities, quotes, alerts] = await Promise.all([
      this.prisma.sales_leads.count({ where: { ...MultiTenancyUtil.getScope(ctx), status: "NEW" } }),
      this.prisma.sales_opportunities.findMany({ where: MultiTenancyUtil.getScope(ctx) }),
      this.prisma.sales_quotes.count({
        where: { ...MultiTenancyUtil.getScope(ctx), status: "PENDING_APPROVAL" },
      }),
      this.prisma.sales_alerts.count({
        where: { ...MultiTenancyUtil.getScope(ctx), acknowledged: false },
      }),
    ]);

    const pipelineValue = opportunities.reduce(
      (sum: number, op: any) => sum + Number(op.amount),
      0,
    );
    const weightedValue = opportunities.reduce(
      (sum: number, op: any) => sum + Number(op.amount) * (op.probability / 100),
      0,
    );

    return {
      openLeads: leads,
      slaDueToday: 0, // Placeholder
      overdueFollowUps: 0, // Placeholder
      openOpportunities: opportunities.length,
      pipelineValue,
      weightedPipelineValue: weightedValue,
      pendingQuoteApprovals: quotes,
      dealRiskCount: alerts,
    };
  }

  async getManagerMetrics(ctx: TenantContext): Promise<SalesManagerMetrics> {
    const opportunities = await this.prisma.sales_opportunities.findMany({
      where: MultiTenancyUtil.getScope(ctx),
    });
    return {
      totalReps: 5,
      openPipeline: opportunities.reduce(
        (sum: number, op: any) => sum + Number(op.amount),
        0,
      ),
      weightedForecast: opportunities.reduce(
        (sum: number, op: any) => sum + Number(op.amount) * (op.probability / 100),
        0,
      ),
      stalledDeals: 2,
      slaBreaches: 1,
      approvalsPending: 3,
    };
  }

  async getExecutiveForecast(ctx: TenantContext,
  ): Promise<SalesExecutiveForecast> {
    return {
      openPipelineValue: 500000000,
      weightedForecastValue: 350000000,
      wonThisPeriod: 150000000,
      lostThisPeriod: 20000000,
      conversionRate: 65,
      avgDealCycleDays: 14,
      forecastAccuracy: 92,
    };
  }

  async getNextBestActions(ctx: TenantContext): Promise<any[]> {
    return [];
  }

  async getSalesAnalytics(ctx: TenantContext): Promise<any> {
    return {};
  }

  async getForecast(ctx: TenantContext): Promise<any> {
    return {};
  }

  async getPipelineVelocity(ctx: TenantContext): Promise<any> {
    return {};
  }

  async getSLAPerformance(ctx: TenantContext): Promise<any> {
    return {};
  }

  async getLeads(ctx: TenantContext): Promise<SalesLead[]> {
    return this.prisma.sales_leads.findMany({ where: MultiTenancyUtil.getScope(ctx) }) as any;
  }

  async createLead(ctx: TenantContext, dto: CreateLeadDto, tx?: any): Promise<SalesLead> {
    return (tx || this.prisma).sales_leads.create({
      data: {
        id: 'pw28wagj',
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        ...dto,
        amount: dto.potential_value, // Map potential_value if needed or use schema field
        sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h SLA
      } as any,
    }) as any;
  }

  async updateLeadStatus(ctx: TenantContext,
    lead_id: string,
    dto: UpdateLeadStatusDto,
  ): Promise<SalesLead> {
    return this.prisma.sales_leads.update({
      where: { id: lead_id },
      data: { status: dto.status },
    }) as any;
  }

  async convertLead(ctx: TenantContext,
    lead_id: string,
    actor_id: string,
  ): Promise<SalesOpportunity> {
    const lead = await this.prisma.sales_leads.findUnique({
      where: { id: lead_id },
    });
    if (!lead) throw new NotFoundException("Lead not found");

    return this.prisma.sales_opportunities.create({
      data: {
        id: '3hwpa82g',
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        lead_id: lead_id,
        account_name: lead.company_name,
        owner_id: lead.owner_id,
        owner_name: lead.owner_name,
        amount: lead.potential_value,
        currency: lead.currency,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }) as any;
  }

  async getOpportunities(ctx: TenantContext): Promise<SalesOpportunity[]> {
    return this.prisma.sales_opportunities.findMany({
      where: MultiTenancyUtil.getScope(ctx),
    }) as any;
  }

  async createOpportunity(ctx: TenantContext,
    dto: CreateOpportunityDto,
    tx?: any
  ): Promise<SalesOpportunity> {
    return (tx || this.prisma).sales_opportunities.create({
      data: {
        id: '1n82ax4i',
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        ...dto,
      } as any,
    }) as any;
  }

  async moveOpportunityStage(ctx: TenantContext,
    opportunityId: string,
    dto: MoveOpportunityStageDto,
  ): Promise<SalesOpportunity> {
    return this.prisma.sales_opportunities.update({
      where: { id: opportunityId },
      data: { stage: dto.stage },
    }) as any;
  }

  async closeOpportunity(ctx: TenantContext,
    opportunityId: string,
    dto: CloseOpportunityDto,
  ): Promise<SalesOpportunity | SalesOrder> {
    const result = await this.prisma.sales_opportunities.update({
      where: { id: opportunityId },
      data: { stage: dto.result === "won" ? "CLOSED_WON" : "CLOSED_LOST" },
    });

    if (dto.result === "won") {
      return this.prisma.sales_orders.create({
        data: {
        id: 'k6yujvxm',
        updated_at: new Date(),
          ...MultiTenancyUtil.getScope(ctx),
          opportunity_id: opportunityId,
          customer_name: result.account_name,
          amount: result.amount,
          currency: result.currency,
          created_by: "system",
        },
      }) as any;
    }
    return result as any;
  }

  async getQuotes(ctx: TenantContext): Promise<SalesQuote[]> {
    return this.prisma.sales_quotes.findMany({ where: MultiTenancyUtil.getScope(ctx) }) as any;
  }

  async createQuote(ctx: TenantContext,
    dto: CreateQuoteDto,
  ): Promise<SalesQuote> {
    return this.prisma.sales_quotes.create({
      data: {
        id: 'c7ms6sin',
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        ...dto,
      } as any,
    }) as any;
  }

  async submitQuote(ctx: TenantContext, quoteId: string): Promise<SalesQuote> {
    return this.prisma.sales_quotes.update({
      where: { id: quoteId },
      data: { status: "PENDING_APPROVAL" },
    }) as any;
  }

  async decideQuote(ctx: TenantContext,
    quoteId: string,
    dto: QuoteDecisionDto,
  ): Promise<SalesQuote> {
    return this.prisma.sales_quotes.update({
      where: { id: quoteId },
      data: {
        status: dto.approved ? "APPROVED" : "REJECTED",
        approval_by: "manager",
        approval_at: new Date(),
      },
    }) as any;
  }

  async getTimeline(ctx: TenantContext): Promise<SalesTimelineEvent[]> {
    return this.prisma.sales_timeline_events.findMany({
      where: MultiTenancyUtil.getScope(ctx),
    }) as any;
  }

  async createTimelineEvent(ctx: TenantContext,
    dto: CreateTimelineEventDto,
  ): Promise<SalesTimelineEvent> {
    return this.prisma.sales_timeline_events.create({
      data: {
        id: 'r7o3tw1n',
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        ...dto,
      } as any,
    }) as any;
  }

  async getTasks(ctx: TenantContext): Promise<SalesTask[]> {
    return this.prisma.sales_tasks.findMany({ where: MultiTenancyUtil.getScope(ctx) }) as any;
  }

  async createTask(ctx: TenantContext, dto: CreateTaskDto): Promise<SalesTask> {
    return this.prisma.sales_tasks.create({
      data: {
        id: 't8rtxr3e',
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        ...dto,
      } as any,
    }) as any;
  }

  async getDeals(ctx: TenantContext): Promise<any[]> {
    return this.prisma.sales_opportunities.findMany({ where: { ...MultiTenancyUtil.getScope(ctx) } });
  }

  async createDeal(ctx: TenantContext, dto: any, tx?: any): Promise<any> {
    return (tx || this.prisma).sales_opportunities.create({
      data: {
        id: `DEAL-${Date.now()}`,
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        ...dto,
      },
    });
  }

  async completeTask(ctx: TenantContext, taskId: string): Promise<SalesTask> {
    return this.prisma.sales_tasks.update({
      where: { id: taskId },
      data: { status: "COMPLETED", completed_at: new Date() },
    }) as any;
  }

  async getOrders(ctx: TenantContext): Promise<SalesOrder[]> {
    return this.prisma.sales_orders.findMany({ where: MultiTenancyUtil.getScope(ctx) }) as any;
  }

  async getAlerts(ctx: TenantContext): Promise<SalesAlert[]> {
    return this.prisma.sales_alerts.findMany({ where: MultiTenancyUtil.getScope(ctx) }) as any;
  }

  async runSlaSweep(ctx: TenantContext, actor_id: string): Promise<SalesAlert[]> {
    return [];
  }

  async getAuditEvents(ctx: TenantContext): Promise<SalesAuditEvent[]> {
    return this.prisma.sales_audit_events.findMany({ where: MultiTenancyUtil.getScope(ctx) }) as any;
  }
}
