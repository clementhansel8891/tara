import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  UseGuards, 
  Req, 
  UseInterceptors
} from "@nestjs/common";
import { SalesOperationalService } from "../sales-operational.service";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { TenantGuard } from "../../../shared/guards/tenant.guard";
import { UserRole } from "../../../shared/roles";
import { TenantInterceptor } from "../../../gateway/tenant.interceptor";
import { TenantContext } from "../../../gateway/tenant-context.interface";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
  user?: any;
}

@Controller('sales/operational')
@UseInterceptors(TenantInterceptor)
@UseGuards(RolesGuard, TenantGuard)
export class SalesOperationalController {
  constructor(private readonly salesService: SalesOperationalService) {}

  @Get("leads")
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async getLeads(
    @Req() req: RequestWithTenant,
    @Query("status") status?: string,
  ) {
    return this.salesService.getLeads(req.tenantContext, status);
  }

  @Post("leads")
  @Roles(UserRole.MEMBER, UserRole.ADMIN)
  async createLead(
    @Req() req: RequestWithTenant,
    @Body() data: any,
  ) {
    const user_id = req.user?.id || "system";
    return this.salesService.createLead(req.tenantContext, data, user_id);
  }

  @Get("opportunities")
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async getOpportunities(
    @Req() req: RequestWithTenant,
    @Query("stage") stage?: string,
  ) {
    return this.salesService.getOpportunities(req.tenantContext, stage);
  }

  @Get("deals")
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async getDeals(
    @Req() req: RequestWithTenant,
    @Query("status") status?: string,
  ) {
    return this.salesService.getDeals(req.tenantContext, status);
  }

  @Get("quotes")
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async getQuotes(
    @Req() req: RequestWithTenant,
    @Query("dealId") dealId?: string,
  ) {
    return this.salesService.getQuotes(req.tenantContext, dealId);
  }
}
