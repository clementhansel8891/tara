import { inventory_audit_cycles as AuditCycle, inventory_adjustments as InventoryAdjustment } from "@prisma/client";
import { CreateAdjustmentDto } from "../../dto/create-adjustment.dto";
import { TenantContext } from "../../../../gateway/tenant-context.interface";

export interface IInventoryAuditRepository {
  /**
   * Initialize a new stock-take cycle
   */
  createAuditCycle(ctx: TenantContext, data: any): Promise<AuditCycle>;

  /**
   * List all audit cycles
   */
  getAuditCycles(ctx: TenantContext): Promise<AuditCycle[]>;

  /**
   * Close a cycle and trigger reconciliation
   */
  finalizeAudit(ctx: TenantContext, cycleId: string, performedBy: string): Promise<AuditCycle>;

  /**
   * Create a quantity adjustment request
   */
  createAdjustment(ctx: TenantContext, data: CreateAdjustmentDto, tx?: any): Promise<InventoryAdjustment>;

  /**
   * Approve an adjustment and update stock levels
   */
  approveAdjustment(ctx: TenantContext, id: string, approvedBy: string): Promise<InventoryAdjustment>;

  /**
   * Historical query for adjustments
   */
  getAdjustments(ctx: TenantContext, filters?: any): Promise<InventoryAdjustment[]>;
}
