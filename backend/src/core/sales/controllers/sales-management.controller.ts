import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Req,
  UseInterceptors
} from "@nestjs/common";
import { SalesManagementService } from "../sales-management.service";
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

@Controller('sales/management')
@UseInterceptors(TenantInterceptor)
@UseGuards(RolesGuard, TenantGuard)
export class SalesManagementController {
  constructor(private readonly salesService: SalesManagementService) {}

  @Get("analytics")
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN)
  async getAnalytics(
    @Req() req: RequestWithTenant,
    @Query("period") period?: string,
  ) {
    return this.salesService.getSalesAnalytics(req.tenantContext, period);
  }

  @Get("forecast")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async getForecast(
    @Req() req: RequestWithTenant,
  ) {
    const user_id = req.user?.id || "system";
    return this.salesService.getForecast(req.tenantContext, user_id);
  }

  @Get("velocity")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async getVelocity(@Req() req: RequestWithTenant) {
    return this.salesService.getPipelineVelocity(req.tenantContext);
  }

  @Get("sla")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async getSLAPerformance(@Req() req: RequestWithTenant) {
    return this.salesService.getSLAPerformance(req.tenantContext);
  }
}
