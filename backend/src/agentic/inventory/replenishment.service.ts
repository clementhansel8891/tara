import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { ForecasterService } from './forecaster.service';

@Injectable()
export class ReplenishmentService {
  private readonly logger = new Logger(ReplenishmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly forecaster: ForecasterService,
  ) {}

  /**
   * Evaluates if a product needs replenishment at a given location.
   * Returns a recommendation object if replenishment is needed.
   */
  async evaluateReplenishment(tenantId: string, productId: string, locationId: string) {
    const level = await this.prisma.stockLevel.findUnique({
      where: {
        locationId_productId_departmentId: {
          locationId,
          productId,
          departmentId: null as any,
        },
      },
    });

    if (!level) return null;

    const dailyDemand = await this.forecaster.getForecast(tenantId, productId, locationId);
    
    // Default safety stock: 7 days of demand (if forecasting enabled)
    // If dailyDemand is 0, we use static reorder points from the StockLevel
    if (dailyDemand > 0) {
      const runwayDays = level.available / dailyDemand;
      const safetyThresholdDays = 7; 

      if (runwayDays < safetyThresholdDays) {
        const suggestQty = Math.ceil(dailyDemand * 14); // Restock for 14 days
        
        return {
          productId,
          locationId,
          currentAvailable: level.available,
          dailyDemand: dailyDemand.toFixed(2),
          runwayDays: runwayDays.toFixed(1),
          recommendedQty: suggestQty,
          reason: `LOW_RUNWAY: ${runwayDays.toFixed(1)} days left (Target: ${safetyThresholdDays})`,
        };
      }
    } else if (level.available <= level.minBuffer) {
      // Static reorder point fallback
      return {
        productId,
        locationId,
        currentAvailable: level.available,
        dailyDemand: 0,
        runwayDays: 'INF',
        recommendedQty: (level as any).maxCapacity - level.available,
        reason: `BUFFER_VIOLATION: Available ${level.available} <= Min ${level.minBuffer}`,
      };
    }

    return null;
  }
}
