import { TenantContext } from "../../../gateway/tenant-context.interface";
import { CreateRequisitionDto } from "../dto/create-requisition.dto";
import { CreateSupplierDto } from "../dto/create-supplier.dto";
import { CreateSupplierBranchDto } from "../dto/create-supplier-branch.dto";
import { CreateDraftPoDto } from "../dto/create-draft-po.dto";
import { ConfirmQuoteDto } from "../dto/confirm-quote.dto";
import { CreateContractDto } from "../dto/create-contract.dto";
import { SignContractDto } from "../dto/sign-contract.dto";
import { ApproveFinalDto } from "../dto/approve-final.dto";
import { CreatePortalMessageDto } from "../dto/create-portal-message.dto";
import { CreateReceiptDto } from "../dto/create-receipt.dto";
import { UpsertSupplierProductDto } from "../dto/upsert-supplier-product.dto";
import { CreateRiskSignalDto } from "../dto/create-risk-signal.dto";
import { CreateProcurementCategoryDto } from "../dto/create-procurement-category.dto";
import { UpdateProcurementCategoryDto } from "../dto/update-procurement-category.dto";
import { ReleasePoDto } from "../dto/release-po.dto";
import { ProcurementRisk } from "../entities/procurement-risk.entity";
import { PurchaseOrder } from "../entities/purchase-order.entity";
import { Requisition } from "../entities/requisition.entity";
import { Supplier } from "../entities/supplier.entity";

export abstract class IProcurementRepository {
  // Suppliers
  abstract getSuppliers( ctx: TenantContext): Promise<Supplier[]>;
  abstract createSupplier( ctx: TenantContext, data: CreateSupplierDto): Promise<Supplier>;

  // Supplier Branches
  abstract getSupplierBranches( ctx: TenantContext): Promise<any[]>;
  abstract createSupplierBranch( ctx: TenantContext, data: CreateSupplierBranchDto): Promise<any>;

  // Supplier Products
  abstract getSupplierProducts( ctx: TenantContext): Promise<any[]>;
  abstract upsertSupplierProduct( ctx: TenantContext, data: UpsertSupplierProductDto): Promise<any>;

  // Supplier Recommendations
  abstract getSupplierRecommendations( ctx: TenantContext, params: any): Promise<any[]>;

  // Categories
  abstract getCategories( ctx: TenantContext): Promise<any[]>;
  abstract upsertCategory( ctx: TenantContext, data: CreateProcurementCategoryDto | UpdateProcurementCategoryDto): Promise<any>;
  abstract deleteCategory( ctx: TenantContext, id: string): Promise<any>;

  // Requisitions
  abstract getRequisitions( ctx: TenantContext): Promise<Requisition[]>;
  abstract createRequisition( ctx: TenantContext, data: CreateRequisitionDto): Promise<Requisition>;
  abstract approveRequesterHod( ctx: TenantContext, requisitionId: string): Promise<Requisition>;
  abstract approveFinal( ctx: TenantContext, requisitionId: string, data: ApproveFinalDto): Promise<Requisition>;

  // Draft POs
  abstract getDraftPurchaseOrders( ctx: TenantContext): Promise<any[]>;
  abstract createDraftPurchaseOrder( ctx: TenantContext, data: CreateDraftPoDto, createdBy: string): Promise<any>;
  abstract approveDraftByProcurementHod( ctx: TenantContext, draftPoId: string): Promise<any>;
  abstract confirmSupplierQuote( ctx: TenantContext, draftPoId: string, data: ConfirmQuoteDto): Promise<any>;

  // Purchase Orders (Final)
  abstract releasePurchaseOrder( ctx: TenantContext, data: ReleasePoDto): Promise<PurchaseOrder>;
  abstract getPurchaseOrders( ctx: TenantContext): Promise<PurchaseOrder[]>;

  // Receipts
  abstract createReceipt( ctx: TenantContext, data: CreateReceiptDto, createdBy: string): Promise<any>;

  // Contracts
  abstract getContracts( ctx: TenantContext): Promise<any[]>;
  abstract createContract( ctx: TenantContext, data: CreateContractDto, createdBy: string): Promise<any>;
  abstract approveLegalContract( ctx: TenantContext, contractId: string): Promise<any>;
  abstract signContract( ctx: TenantContext, contractId: string, data: SignContractDto): Promise<any>;

  // Risk Management
  abstract getRiskSignals( ctx: TenantContext): Promise<ProcurementRisk[]>;
  abstract runRiskScan( ctx: TenantContext): Promise<ProcurementRisk[]>;
  abstract createRiskSignal( ctx: TenantContext, data: CreateRiskSignalDto): Promise<any>;
  abstract updateRiskSignalStatus( ctx: TenantContext, riskSignalId: string, status: string): Promise<any>;

  // Portal Messages
  abstract getPortalMessages( ctx: TenantContext): Promise<any[]>;
  abstract createPortalMessage( ctx: TenantContext, data: CreatePortalMessageDto, createdBy: string): Promise<any>;

  // Audit Events
  abstract getAuditEvents( ctx: TenantContext): Promise<any[]>;
  abstract createAuditEvent( ctx: TenantContext, actor_id: string, action: string, entity_type: string, entity_id: string, detail?: string): Promise<any>;

  // Spend Insights
  abstract getSpendInsights( ctx: TenantContext): Promise<any[]>;
}
