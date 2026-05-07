import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Req,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { Request } from "express";
import { TenantContext } from "../../gateway/tenant-context.interface";
import { TenantInterceptor } from "../../gateway/tenant.interceptor";
import { ModuleStateGuard } from "../auth/guards/module-state.guard";
import { BranchGatingGuard } from "../auth/guards/branch-gating.guard";
import { RequiredModule } from "../../shared/decorators/required-module.decorator";
import { TenantGuard } from "../../shared/guards/tenant.guard";
import { CaptureLeadDto } from "./dto/capture-lead.dto";
import { ConnectAccountDto } from "./dto/connect-account.dto";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { RunExecutionDto } from "./dto/run-execution.dto";
import { ScheduleExecutionDto } from "./dto/schedule-execution.dto";
import { UpdateAccountStatusDto } from "./dto/update-account-status.dto";
import { UpdateAccountSettingsDto } from "./dto/update-account-settings.dto";
import { UpdateCampaignStatusDto } from "./dto/update-campaign-status.dto";
import { UpdateWorkflowStatusDto } from "./dto/update-workflow-status.dto";
import { MarketingService } from "./marketing.service";
import { Customer360Service } from "./customer-360.service";
import { BookingService } from "./booking.service";
import { OmnichannelService } from "./omnichannel.service";
import { SocialSyncService } from "./social-sync.service";
import { PrismaService } from "../../persistence/prisma.service";
import { isModuleActive } from "../../shared/helpers/module-active.helper";
import { MultiTenancyUtil } from "../../shared/utils/multi-tenancy.util";
import { Query } from "@nestjs/common";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller('marketing')
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, BranchGatingGuard, TenantGuard)
@RequiredModule("marketing")
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
    private readonly prisma: PrismaService,
    private readonly customer360: Customer360Service,
    private readonly bookingService: BookingService,
    private readonly omnichannel: OmnichannelService,
    private readonly socialSync: SocialSyncService,
  ) {}

  private actor_id(request: RequestWithTenant) {
    const value = request.headers["x-actor-id"];
    return typeof value === "string" && value.trim().length > 0
      ? value
      : "system";
  }

  @Get("dashboard")
  async getDashboard(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const dashboardData = await this.marketingService.getDashboard(request.tenantContext);

    const moduleContributions: any = {};
    if (await isModuleActive(this.prisma, tenant_id, "retail")) {
      const walkInCustomers = await this.prisma.retail_orders.count({
        where: { ...MultiTenancyUtil.getScope(request.tenantContext), customer_id: null },
      });
      const loyaltyMembers = await this.prisma.retail_orders.groupBy({
        by: ["customer_id"],
        where: { ...MultiTenancyUtil.getScope(request.tenantContext), customer_id: { not: null } },
      });
      moduleContributions.retail = {
        walkInCustomers,
        loyaltyActive: loyaltyMembers.length,
      };
    }

    return {
      success: true,
      tenant_id,
      data: {
        ...dashboardData,
        moduleContributions,
      },
    };
  }

  @Get("channel-performance")
  async getChannelPerformance(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getChannelPerformance(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Get("campaigns")
  async getCampaigns(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getCampaigns(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("campaigns")
  async createCampaign(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateCampaignDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Campaign created",
      data: await this.marketingService.createCampaign(
        request.tenantContext,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Put("campaigns/:id/status")
  async updateCampaignStatus(
    @Req() request: RequestWithTenant,
    @Param("id") campaignId: string,
    @Body() dto: UpdateCampaignStatusDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Campaign status updated",
      data: await this.marketingService.updateCampaignStatus(
        request.tenantContext,
        campaignId,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Get("executions")
  async getExecutions(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getExecutions(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("executions")
  async scheduleExecution(
    @Req() request: RequestWithTenant,
    @Body() dto: ScheduleExecutionDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Execution scheduled",
      data: await this.marketingService.scheduleExecution(
        request.tenantContext,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Put("executions/:id/run")
  async runExecution(
    @Req() request: RequestWithTenant,
    @Param("id") executionId: string,
    @Body() dto: RunExecutionDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Execution update applied",
      data: await this.marketingService.runExecution(
        request.tenantContext,
        executionId,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Get("leads")
  async getLeads(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getLeads(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Get("contacts")
  async getContacts(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getContacts(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("leads")
  async captureLead(
    @Req() request: RequestWithTenant,
    @Body() dto: CaptureLeadDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Lead captured",
      data: await this.marketingService.captureLead(
        request.tenantContext,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Put("leads/:id/handoff-ready")
  async markLeadHandoffReady(
    @Req() request: RequestWithTenant,
    @Param("id") lead_id: string,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Lead marked handoff-ready",
      data: await this.marketingService.markLeadHandoffReady(
        request.tenantContext,
        lead_id,
        this.actor_id(request),
      ),
    };
  }

  @Put("leads/:id/handoff-sales")
  async handoffLeadToSales(
    @Req() request: RequestWithTenant,
    @Param("id") lead_id: string,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Lead handed off to Sales",
      data: await this.marketingService.handoffLeadToSales(
        request.tenantContext,
        lead_id,
        this.actor_id(request),
      ),
    };
  }

  @Get("workflows")
  async getWorkflows(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getWorkflows(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("workflows")
  async createWorkflow(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateWorkflowDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Workflow created",
      data: await this.marketingService.createWorkflow(
        request.tenantContext,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Put("workflows/:id/status")
  async updateWorkflowStatus(
    @Req() request: RequestWithTenant,
    @Param("id") workflowId: string,
    @Body() dto: UpdateWorkflowStatusDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Workflow status updated",
      data: await this.marketingService.updateWorkflowStatus(
        request.tenantContext,
        workflowId,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Get("accounts")
  async getAccounts(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getConnectedAccounts(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("accounts")
  async connectAccount(
    @Req() request: RequestWithTenant,
    @Body() dto: ConnectAccountDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Account connected",
      data: await this.marketingService.connectAccount(
        request.tenantContext,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Put("accounts/:id/status")
  async updateAccountStatus(
    @Req() request: RequestWithTenant,
    @Param("id") accountId: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Account status updated",
      data: await this.marketingService.updateAccountStatus(
        request.tenantContext,
        accountId,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Put("accounts/:id/settings")
  async updateAccountSettings(
    @Req() request: RequestWithTenant,
    @Param("id") accountId: string,
    @Body() dto: UpdateAccountSettingsDto,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Account configuration updated",
      data: await this.marketingService.updateAccountSettings(
        request.tenantContext,
        accountId,
        dto,
        this.actor_id(request),
      ),
    };
  }

  @Delete("accounts/:id")
  async deleteAccount(
    @Req() request: RequestWithTenant,
    @Param("id") accountId: string,
  ) {
    const { tenant_id } = request.tenantContext;
    await this.marketingService.deleteAccount(
      request.tenantContext,
      accountId,
      this.actor_id(request),
    );
    return {
      success: true,
      tenant_id,
      message: "Account decommissioned",
    };
  }

  @Post("accounts/:id/sync")
  async triggerManualSync(
    @Req() request: RequestWithTenant,
    @Param("id") accountId: string,
  ) {
    const { tenant_id } = request.tenantContext;
    const result = await this.marketingService.triggerManualSync(
      request.tenantContext,
      accountId,
      this.actor_id(request),
    );
    return {
      success: true,
      tenant_id,
      message: "Manual synchronization complete",
      data: result,
    };
  }

  @Get("attribution")
  async getAttribution(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getAttribution(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Get("alerts")
  async getAlerts(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getAlerts(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Put("alerts/:id/ack")
  async acknowledgeAlert(
    @Req() request: RequestWithTenant,
    @Param("id") alertId: string,
  ) {
    const { tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Alert acknowledged",
      data: await this.marketingService.acknowledgeAlert(request.tenantContext, alertId),
    };
  }

  @Post("health-sweep")
  async runHealthSweep(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.runHealthSweep(
      request.tenantContext,
      this.actor_id(request),
    );
    return {
      success: true,
      tenant_id,
      message: "Health sweep executed",
      count: data.length,
      data,
    };
  }

  @Get("audit-events")
  async getAuditEvents(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getAuditEvents(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  // --- Growth Engine: Customer 360 ---

  @Get("customers/:id/profile")
  async getCustomerProfile(@Param("id") id: string, @Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.customer360.getUnifiedProfile(request.tenantContext, id);
    return { success: true, tenant_id, data };
  }

  @Post("contacts/sync")
  async syncContact(@Body() body: { type: "LEAD" | "RETAIL", id: string }, @Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.customer360.syncContactFromEntity(request.tenantContext, body.type, body.id);
    return { success: true, tenant_id, data };
  }

  // --- Growth Engine: Appointments ---

  @Get("appointments")
  async getAppointments(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.bookingService.getAppointments(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("appointments")
  async createAppointment(@Body() body: any, @Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.bookingService.createAppointment(request.tenantContext, body);
    return { success: true, tenant_id, message: "Appointment created", data };
  }

  // --- Growth Engine: Omnichannel ---

  @Post("messages/send")
  async sendMessage(@Body() body: { contactId: string, channel: string, content: string }, @Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.omnichannel.sendMessage(request.tenantContext, body.contactId, body.channel, body.content);
    return { success: true, tenant_id, data };
  }

  @Get("channels/status")
  async getChannelStatus() {
    return { success: true, data: this.omnichannel.getChannelStatus() };
  }

  // --- Growth Engine: Funnels ---

  @Get("funnels")
  async getFunnels(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getFunnels(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("funnels")
  async createFunnel(@Req() request: RequestWithTenant, @Body() body: any) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.createFunnel(request.tenantContext, body, this.actor_id(request));
    return { success: true, tenant_id, message: "Funnel created", data };
  }

  @Put("funnels/:id")
  async updateFunnel(@Req() request: RequestWithTenant, @Param("id") id: string, @Body() body: any) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.updateFunnel(request.tenantContext, id, body, this.actor_id(request));
    return { success: true, tenant_id, message: "Funnel updated", data };
  }

  @Get("assets")
  async getCreativeAssets(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.getCreativeAssets(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("assets")
  async createCreativeAsset(@Req() request: RequestWithTenant, @Body() body: any) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.createCreativeAsset(request.tenantContext, body, this.actor_id(request));
    return { success: true, tenant_id, message: "Asset created", data };
  }

  @Put("assets/:id")
  async updateCreativeAsset(@Req() request: RequestWithTenant, @Param("id") id: string, @Body() body: any) {
    const { tenant_id } = request.tenantContext;
    const data = await this.marketingService.updateCreativeAsset(request.tenantContext, id, body, this.actor_id(request));
    return { success: true, tenant_id, message: "Asset updated", data };
  }

  @Post("assets/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), "storage", "marketing", "assets");
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadAsset(
    @Req() request: RequestWithTenant,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const { tenant_id } = request.tenantContext;
    const assetData = {
      name: body.name || file.originalname,
      type: file.mimetype.startsWith("image") ? "IMAGE" : file.mimetype.startsWith("video") ? "VIDEO" : "DOCUMENT",
      url: `/api/v1/marketing/assets/raw/${file.filename}`,
      metadata: {
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
      },
    };
    const data = await this.marketingService.createCreativeAsset(request.tenantContext, assetData, this.actor_id(request));
    return { success: true, tenant_id, message: "Asset uploaded and registered", data };
  }

  @Get("assets/raw/:filename")
  async getRawAsset(@Param("filename") filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), "storage", "marketing", "assets", filename);
    if (!existsSync(filePath)) {
      return res.status(404).send("File not found");
    }
    return res.sendFile(filePath);
  }

  @Get("conversations")
  async getConversations(@Req() request: RequestWithTenant) {
    const { tenant_id } = request.tenantContext;
    const data = await this.omnichannel.getConversations(request.tenantContext);
    return { success: true, tenant_id, count: data.length, data };
  }

  // --- OAuth Callbacks ---

  @Get("oauth/callback/meta")
  async handleMetaCallback(
    @Req() request: RequestWithTenant,
    @Query("code") code: string,
    @Res() res: Response,
  ) {
    await this.socialSync.handleMetaCallback(request.tenantContext, code);
    // Redirect back to frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/marketing/accounts?status=success&provider=meta`);
  }

  @Get("oauth/callback/google")
  async handleGoogleCallback(
    @Req() request: RequestWithTenant,
    @Query("code") code: string,
    @Res() res: Response,
  ) {
    await this.socialSync.handleGoogleCallback(request.tenantContext, code);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/marketing/accounts?status=success&provider=google`);
  }

  @Get("oauth/callback/tiktok")
  async handleTikTokCallback(
    @Req() request: RequestWithTenant,
    @Query("code") code: string,
    @Res() res: Response,
  ) {
    await this.socialSync.handleTikTokCallback(request.tenantContext, code);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/marketing/accounts?status=success&provider=tiktok`);
  }

  @Get("oauth/callback/youtube")
  async handleYoutubeCallback(
    @Req() request: RequestWithTenant,
    @Query("code") code: string,
    @Res() res: Response,
  ) {
    await this.socialSync.handleYoutubeCallback(request.tenantContext, code);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/marketing/accounts?status=success&provider=youtube`);
  }

  @Get("webhooks/meta")
  verifyMetaWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    if (mode === "subscribe" && token === verifyToken) {
      return challenge;
    }
    return "Verification failed";
  }

  @Post("webhooks/meta")
  async handleMetaWebhook(@Body() payload: any) {
    await this.omnichannel.processInboundWebhook(payload);
    return { success: true };
  }

  @Get("oauth/authorize/:provider")
  async getAuthUrl(
    @Req() request: RequestWithTenant,
    @Param("provider") provider: string,
  ) {
    const tenant_id = request.tenantContext.tenant_id;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    
    if (provider === "meta") {
      const appId = process.env.META_APP_ID;
      const redirectUri = encodeURIComponent(`${backendUrl}/marketing/oauth/callback/meta`);
      const scopes = encodeURIComponent("ads_read,ads_management,leads_retrieval");
      return { 
        url: `https://www.facebook.com/v17.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&state=${tenant_id}&scope=${scopes}` 
      };
    } else if (provider === "google") {
      const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${backendUrl}/marketing/oauth/callback/google`);
      const scopes = encodeURIComponent("https://www.googleapis.com/auth/adwords");
      return {
        url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${tenant_id}&response_type=code&scope=${scopes}&access_type=offline`
      };
    } else if (provider === "tiktok") {
      const clientId = process.env.TIKTOK_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${backendUrl}/marketing/oauth/callback/tiktok`);
      const scopes = encodeURIComponent("user.info.basic,video.list,video.stats");
      return {
        url: `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientId}&redirect_uri=${redirectUri}&state=${tenant_id}&response_type=code&scope=${scopes}`
      };
    } else if (provider === "youtube") {
      const clientId = process.env.GOOGLE_ADS_CLIENT_ID; // Usually same project as Google Ads
      const redirectUri = encodeURIComponent(`${backendUrl}/marketing/oauth/callback/youtube`);
      const scopes = encodeURIComponent("https://www.googleapis.com/auth/youtube.readonly");
      return {
        url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${tenant_id}&response_type=code&scope=${scopes}&access_type=offline`
      };
    }
    
    return { url: null };
  }
}
