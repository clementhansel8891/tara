import { Module } from '@nestjs/common';
import { FinanceModule } from './core/finance/finance.module';
import { HRModule } from './core/hr/hr.module';
import { ITSettingsModule } from './core/it-settings/it-settings.module';

/**
 * App Module
 * Root application module for Zenvix Backend
 * 
 * Imports:
 * - FinanceModule: Finance & Accounting (Core Module 1)
 * - HRModule: Global HR & Identity (Core Module 2)
 * - ITSettingsModule: IT, Settings & Device Bridge (Core Module 3)
 * 
 * Future modules:
 * - Industry modules (Retail, F&B, etc.)
 * - Support modules (Sync Engine, Payment Engine, etc.)
 */
@Module({
  imports: [FinanceModule, HRModule, ITSettingsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
