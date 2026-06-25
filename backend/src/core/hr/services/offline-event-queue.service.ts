import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { TaraEvent, EventBusService } from './event-bus.service';

/**
 * Offline Event Queue Service for TARA HR System
 * 
 * Responsibilities:
 * - Queue events locally when Event Bus is temporarily unavailable
 * - Implement retry mechanism with exponential backoff
 * - Replay queued events when Event Bus reconnects
 * 
 * Requirements: 21.13
 */
@Injectable()
export class OfflineEventQueueService {
  private readonly logger = new Logger(OfflineEventQueueService.name);
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly BASE_BACKOFF_MS = 1000; // 1 second
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Queue an event locally when Event Bus is unavailable
   * 
   * @param event - TaraEvent to queue
   * @returns The queued event record
   */
  async queueEvent(event: TaraEvent): Promise<any> {
    try {
      const queuedEvent = await this.prisma.offlineActionQueue.create({
        data: {
          employee_id: event.actor.id,
          action_type: event.event_type,
          action_payload: {
            event_id: event.event_id,
            event_version: event.event_version,
            event_timestamp: event.event_timestamp,
            actor: event.actor,
            entity: event.entity,
            payload: event.payload,
            metadata: event.metadata,
          },
          client_timestamp: event.event_timestamp,
          sync_status: 'pending',
        },
      });

      this.logger.log(
        `Event queued offline: ${event.event_type} [${event.event_id}] for employee ${event.actor.id}`,
      );

      return queuedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to queue event offline: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Attempt to emit event to Event Bus, queue offline if unavailable
   * 
   * @param event - TaraEvent to emit
   * @returns True if emitted successfully, false if queued offline
   */
  async emitOrQueue(event: TaraEvent): Promise<boolean> {
    try {
      await this.eventBus.emit(event);
      return true;
    } catch (error) {
      this.logger.warn(
        `Event Bus unavailable, queuing event offline: ${event.event_type}`,
      );
      await this.queueEvent(event);
      return false;
    }
  }

  /**
   * Process pending offline events with exponential backoff
   * 
   * Implements retry mechanism with exponential backoff:
   * - Attempt 1: immediate
   * - Attempt 2: 1 second
   * - Attempt 3: 2 seconds
   * - Attempt 4: 4 seconds
   * - Attempt 5: 8 seconds
   * 
   * Requirements: 21.13 - Retry with exponential backoff
   */
  async processPendingEvents(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      this.logger.debug('Already processing pending events, skipping');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // Get pending events ordered by creation time (oldest first)
      const pendingEvents = await this.prisma.offlineActionQueue.findMany({
        where: {
          sync_status: 'pending',
        },
        orderBy: {
          created_at: 'asc',
        },
        take: 50, // Process in batches
      });

      this.logger.log(
        `Processing ${pendingEvents.length} pending offline events`,
      );

      for (const queuedEvent of pendingEvents) {
        processed++;

        try {
          // Calculate retry attempt based on sync_error field
          const retryAttempt = this.getRetryAttempt(queuedEvent.sync_error);

          // Check if max retries exceeded
          if (retryAttempt >= this.MAX_RETRY_ATTEMPTS) {
            await this.markAsFailed(
              queuedEvent.id,
              `Max retry attempts (${this.MAX_RETRY_ATTEMPTS}) exceeded`,
            );
            failed++;
            continue;
          }

          // Calculate exponential backoff delay
          const backoffDelay = this.calculateBackoff(retryAttempt);
          const eventAge = Date.now() - queuedEvent.created_at.getTime();

          // Check if enough time has passed for retry
          if (eventAge < backoffDelay) {
            this.logger.debug(
              `Event ${queuedEvent.id} waiting for backoff: ${backoffDelay - eventAge}ms remaining`,
            );
            continue;
          }

          // Reconstruct TaraEvent from queued payload
          const taraEvent = this.reconstructEvent(queuedEvent);

          // Attempt to emit to Event Bus
          await this.eventBus.emit(taraEvent);

          // Mark as synced
          await this.markAsSynced(queuedEvent.id);
          succeeded++;

          this.logger.log(
            `Successfully synced offline event: ${queuedEvent.action_type} [${queuedEvent.id}]`,
          );
        } catch (error) {
          // Update retry count and error message
          await this.updateRetryAttempt(queuedEvent.id, error.message);
          failed++;

          this.logger.warn(
            `Failed to sync event ${queuedEvent.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Offline event processing complete: ${succeeded} succeeded, ${failed} failed out of ${processed} processed`,
      );
    } finally {
      this.isProcessing = false;
    }

    return { processed, succeeded, failed };
  }

  /**
   * Calculate exponential backoff delay in milliseconds
   * 
   * Formula: BASE_BACKOFF_MS * 2^(retry_attempt)
   * 
   * @param retryAttempt - Current retry attempt (0-based)
   * @returns Delay in milliseconds
   */
  private calculateBackoff(retryAttempt: number): number {
    return this.BASE_BACKOFF_MS * Math.pow(2, retryAttempt);
  }

  /**
   * Get retry attempt number from sync_error field
   * 
   * Stores retry count in sync_error as "Retry attempt X: <error message>"
   */
  private getRetryAttempt(syncError: string | null): number {
    if (!syncError) return 0;

    const match = syncError.match(/^Retry attempt (\d+):/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Update retry attempt count in sync_error field
   */
  private async updateRetryAttempt(
    queueId: string,
    errorMessage: string,
  ): Promise<void> {
    const currentEvent = await this.prisma.offlineActionQueue.findUnique({
      where: { id: queueId },
    });

    if (!currentEvent) return;

    const currentAttempt = this.getRetryAttempt(currentEvent.sync_error);
    const newAttempt = currentAttempt + 1;

    await this.prisma.offlineActionQueue.update({
      where: { id: queueId },
      data: {
        sync_error: `Retry attempt ${newAttempt}: ${errorMessage}`,
      },
    });
  }

  /**
   * Reconstruct TaraEvent from queued payload
   */
  private reconstructEvent(queuedEvent: any): TaraEvent {
    const payload = queuedEvent.action_payload as any;

    return {
      event_id: payload.event_id,
      event_type: queuedEvent.action_type,
      event_version: payload.event_version || '1.0',
      event_timestamp: new Date(payload.event_timestamp),
      actor: payload.actor,
      entity: payload.entity,
      payload: payload.payload,
      metadata: payload.metadata,
    };
  }

  /**
   * Mark event as successfully synced
   */
  private async markAsSynced(queueId: string): Promise<void> {
    await this.prisma.offlineActionQueue.update({
      where: { id: queueId },
      data: {
        sync_status: 'synced',
        synced_at: new Date(),
        sync_error: null,
      },
    });
  }

  /**
   * Mark event as permanently failed
   */
  private async markAsFailed(queueId: string, reason: string): Promise<void> {
    await this.prisma.offlineActionQueue.update({
      where: { id: queueId },
      data: {
        sync_status: 'failed',
        sync_error: reason,
      },
    });

    this.logger.error(`Event ${queueId} permanently failed: ${reason}`);
  }

  /**
   * Get statistics about offline queue
   */
  async getQueueStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    total: number;
  }> {
    const [pending, synced, failed, total] = await Promise.all([
      this.prisma.offlineActionQueue.count({
        where: { sync_status: 'pending' },
      }),
      this.prisma.offlineActionQueue.count({
        where: { sync_status: 'synced' },
      }),
      this.prisma.offlineActionQueue.count({
        where: { sync_status: 'failed' },
      }),
      this.prisma.offlineActionQueue.count(),
    ]);

    return { pending, synced, failed, total };
  }

  /**
   * Clean up old synced events (older than 90 days)
   * 
   * Requirements: 21.9 - Event retention (90 days)
   */
  async cleanupOldEvents(): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.prisma.offlineActionQueue.deleteMany({
      where: {
        sync_status: 'synced',
        synced_at: {
          lt: ninetyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old synced events`);
    return result.count;
  }

  /**
   * Retry all failed events (reset to pending for manual retry)
   */
  async retryFailedEvents(): Promise<number> {
    const result = await this.prisma.offlineActionQueue.updateMany({
      where: {
        sync_status: 'failed',
      },
      data: {
        sync_status: 'pending',
        sync_error: 'Manual retry requested',
      },
    });

    this.logger.log(`Reset ${result.count} failed events to pending`);
    return result.count;
  }

  /**
   * Get pending events for a specific employee
   */
  async getPendingEventsForEmployee(employeeId: string): Promise<any[]> {
    return this.prisma.offlineActionQueue.findMany({
      where: {
        employee_id: employeeId,
        sync_status: 'pending',
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }
}
