import { Controller, Get, Post, Body, Param, Put, UseInterceptors, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { RetailInfrastructureService } from './retail-infrastructure.service';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantContext } from '../../gateway/tenant-context.interface';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller('retail/infrastructure')
@UseInterceptors(TenantInterceptor)
export class RetailInfrastructureController {
  constructor(private readonly infraService: RetailInfrastructureService) {}

  @Get('nodes')
  async listNodes(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    return this.infraService.listGatewayNodes(tenantId);
  }

  @Put('nodes/:id/status')
  async setNodeStatus(
    @Req() request: RequestWithTenant,
    @Param('id') nodeId: string,
    @Body('status') status: 'ACTIVE' | 'STANDBY' | 'DOWN',
  ) {
    const { tenantId } = request.tenantContext;
    return this.infraService.setNodeStatus(tenantId, nodeId, status);
  }

  @Get('load-balancers')
  async listLoadBalancers(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    return this.infraService.listLoadBalancers(tenantId);
  }

  @Post('load-balancers')
  async createLoadBalancer(
    @Req() request: RequestWithTenant,
    @Body() data: any,
  ) {
    const { tenantId } = request.tenantContext;
    return this.infraService.createLoadBalancer(tenantId, data);
  }

  @Put('load-balancers/:id')
  async updateLoadBalancer(
    @Req() request: RequestWithTenant,
    @Param('id') lbId: string,
    @Body() data: any,
  ) {
    const { tenantId } = request.tenantContext;
    return this.infraService.updateLoadBalancer(tenantId, lbId, data);
  }
}
