import { Injectable } from "@nestjs/common";
import { CreateProvisioningRequestDto } from "./dto/create-provisioning-request.dto";
import { IITRepository } from "./repositories/it.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";
import { EventBusService } from "../../shared/events/event-bus.service";
import { CreateDeviceDto, CreateDeviceEventDto } from "./dto/device.dto";

@Injectable()
export class ITService {
  constructor(
    private readonly repository: IITRepository,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async getProvisioningRequests(tenantId: string) {
    return this.repository.getProvisioningRequests(tenantId);
  }

  async createProvisioningRequest(
    tenantId: string,
    dto: CreateProvisioningRequestDto,
    userId?: string,
  ) {
    const request = await this.repository.createProvisioningRequest(
      tenantId,
      dto,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it",
        action: "CREATE",
        entityType: "PROVISIONING_REQUEST",
        entityId: request.id,
        metadata: { ...dto },
      });
    }
    return request;
  }

  async markProvisioned(
    tenantId: string,
    requestId: string,
    provisionedBy: string,
    userId?: string,
  ) {
    const request = await this.repository.markProvisioned(
      tenantId,
      requestId,
      provisionedBy,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it",
        action: "PROVISION",
        entityType: "PROVISIONING_REQUEST",
        entityId: requestId,
        metadata: { provisionedBy },
      });
    }
    return request;
  }

  async updateProvisioningRequest(
    tenantId: string,
    requestId: string,
    dto: Partial<CreateProvisioningRequestDto>,
    userId?: string,
  ) {
    const request = await this.repository.updateProvisioningRequest(
      tenantId,
      requestId,
      dto,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it",
        action: "UPDATE",
        entityType: "PROVISIONING_REQUEST",
        entityId: requestId,
        metadata: { ...dto },
      });
    }
    return request;
  }

  async deleteProvisioningRequest(
    tenantId: string,
    requestId: string,
    userId?: string,
  ) {
    await this.repository.deleteProvisioningRequest(tenantId, requestId);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it",
        action: "DELETE",
        entityType: "PROVISIONING_REQUEST",
        entityId: requestId,
      });
    }
  }

  // Devices (NEW)
  async getDevices(tenantId: string) {
    return this.repository.getDevices(tenantId);
  }

  async createDevice(tenantId: string, dto: CreateDeviceDto, userId?: string) {
    const device = await this.repository.createDevice(tenantId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it",
        action: "CREATE",
        entityType: "DEVICE",
        entityId: device.id,
        metadata: { ...dto },
      });
    }
    return device;
  }

  async updateDevice(
    tenantId: string,
    deviceId: string,
    dto: Partial<CreateDeviceDto>,
    userId?: string,
  ) {
    const device = await this.repository.updateDevice(tenantId, deviceId, dto);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "it",
        action: "UPDATE",
        entityType: "DEVICE",
        entityId: deviceId,
        metadata: { ...dto },
      });
    }
    return device;
  }

  // Device Events (NEW)
  async getDeviceEvents(tenantId: string) {
    return this.repository.getDeviceEvents(tenantId);
  }

  async createDeviceEvent(tenantId: string, dto: CreateDeviceEventDto) {
    const event = await this.repository.createDeviceEvent(tenantId, dto);

    // Publish to EventBus for Inventory/Retail to consume
    await this.eventBus.publish({
      eventType: "DEVICE_EVENT_CREATED",
      tenantId: event.tenantId,
      entityId: event.id,
      entityType: "DEVICE_EVENT",
      sourceModule: "it",
      payload: event.payload,
    });

    return event;
  }

  // Misc
  async getSystemHealth(tenantId: string) {
    return this.repository.getSystemHealth(tenantId);
  }

  async getMonitoringStats(tenantId: string) {
    return this.repository.getProvisioningStats(tenantId);
  }

  async getAuditLogs(tenantId: string, requestId?: string) {
    return this.repository.getAuditLogs(tenantId, requestId);
  }
}
