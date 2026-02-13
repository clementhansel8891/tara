import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ITSettingsService } from './it-settings.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantContext } from '../../gateway/tenant-context.interface';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller('it-settings')
@UseInterceptors(TenantInterceptor)
export class ITSettingsController {
  constructor(private readonly itSettingsService: ITSettingsService) {}

  @Get('devices')
  async getDevices(
    @Req() request: RequestWithTenant,
    @Query('locationId') locationId?: string,
  ) {
    const { tenantId } = request.tenantContext;
    const devices = await this.itSettingsService.getDevices(tenantId, locationId);
    return {
      success: true,
      tenantId,
      count: devices.length,
      data: devices,
    };
  }

  @Post('devices')
  async registerDevice(
    @Req() request: RequestWithTenant,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    const { tenantId } = request.tenantContext;
    const device = await this.itSettingsService.registerDevice(tenantId, registerDeviceDto);
    return {
      success: true,
      tenantId,
      message: 'Device registered successfully',
      data: device,
    };
  }

  @Put('devices/:id/status')
  async updateDeviceStatus(
    @Req() request: RequestWithTenant,
    @Param('id') deviceId: string,
    @Body() body: { status: string },
  ) {
    const { tenantId } = request.tenantContext;
    const device = await this.itSettingsService.updateDeviceStatus(tenantId, deviceId, body.status);
    return {
      success: true,
      tenantId,
      message: 'Device status updated',
      data: device,
    };
  }

  @Get('settings')
  async getSettings(
    @Req() request: RequestWithTenant,
    @Query('category') category?: string,
  ) {
    const { tenantId } = request.tenantContext;
    const settings = await this.itSettingsService.getSettings(tenantId, category);
    return {
      success: true,
      tenantId,
      count: settings.length,
      data: settings,
    };
  }

  @Get('settings/:key')
  async getSetting(@Req() request: RequestWithTenant, @Param('key') key: string) {
    const { tenantId } = request.tenantContext;
    const setting = await this.itSettingsService.getSetting(tenantId, key);
    if (!setting) {
      return {
        success: false,
        tenantId,
        message: 'Setting not found',
        data: null,
      };
    }
    return {
      success: true,
      tenantId,
      data: setting,
    };
  }

  @Put('settings/:key')
  async updateSetting(
    @Req() request: RequestWithTenant,
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    const { tenantId } = request.tenantContext;
    const setting = await this.itSettingsService.updateSetting(tenantId, key, updateSettingDto);
    return {
      success: true,
      tenantId,
      message: 'Setting updated successfully',
      data: setting,
    };
  }
}
