import { TenantContext } from "../../../gateway/tenant-context.interface";
import { Device } from "../entities/device.entity";
import { Setting } from "../entities/setting.entity";
import { RegisterDeviceDto } from "../dto/register-device.dto";
import { UpdateSettingDto } from "../dto/update-setting.dto";

export abstract class IITSettingsRepository {
  abstract getDevices( ctx: TenantContext, location_id?: string): Promise<Device[]>;
  abstract registerDevice( ctx: TenantContext,
    data: RegisterDeviceDto,
  ): Promise<Device>;
  abstract updateDeviceStatus( ctx: TenantContext,
    device_id: string,
    status: string,
  ): Promise<Device>;
  abstract getSettings( ctx: TenantContext, category?: string): Promise<Setting[]>;
  abstract getSetting( ctx: TenantContext, key: string): Promise<Setting | null>;
  abstract updateSetting( ctx: TenantContext,
    key: string,
    data: UpdateSettingDto,
  ): Promise<Setting>;
}
