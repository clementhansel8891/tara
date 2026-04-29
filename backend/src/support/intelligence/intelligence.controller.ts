import { Controller, Get, Query, Req, UseGuards, UseInterceptors, ForbiddenException } from "@nestjs/common";
import { Request } from "express";
import { IntelligenceService } from "./intelligence.service";
import { TenantInterceptor } from "../../gateway/tenant.interceptor";
import { TenantGuard } from "../../shared/guards/tenant.guard";
import { TenantContext } from "../../gateway/tenant-context.interface";
import { UserRole } from "../../shared/roles";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * Explorer Controller
 * Platform-wide intelligence and search
 */
@Controller('intelligence')
@UseInterceptors(TenantInterceptor)
@UseGuards(TenantGuard)
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  private ensureSuperAdmin(role: string) {
    if (role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Access Denied: Global Explorer is restricted to Superadmins only.");
    }
  }

  @Get("workforce/headcount")
  async getGlobalHeadcount(@Req() request: RequestWithTenant) {
    this.ensureSuperAdmin(request.tenantContext.role || "");
    const data = await this.intelligenceService.getGlobalHeadcount();
    return { success: true, data };
  }

  @Get("workforce/compensation")
  async getGlobalCompensation(@Req() request: RequestWithTenant) {
    this.ensureSuperAdmin(request.tenantContext.role || "");
    const data = await this.intelligenceService.getGlobalCompensationStats();
    return { success: true, data };
  }

  @Get("search")
  async globalSearch(
    @Req() request: RequestWithTenant,
    @Query("q") query: string
  ) {
    this.ensureSuperAdmin(request.tenantContext.role || "");
    const results = await this.intelligenceService.globalSearch(query);
    return { success: true, data: results };
  }

  @Get("workforce/readiness")
  async getRegionalReadiness(@Req() request: RequestWithTenant) {
    this.ensureSuperAdmin(request.tenantContext.role || "");
    const data = await this.intelligenceService.getRegionalReadiness();
    return { success: true, data };
  }
}
