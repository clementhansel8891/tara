import { Injectable, BadRequestException } from '@nestjs/common';
import { JournalValidationResult } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';

@Injectable()
export class JournalValidationService {
  // Requirement: ZERO TOLERANCE for professional ledger
  private static readonly BALANCE_TOLERANCE = new Prisma.Decimal(0);

  async validate(journal: any): Promise<JournalValidationResult> {
    const result = this.check(journal);
    if (!result.valid) {
      throw new BadRequestException(`Journal validation failed: ${result.errors.join(' | ')}`);
    }
    return result;
  }

  check(journal: any): JournalValidationResult {
    const errors: string[] = [];

    if (!journal.lines || journal.lines.length === 0) {
      errors.push('[EMPTY_JOURNAL] journal must have at least one line');
    }

    for (const line of journal.lines ?? []) {
      const amount = new Prisma.Decimal(line.amount);
      if (amount.lte(0)) {
        errors.push(`[INVALID_LINE_AMOUNT] all line amounts must be > 0, got ${amount.toString()}`);
        break;
      }
    }

    const totalDebit = new Prisma.Decimal(journal.totalDebit);
    const totalCredit = new Prisma.Decimal(journal.totalCredit);
    const imbalance = totalDebit.minus(totalCredit).abs();
    
    if (imbalance.gt(JournalValidationService.BALANCE_TOLERANCE)) {
      errors.push(`[UNBALANCED_JOURNAL] debits (${totalDebit.toString()}) ≠ credits (${totalCredit.toString()}) — imbalance: ${imbalance.toString()}`);
    }

    if (!journal.sourceEventId || journal.sourceEventId.trim() === '') {
      errors.push('[MISSING_EVENT_ORIGIN] sourceEventId is required');
    }

    const valid = errors.length === 0;
    return { valid, isValid: valid, errors };
  }
}
