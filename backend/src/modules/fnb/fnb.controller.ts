import { Controller, Get, Post, Body, Param, ParseIntPipe, Req, UseInterceptors, UseGuards } from '@nestjs/common';
import { FnbService } from './fnb.service';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantContext } from '../../gateway/tenant-context.interface';
import { Request } from 'express';
import { TenantGuard } from '../../shared/guards/tenant.guard';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller('fnb')
@UseInterceptors(TenantInterceptor)
@UseGuards(TenantGuard)
export class FnbController {
  constructor(private readonly fnbService: FnbService) {}

  @Get('recipes')
  async getRecipes(@Req() request: RequestWithTenant) {
    return this.fnbService.getAllRecipes(request.tenantContext);
  }

  @Post('recipes/:id/produce')
  async auditProduction(
    @Req() request: RequestWithTenant,
    @Param('id') recipeId: string,
    @Body('yieldQty', ParseIntPipe) yieldQty: number,
  ) {
    return this.fnbService.auditProduction(request.tenantContext, recipeId, yieldQty);
  }
}
