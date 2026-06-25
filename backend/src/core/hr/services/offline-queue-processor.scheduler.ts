import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OfflineEventQueueService } from './offline-event-queue.service';

/**
 * Scheduled Processor for Offline Event Queue
 * 
 * Responsibilities:
 * - Process pending offline events every minute
 * - Clean up old synced events daily
 * - Monitor queue health and log statistics
 * 
 * Requirements: 21.13
 */
@Injectable()
export class OfflineQueueProcessorScheduler {
  private readonly logger = new Logger(OfflineQueueProcessorScheduler.name);

  constructor(
    private readonly offlineQueueService: OfflineEventQueueService,
  ) {}

  /**
   * Process pending offline events every minute
   * 
   * Runs every 60 seconds to attempt syncing queued events
   * with exponential backoff retry logic
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingEvents() {
    this.logger.debug('Running scheduled offline event processing');

    try {
      const result = await this.offlineQueueService.processPendingEvents();

      if (result.processed > 0) {
        this.logger.log(
          `Processed ${result.processed} offline events: ${result.succeeded} succeeded, ${result.failed} failed`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process offline events: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clean up old synced events daily at 2 AM
   * 
   * Removes synced events older than 90 days to maintain
   * storage efficiency while complying with retention policy
   */
  @Cron('0 2 * * *') // 2 AM daily
  async cleanupOldEvents() {
    this.logger.log('Running scheduled cleanup of old synced events');

    try {
      const deleted = await this.offlineQueueService.cleanupOldEvents();
      this.logger.log(`Cleaned up ${deleted} old synced events`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old events: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Log queue statistics every 5 minutes for monitoring
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async logQueueStats() {
    try {
      const stats = await this.offlineQueueService.getQueueStats();

      if (stats.pending > 0 || stats.failed > 0) {
        this.logger.log(
          `Offline Queue Stats: ${stats.pending} pending, ${stats.synced} synced, ${stats.failed} failed (${stats.total} total)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to get queue stats: ${error.message}`,
        error.stack,
      );
    }
  }
}
