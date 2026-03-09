import { audit } from "@/core/logging/audit";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { loadFromStorage, saveToStorage } from "@/core/persistence";
import type {
  GoodsReceiptSyncRecord,
  GoodsReceiptSyncStatus,
  LegalContractHandoff,
  LegalHandoffStatus,
  SupplierAccessProvisioning,
  SupplierAccessProvisioningStatus,
} from "@/core/types/procurement/procurement";

const legalHandoffsKey = (tenantId: string) =>
  `proc:${tenantId}:integrations:legal-handoffs`;
const inventorySyncKey = (tenantId: string) =>
  `proc:${tenantId}:integrations:inventory-sync`;
const supplierAccessKey = (tenantId: string) =>
  `proc:${tenantId}:integrations:supplier-access`;

const nowIso = () => new Date().toISOString();
const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const ensureTenantAccess = (tenantId: string, actor: SessionContext) => {
  if (actor.role === Roles.SUPERADMIN) return;
  if (actor.tenantId !== tenantId) throw new Error("Tenant access denied");
};

const updateById = <T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>,
): { updated: T | null; next: T[] } => {
  let updated: T | null = null;
  const next = items.map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch };
    return updated;
  });
  return { updated, next };
};

export const procurementIntegrationAdapters = {
  listLegalHandoffs(
    tenantId: string,
    actor: SessionContext,
  ): LegalContractHandoff[] {
    return loadFromStorage<LegalContractHandoff[]>(
      legalHandoffsKey(tenantId),
      [],
    );
  },

  requestLegalContractHandoff(
    tenantId: string,
    actor: SessionContext,
    payload: {
      requisitionId: string;
      contractId: string;
      supplierId: string;
      notes?: string;
      workflowRequestId?: string;
    },
  ): LegalContractHandoff {
    ensureTenantAccess(tenantId, actor);
    const current = this.listLegalHandoffs(tenantId);
    const existing = current.find(
      (item) => item.contractId === payload.contractId,
    );
    const nextStatus: LegalHandoffStatus = "PENDING_LEGAL_ACK";

    if (existing) {
      const next = current.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              requisitionId: payload.requisitionId,
              supplierId: payload.supplierId,
              notes: payload.notes ?? item.notes,
              workflowRequestId:
                payload.workflowRequestId ?? item.workflowRequestId,
              status: nextStatus,
              updatedAt: nowIso(),
            }
          : item,
      );
      const updated = next.find((item) => item.id === existing.id);
      saveToStorage(legalHandoffsKey(tenantId), next);
      if (!updated) throw new Error("Failed to update legal handoff.");
      audit.log({
        tenantId,
        actorId: actor.userId,
        action: "procurement.integration.legal_handoff.requested",
        entityType: "legal_handoff",
        entityId: updated.id,
        after: {
          contractId: updated.contractId,
          status: updated.status,
        },
      });
      return updated;
    }

    const created: LegalContractHandoff = {
      id: createId("proc-legal"),
      tenantId,
      requisitionId: payload.requisitionId,
      contractId: payload.contractId,
      supplierId: payload.supplierId,
      requestedBy: actor.userId,
      notes: payload.notes,
      workflowRequestId: payload.workflowRequestId,
      status: nextStatus,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    saveToStorage(legalHandoffsKey(tenantId), [created, ...current]);
    audit.log({
      tenantId,
      actorId: actor.userId,
      action: "procurement.integration.legal_handoff.requested",
      entityType: "legal_handoff",
      entityId: created.id,
      after: {
        contractId: created.contractId,
        status: created.status,
      },
    });
    return created;
  },

  setLegalHandoffStatus(
    tenantId: string,
    actor: SessionContext,
    handoffId: string,
    status: LegalHandoffStatus,
  ): LegalContractHandoff {
    ensureTenantAccess(tenantId, actor);
    const current = this.listLegalHandoffs(tenantId);
    const patch: Partial<LegalContractHandoff> = {
      status,
      updatedAt: nowIso(),
    };
    if (status === "ACKNOWLEDGED") patch.acknowledgedBy = actor.userId;
    if (status === "CONTRACT_ACCEPTED") patch.acceptedBy = actor.userId;
    const { updated, next } = updateById(current, handoffId, patch);
    if (!updated) throw new Error("Legal handoff not found.");
    saveToStorage(legalHandoffsKey(tenantId), next);
    audit.log({
      tenantId,
      actorId: actor.userId,
      action: "procurement.integration.legal_handoff.updated",
      entityType: "legal_handoff",
      entityId: updated.id,
      after: {
        status: updated.status,
      },
    });
    return updated;
  },

  listGoodsReceiptSyncs(
    tenantId: string,
    actor: SessionContext,
  ): GoodsReceiptSyncRecord[] {
    return loadFromStorage<GoodsReceiptSyncRecord[]>(
      inventorySyncKey(tenantId),
      [],
    );
  },

  queueGoodsReceiptSync(
    tenantId: string,
    actor: SessionContext,
    payload: {
      finalPoId: string;
      requisitionId: string;
      supplierId: string;
      supplierBranchId: string;
      branchCode: string;
      expectedDeliveryDate?: string;
    },
  ): GoodsReceiptSyncRecord {
    ensureTenantAccess(tenantId, actor);
    const current = this.listGoodsReceiptSyncs(tenantId);
    const existing = current.find(
      (item) => item.finalPoId === payload.finalPoId,
    );
    const nextStatus: GoodsReceiptSyncStatus = "PENDING_RECEIPT";

    if (existing) {
      const next = current.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              requisitionId: payload.requisitionId,
              supplierId: payload.supplierId,
              supplierBranchId: payload.supplierBranchId,
              branchCode: payload.branchCode,
              expectedDeliveryDate: payload.expectedDeliveryDate,
              status: nextStatus,
              updatedAt: nowIso(),
            }
          : item,
      );
      const updated = next.find((item) => item.id === existing.id);
      saveToStorage(inventorySyncKey(tenantId), next);
      if (!updated) throw new Error("Failed to update inventory sync queue.");
      return updated;
    }

    const created: GoodsReceiptSyncRecord = {
      id: createId("proc-grn-sync"),
      tenantId,
      finalPoId: payload.finalPoId,
      requisitionId: payload.requisitionId,
      supplierId: payload.supplierId,
      supplierBranchId: payload.supplierBranchId,
      branchCode: payload.branchCode,
      expectedDeliveryDate: payload.expectedDeliveryDate,
      status: nextStatus,
      issueCount: 0,
      invoiceMismatch: false,
      requestedBy: actor.userId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    saveToStorage(inventorySyncKey(tenantId), [created, ...current]);
    return created;
  },

  setGoodsReceiptSyncStatus(
    tenantId: string,
    actor: SessionContext,
    syncId: string,
    payload: {
      status: GoodsReceiptSyncStatus;
      issueCount: number;
      invoiceMismatch: boolean;
    },
  ): GoodsReceiptSyncRecord {
    ensureTenantAccess(tenantId, actor);
    const { updated, next } = updateById(
      this.listGoodsReceiptSyncs(tenantId),
      syncId,
      {
        status: payload.status,
        issueCount: payload.issueCount,
        invoiceMismatch: payload.invoiceMismatch,
        syncedBy: actor.userId,
        syncedAt: nowIso(),
        updatedAt: nowIso(),
      },
    );
    if (!updated) throw new Error("Goods receipt sync record not found.");
    saveToStorage(inventorySyncKey(tenantId), next);
    audit.log({
      tenantId,
      actorId: actor.userId,
      action: "procurement.integration.inventory_sync.updated",
      entityType: "goods_receipt_sync",
      entityId: updated.id,
      after: {
        status: updated.status,
        issueCount: updated.issueCount,
        invoiceMismatch: updated.invoiceMismatch,
      },
    });
    return updated;
  },

  listSupplierAccessProvisioning(
    tenantId: string,
    actor: SessionContext,
  ): SupplierAccessProvisioning[] {
    return loadFromStorage<SupplierAccessProvisioning[]>(
      supplierAccessKey(tenantId),
      [],
    );
  },

  requestSupplierAccessProvisioning(
    tenantId: string,
    actor: SessionContext,
    payload: {
      supplierId: string;
      supplierBranchId: string;
      portalScope: SupplierAccessProvisioning["portalScope"];
      reason: string;
      approvedBy?: string;
    },
  ): SupplierAccessProvisioning {
    ensureTenantAccess(tenantId, actor);
    const current = this.listSupplierAccessProvisioning(tenantId);
    const existing = current.find(
      (item) =>
        item.supplierId === payload.supplierId &&
        item.supplierBranchId === payload.supplierBranchId &&
        item.status !== "REVOKED",
    );
    if (existing) return existing;
    const created: SupplierAccessProvisioning = {
      id: createId("proc-sup-access"),
      tenantId,
      supplierId: payload.supplierId,
      supplierBranchId: payload.supplierBranchId,
      requestedBy: actor.userId,
      portalScope: payload.portalScope,
      reason: payload.reason,
      status: "REQUESTED",
      approvedBy: payload.approvedBy,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    saveToStorage(supplierAccessKey(tenantId), [created, ...current]);
    audit.log({
      tenantId,
      actorId: actor.userId,
      action: "procurement.integration.supplier_access.requested",
      entityType: "supplier_access",
      entityId: created.id,
      after: {
        supplierId: created.supplierId,
        supplierBranchId: created.supplierBranchId,
        status: created.status,
      },
    });
    return created;
  },

  setSupplierAccessProvisioningStatus(
    tenantId: string,
    actor: SessionContext,
    provisioningId: string,
    status: SupplierAccessProvisioningStatus,
  ): SupplierAccessProvisioning {
    ensureTenantAccess(tenantId, actor);
    const patch: Partial<SupplierAccessProvisioning> = {
      status,
      updatedAt: nowIso(),
    };
    if (status === "PROVISIONED") patch.provisionedBy = actor.userId;
    const { updated, next } = updateById(
      this.listSupplierAccessProvisioning(tenantId),
      provisioningId,
      patch,
    );
    if (!updated)
      throw new Error("Supplier access provisioning record not found.");
    saveToStorage(supplierAccessKey(tenantId), next);
    audit.log({
      tenantId,
      actorId: actor.userId,
      action: "procurement.integration.supplier_access.updated",
      entityType: "supplier_access",
      entityId: updated.id,
      after: {
        status: updated.status,
      },
    });
    return updated;
  },
};
