import { CreateProvisioningRequestDto } from "../dto/create-provisioning-request.dto";
import { ProvisioningRequest } from "../entities/provisioning-request.entity";
import { SystemHealth } from "../entities/system-health.entity";
import { Device, DeviceEvent } from "../entities/device.entity";
import { CreateDeviceDto, CreateDeviceEventDto } from "../dto/device.dto";

export abstract class IITRepository {
  // Provisioning
  abstract getProvisioningRequests(
    tenantId: string,
  ): Promise<ProvisioningRequest[]>;
  abstract createProvisioningRequest(
    tenantId: string,
    dto: CreateProvisioningRequestDto,
  ): Promise<ProvisioningRequest>;
  abstract markProvisioned(
    tenantId: string,
    requestId: string,
    provisionedBy: string,
  ): Promise<ProvisioningRequest>;
  abstract updateProvisioningRequest(
    tenantId: string,
    requestId: string,
    dto: Partial<CreateProvisioningRequestDto>,
  ): Promise<ProvisioningRequest>;
  abstract deleteProvisioningRequest(
    tenantId: string,
    requestId: string,
  ): Promise<void>;

  // Devices (NEW)
  abstract getDevices(tenantId: string): Promise<Device[]>;
  abstract createDevice(tenantId: string, dto: CreateDeviceDto): Promise<Device>;
  abstract updateDevice(
    tenantId: string,
    deviceId: string,
    dto: Partial<CreateDeviceDto>,
  ): Promise<Device>;
  abstract getDevice(tenantId: string, deviceId: string): Promise<Device | null>;

  // Device Events (NEW)
  abstract getDeviceEvents(tenantId: string): Promise<DeviceEvent[]>;
  abstract createDeviceEvent(
    tenantId: string,
    dto: CreateDeviceEventDto,
  ): Promise<DeviceEvent>;

  // Misc
  abstract getSystemHealth(tenantId: string): Promise<SystemHealth[]>;
  abstract getProvisioningStats(tenantId: string): Promise<any>;
  abstract getAuditLogs(tenantId: string, requestId?: string): Promise<any[]>;
}
