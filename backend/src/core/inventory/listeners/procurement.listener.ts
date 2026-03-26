import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService, DomainEvent } from '../../../shared/events/event-bus.service';
import { InventoryService } from '../inventory.service';

@Injectable()
export class ProcurementListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly inventoryService: InventoryService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('PO_RECEIVED', 'ProcurementListener', async (event: DomainEvent) => {
      await this.handlePoReceived(event);
    });
  }

  private async handlePoReceived(event: any) {
    const { tenantId, payload, correlationId, userId } = event;
    const { poId, items } = payload;

    for (const item of items) {
      // 1. Ensure item exists in Catalog (Inventory quantity truth source)
      // Note: In this architecture, Inventory tracks quantity for existing Product records.
      // If the product doesn't exist, we might need a placeholder or a catalog-level creation.
      // For now, we assume the product already exists or we create a minimal record if the repository supports it.
      
      // 2. Intake Stock
      await this.inventoryService.intakeStock(
        tenantId,
        {
          itemId: item.productId,
          locationId: item.locationId || 'DEFAULT_WH', // Default warehouse if not specified
          quantity: item.quantity,
          unitCost: item.unitPrice,
          referenceId: poId,
          referenceType: 'PROCUREMENT_RECEIPT',
        } as any,
        userId,
        null,
        correlationId
      );
    }
  }
}
