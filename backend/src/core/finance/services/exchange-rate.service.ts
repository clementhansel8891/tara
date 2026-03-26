import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  /**
   * Retrieves the current exchange rate for a currency pair.
   * Logs the source and timestamp for audit traceability.
   */
  async getRate(from: string, to: string): Promise<{ rate: number; source: string; timestamp: Date }> {
    if (from === to) return { rate: 1.0, source: 'SYSTEM', timestamp: new Date() };

    this.logger.log(`Fetching exchange rate ${from} -> ${to}`);
    
    // Mock rates for development
    const mockRates: Record<string, number> = {
      'EUR_USD': 1.08,
      'GBP_USD': 1.27,
      'JPY_USD': 0.0067,
    };

    const key = `${from}_${to}`;
    const rate = mockRates[key] || 1.0;

    return {
      rate,
      source: 'MOCK_FINANCIAL_API',
      timestamp: new Date(),
    };
  }
}
