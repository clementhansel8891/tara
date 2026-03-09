import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { TenantContext } from "../../gateway/tenant-context.interface";
import { TenantInterceptor } from "../../gateway/tenant.interceptor";
import { ModuleStateGuard } from "../auth/guards/module-state.guard";
import { BranchGatingGuard } from "../auth/guards/branch-gating.guard";
import { RequiredModule } from "../../shared/decorators/required-module.decorator";
import { TenantGuard } from "../../shared/guards/tenant.guard";
import { CloseOpportunityDto } from "./dto/close-opportunity.dto";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { CreateQuoteDto } from "./dto/create-quote.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { CreateTimelineEventDto } from "./dto/create-timeline-event.dto";
import { MoveOpportunityStageDto } from "./dto/move-opportunity-stage.dto";
import { QuoteDecisionDto } from "./dto/quote-decision.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { SalesService } from "./sales.service";
import { PrismaService } from "../../persistence/prisma.service";
import { isModuleActive } from "../../shared/helpers/module-active.helper";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller("sales")
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, BranchGatingGuard, TenantGuard)
@RequiredModule("sales")
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("dashboard")
  async getDashboard(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const dashboardData = await this.salesService.getDashboard(tenantId);

    // Core Module Integration: Retail Contributions
    const moduleContributions: any = {};
    if (await isModuleActive(this.prisma, tenantId, "retail")) {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const retailRevenueAgg = await this.prisma.retailOrder.aggregate({
        where: {
          tenantId,
          status: { in: ["COMPLETED", "PAID", "complete", "paid"] },
          createdAt: { gte: startOfWeek },
        },
        _sum: { totalAmount: true },
      });

      const retailOrders = await this.prisma.retailOrder.count({
        where: {
          tenantId,
          createdAt: { gte: startOfWeek },
        },
      });

      moduleContributions.retail = {
        retailRevenue: retailRevenueAgg._sum.totalAmount?.toNumber() || 0,
        retailOrders,
      };
    }

    return {
      success: true,
      tenantId,
      data: {
        ...dashboardData,
        moduleContributions,
      },
    };
  }

  @Get("manager-metrics")
  async getManagerMetrics(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      data: await this.salesService.getManagerMetrics(tenantId),
    };
  }

  @Get("executive-forecast")
  async getExecutiveForecast(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      data: await this.salesService.getExecutiveForecast(tenantId),
    };
  }

  @Get("nba")
  async getNextBestActions(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      data: await this.salesService.getNextBestActions(tenantId),
    };
  }

  @Get("leads")
  async getLeads(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getLeads(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }

  @Post("leads")
  async createLead(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateLeadDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Lead created",
      data: await this.salesService.createLead(tenantId, dto, userId),
    };
  }

  @Put("leads/:id/status")
  async updateLeadStatus(
    @Req() request: RequestWithTenant,
    @Param("id") leadId: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Lead status updated",
      data: await this.salesService.updateLeadStatus(
        tenantId,
        leadId,
        dto,
        userId,
      ),
    };
  }

  @Post("leads/:id/convert")
  async convertLead(
    @Req() request: RequestWithTenant,
    @Param("id") leadId: string,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Lead converted to opportunity",
      data: await this.salesService.convertLead(
        tenantId,
        leadId,
        userId || "system",
      ),
    };
  }

  @Get("opportunities")
  async getOpportunities(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getOpportunities(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }

  @Post("opportunities")
  async createOpportunity(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateOpportunityDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Opportunity created",
      data: await this.salesService.createOpportunity(tenantId, dto, userId),
    };
  }

  @Put("opportunities/:id/stage")
  async moveOpportunityStage(
    @Req() request: RequestWithTenant,
    @Param("id") opportunityId: string,
    @Body() dto: MoveOpportunityStageDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Opportunity stage updated",
      data: await this.salesService.moveOpportunityStage(
        tenantId,
        opportunityId,
        dto,
        userId,
      ),
    };
  }

  @Put("opportunities/:id/close")
  async closeOpportunity(
    @Req() request: RequestWithTenant,
    @Param("id") opportunityId: string,
    @Body() dto: CloseOpportunityDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Opportunity close operation complete",
      data: await this.salesService.closeOpportunity(
        tenantId,
        opportunityId,
        dto,
        userId,
      ),
    };
  }

  @Get("quotes")
  async getQuotes(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getQuotes(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }

  @Post("quotes")
  async createQuote(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateQuoteDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Quote created",
      data: await this.salesService.createQuote(tenantId, dto, userId),
    };
  }

  @Put("quotes/:id/submit")
  async submitQuote(
    @Req() request: RequestWithTenant,
    @Param("id") quoteId: string,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Quote submitted for approval",
      data: await this.salesService.submitQuote(tenantId, quoteId, userId),
    };
  }

  @Put("quotes/:id/decision")
  async decideQuote(
    @Req() request: RequestWithTenant,
    @Param("id") quoteId: string,
    @Body() dto: QuoteDecisionDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Quote decision recorded",
      data: await this.salesService.decideQuote(tenantId, quoteId, dto, userId),
    };
  }

  @Get("timeline")
  async getTimeline(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getTimeline(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }

  @Post("timeline")
  async createTimelineEvent(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateTimelineEventDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Timeline event created",
      data: await this.salesService.createTimelineEvent(tenantId, dto, userId),
    };
  }

  @Get("tasks")
  async getTasks(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getTasks(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }

  @Post("tasks")
  async createTask(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateTaskDto,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Task created",
      data: await this.salesService.createTask(tenantId, dto, userId),
    };
  }

  @Put("tasks/:id/done")
  async completeTask(
    @Req() request: RequestWithTenant,
    @Param("id") taskId: string,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return {
      success: true,
      tenantId,
      message: "Task marked done",
      data: await this.salesService.completeTask(tenantId, taskId, userId),
    };
  }

  @Get("orders")
  async getOrders(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getOrders(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }

  @Get("alerts")
  async getAlerts(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getAlerts(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }

  @Post("sla-sweep")
  async runSlaSweep(@Req() request: RequestWithTenant) {
    const { tenantId, userId } = request.tenantContext;
    const data = await this.salesService.runSlaSweep(
      tenantId,
      userId || "system",
    );
    return {
      success: true,
      tenantId,
      message: "SLA sweep executed",
      count: data.length,
      data,
    };
  }

  @Get("audit-events")
  async getAuditEvents(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const data = await this.salesService.getAuditEvents(tenantId);
    return { success: true, tenantId, count: data.length, data };
  }
}
