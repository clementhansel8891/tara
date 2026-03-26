import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InventoryService } from "../inventory.service";
import { EventBusService } from "../../../shared/events/event-bus.service";

@Injectable()
export class RetailListener implements OnModuleInit {
  private readonly logger = new Logger(RetailListener.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventBus: EventBusService
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('RETAIL_SALE_COMPLETED', 'RetailListener.handle', async (event: any) => {
      switch (event.eventType) {
        case "RETAIL_SALE_COMPLETED":
          return this.handleRetailSale(event);
        case "RETAIL_RETURN_COMPLETED":
          return this.handleRetailReturn(event);
        case "RETAIL_OPNAME_SUBMITTED":
          return this.handleRetailOpname(event);
        case "RETAIL_GOODS_RECEIVED":
          return this.handleRetailGoodsReceived(event);
      }
    });
  }

  async handleRetailSale(event: any) {
    this.logger.log(`Received RETAIL_SALE_COMPLETED for order ${event.payload?.orderId}`);
    try {
      const { tenantId, payload, userId } = event;
      
      for (const move of payload.movements) {
        await this.inventoryService.consumeStock(
          tenantId,
          {
            itemId: move.productId,
            locationId: move.fromLocationId,
            quantity: move.quantity,
            reason: "RETAIL_SALE",
            referenceId: payload.orderId,
            referenceType: "RETAIL_ORDER",
          },
          userId,
          event.tx,
          event.correlationId
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process RETAIL_SALE_COMPLETED: ${error.message}`);
    }
  }

  async handleRetailReturn(event: any) {
    this.logger.log(`Received RETAIL_RETURN_COMPLETED for order ${event.payload?.orderId}`);
    try {
      const { tenantId, payload, userId } = event;
      
      for (const item of payload.returnedItems) {
        await this.inventoryService.intakeStock(
          tenantId,
          {
            itemId: item.productId,
            locationId: payload.storeId,
            quantity: item.quantity,
            unitCost: item.unitPrice,
            reason: "CUSTOMER_RETURN",
            referenceId: `RETAIL_RETURN_${payload.orderId}`,
          },
          userId,
          event.tx,
          event.correlationId
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process RETAIL_RETURN_COMPLETED: ${error.message}`);
    }
  }

  async handleRetailOpname(event: any) {
    this.logger.log(`Received RETAIL_OPNAME_SUBMITTED for store ${event.payload?.storeId}`);
    try {
      const { tenantId, payload, userId } = event;
      
      for (const adj of payload.adjustments) {
        await this.inventoryService.createAdjustment(
          tenantId,
          {
            itemId: adj.productId,
            locationId: payload.storeId,
            requestedDelta: adj.variance,
            reason: `RETAIL_OPNAME_${payload.sessionId}`,
          },
          userId,
          event.tx,
          event.correlationId
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process RETAIL_OPNAME_SUBMITTED: ${error.message}`);
    }
  }

  async handleRetailGoodsReceived(event: any) {
    this.logger.log(`Received RETAIL_GOODS_RECEIVED for shipment ${event.payload?.shipmentId}`);
    try {
      const { tenantId, payload, userId } = event;
      
      for (const item of payload.items) {
        await this.inventoryService.intakeStock(
          tenantId,
          {
            itemId: item.productId,
            locationId: payload.storeId,
            quantity: item.quantity,
            unitCost: item.unitCost || 0,
            reason: "RETAIL_STOCK_INTAKE",
            referenceId: `RETAIL_INTAKE_${payload.shipmentId}`,
          },
          userId,
          event.tx,
          event.correlationId
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process RETAIL_GOODS_RECEIVED: ${error.message}`);
    }
  }
}
