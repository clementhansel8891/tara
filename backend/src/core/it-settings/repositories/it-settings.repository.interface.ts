import { Device } from '../entities/device.entity';
import { Setting } from '../entities/setting.entity';
import { RegisterDeviceDto } from '../dto/register-device.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';

export abstract class IITSettingsRepository {
  abstract getDevices(tenantId: string, locationId?: string): Promise<Device[]>;
  abstract registerDevice(tenantId: string, data: RegisterDeviceDto): Promise<Device>;
  abstract updateDeviceStatus(tenantId: string, deviceId: string, status: string): Promise<Device>;
  abstract getSettings(tenantId: string, category?: string): Promise<Setting[]>;
  abstract getSetting(tenantId: string, key: string): Promise<Setting | null>;
  abstract updateSetting(tenantId: string, key: string, data: UpdateSettingDto): Promise<Setting>;
}
