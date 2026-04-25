import { procurement_requisitions } from "@prisma/client";
import { Requisition } from "../entities/requisition.entity";
import { TenantContext } from "../../../gateway/tenant-context.interface";

/**
 * Zenvix Procurement Workflow Strategy
 * Separates the 'Departmental' layer from the 'Operational' mode.
 */
export interface IProcurementWorkflow {
  /**
   * Process an approved requisition based on the mode (DIRECT vs BIDDING)
   */
  processApprovedRequisitions(ctx: TenantContext, requisition: Requisition): Promise<void>;
  
  /**
   * Identifies the mode this workflow handles
   */
  getMode(): 'DIRECT' | 'BIDDING';
}
