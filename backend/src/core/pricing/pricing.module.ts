import { Module, Global } from '@nestjs/common';
import { PricingEngineService } from './pricing-engine.service';
import { PricingMockRepository } from './repositories/pricing.mock.repository';
import { IPricingRepository } from './repositories/interfaces/pricing.repository.interface';
import { FinanceModule } from '../finance/finance.module';
import { PricingController } from './pricing.controller';

@Global()
@Module({
  imports: [FinanceModule],
  controllers: [PricingController],
  providers: [
    PricingEngineService,
    {
      provide: 'IPricingRepository',
      useClass: PricingMockRepository,
    },
  ],
  exports: [PricingEngineService],
})
export class PricingModule {}
