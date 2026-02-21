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

export interface ProcurementRepository {
  listSupplierMasters: (tenantId: string) => Promise<SupplierMaster[]>;
  // Change this to Promise
  createSupplierMaster: (tenantId: string, payload: SupplierMaster) => Promise<SupplierMaster>; 
  updateSupplierMaster: (
    tenantId: string,
    id: string,
    patch: Partial<SupplierMaster>,
  ) => Promise<SupplierMaster | null>;

  listSupplierBranches: (tenantId: string) => Promise<SupplierBranch[]>;
  // Change this to Promise
  createSupplierBranch: (tenantId: string, payload: SupplierBranch) => Promise<SupplierBranch>;
  updateSupplierBranch: (
    tenantId: string,
    id: string,
    patch: Partial<SupplierBranch>,
  ) => Promise<SupplierBranch | null>;

  listSupplierProducts: (tenantId: string) => Promise<SupplierProduct[]>;
  upsertSupplierProduct: (tenantId: string, payload: SupplierProduct) => Promise<SupplierProduct>;

  listRequisitions: (tenantId: string) => Promise<Requisition[]>;
  // Change this to Promise
  createRequisition: (tenantId: string, payload: Requisition) => Promise<Requisition>;
  updateRequisition: (
    tenantId: string,
    id: string,
    patch: Partial<Requisition>,
  ) => Promise<Requisition | null>;

  listDraftPurchaseOrders: (tenantId: string) => Promise<DraftPurchaseOrder[]>;
  // Change this to Promise
  createDraftPurchaseOrder: (
    tenantId: string,
    payload: DraftPurchaseOrder,
  ) => Promise<DraftPurchaseOrder>;
  updateDraftPurchaseOrder: (
    tenantId: string,
    id: string,
    patch: Partial<DraftPurchaseOrder>,
  ) => Promise<DraftPurchaseOrder | null>;

  listFinalPurchaseOrders: (tenantId: string) => Promise<FinalPurchaseOrder[]>;
  // Change this to Promise
  createFinalPurchaseOrder: (
    tenantId: string,
    payload: FinalPurchaseOrder,
  ) => Promise<FinalPurchaseOrder>;
  updateFinalPurchaseOrder: (
    tenantId: string,
    id: string,
    patch: Partial<FinalPurchaseOrder>,
  ) => Promise<FinalPurchaseOrder | null>;

  listContracts: (tenantId: string) => Promise<ContractRecord[]>;
  // Change this to Promise
  createContract: (tenantId: string, payload: ContractRecord) => Promise<ContractRecord>;
  updateContract: (
    tenantId: string,
    id: string,
    patch: Partial<ContractRecord>,
  ) => Promise<ContractRecord | null>;

  listReceipts: (tenantId: string) => Promise<ReceiptRecord[]>;
  createReceipt: (tenantId: string, payload: ReceiptRecord) => Promise<ReceiptRecord>;

  listRatingLogs: (tenantId: string) => Promise<RatingLog[]>;
  createRatingLog: (tenantId: string, payload: RatingLog) => Promise<RatingLog>;

  listRiskSignals: (tenantId: string) => Promise<RiskSignal[]>;
  // Change this to Promise
  createRiskSignal: (tenantId: string, payload: RiskSignal) => Promise<RiskSignal>;
  updateRiskSignal: (
    tenantId: string,
    id: string,
    patch: Partial<RiskSignal>,
  ) => Promise<RiskSignal | null>;

  listPortalMessages: (tenantId: string) => Promise<SupplierPortalMessage[]>;
  createPortalMessage: (tenantId: string, payload: SupplierPortalMessage) => Promise<SupplierPortalMessage>;

  listAuditEvents: (tenantId: string) => Promise<ProcurementAuditEvent[]>;
  createAuditEvent: (tenantId: string, payload: ProcurementAuditEvent) => Promise<ProcurementAuditEvent>;
}

