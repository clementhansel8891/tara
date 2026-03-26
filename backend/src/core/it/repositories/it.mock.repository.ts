import { CreateProvisioningRequestDto } from "../dto/create-provisioning-request.dto";
import { ProvisioningRequest } from "../entities/provisioning-request.entity";
import { SystemHealth } from "../entities/system-health.entity";
import { Device, DeviceEvent } from "../entities/device.entity";
import { CreateDeviceDto, CreateDeviceEventDto } from "../dto/device.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { IITRepository } from "./it.repository.interface";

@Injectable()
export class ITMockRepository extends IITRepository {
  private readonly provisioningRequests: ProvisioningRequest[] = [];
  private readonly healthChecks: SystemHealth[] = [];
  private readonly devices: Device[] = [];
  private readonly deviceEvents: DeviceEvent[] = [];

  constructor() {
    super();
    this.seed("tenant-001");
    this.seed("tenant-002");
  }

  private seed(tenantId: string): void {
    this.provisioningRequests.push({
      id: `${tenantId}-prov-1`,
      tenantId,
      supplierId: `${tenantId}-supplier-1`,
      supplierBranchId: `${tenantId}-supplier-1-jkt`,
      scope: "full_portal",
      priority: "MEDIUM",
      description: "Initial automated onboarding for new supplier admin.",
      reason: "Initial supplier onboarding",
      status: "requested",
      requestedBy: "procurement-admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.healthChecks.push(
      {
        id: `${tenantId}-health-1`,
        tenantId,
        component: "identity",
        status: "healthy",
        latencyMs: 42,
        checkedAt: new Date(),
      },
      {
        id: `${tenantId}-health-2`,
        tenantId,
        component: "database",
        status: "healthy",
        latencyMs: 55,
        checkedAt: new Date(),
      },
      {
        id: `${tenantId}-health-3`,
        tenantId,
        component: "integrations",
        status: "degraded",
        latencyMs: 210,
        checkedAt: new Date(),
      },
    );
  }

  async getProvisioningRequests(
    tenantId: string,
  ): Promise<ProvisioningRequest[]> {
    return this.provisioningRequests.filter(
      (item) => item.tenantId === tenantId,
    );
  }

  async createProvisioningRequest(
    tenantId: string,
    dto: CreateProvisioningRequestDto,
  ): Promise<ProvisioningRequest> {
    const created: ProvisioningRequest = {
      id: `${tenantId}-prov-${this.provisioningRequests.length + 1}`,
      tenantId,
      supplierId: dto.supplierId,
      supplierBranchId: dto.supplierBranchId,
      scope: dto.scope,
      priority: dto.priority || "MEDIUM",
      description: dto.description,
      reason: dto.reason,
      status: "requested",
      requestedBy: dto.requestedBy || "system",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.provisioningRequests.push(created);
    return created;
  }

  async markProvisioned(
    tenantId: string,
    requestId: string,
    provisionedBy: string,
  ): Promise<ProvisioningRequest> {
    const request = this.provisioningRequests.find(
      (item) => item.tenantId === tenantId && item.id === requestId,
    );
    if (!request)
      throw new NotFoundException("Provisioning request not found.");
    request.status = "provisioned";
    request.provisionedBy = provisionedBy;
    request.updatedAt = new Date();
    return request;
  }

  async updateProvisioningRequest(
    tenantId: string,
    requestId: string,
    dto: Partial<CreateProvisioningRequestDto>,
  ): Promise<ProvisioningRequest> {
    const request = this.provisioningRequests.find(
      (item) => item.tenantId === tenantId && item.id === requestId,
    );
    if (!request)
      throw new NotFoundException("Provisioning request not found.");
    if (dto.employeeId !== undefined) request.employeeId = dto.employeeId;
    if (dto.supplierId !== undefined) request.supplierId = dto.supplierId;
    if (dto.supplierBranchId !== undefined)
      request.supplierBranchId = dto.supplierBranchId;
    if (dto.scope !== undefined) request.scope = dto.scope;
    if (dto.reason !== undefined) request.reason = dto.reason;
    request.updatedAt = new Date();
    return request;
  }

  async deleteProvisioningRequest(
    tenantId: string,
    requestId: string,
  ): Promise<void> {
    const index = this.provisioningRequests.findIndex(
      (item) => item.tenantId === tenantId && item.id === requestId,
    );
    if (index === -1)
      throw new NotFoundException("Provisioning request not found.");
    this.provisioningRequests.splice(index, 1);
  }

  async getSystemHealth(tenantId: string): Promise<SystemHealth[]> {
    return this.healthChecks.filter((item) => item.tenantId === tenantId);
  }

  async getProvisioningStats(tenantId: string): Promise<any> {
    const requests = this.provisioningRequests.filter((r) => r.tenantId === tenantId);
    return {
      total: requests.length,
      requested: requests.filter((r) => r.status === "requested").length,
      provisioned: requests.filter((r) => r.status === "provisioned").length,
    };
  }

  async getAuditLogs(tenantId: string, requestId?: string): Promise<any[]> {
    return []; // Mock return
  }

  // Devices (NEW)
  async getDevices(tenantId: string): Promise<Device[]> {
    return this.devices.filter((d) => d.tenantId === tenantId);
  }

  async createDevice(tenantId: string, dto: CreateDeviceDto): Promise<Device> {
    const created: Device = {
      id: `dev-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      name: dto.name,
      type: dto.type,
      connection: dto.connection,
      status: "ONLINE",
      locationId: dto.locationId,
      ownerId: dto.ownerId,
      metadata: dto.metadata || {},
      createdAt: new Date(),
    };
    this.devices.push(created);
    return created;
  }

  async updateDevice(
    tenantId: string,
    deviceId: string,
    dto: Partial<CreateDeviceDto>,
  ): Promise<Device> {
    const device = this.devices.find((d) => d.id === deviceId && d.tenantId === tenantId);
    if (!device) throw new NotFoundException("Device not found");
    Object.assign(device, dto);
    return device;
  }

  async getDevice(tenantId: string, deviceId: string): Promise<Device | null> {
    return this.devices.find((d) => d.id === deviceId && d.tenantId === tenantId) || null;
  }

  // Device Events (NEW)
  async getDeviceEvents(tenantId: string): Promise<DeviceEvent[]> {
    return this.deviceEvents.filter((e) => e.tenantId === tenantId);
  }

  async createDeviceEvent(
    tenantId: string,
    dto: CreateDeviceEventDto,
  ): Promise<DeviceEvent> {
    const created: DeviceEvent = {
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      deviceId: dto.deviceId,
      eventType: dto.eventType,
      payload: dto.payload,
      processed: dto.processed || false,
      createdAt: new Date(),
    };
    this.deviceEvents.push(created);
    return created;
  }

}
