import { audit } from "@/core/logging/audit";
import { mockProcurementRepo } from "@/core/repositories/procurement/mockProcurementRepo";
import type { SessionContext } from "@/core/security/session";
import { financeService } from "@/core/services/finance/financeService";
import { workflowService } from "@/core/services/hr/workflowService";
import { procurementIntegrationAdapters } from "@/core/services/procurement/procurementIntegrationAdapters";
import type {
  ContractRecord,
  DraftPurchaseOrder,
  FinalPurchaseOrder,
  PoLineItem,
  ProcurementAuditEvent,
  ProcurementSpendInsight,
  RatingLog,
  ReceiptRecord,
  Requisition,
  RiskSignal,
  RiskSignalStatus,
  RiskTier,
  SupplierBranch,
  SupplierMaster,
  SupplierPortalMessage,
  SupplierProduct,
  SupplierRecommendation,
} from "@/core/types/procurement/procurement";

const repo = mockProcurementRepo;

const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const ensureTenant = (tenantId: string, session: SessionContext) => {
  if (session.role === "SUPERADMIN") return;
  if (tenantId !== session.tenantId) throw new Error("Tenant access denied");
};

const emptyApprovals = () => ({
  requesterHod: false,
  procurementHodDraft: false,
  legal: false,
  financeHod: false,
  requesterHodFinal: false,
  procurementHodFinal: false,
});

const safeAverage = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

const toRiskTier = (score: number): RiskTier => {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MEDIUM";
  return "HIGH";
};

const BUDGET_LIMITS: Record<Requisition["budgetClass"], number> = {
  OPEX: 1000000000,
  CAPEX: 10000000000,
  EMERGENCY: 500000000,
};

const logEvent = (
  tenantId: string,
  actorId: string,
  action: string,
  entityType: ProcurementAuditEvent["entityType"],
  entityId: string,
  detail: string,
) => {
  const event: ProcurementAuditEvent = {
    id: createId("proc-audit"),
    tenantId,
    actorId,
    action,
    entityType,
    entityId,
    detail,
    createdAt: nowIso(),
  };
  repo.createAuditEvent(tenantId, event);
  audit.log({
    tenantId,
    actorId,
    action: `procurement.${action}`,
    entityType: entityType.toLowerCase(),
    entityId,
    after: { detail },
  });
};

