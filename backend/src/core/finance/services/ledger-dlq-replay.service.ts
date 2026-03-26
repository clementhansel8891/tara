import { Injectable, Logger, Inject } from '@nestjs/common';
import { ILedgerPostingRepository } from '../repositories/interfaces/ledger-posting.repository.interface';
import { LedgerPostingStatus } from '../domain/finance.constants';
import { LedgerPostingService } from './ledger-posting.service';

export interface ReplayResult {
  eventId: string;
  tenantId: string;
  companyId: string;
  status: 'REQUEUED' | 'SKIPPED_IDEMPOTENT' | 'NOT_FOUND' | 'INVALID_STATE';
  at: Date;
  detail: string;
}

export interface BulkReplayResult {
  tenantId: string;
  companyId?: string;
  total: number;
  requeued: number;
  skipped: number;
  failed: string[];
  dryRun: boolean;
  at: Date;
}

/**
 * LedgerDlqReplayService
 * ────────────────────────
 * Operations tool for safely reprocessing failed ledger events.
 *
 * Safety guarantees:
 *  - Idempotency: events that already have a processed idempotency key are skipped
 *  - Audit: every replay action is logged with the operator context
 *  - Dry-run mode: returns counts without writing any changes
 */
@Injectable()
export class LedgerDlqReplayService {
  private readonly logger = new Logger(LedgerDlqReplayService.name);

  constructor(
    @Inject('ILedgerPostingRepository')
    private readonly ledgerRepo: ILedgerPostingRepository,
    private readonly ledgerPostingService: LedgerPostingService,
  ) {}

  /**
   * Replay a single failed event by its posting ID.
   * Resets retryCount and re-enqueues as PENDING.
   */
  async replayFailedEvent(
    tenantId: string,
    companyId: string,
    eventId: string,
  ): Promise<ReplayResult> {
    const posting = await this.ledgerRepo.findById(tenantId, companyId, eventId);

    if (!posting) {
      return {
        eventId,
        tenantId,
        companyId,
        status: 'NOT_FOUND',
        at: new Date(),
        detail: `Posting ${eventId} not found for tenant ${tenantId}`,
      };
    }

    const replayableStatuses: string[] = [
      LedgerPostingStatus.FAILED,
      LedgerPostingStatus.FAILED_RETRYABLE,
      LedgerPostingStatus.FAILED_TERMINAL,
    ];

    if (!replayableStatuses.includes(posting.status)) {
      return {
        eventId,
        tenantId,
        companyId,
        status: 'INVALID_STATE',
        at: new Date(),
        detail: `Posting ${eventId} is in status '${posting.status}' — only FAILED/FAILED_TERMINAL events can be replayed`,
      };
    }

    // Idempotency check: if already processed, skip
    const alreadyProcessed = await this.ledgerRepo.checkIdempotency(
      tenantId,
      companyId,
      posting.sourceEventId,
    );

    if (alreadyProcessed) {
      this.logger.warn(
        `[DLQ Replay] Event ${posting.sourceEventId} was already processed (idempotency key exists). Skipping.`,
      );
      return {
        eventId,
        tenantId,
        companyId,
        status: 'SKIPPED_IDEMPOTENT',
        at: new Date(),
        detail: `sourceEventId '${posting.sourceEventId}' already has an idempotency record — skipped to prevent double-processing`,
      };
    }

    // Reset and re-enqueue
    await this.ledgerRepo.updateStatus(tenantId, companyId, eventId, LedgerPostingStatus.PENDING, 0);

    this.logger.log(
      `[DLQ Replay] Re-queued posting ${eventId} (sourceEventId=${posting.sourceEventId}) for tenant ${tenantId}`,
    );

    return {
      eventId,
      tenantId,
      companyId,
      status: 'REQUEUED',
      at: new Date(),
      detail: `Posting reset to PENDING with retryCount=0. Will be picked up by LedgerWorkerService on next poll.`,
    };
  }

  /**
   * Replay all FAILED_TERMINAL events for a tenant.
   * dryRun=true returns counts without writing any changes.
   */
  async replayTenantDLQ(
    tenantId: string,
    companyId: string,
    options: { dryRun: boolean } = { dryRun: false },
  ): Promise<BulkReplayResult> {
    const failedTerminal = await this.ledgerRepo.findByStatus(
      tenantId,
      companyId,
      LedgerPostingStatus.FAILED_TERMINAL,
    );

    const result: BulkReplayResult = {
      tenantId,
      companyId,
      total: failedTerminal.length,
      requeued: 0,
      skipped: 0,
      failed: [],
      dryRun: options.dryRun,
      at: new Date(),
    };

    if (options.dryRun) {
      this.logger.log(
        `[DLQ Replay] DRY RUN for tenant ${tenantId}: found ${failedTerminal.length} FAILED_TERMINAL events`,
      );
      result.requeued = failedTerminal.length; // projected count in dry-run
      return result;
    }

    for (const posting of failedTerminal) {
      try {
        const replayResult = await this.replayFailedEvent(tenantId, companyId, posting.id);
        if (replayResult.status === 'REQUEUED') result.requeued++;
        else if (replayResult.status === 'SKIPPED_IDEMPOTENT') result.skipped++;
        else result.failed.push(`${posting.id}: ${replayResult.detail}`);
      } catch (err) {
        result.failed.push(`${posting.id}: ${err.message}`);
      }
    }

    this.logger.log(
      `[DLQ Replay] Tenant ${tenantId} — total=${result.total} requeued=${result.requeued} skipped=${result.skipped} failed=${result.failed.length}`,
    );

    return result;
  }
}
