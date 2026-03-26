import { Injectable, Logger } from '@nestjs/common';
import { FinancialEventRegistry } from '../domain/posting-gateway.interfaces';

@Injectable()
export class FinancialEventRegistryService {
  private readonly logger = new Logger(FinancialEventRegistryService.name);
  private readonly registry = new Map<string, FinancialEventRegistry>();

  constructor() {
    // Basic seeds for development
    this.seedRegistry();
  }

  /**
   * Checks if an event is registered and active.
   */
  isValid(eventType: string, version: string): boolean {
    const event = this.registry.get(eventType);
    if (!event) return false;
    
    return event.isActive && event.eventVersion === version;
  }

  /**
   * Returns the rule template ID associated with the event.
   */
  getTemplateId(eventType: string): string | undefined {
    return this.registry.get(eventType)?.ruleTemplateId;
  }

  private seedRegistry() {
    this.registry.set('SALES_COMPLETED', {
      eventType: 'SALES_COMPLETED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-SALE-001',
      isActive: true,
    });

    this.registry.set('PAYROLL_POSTED', {
      eventType: 'PAYROLL_POSTED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-PAYROLL-001',
      isActive: true,
    });

    this.registry.set('INVOICE_CREATED', {
      eventType: 'INVOICE_CREATED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-AR-INV-001',
      isActive: true,
    });

    this.registry.set('PAYMENT_RECEIVED', {
      eventType: 'PAYMENT_RECEIVED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-AR-PAY-001',
      isActive: true,
    });

    this.registry.set('PAYMENT_ALLOCATED', {
      eventType: 'PAYMENT_ALLOCATED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-AR-ALC-001',
      isActive: true,
    });

    this.registry.set('VENDOR_BILL_CREATED', {
      eventType: 'VENDOR_BILL_CREATED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-AP-BILL-001',
      isActive: true,
    });

    this.registry.set('VENDOR_PAYMENT_CREATED', {
      eventType: 'VENDOR_PAYMENT_CREATED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-AP-PAY-001',
      isActive: true,
    });

    this.registry.set('CASH_RECEIVED', {
      eventType: 'CASH_RECEIVED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-CASH-IN-001',
      isActive: true,
    });

    this.registry.set('CASH_PAID', {
      eventType: 'CASH_PAID',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-CASH-OUT-001',
      isActive: true,
    });

    this.registry.set('BANK_ADJUSTMENT', {
      eventType: 'BANK_ADJUSTMENT',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-BANK-ADJ-001',
      isActive: true,
    });

    this.registry.set('REVENUE_RECOGNIZED', {
      eventType: 'REVENUE_RECOGNIZED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-REVREC-001',
      isActive: true,
    });

    this.registry.set('ASSET_ACQUIRED', {
      eventType: 'ASSET_ACQUIRED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-ASSET-ACQ-001',
      isActive: true,
    });

    this.registry.set('ASSET_DEPRECIATED', {
      eventType: 'ASSET_DEPRECIATED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-ASSET-DEPR-001',
      isActive: true,
    });

    this.registry.set('ASSET_DISPOSED', {
      eventType: 'ASSET_DISPOSED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-ASSET-DISP-001',
      isActive: true,
    });

    this.registry.set('INVENTORY_RECEIVED', {
      eventType: 'INVENTORY_RECEIVED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-INV-REC-001',
      isActive: true,
    });

    this.registry.set('INVENTORY_ISSUED', {
      eventType: 'INVENTORY_ISSUED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-INV-ISS-001',
      isActive: true,
    });

    this.registry.set('COGS_RECORDED', {
      eventType: 'COGS_RECORDED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-COGS-001',
      isActive: true,
    });

    this.registry.set('INVENTORY_REVALUED', {
      eventType: 'INVENTORY_REVALUED',
      eventVersion: '1.0.0',
      schemaVersion: '2026-Q1',
      ruleTemplateId: 'RULE-INV-REV-001',
      isActive: true,
    });
  }
}
