import { Injectable } from "@nestjs/common";
import { CreateRequisitionDto } from "./dto/create-requisition.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { ReleasePoDto } from "./dto/release-po.dto";
import { IProcurementRepository } from "./repositories/procurement.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class ProcurementService {
  constructor(
    private readonly repository: IProcurementRepository,
    private readonly auditService: AuditService,
  ) {}

  async getSuppliers(tenantId: string) {
    return this.repository.getSuppliers(tenantId);
  }

  async createSupplier(
    tenantId: string,
    data: CreateSupplierDto,
    userId?: string,
  ) {
    const supplier = await this.repository.createSupplier(tenantId, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "procurement",
        action: "CREATE",
        entityType: "SUPPLIER",
        entityId: supplier.id,
        metadata: { name: data.name, category: data.category },
      });
    }
    return supplier;
  }

  async getRequisitions(tenantId: string) {
    return this.repository.getRequisitions(tenantId);
  }

  async createRequisition(
    tenantId: string,
    data: CreateRequisitionDto,
    userId?: string,
  ) {
    const requisition = await this.repository.createRequisition(tenantId, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "procurement",
        action: "CREATE",
        entityType: "REQUISITION",
        entityId: requisition.id,
        metadata: {
          title: data.title,
          amount: data.amount,
          requesterDept: data.requesterDept,
        },
      });
    }
    return requisition;
  }

  async approveRequesterHod(
    tenantId: string,
    requisitionId: string,
    userId?: string,
  ) {
    const requisition = await this.repository.approveRequesterHod(
      tenantId,
      requisitionId,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "procurement",
        action: "APPROVE_HOD",
        entityType: "REQUISITION",
        entityId: requisitionId,
      });
    }
    return requisition;
  }

  async releasePurchaseOrder(
    tenantId: string,
    data: ReleasePoDto,
    userId?: string,
  ) {
    const po = await this.repository.releasePurchaseOrder(tenantId, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "procurement",
        action: "RELEASE",
        entityType: "PURCHASE_ORDER",
        entityId: po.id,
        metadata: {
          requisitionId: data.requisitionId,
          supplierId: po.supplierId,
        },
      });
    }
    return po;
  }

  async getPurchaseOrders(tenantId: string) {
    return this.repository.getPurchaseOrders(tenantId);
  }

  async getRiskSignals(tenantId: string) {
    return this.repository.getRiskSignals(tenantId);
  }

  async runRiskScan(tenantId: string, userId?: string) {
    const results = await this.repository.runRiskScan(tenantId);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "procurement",
        action: "RUN_RISK_SCAN",
        entityType: "SYSTEM",
        entityId: "risk-engine",
        metadata: { signalsFound: results.length },
      });
    }
    return results;
  }

  async getSupplierBranches(tenantId: string) {
    return this.repository.getSupplierBranches(tenantId);
  }

  async getSupplierProducts(tenantId: string) {
    return this.repository.getSupplierProducts(tenantId);
  }

  async getSupplierRecommendations(tenantId: string, params: any) {
    return this.repository.getSupplierRecommendations(tenantId, params);
  }

  async getDraftPurchaseOrders(tenantId: string) {
    return this.repository.getDraftPurchaseOrders(tenantId);
  }

  async getContracts(tenantId: string) {
    return this.repository.getContracts(tenantId);
  }

  async getAuditEvents(tenantId: string) {
    return this.repository.getAuditEvents(tenantId);
  }

  async getSpendInsights(tenantId: string) {
    return this.repository.getSpendInsights(tenantId);
  }
}
