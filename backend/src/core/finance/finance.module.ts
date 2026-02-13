import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { IFinanceRepository } from './repositories/finance.repository.interface';
import { FinanceMockRepository } from './repositories/finance.mock.repository';

/**
 * Finance Module
 * Core module for financial operations
 * 
 * In DEV_MOCK_MODE: Uses FinanceMockRepository
 * In PRODUCTION: Will use real database repository (swap provider)
 */
@Module({
  controllers: [FinanceController],
  providers: [
    FinanceService,
    {
      provide: IFinanceRepository,
      useClass: FinanceMockRepository, // DEV_MOCK_MODE: Swap to real repo later
    },
  ],
  exports: [FinanceService], // Export for cross-module usage
})
export class FinanceModule {}
