import { TenantContext } from "../../../gateway/tenant-context.interface";
import { Injectable, NotFoundException } from "@nestjs/common";
import { IITSettingsRepository } from "./it-settings.repository.interface";
import { Device } from "../entities/device.entity";
import { Setting } from "../entities/setting.entity";
import { RegisterDeviceDto } from "../dto/register-device.dto";
import { UpdateSettingDto } from "../dto/update-setting.dto";

@Injectable()
export class ITSettingsMockRepository extends IITSettingsRepository {
  private devices: Device[] = [];
  private settings: Setting[] = [];

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Tenant 001 devices
    this.devices.push(
      {
        id: "tenant-001-dev-1",
        tenant_id: "tenant-001",
        location_id: "location-001",
        deviceType: "pos",
        deviceName: "POS Terminal 1",
        ip_address: "192.168.1.101",
        macAddress: "00:1B:44:11:3A:B7",
        status: "online",
        lastSeen: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "tenant-001-dev-2",
        tenant_id: "tenant-001",
        location_id: "location-001",
        deviceType: "biometric",
        deviceName: "Fingerprint Scanner",
        ip_address: "192.168.1.102",
        status: "online",
        lastSeen: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    );

    // Tenant 002 devices
    this.devices.push(
      {
        id: "tenant-002-dev-1",
        tenant_id: "tenant-002",
        location_id: "location-002",
        deviceType: "pos",
        deviceName: "Store POS 1",
        ip_address: "192.168.2.101",
        status: "online",
        lastSeen: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "tenant-002-dev-2",
        tenant_id: "tenant-002",
        location_id: "location-002",
        deviceType: "pos",
        deviceName: "Store POS 2",
        ip_address: "192.168.2.102",
        status: "online",
        lastSeen: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    );

    // Tenant 001 settings
    this.settings.push(
      {
        id: "tenant-001-set-1",
        tenant_id: "tenant-001",
        key: "company.timezone",
        value: "America/New_York",
        category: "general",
        isPublic: true,
        description: "Company timezone",
        created_at: new Date(),
        updated_at: new Date(),
      },
    );

    // Tenant 002 settings
    this.settings.push(
      {
        id: "tenant-002-set-1",
        tenant_id: "tenant-002",
        key: "company.timezone",
        value: "Asia/Singapore",
        category: "general",
        isPublic: true,
        description: "Company timezone",
        created_at: new Date(),
        updated_at: new Date(),
      },
    );
  }

  async getDevices(ctx: TenantContext, location_id?: string): Promise<Device[]> {
    let devices = this.devices.filter((dev) => dev.tenant_id === ctx.tenant_id);
    if (location_id) {
      devices = devices.filter((dev) => dev.location_id === location_id);
    }
    return devices;
  }

  async registerDevice(
    ctx: TenantContext,
    data: RegisterDeviceDto,
  ): Promise<Device> {
    const device: Device = {
      id: `${ctx.tenant_id}-dev-${this.devices.length + 1}`,
      tenant_id: ctx.tenant_id,
      location_id: data.location_id,
      deviceType: data.deviceType as any,
      deviceName: data.deviceName,
      ip_address: data.ip_address,
      macAddress: data.macAddress,
      status: "online",
      lastSeen: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.devices.push(device);
    return device;
  }

  async updateDeviceStatus(
    ctx: TenantContext,
    device_id: string,
    status: string,
  ): Promise<Device> {
    const index = this.devices.findIndex(
      (dev) => dev.tenant_id === ctx.tenant_id && dev.id === device_id,
    );
    if (index === -1) {
      throw new NotFoundException("Device not found");
    }
    this.devices[index].status = status as any;
    this.devices[index].lastSeen = new Date();
    this.devices[index].updated_at = new Date();
    return this.devices[index];
  }

  async getSettings(ctx: TenantContext, category?: string): Promise<Setting[]> {
    let settings = this.settings.filter((set) => set.tenant_id === ctx.tenant_id);
    if (category) {
      settings = settings.filter((set) => set.category === category);
    }
    return settings;
  }

  async getSetting(ctx: TenantContext, key: string): Promise<Setting | null> {
    const setting = this.settings.find(
      (set) => set.tenant_id === ctx.tenant_id && set.key === key,
    );
    return setting || null;
  }

  async updateSetting(
    ctx: TenantContext,
    key: string,
    data: UpdateSettingDto,
  ): Promise<Setting> {
    const index = this.settings.findIndex(
      (set) => set.tenant_id === ctx.tenant_id && set.key === key,
    );

    if (index === -1) {
      // Create new setting
      const setting: Setting = {
        id: `${ctx.tenant_id}-set-${this.settings.length + 1}`,
        tenant_id: ctx.tenant_id,
        key,
        value: data.value,
        category: (data.category as any) || "general",
        isPublic: data.isPublic ?? true,
        description: data.description,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.settings.push(setting);
      return setting;
    }

    // Update existing setting
    this.settings[index] = {
      ...this.settings[index],
      value: data.value,
      category: (data.category as any) || this.settings[index].category,
      isPublic: data.isPublic ?? this.settings[index].isPublic,
      description: data.description || this.settings[index].description,
      updated_at: new Date(),
    };
    return this.settings[index];
  }
}
