import { Injectable } from "@nestjs/common";
import { CreateProvisioningRequestDto } from "./dto/create-provisioning-request.dto";
import { IITRepository } from "./repositories/it.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class ITService {
  constructor(
    private readonly repository: IITRepository,
    private readonly auditService: AuditService,
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
