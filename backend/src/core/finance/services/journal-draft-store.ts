import { Injectable, Logger } from '@nestjs/common';
import { JournalDraft } from '../domain/journal-draft.models';

@Injectable()
export class JournalDraftStore {
  private readonly logger = new Logger(JournalDraftStore.name);
  private readonly store = new Map<string, JournalDraft>();

  /**
   * Persists a draft to survive crashes during the commit phase.
   * In production, this would be a Postgres/Redis persistence call.
   */
  async save(draft: JournalDraft): Promise<void> {
    this.store.set(draft.draftId, draft);
    this.logger.debug(`JournalDraft ${draft.draftId} persisted to store.`);
  }

  /**
   * Clears the draft after successful ledger commit.
   */
  async remove(draftId: string): Promise<void> {
    this.store.delete(draftId);
    this.logger.debug(`JournalDraft ${draftId} removed from store.`);
  }

  /**
   * Retrieves a draft for recovery or retry.
   */
  async get(draftId: string): Promise<JournalDraft | undefined> {
    return this.store.get(draftId);
  }
}
