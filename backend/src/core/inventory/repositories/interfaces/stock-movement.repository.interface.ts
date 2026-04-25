import { stock_movements as StockMovement, stock_levels as StockLevel } from "@prisma/client";
import { StockIntakeDto } from "../../dto/stock-intake.dto";
import { TransferStockDto } from "../../dto/transfer-stock.dto";
import { TenantContext } from "../../../../gateway/tenant-context.interface";

export interface StockReservation {
  product_id: string;
  location_id: string;
  quantity: number;
  referenceId: string;
  referenceType: string;
}

export interface IStockMovementRepository {
  /**
   * Atomic stock intake (PO receipt / Manual)
   */
  intake(ctx: TenantContext, data: StockIntakeDto, tx?: any): Promise<StockMovement>;

  /**
   * Atomic stock transfer between locations
   */
  transfer(ctx: TenantContext, data: TransferStockDto, tx?: any): Promise<StockMovement[]>;

  /**
   * Atomic stock consumption (Sales / Production / Waste)
   */
  consume(ctx: TenantContext, data: any, tx?: any): Promise<StockMovement>;

  /**
   * Set aside stock for a future transaction
   */
  reserve(ctx: TenantContext, data: StockReservation, tx?: any): Promise<void>;

  /**
   * Release or cancel a reservation
   */
  release(ctx: TenantContext, data: StockReservation, tx?: any): Promise<void>;

  /**
   * Historical query for movements
   */
  findAll(ctx: TenantContext, filters?: any): Promise<StockMovement[]>;

  /**
   * Find current balances
   */
  getBalances(ctx: TenantContext, location_id?: string, product_id?: string): Promise<StockLevel[]>;
}
