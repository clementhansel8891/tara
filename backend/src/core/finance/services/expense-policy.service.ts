import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExpensePolicyService {
  private readonly logger = new Logger(ExpensePolicyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates an expense against the applicable policy.
   * Returns 'APPROVED', 'WARNING', or 'REJECTED'.
   */
  async evaluateExpense(tenantId: string, category: string, amount: number) {
    const policy = await this.prisma.expensePolicy.findFirst({
      where: { tenantId, category, status: 'ACTIVE' }
    });

    if (!policy) {
      this.logger.warn(`No expense policy found for category ${category}. Assuming permissive.`);
      return { status: 'PERMISSIVE', policyId: null };
    }

    const value = new Decimal(amount);

    if (value.gt(policy.hardLimit)) {
      return { status: 'REJECTED', policyId: policy.id, reason: 'EXCEEDS_HARD_LIMIT' };
    }

    if (value.gt(policy.softLimit)) {
      return { status: 'WARNING', policyId: policy.id, reason: 'EXCEEDS_SOFT_LIMIT' };
    }

    return { status: 'APPROVED', policyId: policy.id };
  }
}
