import { TenantContext } from "../../gateway/tenant-context.interface";
import { Injectable } from "@nestjs/common";
import { IITSettingsRepository } from "./repositories/it-settings.repository.interface";
import { Device } from "./entities/device.entity";
import { Setting } from "./entities/setting.entity";
import { RegisterDeviceDto } from "./dto/register-device.dto";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { AuditService } from "../../shared/audit/audit.service";
import { PrismaService } from "../../persistence/prisma.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ITSettingsService {
  constructor(
    private readonly repository: IITSettingsRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async getDevices(ctx: TenantContext, location_id?: string): Promise<Device[]> {
    return this.repository.getDevices(ctx, location_id);
  }

  async registerDevice(ctx: TenantContext,
    data: RegisterDeviceDto,
    user_id?: string,
  ): Promise<Device> {
    const device = await this.repository.registerDevice(ctx, data);
    if (user_id) {
      await this.auditService.log({
        tenant_id: ctx.tenant_id,
        user_id,
        module: "it-settings",
        action: "REGISTER",
        entity_type: "DEVICE",
        entity_id: device.id,
        metadata: { name: data.deviceName, type: data.deviceType },
      });
    }
    return device;
  }

  async updateDeviceStatus(ctx: TenantContext,
    device_id: string,
    status: string,
    user_id?: string,
  ): Promise<Device> {
    const device = await this.repository.updateDeviceStatus(
      ctx,
      device_id,
      status,
    );
    if (user_id) {
      await this.auditService.log({
        tenant_id: ctx.tenant_id,
        user_id,
        module: "it-settings",
        action: "UPDATE_STATUS",
        entity_type: "DEVICE",
        entity_id: device_id,
        metadata: { status },
      });
    }
    return device;
  }

  async getSettings(ctx: TenantContext, category?: string): Promise<Setting[]> {
    return this.repository.getSettings(ctx, category);
  }

  async getSetting(ctx: TenantContext, key: string): Promise<Setting | null> {
    return this.repository.getSetting(ctx, key);
  }

  async updateSetting(ctx: TenantContext,
    key: string,
    data: UpdateSettingDto,
    user_id?: string,
  ): Promise<Setting> {
    const setting = await this.repository.updateSetting(ctx, key, data);
    if (user_id) {
      await this.auditService.log({
        tenant_id: ctx.tenant_id,
        user_id,
        module: "it-settings",
        action: "UPDATE",
        entity_type: "SETTING",
        entity_id: key,
        metadata: { value: data.value, category: data.category },
      });
    }
    return setting;
  }

  /**
   * List provisioning requests backed by audit_logs
   * (entity_type = 'PROVISIONING_REQUEST', module = 'it-provisioning').
   * The full request payload is stored in the `metadata` JSON column.
   */
  async listProvisioningRequests(ctx: TenantContext, locationId?: string): Promise<any[]> {
    const logs = await this.prisma.audit_logs.findMany({
      where: {
        tenant_id: ctx.tenant_id,
        module: "it-provisioning",
        entity_type: "PROVISIONING_REQUEST",
        action: "CREATE",
        ...(locationId ? { metadata: { path: ["locationId"], equals: locationId } } : {}),
      },
      orderBy: { created_at: "desc" },
      take: 200,
    });

    return logs.map((log) => ({
      id: log.entity_id,
      tenantId: log.tenant_id,
      requesterId: log.user_id,
      createdAt: log.created_at,
      updatedAt: log.updated_at,
      status: (log.metadata as any)?.status ?? "PENDING",
      ...((log.metadata as any) ?? {}),
    }));
  }

  /**
   * Create a provisioning request persisted as an audit_log entry.
   */
  async createProvisioningRequest(ctx: TenantContext, data: any, user_id?: string): Promise<any> {
    const requestId = data.id ?? uuidv4();
    const payload = {
      ...data,
      id: requestId,
      status: data.status ?? "PENDING",
    };

    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id: user_id ?? ctx.user_id ?? "system",
      module: "it-provisioning",
      action: "CREATE",
      entity_type: "PROVISIONING_REQUEST",
      entity_id: requestId,
      metadata: payload,
    });

    return {
      id: requestId,
      tenantId: ctx.tenant_id,
      requesterId: user_id ?? ctx.user_id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "PENDING",
      ...data,
    };
  }
}

