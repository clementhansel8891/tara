import { Injectable } from '@nestjs/common';
import { IITSettingsRepository } from './repositories/it-settings.repository.interface';
import { Device } from './entities/device.entity';
import { Setting } from './entities/setting.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class ITSettingsService {
  constructor(private readonly repository: IITSettingsRepository) {}

  async getDevices(tenantId: string, locationId?: string): Promise<Device[]> {
    return this.repository.getDevices(tenantId, locationId);
  }

  async registerDevice(tenantId: string, data: RegisterDeviceDto): Promise<Device> {
    return this.repository.registerDevice(tenantId, data);
  }

  async updateDeviceStatus(tenantId: string, deviceId: string, status: string): Promise<Device> {
    return this.repository.updateDeviceStatus(tenantId, deviceId, status);
  }

  async getSettings(tenantId: string, category?: string): Promise<Setting[]> {
    return this.repository.getSettings(tenantId, category);
  }

  async getSetting(tenantId: string, key: string): Promise<Setting | null> {
    return this.repository.getSetting(tenantId, key);
  }

  async updateSetting(tenantId: string, key: string, data: UpdateSettingDto): Promise<Setting> {
    return this.repository.updateSetting(tenantId, key, data);
  }
}
