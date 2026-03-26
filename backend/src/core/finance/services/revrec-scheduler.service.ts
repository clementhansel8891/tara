import { Injectable, Logger } from '@nestjs/common';
import { RevRecSchedule, RevRecStatus, RecognitionPeriod } from '../domain/revrec.interfaces';
import { Prisma } from '@prisma/client';

@Injectable()
export class RevRecScheduler {
  private readonly logger = new Logger(RevRecScheduler.name);

  /**
   * Generates a linear revenue recognition schedule over a set period.
   * Hardened with Prisma.Decimal and "Penny Slop" correction.
   */
  async createSchedule(params: {
    tenantId: string;
    companyId: string;
    contractId: string;
    totalAmount: Prisma.Decimal;
    currency: string;
    startDate: Date;
    endDate: Date;
    deferredAccountId: string;
    revenueAccountId: string;
  }): Promise<RevRecSchedule> {
    const { startDate, endDate, totalAmount } = params;
    
    // Calculate months difference
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
    
    // Precision linear division
    const monthlyAmount = totalAmount.div(months).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    const periods: RecognitionPeriod[] = [];
    let runningTotal = new Prisma.Decimal(0);

    for (let i = 0; i < months; i++) {
        const periodDate = new Date(startDate);
        periodDate.setMonth(startDate.getMonth() + i);

        let amount = monthlyAmount;

        // Adjust for "Penny Slop" in the final period to ensure sum exactly matches totalAmount
        if (i === months - 1) {
            amount = totalAmount.minus(runningTotal);
        } else {
            runningTotal = runningTotal.plus(amount);
        }

        periods.push({
            date: periodDate,
            amount: amount,
            status: 'PENDING',
        });
    }

    const schedule: RevRecSchedule = {
      id: `SCH-${params.contractId}`,
      ...params,
      status: RevRecStatus.ACTIVE,
      periods,
    };

    this.logger.log(`Created precision RevRec Schedule for Contract ${params.contractId} [Sum: ${totalAmount}] [Periods: ${months}]`);
    return schedule;
  }
}