const createOpenRisk = (
  tenantId: string,
  code: RiskSignal["code"],
  severity: RiskSignal["severity"],
  entityId: string,
  detail: string,
) => {
  const existing = repo
    .listRiskSignals(tenantId)
    .find((item) => item.code === code && item.entityId === entityId && item.status === "OPEN");
  if (existing) return existing;
  const signal: RiskSignal = {
    id: createId("risk"),
    tenantId,
    code,
    severity,
    status: "OPEN",
    entityId,
    detail,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  repo.createRiskSignal(tenantId, signal);
  return signal;
};

export const procurementService = {
  listSupplierMasters: (tenantId: string) => repo.listSupplierMasters(tenantId),
  listSupplierBranches: (tenantId: string) => repo.listSupplierBranches(tenantId),
  listSupplierProducts: (tenantId: string) => repo.listSupplierProducts(tenantId),
  listRequisitions: (tenantId: string) => repo.listRequisitions(tenantId),
  listDraftPurchaseOrders: (tenantId: string) => repo.listDraftPurchaseOrders(tenantId),
  listFinalPurchaseOrders: (tenantId: string) => repo.listFinalPurchaseOrders(tenantId),
  listContracts: (tenantId: string) => repo.listContracts(tenantId),
  listPortalMessages: (tenantId: string) => repo.listPortalMessages(tenantId),
  listRatingLogs: (tenantId: string) => repo.listRatingLogs(tenantId),
  listRiskSignals: (tenantId: string) => repo.listRiskSignals(tenantId),
  listAuditEvents: (tenantId: string) => repo.listAuditEvents(tenantId),
  listLegalHandoffs: (tenantId: string) => procurementIntegrationAdapters.listLegalHandoffs(tenantId),
  listGoodsReceiptSyncs: (tenantId: string) => procurementIntegrationAdapters.listGoodsReceiptSyncs(tenantId),
  listSupplierAccessProvisioning: (tenantId: string) => procurementIntegrationAdapters.listSupplierAccessProvisioning(tenantId),
  acknowledgeLegalHandoff: (tenantId: string, session: SessionContext, handoffId: string) =>
    procurementIntegrationAdapters.setLegalHandoffStatus(tenantId, session, handoffId, "ACKNOWLEDGED"),
  updateGoodsReceiptSyncStatus: (
    tenantId: string,
    session: SessionContext,
    syncId: string,
    payload: { status: "SYNCED" | "MISMATCH_REPORTED"; issueCount: number; invoiceMismatch: boolean },
  ) => procurementIntegrationAdapters.setGoodsReceiptSyncStatus(tenantId, session, syncId, payload),
  updateSupplierAccessProvisioningStatus: (
    tenantId: string,
    session: SessionContext,
    provisioningId: string,
    status: "REQUESTED" | "PROVISIONED" | "REVOKED",
  ) => procurementIntegrationAdapters.setSupplierAccessProvisioningStatus(tenantId, session, provisioningId, status),

  createSupplierMaster(
    tenantId: string,
    session: SessionContext,
    payload: { name: string; taxId: string; categories: string[] },
  ): SupplierMaster {
    ensureTenant(tenantId, session);
    const created: SupplierMaster = {
      id: createId("sup"),
      tenantId,
      name: payload.name.trim(),
      taxId: payload.taxId.trim(),
      complianceStatus: "PENDING",
      globalRating: 70,
      riskTier: "MEDIUM",
      categories: payload.categories.length ? payload.categories : ["General"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repo.createSupplierMaster(tenantId, created);
    workflowService.createRequest(tenantId, session, {
      entityType: "PURCHASE",
      entityId: created.id,
      makerDept: session.departmentId,
      destinationDept: "LEGAL",
      notes: "Supplier onboarding compliance verification",
    });
    logEvent(tenantId, session.userId, "supplier.created", "SUPPLIER", created.id, created.name);
    return created;
  },

  createSupplierBranch(
    tenantId: string,
    session: SessionContext,
    payload: {
      supplierId: string;
      branchCode: string;
      branchName: string;
      location: string;
      leadTimeDays: number;
    },
  ): SupplierBranch {
    ensureTenant(tenantId, session);
    const created: SupplierBranch = {
      id: createId("sup-branch"),
      tenantId,
      supplierId: payload.supplierId,
      branchCode: payload.branchCode.toUpperCase(),
      branchName: payload.branchName,
      location: payload.location,
      leadTimeDays: Math.max(payload.leadTimeDays, 1),
      localRating: 70,
      riskTier: "MEDIUM",
      active: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repo.createSupplierBranch(tenantId, created);
    logEvent(tenantId, session.userId, "supplier_branch.created", "SUPPLIER_BRANCH", created.id, created.branchName);
    return created;
  },

  upsertSupplierProduct(
    tenantId: string,
    session: SessionContext,
    payload: Omit<SupplierProduct, "tenantId" | "updatedAt">,
  ): SupplierProduct {
    ensureTenant(tenantId, session);
    const next: SupplierProduct = { ...payload, tenantId, updatedAt: nowIso() };
    repo.upsertSupplierProduct(tenantId, next);
    logEvent(tenantId, session.userId, "supplier_product.upserted", "SUPPLIER_BRANCH", next.id, next.name);
    return next;
  },

  createRequisition(
    tenantId: string,
    session: SessionContext,
    payload: {
      title: string;
      description: string;
      category: string;
      branchCode: string;
      budgetClass: Requisition["budgetClass"];
      amount: number;
      contractRequired: boolean;
    },
  ): Requisition {
    ensureTenant(tenantId, session);
    const created: Requisition = {
      id: createId("req"),
      tenantId,
      requesterId: session.userId,
      requesterDept: session.departmentId.toUpperCase(),
      branchCode: payload.branchCode.toUpperCase(),
      title: payload.title,
      description: payload.description,
      category: payload.category,
      budgetClass: payload.budgetClass,
      amount: Math.max(payload.amount, 0),
      currency: "IDR",
      status: "PENDING_REQUESTER_HOD",
      approvals: emptyApprovals(),
      contractRequired: payload.contractRequired,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repo.createRequisition(tenantId, created);
    workflowService.createRequest(tenantId, session, {
      entityType: "PURCHASE",
      entityId: created.id,
      makerDept: session.departmentId,
      destinationDept: "REQUESTER_HOD",
      notes: "Requester HOD approval gate",
    });
    if (created.amount > BUDGET_LIMITS[created.budgetClass]) {
      createOpenRisk(
        tenantId,
        "PRICE_SPIKE",
        "HIGH",
        created.id,
        `Amount exceeds ${created.budgetClass} threshold.`,
      );
    }
    logEvent(tenantId, session.userId, "requisition.created", "REQUISITION", created.id, created.title);
    return created;
  },

  approveRequesterHod(tenantId: string, session: SessionContext, requisitionId: string) {
    ensureTenant(tenantId, session);
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    const updated = repo.updateRequisition(tenantId, requisitionId, {
      status: "APPROVED_REQUESTER_HOD",
      approvals: { ...requisition.approvals, requesterHod: true },
      updatedAt: nowIso(),
    });
    if (!updated) throw new Error("Unable to update requisition.");
    logEvent(tenantId, session.userId, "requisition.requester_hod_approved", "REQUISITION", requisitionId, requisition.title);
    return updated;
  },

  buildDraftPurchaseOrder(
    tenantId: string,
    session: SessionContext,
    payload: {
      requisitionId: string;
      supplierId: string;
      supplierBranchId: string;
      contractType: DraftPurchaseOrder["contractType"];
      lineItems: Array<{ productSku: string; description: string; quantity: number; uom: string; unitPrice: number }>;
    },
  ): DraftPurchaseOrder {
    ensureTenant(tenantId, session);
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === payload.requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    if (!requisition.approvals.requesterHod) throw new Error("Requester HOD approval required.");
    const lineItems: PoLineItem[] = payload.lineItems.map((line) => ({
      id: createId("line"),
      productSku: line.productSku,
      description: line.description,
      quantity: Math.max(line.quantity, 1),
      uom: line.uom,
      unitPrice: Math.max(line.unitPrice, 0),
      total: Math.max(line.quantity, 1) * Math.max(line.unitPrice, 0),
    }));
    const quotedTotal = lineItems.reduce((sum, line) => sum + line.total, 0);
    const draft: DraftPurchaseOrder = {
      id: createId("dpo"),
      tenantId,
      requisitionId: requisition.id,
      branchCode: requisition.branchCode,
      supplierId: payload.supplierId,
      supplierBranchId: payload.supplierBranchId,
      contractType: payload.contractType,
      status: "DRAFT",
      lineItems,
      quotedTotal,
      createdBy: session.userId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repo.createDraftPurchaseOrder(tenantId, draft);
    repo.updateRequisition(tenantId, requisition.id, {
      status: "DRAFT_PO_PREPARED",
      linkedDraftPoId: draft.id,
      supplierId: payload.supplierId,
      supplierBranchId: payload.supplierBranchId,
      updatedAt: nowIso(),
    });
    logEvent(tenantId, session.userId, "draft_po.created", "DRAFT_PO", draft.id, requisition.title);
    return draft;
  },

  approveDraftByProcurementHod(tenantId: string, session: SessionContext, draftPoId: string) {
    ensureTenant(tenantId, session);
    const draft = repo.listDraftPurchaseOrders(tenantId).find((item) => item.id === draftPoId);
    if (!draft) throw new Error("Draft PO not found.");
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === draft.requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    repo.updateDraftPurchaseOrder(tenantId, draft.id, { status: "PROCUREMENT_HOD_APPROVED", updatedAt: nowIso() });
    const updated = repo.updateRequisition(tenantId, requisition.id, {
      status: "DRAFT_PO_APPROVED",
      approvals: { ...requisition.approvals, procurementHodDraft: true },
      updatedAt: nowIso(),
    });
    if (!updated) throw new Error("Unable to update requisition.");
    logEvent(tenantId, session.userId, "draft_po.procurement_hod_approved", "DRAFT_PO", draftPoId, requisition.id);
    return updated;
  },

  confirmSupplierQuote(
    tenantId: string,
    session: SessionContext,
    payload: { draftPoId: string; quoteReference: string; quoteNotes: string; quoteAttachment?: string; quotedTotal?: number },
  ) {
    ensureTenant(tenantId, session);
    const draft = repo.listDraftPurchaseOrders(tenantId).find((item) => item.id === payload.draftPoId);
    if (!draft) throw new Error("Draft PO not found.");
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === draft.requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    const quotedTotal = payload.quotedTotal ?? draft.quotedTotal;
    const updated = repo.updateDraftPurchaseOrder(tenantId, draft.id, {
      status: "SUPPLIER_CONFIRMED",
      quoteReference: payload.quoteReference,
      quoteNotes: payload.quoteNotes,
      quoteAttachment: payload.quoteAttachment,
      quotedTotal,
      updatedAt: nowIso(),
    });
    if (!updated) throw new Error("Unable to update draft.");
    repo.updateRequisition(tenantId, requisition.id, { status: "SUPPLIER_CONFIRMED", updatedAt: nowIso() });
    if (quotedTotal > requisition.amount * 1.2) {
      createOpenRisk(tenantId, "PRICE_SPIKE", "HIGH", draft.id, "Quoted amount exceeds requisition baseline.");
    }
    return updated;
  },

  upsertContractForRequisition(
    tenantId: string,
    session: SessionContext,
    payload: { requisitionId: string; supplierId: string; notes?: string; attachmentIds?: string[] },
  ): ContractRecord {
    ensureTenant(tenantId, session);
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === payload.requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    const existing = requisition.linkedContractId
      ? repo.listContracts(tenantId).find((item) => item.id === requisition.linkedContractId)
      : undefined;
    if (existing) {
      const legalWorkflow = workflowService.createRequest(tenantId, session, {
        entityType: "CONTRACT",
        entityId: existing.id,
        makerDept: session.departmentId,
        destinationDept: "LEGAL",
        notes: "Procurement contract ownership handoff",
      });
      const updated = repo.updateContract(tenantId, existing.id, {
        status: "LEGAL_REVIEW",
        version: existing.version + 1,
        notes: payload.notes ?? existing.notes,
        attachmentIds: payload.attachmentIds ?? existing.attachmentIds,
        updatedAt: nowIso(),
      });
      if (!updated) throw new Error("Unable to update contract.");
      procurementIntegrationAdapters.requestLegalContractHandoff(tenantId, session, {
        requisitionId: requisition.id,
        contractId: updated.id,
        supplierId: payload.supplierId,
        notes: payload.notes,
        workflowRequestId: legalWorkflow.id,
      });
      logEvent(
        tenantId,
        session.userId,
        "contract.handoff_queued",
        "CONTRACT",
        updated.id,
        requisition.title,
      );
      return updated;
    }
    const created: ContractRecord = {
      id: createId("ctr"),
      tenantId,
      requisitionId: requisition.id,
      supplierId: payload.supplierId,
      status: "LEGAL_REVIEW",
      version: 1,
      signedBySupplier: false,
      signedByProcurementHod: false,
      signedByFinanceHod: false,
      notes: payload.notes,
      attachmentIds: payload.attachmentIds ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repo.createContract(tenantId, created);
    repo.updateRequisition(tenantId, requisition.id, { linkedContractId: created.id, updatedAt: nowIso() });
    const legalWorkflow = workflowService.createRequest(tenantId, session, {
      entityType: "CONTRACT",
      entityId: created.id,
      makerDept: session.departmentId,
      destinationDept: "LEGAL",
      notes: "Procurement contract ownership handoff",
    });
    procurementIntegrationAdapters.requestLegalContractHandoff(tenantId, session, {
      requisitionId: requisition.id,
      contractId: created.id,
      supplierId: payload.supplierId,
      notes: payload.notes,
      workflowRequestId: legalWorkflow.id,
    });
    logEvent(
      tenantId,
      session.userId,
      "contract.handoff_queued",
      "CONTRACT",
      created.id,
      requisition.title,
    );
    return created;
  },

  approveLegalContract(tenantId: string, session: SessionContext, contractId: string) {
    ensureTenant(tenantId, session);
    const contract = repo.listContracts(tenantId).find((item) => item.id === contractId);
    if (!contract) throw new Error("Contract not found.");
    const updated = repo.updateContract(tenantId, contract.id, {
      status: "LEGAL_APPROVED",
      legalReviewedBy: session.userId,
      updatedAt: nowIso(),
    });
    if (!updated) throw new Error("Unable to approve contract.");
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === contract.requisitionId);
    if (requisition) {
      repo.updateRequisition(tenantId, requisition.id, {
        status: "LEGAL_APPROVED",
        approvals: { ...requisition.approvals, legal: true },
        updatedAt: nowIso(),
      });
    }
    const handoff = procurementIntegrationAdapters
      .listLegalHandoffs(tenantId)
      .find((item) => item.contractId === contract.id);
    if (handoff) {
      procurementIntegrationAdapters.setLegalHandoffStatus(
        tenantId,
        session,
        handoff.id,
        "CONTRACT_ACCEPTED",
      );
    }
    return updated;
  },

  signContractParty(tenantId: string, session: SessionContext, contractId: string, party: "SUPPLIER" | "PROCUREMENT_HOD" | "FINANCE_HOD") {
    ensureTenant(tenantId, session);
    const contract = repo.listContracts(tenantId).find((item) => item.id === contractId);
    if (!contract) throw new Error("Contract not found.");
    const patch: Partial<ContractRecord> = { updatedAt: nowIso() };
    if (party === "SUPPLIER") patch.signedBySupplier = true;
    if (party === "PROCUREMENT_HOD") patch.signedByProcurementHod = true;
    if (party === "FINANCE_HOD") patch.signedByFinanceHod = true;
    const signerState = {
      supplier: patch.signedBySupplier ?? contract.signedBySupplier,
      procurement: patch.signedByProcurementHod ?? contract.signedByProcurementHod,
      finance: patch.signedByFinanceHod ?? contract.signedByFinanceHod,
    };
    patch.status = contract.status === "LEGAL_APPROVED" && signerState.supplier && signerState.procurement && signerState.finance
      ? "SIGNED"
      : contract.status;
    const updated = repo.updateContract(tenantId, contract.id, patch);
    if (!updated) throw new Error("Unable to sign contract.");
    return updated;
  },

  setFinalApproval(tenantId: string, session: SessionContext, requisitionId: string, approver: "REQUESTER_HOD" | "PROCUREMENT_HOD" | "FINANCE_HOD") {
    ensureTenant(tenantId, session);
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    const approvals = { ...requisition.approvals };
    if (approver === "REQUESTER_HOD") approvals.requesterHodFinal = true;
    if (approver === "PROCUREMENT_HOD") approvals.procurementHodFinal = true;
    if (approver === "FINANCE_HOD") approvals.financeHod = true;
    const finalApproved = approvals.requesterHod && approvals.procurementHodDraft && approvals.legal && approvals.requesterHodFinal && approvals.procurementHodFinal && approvals.financeHod;
    const updated = repo.updateRequisition(tenantId, requisition.id, {
      approvals,
      status: finalApproved ? "FINAL_APPROVED" : "FINAL_APPROVAL_PENDING",
      updatedAt: nowIso(),
    });
    if (!updated) throw new Error("Unable to update requisition.");
    return updated;
  },

  releasePurchaseOrder(tenantId: string, session: SessionContext, requisitionId: string): FinalPurchaseOrder {
    ensureTenant(tenantId, session);
    const requisition = repo.listRequisitions(tenantId).find((item) => item.id === requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    if (requisition.status !== "FINAL_APPROVED") throw new Error("Final approvals are incomplete.");
    const draft = requisition.linkedDraftPoId ? repo.listDraftPurchaseOrders(tenantId).find((item) => item.id === requisition.linkedDraftPoId) : undefined;
    if (!draft || draft.status !== "SUPPLIER_CONFIRMED") throw new Error("Supplier confirmation is required.");
    if (requisition.contractRequired) {
      const contract = requisition.linkedContractId ? repo.listContracts(tenantId).find((item) => item.id === requisition.linkedContractId) : undefined;
      if (!contract || contract.status !== "SIGNED") throw new Error("Signed contract is required.");
    }
    const supplier = repo.listSupplierMasters(tenantId).find((item) => item.id === draft.supplierId);
    const payable = financeService.createPayable(tenantId, session, {
      vendor: supplier?.name ?? draft.supplierId,
      amount: draft.quotedTotal,
      dueDate: addDays(30),
      currency: "IDR",
    });
    const finalPo: FinalPurchaseOrder = {
      id: createId("po"),
      tenantId,
      requisitionId: requisition.id,
      draftPoId: draft.id,
      supplierId: draft.supplierId,
      supplierBranchId: draft.supplierBranchId,
      branchCode: requisition.branchCode,
      status: "RELEASED",
      totalAmount: draft.quotedTotal,
      issuedAt: nowIso().slice(0, 10),
      expectedDeliveryDate: addDays(7),
      financeCommitmentId: payable.id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repo.createFinalPurchaseOrder(tenantId, finalPo);
    repo.updateDraftPurchaseOrder(tenantId, draft.id, { status: "READY_FOR_RELEASE", updatedAt: nowIso() });
    repo.updateRequisition(tenantId, requisition.id, { status: "PO_RELEASED", linkedFinalPoId: finalPo.id, updatedAt: nowIso() });
    procurementIntegrationAdapters.queueGoodsReceiptSync(tenantId, session, {
      finalPoId: finalPo.id,
      requisitionId: requisition.id,
      supplierId: finalPo.supplierId,
      supplierBranchId: finalPo.supplierBranchId,
      branchCode: finalPo.branchCode,
      expectedDeliveryDate: finalPo.expectedDeliveryDate,
    });
    procurementIntegrationAdapters.requestSupplierAccessProvisioning(tenantId, session, {
      supplierId: finalPo.supplierId,
      supplierBranchId: finalPo.supplierBranchId,
      portalScope: "FULL_PORTAL",
      reason: `PO ${finalPo.id} released and supplier portal access is required.`,
      approvedBy: session.userId,
    });
    workflowService.createRequest(tenantId, session, {
      entityType: "PURCHASE",
      entityId: finalPo.id,
      makerDept: session.departmentId,
      destinationDept: "INVENTORY",
      notes: "Goods receipt sync queue from released PO.",
    });
    workflowService.createRequest(tenantId, session, {
      entityType: "PURCHASE",
      entityId: finalPo.id,
      makerDept: session.departmentId,
      destinationDept: "IT",
      notes: "Supplier portal access provisioning request.",
    });
    logEvent(tenantId, session.userId, "po.released", "FINAL_PO", finalPo.id, requisition.title);
    return finalPo;
  },

  createPortalMessage(tenantId: string, session: SessionContext, payload: Omit<SupplierPortalMessage, "id" | "tenantId" | "createdAt" | "createdBy">) {
    ensureTenant(tenantId, session);
    const message: SupplierPortalMessage = { id: createId("portal"), tenantId, ...payload, createdBy: session.userId, createdAt: nowIso() };
    repo.createPortalMessage(tenantId, message);
    logEvent(tenantId, session.userId, "portal.message_created", "PORTAL", message.id, message.type);
    return message;
  },

  recordReceipt(
    tenantId: string,
    session: SessionContext,
    payload: { finalPoId: string; deliveryOnTime: boolean; quantityAccuracy: number; qualityScore: number; issueCount: number; invoiceMismatch: boolean },
  ) {
    ensureTenant(tenantId, session);
    const po = repo.listFinalPurchaseOrders(tenantId).find((item) => item.id === payload.finalPoId);
    if (!po) throw new Error("Final PO not found.");
    const receipt: ReceiptRecord = {
      id: createId("grn"),
      tenantId,
      finalPoId: po.id,
      supplierId: po.supplierId,
      supplierBranchId: po.supplierBranchId,
      receivedAt: nowIso(),
      deliveryOnTime: payload.deliveryOnTime,
      quantityAccuracy: Math.max(0, Math.min(100, payload.quantityAccuracy)),
      qualityScore: Math.max(0, Math.min(100, payload.qualityScore)),
      issueCount: Math.max(0, payload.issueCount),
      invoiceMismatch: payload.invoiceMismatch,
      createdAt: nowIso(),
    };
    repo.createReceipt(tenantId, receipt);
    repo.updateFinalPurchaseOrder(tenantId, po.id, { status: payload.issueCount === 0 ? "RECEIVED" : "DELIVERING", updatedAt: nowIso() });
    const supplierScore = Math.max(0, Math.round((receipt.deliveryOnTime ? 100 : 70) * 0.2 + receipt.quantityAccuracy * 0.25 + receipt.qualityScore * 0.3 + (payload.issueCount === 0 ? 95 : 70) * 0.15 + 85 * 0.1 - payload.issueCount * 5 - (payload.invoiceMismatch ? 20 : 0)));
    const rating: RatingLog = {
      id: createId("rating"),
      tenantId,
      supplierId: receipt.supplierId,
      supplierBranchId: receipt.supplierBranchId,
      supplierScore,
      productScore: Math.round((receipt.quantityAccuracy + receipt.qualityScore) / 2),
      riskTier: toRiskTier(supplierScore),
      inputs: {
        deliveryTimeliness: receipt.deliveryOnTime ? 100 : 70,
        quantityAccuracy: receipt.quantityAccuracy,
        productQuality: receipt.qualityScore,
        contractCompliance: payload.issueCount === 0 ? 95 : 70,
        pricingStability: 85,
        issuePenalty: payload.issueCount * 5,
        invoiceMismatchPenalty: payload.invoiceMismatch ? 20 : 0,
      },
      createdAt: nowIso(),
    };
    repo.createRatingLog(tenantId, rating);
    const pendingSync = procurementIntegrationAdapters
      .listGoodsReceiptSyncs(tenantId)
      .find((item) => item.finalPoId === po.id);
    if (pendingSync) {
      procurementIntegrationAdapters.setGoodsReceiptSyncStatus(tenantId, session, pendingSync.id, {
        status: payload.issueCount > 0 || payload.invoiceMismatch ? "MISMATCH_REPORTED" : "SYNCED",
        issueCount: payload.issueCount,
        invoiceMismatch: payload.invoiceMismatch,
      });
    }
    const master = repo.listSupplierMasters(tenantId).find((item) => item.id === receipt.supplierId);
    if (master) {
      const score = Math.round(safeAverage([master.globalRating, rating.supplierScore]));
      repo.updateSupplierMaster(tenantId, master.id, { globalRating: score, riskTier: toRiskTier(score), updatedAt: nowIso() });
    }
    const branch = repo.listSupplierBranches(tenantId).find((item) => item.id === receipt.supplierBranchId);
    if (branch) {
      const score = Math.round(safeAverage([branch.localRating, rating.supplierScore]));
      repo.updateSupplierBranch(tenantId, branch.id, { localRating: score, riskTier: toRiskTier(score), updatedAt: nowIso() });
    }
    if (payload.invoiceMismatch) createOpenRisk(tenantId, "DUPLICATE_INVOICE_PATTERN", "HIGH", po.id, "Invoice mismatch detected.");
    if (rating.riskTier === "HIGH") createOpenRisk(tenantId, "SUPPLIER_RISK", "HIGH", receipt.supplierId, `Supplier score dropped to ${rating.supplierScore}.`);
    return { receipt, rating };
  },

  setRiskSignalStatus(tenantId: string, session: SessionContext, riskSignalId: string, status: RiskSignalStatus) {
    ensureTenant(tenantId, session);
    const updated = repo.updateRiskSignal(tenantId, riskSignalId, { status, updatedAt: nowIso() });
    if (!updated) throw new Error("Risk signal not found.");
    return updated;
  },

  runRiskScan(tenantId: string, session: SessionContext) {
    ensureTenant(tenantId, session);
    const requisitions = repo.listRequisitions(tenantId);
    const drafts = repo.listDraftPurchaseOrders(tenantId);
    requisitions.forEach((req) => {
      if (req.status === "DRAFT_PO_APPROVED" && !req.approvals.requesterHod) {
        createOpenRisk(tenantId, "APPROVAL_BYPASS_RISK", "HIGH", req.id, "Draft stage reached without requester HOD approval.");
      }
    });
    drafts.forEach((draft) => {
      const req = requisitions.find((item) => item.id === draft.requisitionId);
      if (req && draft.quotedTotal > req.amount * 1.15) {
        createOpenRisk(tenantId, "PRICE_SPIKE", "HIGH", draft.id, "Quoted amount exceeds requisition by more than 15%.");
      }
    });
    return repo.listRiskSignals(tenantId);
  },

  getSupplierRecommendations(tenantId: string, params: { branchCode: string; category: string }): SupplierRecommendation[] {
    const masters = repo.listSupplierMasters(tenantId);
    const branches = repo.listSupplierBranches(tenantId).filter((item) => item.active && item.branchCode === params.branchCode.toUpperCase());
    const products = repo.listSupplierProducts(tenantId).filter((item) => item.active && item.category.toLowerCase() === params.category.toLowerCase());
    return branches
      .map((branch) => {
        const master = masters.find((item) => item.id === branch.supplierId);
        if (!master) return null;
        const product = products.find((item) => item.supplierId === master.id && item.branchId === branch.id);
        const score = Math.round(branch.localRating * 0.65 + master.globalRating * 0.35 - branch.leadTimeDays);
        return {
          supplierId: master.id,
          supplierName: master.name,
          supplierBranchId: branch.id,
          branchName: branch.branchName,
          score: Math.max(0, Math.min(score, 100)),
          riskTier: toRiskTier(score),
          unitPrice: product?.unitPrice,
          leadTimeDays: branch.leadTimeDays,
        } satisfies SupplierRecommendation;
      })
      .filter((item): item is SupplierRecommendation => item !== null)
      .sort((a, b) => b.score - a.score);
  },

  getSpendInsights(tenantId: string): ProcurementSpendInsight[] {
    const requisitions = repo.listRequisitions(tenantId);
    const finalPos = repo.listFinalPurchaseOrders(tenantId);
    const riskSignals = repo.listRiskSignals(tenantId);
    const ratings = repo.listRatingLogs(tenantId);
    const requested = requisitions.reduce((sum, item) => sum + item.amount, 0);
    const released = finalPos.reduce((sum, item) => sum + item.totalAmount, 0);
    const pendingFinal = requisitions.filter((item) => item.status === "FINAL_APPROVAL_PENDING").length;
    const avgScore = Math.round(safeAverage(ratings.map((item) => item.supplierScore)));
    const openRisk = riskSignals.filter((item) => item.status === "OPEN" && item.severity === "HIGH").length;
    return [
      { id: `${tenantId}-proc-ins-1`, label: "Requested spend", category: "SPEND", value: requested.toLocaleString() },
      { id: `${tenantId}-proc-ins-2`, label: "Released PO spend", category: "SPEND", value: released.toLocaleString() },
      { id: `${tenantId}-proc-ins-3`, label: "Pending final approvals", category: "APPROVAL", value: String(pendingFinal) },
      { id: `${tenantId}-proc-ins-4`, label: "Average supplier score", category: "SUPPLIER", value: String(avgScore) },
      { id: `${tenantId}-proc-ins-5`, label: "Open high-risk signals", category: "RISK", value: String(openRisk) },
    ];
  },
};
