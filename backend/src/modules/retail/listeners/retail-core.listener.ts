import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../../shared/audit/audit.service';
import { MarketingService } from '../../../core/marketing/marketing.service';
import { SalesService } from '../../../core/sales/sales.service';
import { Customer360Service } from '../../../core/marketing/customer-360.service';

@Injectable()
export class RetailCoreListener {
  constructor(
    private readonly auditService: AuditService,
    private readonly marketingService: MarketingService,
    private readonly customer360Service: Customer360Service,
    private readonly salesService: SalesService,
  ) {}

  @OnEvent('retail.customer.created')
  async handleCustomerCreated(payload: any) {
    const { ctx, customer } = payload;
    
    // 1. Global Audit Log
    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id: customer.id,
      action: 'RETAIL_CUSTOMER_REGISTERED',
      module: 'RETAIL',
      entity_type: 'CUSTOMER',
      entity_id: customer.id,
      metadata: { source: 'headless_ecommerce' },
    });

    // 2. Marketing Sync (Customer 360)
    await this.customer360Service.syncContactFromEntity(ctx, 'RETAIL', customer.id);
  }

  @OnEvent('retail.order.completed')
  async handleOrderCompleted(payload: any) {
    const { ctx, order } = payload;

    // 1. Global Audit Log
    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id: order.cashier_id || 'SYSTEM',
      action: 'RETAIL_ORDER_PAID',
      module: 'RETAIL',
      entity_type: 'ORDER',
      entity_id: order.id,
      metadata: { amount: order.grand_total, currency: order.currency },
    });

    // 2. Core Sales Sync
    await this.salesService.recordConsolidatedSale(ctx, {
      external_id: order.id,
      source: 'RETAIL',
      amount: order.grand_total,
      currency: order.currency,
      customer_id: order.customer_id,
      customer_name: order.retail_customers?.name,
      company_id: order.company_id,
      store_id: order.store_id,
      ecommerce_id: order.ecommerce_id,
      location_id: order.location_id,
      items: order.items.map((item: any) => ({
        sku: item.sku,
        name: item.name,
        qty: item.quantity,
        price: item.unit_price,
      })),
    });
  }

  @OnEvent('retail.chat.initiated')
  async handleChatInitiated(payload: any) {
    const { ctx, customerId, context } = payload;

    // 1. Global Audit Log
    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id: customerId,
      action: 'WHATSAPP_CHAT_INITIATED',
      module: 'RETAIL',
      entity_type: 'COMMUNICATION',
      entity_id: customerId,
      metadata: context,
    });
  }
}
