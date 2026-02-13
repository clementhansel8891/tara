import {
  ensureSeed,
  loadFromStorage,
  saveToStorage,
} from "@/core/repositories/hr/storage";
import type { ProcurementRepository } from "@/core/repositories/procurement/procurementRepository";
import type {
  ContractRecord,
  DraftPurchaseOrder,
  FinalPurchaseOrder,
  ProcurementAuditEvent,
  RatingLog,
  ReceiptRecord,
  Requisition,
  RiskSignal,
  SupplierBranch,
  SupplierMaster,
  SupplierPortalMessage,
  SupplierProduct,
} from "@/core/types/procurement/procurement";

const now = () => new Date().toISOString();

const mastersKey = (tenantId: string) => `proc:${tenantId}:supplier-masters`;
const branchesKey = (tenantId: string) => `proc:${tenantId}:supplier-branches`;
const productsKey = (tenantId: string) => `proc:${tenantId}:supplier-products`;
const requisitionsKey = (tenantId: string) => `proc:${tenantId}:requisitions`;
const draftPoKey = (tenantId: string) => `proc:${tenantId}:draft-pos`;
const finalPoKey = (tenantId: string) => `proc:${tenantId}:final-pos`;
const contractsKey = (tenantId: string) => `proc:${tenantId}:contracts`;
const receiptsKey = (tenantId: string) => `proc:${tenantId}:receipts`;
const ratingsKey = (tenantId: string) => `proc:${tenantId}:ratings`;
const risksKey = (tenantId: string) => `proc:${tenantId}:risk-signals`;
const portalKey = (tenantId: string) => `proc:${tenantId}:portal`;
const auditKey = (tenantId: string) => `proc:${tenantId}:audit`;

