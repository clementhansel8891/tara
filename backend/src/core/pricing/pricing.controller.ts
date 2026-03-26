import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PricingEngineService } from './pricing-engine.service';
import { PricingQuoteDto } from './dto/pricing-quote.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingEngine: PricingEngineService) {}

  @Get('quote')
  async getQuote(
    @Query('tenantId') tenantId: string,
    @Query('skuId') skuId: string,
    @Query('locationId') locationId: string,
  ): Promise<PricingQuoteDto> {
    // In a real scenario, tenantId would be extracted from the request header via a guard
    return this.pricingEngine.getQuote(tenantId, skuId, locationId);
  }
}
