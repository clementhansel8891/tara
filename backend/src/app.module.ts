import { Module } from '@nestjs/common';
import { FinanceModule } from './core/finance/finance.module';
import { HRModule } from './core/hr/hr.module';
import { ITSettingsModule } from './core/it-settings/it-settings.module';
import { ProcurementModule } from './core/procurement/procurement.module';
import { InventoryModule } from './core/inventory/inventory.module';
import { AdminModule } from './core/admin/admin.module';
import { ITModule } from './core/it/it.module';
import { SalesModule } from './core/sales/sales.module';
import { MarketingModule } from './core/marketing/marketing.module';
import { PaymentModule } from './core/payment/payment.module';
import { RetailModule } from './core/retail/retail.module';
import { PersistenceModule } from './persistence/persistence.module';
import { AuditModule } from './shared/audit/audit.module';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

/**
 * App Module
 * Root application module for Zenvix Backend
 * 
 * Imports:
 * - FinanceModule: Finance & Accounting (Core Module 1)
 * - HRModule: Global HR & Identity (Core Module 2)
 * - ITSettingsModule: IT, Settings & Device Bridge (Core Module 3)
 * - PersistenceModule: Global Database Connection (Prisma)
 * 
 * Future modules:
 * - Industry modules (Retail, F&B, etc.)
 * - Support modules (Sync Engine, Payment Engine, etc.)
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    PersistenceModule,
    FinanceModule,
    HRModule,
    ITSettingsModule,
    ProcurementModule,
    InventoryModule,
    AdminModule,
    ITModule,
    SalesModule,
    MarketingModule,
    PaymentModule,
    RetailModule,
    AuditModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})

export class AppModule {}
