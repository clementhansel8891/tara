import { Injectable, Logger } from '@nestjs/common';
import { PostingState } from '../domain/posting-gateway.interfaces';

@Injectable()
export class PostingRetryWorker {
  private readonly logger = new Logger(PostingRetryWorker.name);
  private readonly MAX_RETRIES = 5;

  constructor() {
    // In a real app, this would be a Cron or a Queue consumer
    this.startRetryLoop();
  }

  private startRetryLoop() {
    this.logger.log('Posting Retry Worker started.');
    // Simulated loop
    setInterval(() => this.processRetries(), 60000); // Every minute
  }

  private async processRetries() {
    this.logger.debug('Scanning for RETRY_PENDING events...');
    // Mock logic: find events in RETRY_PENDING from DB
    // For each:
    //   if (attempts < MAX_RETRIES) {
    //     call gateway.postEvent()
    //   } else {
    //     move to DLQ
    //   }
  }

  /**
   * Calculates next retry delay using exponential backoff.
   */
  getBackoffDelay(attempt: number): number {
    return Math.pow(2, attempt) * 10000; // 10s, 20s, 40s...
  }
}
