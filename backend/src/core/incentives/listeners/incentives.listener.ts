import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { IncentivesService } from "../incentives.service";
import { EventBusService } from "../../../shared/events/event-bus.service";

@Injectable()
export class IncentivesListener implements OnModuleInit {
  private readonly logger = new Logger(IncentivesListener.name);

  constructor(
    private readonly incentivesService: IncentivesService,
    private readonly eventBus: EventBusService
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('RETAIL_SALE_COMPLETED', 'IncentivesListener.handle', async (event: any) => {
      this.logger.log(`Triggering incentive evaluation for order ${event.payload?.order_id}`);
      try {
        await this.incentivesService.evaluateOrder(event.payload.order_id, 'RETAIL');
      } catch (error) {
        this.logger.error(`Failed to evaluate incentives for order ${event.payload?.order_id}: ${error.message}`);
      }
    });

    // Also listen for regular sales if they exist
    this.eventBus.subscribe('SALES_ORDER_COMPLETED', 'IncentivesListener.handleSales', async (event: any) => {
      try {
        await this.incentivesService.evaluateOrder(event.payload.order_id, 'SALES');
      } catch (error) {
        this.logger.error(`Failed to evaluate incentives for sales order ${event.payload?.order_id}: ${error.message}`);
      }
    });
  }
}
