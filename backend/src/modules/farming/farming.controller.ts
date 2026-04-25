import { Controller, Get, Post, Body, Param, Req, UseInterceptors, UseGuards, Ip } from '@nestjs/common';
import { FarmingService } from './farming.service';
import { IoTGatewayService } from './iot-gateway.service';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantContext } from '../../gateway/tenant-context.interface';
import { Request } from 'express';
import { TenantGuard } from '../../shared/guards/tenant.guard';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller('farming')
@UseInterceptors(TenantInterceptor)
@UseGuards(TenantGuard)
export class FarmingController {
  constructor(
    private readonly farmingService: FarmingService,
    private readonly iotGateway: IoTGatewayService,
  ) {}

  @Get('sensors/:sensor_id/logs')
  async getLogs(
    @Req() request: RequestWithTenant,
    @Param('sensor_id') sensor_id: string,
  ) {
    return this.farmingService.getLogs(request.tenantContext, sensor_id);
  }

  /**
   * Enterprise IoT Ingestion Entry Point
   * Handles high-frequency telemetry JSON payloads.
   */
  @Post('iot/ingest')
  async ingestTelemetry(
    @Req() request: RequestWithTenant,
    @Req() req: any,
    @Body() payload: any,
  ) {
    const deviceModel = req.headers['x-device-model'] as string;
    const ip = req.ip;
    return this.iotGateway.handleHttpTelemetry(request.tenantContext, payload, { ip, deviceModel });
  }

  @Post('sensors/log')
  async logReading(
    @Req() request: RequestWithTenant,
    @Req() req: any,
    @Body() data: any,
  ) {
    const deviceModel = req.headers['x-device-model'] as string;
    const ip = req.ip;
    return this.farmingService.logReading(request.tenantContext, { ...data, metadata: { ...data.metadata, ip, deviceModel } });
  }
}
