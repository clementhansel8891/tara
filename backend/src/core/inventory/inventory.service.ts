import { Injectable } from '@nestjs/common';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { StockIntakeDto } from './dto/stock-intake.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { IInventoryRepository } from './repositories/inventory.repository.interface';

@Injectable()
export class InventoryService {
  constructor(private readonly repository: IInventoryRepository) {}

  async getDashboard(tenantId: string) {
    return this.repository.getDashboard(tenantId);
  }

  async getItems(tenantId: string) {
    return this.repository.getItems(tenantId);
  }

  async createItem(tenantId: string, data: CreateItemDto) {
    return this.repository.createItem(tenantId, data);
  }

  async getBalances(tenantId: string, locationId?: string, departmentId?: string) {
    return this.repository.getBalances(tenantId, locationId, departmentId);
  }

  async getMovements(tenantId: string, itemId?: string) {
    return this.repository.getMovements(tenantId, itemId);
  }

  async intakeStock(tenantId: string, data: StockIntakeDto) {
    return this.repository.intakeStock(tenantId, data);
  }

  async transferStock(tenantId: string, data: TransferStockDto) {
    return this.repository.transferStock(tenantId, data);
  }

  async getAdjustments(tenantId: string) {
    return this.repository.getAdjustments(tenantId);
  }

  async createAdjustment(tenantId: string, data: CreateAdjustmentDto) {
    return this.repository.createAdjustment(tenantId, data);
  }

  async approveAdjustment(tenantId: string, adjustmentId: string, approvedBy: string) {
    return this.repository.approveAdjustment(tenantId, adjustmentId, approvedBy);
  }

  async getAlerts(tenantId: string) {
    return this.repository.getAlerts(tenantId);
  }

  async setAlertStatus(
    tenantId: string,
    alertId: string,
    status: 'open' | 'acknowledged' | 'resolved',
  ) {
    return this.repository.setAlertStatus(tenantId, alertId, status);
  }

  async getAuditCycles(tenantId: string) {
    return this.repository.getAuditCycles(tenantId);
  }

  async createAuditCycle(tenantId: string, data: any) {
    return this.repository.createAuditCycle(tenantId, data);
  }

  async updateAuditCycle(tenantId: string, id: string, data: any) {
    return this.repository.updateAuditCycle(tenantId, id, data);
  }

  async getIntegrationEvents(tenantId: string) {
    return this.repository.getIntegrationEvents(tenantId);
  }

  async createIntegrationEvent(tenantId: string, data: any) {
    return this.repository.createIntegrationEvent(tenantId, data);
  }

  async runLowStockScan(tenantId: string) {
    const balances = await this.repository.getBalances(tenantId);
    // Placeholder logic: just return scanned count for now as per mock requirement speed
    return { scanned: balances.length, lowStockFound: balances.filter(b => b.quantity <= 50).length };
  }

  async runExpiryScan(tenantId: string) {
     return { scanned: 0, expiryFound: 0 };
  }

  async consumeStock(tenantId: string, data: any) {
    return this.repository.consumeStock(tenantId, data);
  }

  async deleteItem(tenantId: string, itemId: string) {
    return this.repository.deleteItem(tenantId, itemId);
  }

  async batchDeleteItems(tenantId: string, itemIds: string[]) {
    return this.repository.batchDeleteItems(tenantId, itemIds);
  }

  async batchIntakeStock(tenantId: string, data: StockIntakeDto[]) {
    return this.repository.batchIntakeStock(tenantId, data);
  }

  async requestProcurement(tenantId: string, data: any) {
    return this.repository.requestProcurement(tenantId, data);
  }
}

