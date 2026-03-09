import { Injectable } from "@nestjs/common";
import { IITSettingsRepository } from "./repositories/it-settings.repository.interface";
import { Device } from "./entities/device.entity";
import { Setting } from "./entities/setting.entity";
import { RegisterDeviceDto } from "./dto/register-device.dto";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class ITSettingsService {
  constructor(
    private readonly repository: IITSettingsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getDevices(tenantId: string, locationId?: string): Promise<Device[]> {
    return this.repository.getDevices(tenantId, locationId);
  }

  async registerDevice(
    tenantId: string,
    data: RegisterDeviceDto,
    userId?: string,
  ): Promise<Device> {
    const device = await this.repository.registerDevice(tenantId, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it-settings",
        action: "REGISTER",
        entityType: "DEVICE",
        entityId: device.id,
        metadata: { name: data.deviceName, type: data.deviceType },
      });
    }
    return device;
  }

  async updateDeviceStatus(
    tenantId: string,
    deviceId: string,
    status: string,
    userId?: string,
  ): Promise<Device> {
    const device = await this.repository.updateDeviceStatus(
      tenantId,
      deviceId,
      status,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it-settings",
        action: "UPDATE_STATUS",
        entityType: "DEVICE",
        entityId: deviceId,
        metadata: { status },
      });
    }
    return device;
  }

  async getSettings(tenantId: string, category?: string): Promise<Setting[]> {
    return this.repository.getSettings(tenantId, category);
  }

  async getSetting(tenantId: string, key: string): Promise<Setting | null> {
    return this.repository.getSetting(tenantId, key);
  }

  async updateSetting(
    tenantId: string,
    key: string,
    data: UpdateSettingDto,
    userId?: string,
  ): Promise<Setting> {
    const setting = await this.repository.updateSetting(tenantId, key, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it-settings",
        action: "UPDATE",
        entityType: "SETTING",
        entityId: key,
        metadata: { value: data.value, category: data.category },
      });
    }
    return setting;
  }
}