const seedMasters = (tenantId: string): SupplierMaster[] => [
  {
    id: `${tenantId}-sup-001`,
    tenantId,
    name: "Nusantara Industrial Supply",
    taxId: "NPWP-01.234.567.8-091.000",
    complianceStatus: "VERIFIED",
    globalRating: 88,
    riskTier: "LOW",
    categories: ["Machinery", "MRO"],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: `${tenantId}-sup-002`,
    tenantId,
    name: "Archipelago Office Systems",
    taxId: "NPWP-98.765.432.1-091.000",
    complianceStatus: "VERIFIED",
    globalRating: 79,
    riskTier: "MEDIUM",
    categories: ["Office", "IT"],
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedBranches = (tenantId: string): SupplierBranch[] => [
  {
    id: `${tenantId}-sup-001-jkt`,
    tenantId,
    supplierId: `${tenantId}-sup-001`,
    branchCode: "JKT",
    branchName: "Jakarta Fulfillment",
    location: "Jakarta",
    leadTimeDays: 3,
    localRating: 90,
    riskTier: "LOW",
    active: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: `${tenantId}-sup-001-sby`,
    tenantId,
    supplierId: `${tenantId}-sup-001`,
    branchCode: "SBY",
    branchName: "Surabaya Fulfillment",
    location: "Surabaya",
    leadTimeDays: 4,
    localRating: 84,
    riskTier: "LOW",
    active: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: `${tenantId}-sup-002-jkt`,
    tenantId,
    supplierId: `${tenantId}-sup-002`,
    branchCode: "JKT",
    branchName: "Jakarta Office Distribution",
    location: "Jakarta",
    leadTimeDays: 2,
    localRating: 76,
    riskTier: "MEDIUM",
    active: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedProducts = (tenantId: string): SupplierProduct[] => [
  {
    id: `${tenantId}-prd-001`,
    tenantId,
    supplierId: `${tenantId}-sup-001`,
    branchId: `${tenantId}-sup-001-jkt`,
    sku: "MCH-CNC-12",
    name: "CNC Cutting Unit",
    category: "Machinery",
    unitPrice: 280000000,
    currency: "IDR",
    qualityScore: 90,
    active: true,
    updatedAt: now(),
  },
  {
    id: `${tenantId}-prd-002`,
    tenantId,
    supplierId: `${tenantId}-sup-002`,
    branchId: `${tenantId}-sup-002-jkt`,
    sku: "OFF-CHR-88",
    name: "Ergonomic Chair",
    category: "Office",
    unitPrice: 2450000,
    currency: "IDR",
    qualityScore: 81,
    active: true,
    updatedAt: now(),
  },
];

const seedRequisitions = (tenantId: string): Requisition[] => [
  {
    id: `${tenantId}-req-001`,
    tenantId,
    requesterId: "user-demo",
    requesterDept: "OPERATIONS",
    branchCode: "JKT",
    title: "Packaging line motor replacement",
    description: "Urgent replacement for line B production continuity.",
    category: "Machinery",
    budgetClass: "OPEX",
    amount: 310000000,
    currency: "IDR",
    status: "PENDING_REQUESTER_HOD",
    approvals: {
      requesterHod: false,
      procurementHodDraft: false,
      legal: false,
      financeHod: false,
      requesterHodFinal: false,
      procurementHodFinal: false,
    },
    contractRequired: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

const ensureArray = <T>(key: string, seed: T[]) => ensureSeed<T[]>(key, seed);

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

export const mockProcurementRepo: ProcurementRepository = {
  listSupplierMasters(tenantId) {
    return ensureArray(mastersKey(tenantId), seedMasters(tenantId));
  },
  createSupplierMaster(tenantId, payload) {
    const next = [payload, ...this.listSupplierMasters(tenantId)];
    saveToStorage(mastersKey(tenantId), next);
    return payload;
  },
  updateSupplierMaster(tenantId, id, patch) {
    const { updated, next } = updateById(this.listSupplierMasters(tenantId), id, patch);
    if (updated) saveToStorage(mastersKey(tenantId), next);
    return updated;
  },

  listSupplierBranches(tenantId) {
    return ensureArray(branchesKey(tenantId), seedBranches(tenantId));
  },
  createSupplierBranch(tenantId, payload) {
    const next = [payload, ...this.listSupplierBranches(tenantId)];
    saveToStorage(branchesKey(tenantId), next);
    return payload;
  },
  updateSupplierBranch(tenantId, id, patch) {
    const { updated, next } = updateById(this.listSupplierBranches(tenantId), id, patch);
    if (updated) saveToStorage(branchesKey(tenantId), next);
    return updated;
  },

  listSupplierProducts(tenantId) {
    return ensureArray(productsKey(tenantId), seedProducts(tenantId));
  },
  upsertSupplierProduct(tenantId, payload) {
    const items = this.listSupplierProducts(tenantId);
    const existing = items.find((item) => item.id === payload.id);
    if (existing) {
      const next = items.map((item) => (item.id === payload.id ? payload : item));
      saveToStorage(productsKey(tenantId), next);
      return payload;
    }
    const next = [payload, ...items];
    saveToStorage(productsKey(tenantId), next);
    return payload;
  },

  listRequisitions(tenantId) {
    return ensureArray(requisitionsKey(tenantId), seedRequisitions(tenantId));
  },
  createRequisition(tenantId, payload) {
    const next = [payload, ...this.listRequisitions(tenantId)];
    saveToStorage(requisitionsKey(tenantId), next);
    return payload;
  },
  updateRequisition(tenantId, id, patch) {
    const { updated, next } = updateById(this.listRequisitions(tenantId), id, patch);
    if (updated) saveToStorage(requisitionsKey(tenantId), next);
    return updated;
  },

  listDraftPurchaseOrders(tenantId) {
    return loadFromStorage<DraftPurchaseOrder[]>(draftPoKey(tenantId), []);
  },
  createDraftPurchaseOrder(tenantId, payload) {
    const next = [payload, ...this.listDraftPurchaseOrders(tenantId)];
    saveToStorage(draftPoKey(tenantId), next);
    return payload;
  },
  updateDraftPurchaseOrder(tenantId, id, patch) {
    const { updated, next } = updateById(this.listDraftPurchaseOrders(tenantId), id, patch);
    if (updated) saveToStorage(draftPoKey(tenantId), next);
    return updated;
  },

  listFinalPurchaseOrders(tenantId) {
    return loadFromStorage<FinalPurchaseOrder[]>(finalPoKey(tenantId), []);
  },
  createFinalPurchaseOrder(tenantId, payload) {
    const next = [payload, ...this.listFinalPurchaseOrders(tenantId)];
    saveToStorage(finalPoKey(tenantId), next);
    return payload;
  },
  updateFinalPurchaseOrder(tenantId, id, patch) {
    const { updated, next } = updateById(this.listFinalPurchaseOrders(tenantId), id, patch);
    if (updated) saveToStorage(finalPoKey(tenantId), next);
    return updated;
  },

  listContracts(tenantId) {
    return loadFromStorage<ContractRecord[]>(contractsKey(tenantId), []);
  },
  createContract(tenantId, payload) {
    const next = [payload, ...this.listContracts(tenantId)];
    saveToStorage(contractsKey(tenantId), next);
    return payload;
  },
  updateContract(tenantId, id, patch) {
    const { updated, next } = updateById(this.listContracts(tenantId), id, patch);
    if (updated) saveToStorage(contractsKey(tenantId), next);
    return updated;
  },

  listReceipts(tenantId) {
    return loadFromStorage<ReceiptRecord[]>(receiptsKey(tenantId), []);
  },
  createReceipt(tenantId, payload) {
    const next = [payload, ...this.listReceipts(tenantId)];
    saveToStorage(receiptsKey(tenantId), next);
    return payload;
  },

  listRatingLogs(tenantId) {
    return loadFromStorage<RatingLog[]>(ratingsKey(tenantId), []);
  },
  createRatingLog(tenantId, payload) {
    const next = [payload, ...this.listRatingLogs(tenantId)];
    saveToStorage(ratingsKey(tenantId), next);
    return payload;
  },

  listRiskSignals(tenantId) {
    return loadFromStorage<RiskSignal[]>(risksKey(tenantId), []);
  },
  createRiskSignal(tenantId, payload) {
    const next = [payload, ...this.listRiskSignals(tenantId)];
    saveToStorage(risksKey(tenantId), next);
    return payload;
  },
  updateRiskSignal(tenantId, id, patch) {
    const { updated, next } = updateById(this.listRiskSignals(tenantId), id, patch);
    if (updated) saveToStorage(risksKey(tenantId), next);
    return updated;
  },

  listPortalMessages(tenantId) {
    return loadFromStorage<SupplierPortalMessage[]>(portalKey(tenantId), []);
  },
  createPortalMessage(tenantId, payload) {
    const next = [payload, ...this.listPortalMessages(tenantId)];
    saveToStorage(portalKey(tenantId), next);
    return payload;
  },

  listAuditEvents(tenantId) {
    return loadFromStorage<ProcurementAuditEvent[]>(auditKey(tenantId), []);
  },
  createAuditEvent(tenantId, payload) {
    const next = [payload, ...this.listAuditEvents(tenantId)];
    saveToStorage(auditKey(tenantId), next);
    return payload;
  },
};

