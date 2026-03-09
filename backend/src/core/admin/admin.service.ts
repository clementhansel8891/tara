import { Injectable } from "@nestjs/common";
import { CreateAdminRequestDto } from "./dto/create-admin-request.dto";
import { ToggleModuleDto } from "./dto/toggle-module.dto";
import { IAdminRepository } from "./repositories/admin.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly repository: IAdminRepository,
    private readonly auditService: AuditService,
  ) {}

  async getModuleStatuses(tenantId: string) {
    return this.repository.getModuleStatuses(tenantId);
  }

  async toggleModule(tenantId: string, dto: ToggleModuleDto, actorId?: string) {
    const result = await this.repository.toggleModule(tenantId, dto);
    if (actorId) {
      await this.auditService.log({
        tenantId,
        userId: actorId,
        module: "admin",
        action: "TOGGLE_MODULE",
        entityType: "MODULE",
        entityId: dto.moduleKey,
        metadata: { status: dto.enabled ? "enabled" : "disabled" },
      });
    }
    return result;
  }

  async getRequests(tenantId: string) {
    return this.repository.getRequests(tenantId);
  }

  async createRequest(
    tenantId: string,
    dto: CreateAdminRequestDto,
    actorId?: string,
  ) {
    const request = await this.repository.createRequest(tenantId, dto);
    if (actorId) {
      await this.auditService.log({
        tenantId,
        userId: actorId,
        module: "admin",
        action: "CREATE",
        entityType: "ADMIN_REQUEST",
        entityId: request.id,
        metadata: { type: dto.type, title: dto.title },
      });
    }
    return request;
  }

  async resolveRequest(
    tenantId: string,
    requestId: string,
    resolvedBy: string,
  ) {
    const request = await this.repository.resolveRequest(
      tenantId,
      requestId,
      resolvedBy,
    );
    await this.auditService.log({
      tenantId,
      userId: resolvedBy,
      module: "admin",
      action: "RESOLVE",
      entityType: "ADMIN_REQUEST",
      entityId: requestId,
    });
    return request;
  }

  async getAuditEvents(tenantId: string) {
    return this.repository.getAuditEvents(tenantId);
  }
}
