import { Module } from '@nestjs/common';
import { HRController } from './hr.controller';
import { HRService } from './hr.service';
import { IHRRepository } from './repositories/hr.repository.interface';
import { HRMockRepository } from './repositories/hr.mock.repository';

/**
 * HR Module
 * Core module for Human Resources operations
 * 
 * In DEV_MOCK_MODE: Uses HRMockRepository
 * In PRODUCTION: Will use real database repository
 */
@Module({
  controllers: [HRController],
  providers: [
    HRService,
    {
      provide: IHRRepository,
      useClass: HRMockRepository, // DEV_MOCK_MODE: Swap to real repo later
    },
  ],
  exports: [HRService], // Export for cross-module usage
})
export class HRModule {}
