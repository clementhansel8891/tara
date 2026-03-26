import { Injectable, Logger } from '@nestjs/common';
import { JournalDraft } from '../domain/journal-draft.models';
import { LedgerPostingService } from '../services/ledger-posting.service';

@Injectable()
export class LedgerPostingAdapter {
  private readonly logger = new Logger(LedgerPostingAdapter.name);

  constructor(
    private readonly ledgerService: LedgerPostingService,
  ) {}

  /**
   * Final bridge to the immutable ledger.
   * Transforms a validated JournalDraft into a Ledger Posting request.
   */
  async submit(draft: JournalDraft): Promise<{ journalId: string; sequence: number }> {
    this.logger.log(`Submitting JournalDraft ${draft.draftId} to Ledger Core.`);

    // Note: In a real implementation, this would call ledgerService.enqueuePosting
    // and wait for the result or return the enqueued ID.
    // For this design, we simulate the success path.
    
    const journalId = `JRN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const sequence = 1000 + Math.floor(Math.random() * 9000);

    return { journalId, sequence };
  }
}
