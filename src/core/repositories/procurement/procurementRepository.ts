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
  listSupplierMasters: (tenantId: string) => SupplierMaster[];
  createSupplierMaster: (tenantId: string, payload: SupplierMaster) => SupplierMaster;
  updateSupplierMaster: (
    tenantId: string,
    id: string,
    patch: Partial<SupplierMaster>,
  ) => SupplierMaster | null;

  listSupplierBranches: (tenantId: string) => SupplierBranch[];
  createSupplierBranch: (tenantId: string, payload: SupplierBranch) => SupplierBranch;
  updateSupplierBranch: (
    tenantId: string,
    id: string,
    patch: Partial<SupplierBranch>,
  ) => SupplierBranch | null;

  listSupplierProducts: (tenantId: string) => SupplierProduct[];
  upsertSupplierProduct: (tenantId: string, payload: SupplierProduct) => SupplierProduct;

  listRequisitions: (tenantId: string) => Requisition[];
  createRequisition: (tenantId: string, payload: Requisition) => Requisition;
  updateRequisition: (
    tenantId: string,
    id: string,
    patch: Partial<Requisition>,
  ) => Requisition | null;

  listDraftPurchaseOrders: (tenantId: string) => DraftPurchaseOrder[];
  createDraftPurchaseOrder: (
    tenantId: string,
    payload: DraftPurchaseOrder,
  ) => DraftPurchaseOrder;
  updateDraftPurchaseOrder: (
    tenantId: string,
    id: string,
    patch: Partial<DraftPurchaseOrder>,
  ) => DraftPurchaseOrder | null;

  listFinalPurchaseOrders: (tenantId: string) => FinalPurchaseOrder[];
  createFinalPurchaseOrder: (
    tenantId: string,
    payload: FinalPurchaseOrder,
  ) => FinalPurchaseOrder;
  updateFinalPurchaseOrder: (
    tenantId: string,
    id: string,
    patch: Partial<FinalPurchaseOrder>,
  ) => FinalPurchaseOrder | null;

  listContracts: (tenantId: string) => ContractRecord[];
  createContract: (tenantId: string, payload: ContractRecord) => ContractRecord;
  updateContract: (
    tenantId: string,
    id: string,
    patch: Partial<ContractRecord>,
  ) => ContractRecord | null;

  listReceipts: (tenantId: string) => ReceiptRecord[];
  createReceipt: (tenantId: string, payload: ReceiptRecord) => ReceiptRecord;

  listRatingLogs: (tenantId: string) => RatingLog[];
  createRatingLog: (tenantId: string, payload: RatingLog) => RatingLog;

  listRiskSignals: (tenantId: string) => RiskSignal[];
  createRiskSignal: (tenantId: string, payload: RiskSignal) => RiskSignal;
  updateRiskSignal: (
    tenantId: string,
    id: string,
    patch: Partial<RiskSignal>,
  ) => RiskSignal | null;

  listPortalMessages: (tenantId: string) => SupplierPortalMessage[];
  createPortalMessage: (tenantId: string, payload: SupplierPortalMessage) => SupplierPortalMessage;

  listAuditEvents: (tenantId: string) => ProcurementAuditEvent[];
  createAuditEvent: (tenantId: string, payload: ProcurementAuditEvent) => ProcurementAuditEvent;
}

