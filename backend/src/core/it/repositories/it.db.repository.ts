import { Injectable } from '@nestjs/common';
import { ITProvisioningRequest, ITSystemHealth } from '../../../generated/client';
import { PrismaService } from '../../../persistence/prisma.service';
import { CreateProvisioningRequestDto } from '../dto/create-provisioning-request.dto';
import { ProvisioningRequest } from '../entities/provisioning-request.entity';
import { SystemHealth } from '../entities/system-health.entity';
import { IITRepository } from './it.repository.interface';

@Injectable()
export class ITDbRepository extends IITRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getProvisioningRequests(tenantId: string): Promise<ProvisioningRequest[]> {
    const requests = await this.prisma.iTProvisioningRequest.findMany({
      where: { companyId: tenantId },
    });

    return requests.map((r: ITProvisioningRequest) => ({
      id: r.id,
      tenantId: r.companyId,
      employeeId: r.employeeId || undefined,
      supplierId: r.supplierId || undefined,
      supplierBranchId: r.supplierBranchId || undefined,
      scope: (r.scope as any) || 'full_portal',
      reason: r.reason || '',
      status: r.status.toLowerCase() as any,
      requestedBy: r.requestedBy,
      provisionedBy: r.provisionedBy || undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async createProvisioningRequest(
    tenantId: string,
    dto: CreateProvisioningRequestDto,
  ): Promise<ProvisioningRequest> {
    const created = await this.prisma.iTProvisioningRequest.create({
      data: {
        companyId: tenantId,
        employeeId: dto.employeeId,
        supplierId: dto.supplierId,
        supplierBranchId: dto.supplierBranchId,
        scope: dto.scope,
        reason: dto.reason,
        status: 'REQUESTED',
        requestedBy: 'system', // In real app, this would be from auth
      },
    });

    return {
      id: created.id,
      tenantId: created.companyId,
      employeeId: created.employeeId || undefined,
      supplierId: created.supplierId || undefined,
      supplierBranchId: created.supplierBranchId || undefined,
      scope: (created.scope as any) || 'full_portal',
      reason: created.reason || '',
      status: 'requested',
      requestedBy: created.requestedBy,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async markProvisioned(
    tenantId: string,
    requestId: string,
    provisionedBy: string,
  ): Promise<ProvisioningRequest> {
    const updated = await this.prisma.iTProvisioningRequest.update({
      where: { id: requestId, companyId: tenantId },
      data: {
        status: 'PROVISIONED',
        provisionedBy,
      },
    });

    return {
      id: updated.id,
      tenantId: updated.companyId,
      employeeId: updated.employeeId || undefined,
      supplierId: updated.supplierId || undefined,
      supplierBranchId: updated.supplierBranchId || undefined,
      scope: (updated.scope as any) || 'full_portal',
      reason: updated.reason || '',
      status: 'provisioned',
      requestedBy: updated.requestedBy,
      provisionedBy: updated.provisionedBy || undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getSystemHealth(tenantId: string): Promise<SystemHealth[]> {
    const health = await this.prisma.iTSystemHealth.findMany({
      where: { companyId: tenantId },
      orderBy: { checkedAt: 'desc' },
      take: 20,
    });

    return health.map((h: ITSystemHealth) => ({
      id: h.id,
      tenantId: h.companyId,
      component: h.component as any,
      status: h.status.toLowerCase() as any,
      latencyMs: h.latencyMs,
      checkedAt: h.checkedAt,
    }));
  }
}
