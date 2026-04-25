import { Controller, Get, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { PricingEngineService } from './pricing-engine.service';
import { PricingQuoteDto } from './dto/pricing-quote.dto';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantGuard } from '../../shared/guards/tenant.guard';

@Controller('pricing')
@UseGuards(TenantGuard)
@UseInterceptors(TenantInterceptor)
export class PricingController {
  constructor(private readonly pricingEngine: PricingEngineService) {}

  @Get('quote')
  async getQuote(
    @Req() request: any,
    @Query('skuId') skuId: string,
    @Query('location_id') location_id: string,
  ): Promise<PricingQuoteDto> {
    return this.pricingEngine.getQuote(request.tenantContext, skuId, location_id);
  }
}
