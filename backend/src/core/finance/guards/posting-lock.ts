import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PostingLockManager {
  private readonly logger = new Logger(PostingLockManager.name);
  private readonly locks = new Map<string, Date>();

  /**
   * Acquires a lock for a specific source event to prevent race conditions.
   * In production, this would use Redis (Redlock).
   */
  async acquire(tenantId: string, companyId: string, sourceEventId: string): Promise<boolean> {
    const lockKey = `${tenantId}:${companyId}:${sourceEventId}`;
    
    if (this.locks.has(lockKey)) {
      this.logger.warn(`Lock already held for key: ${lockKey}`);
      return false;
    }

    this.locks.set(lockKey, new Date());
    this.logger.debug(`Lock acquired for key: ${lockKey}`);
    return true;
  }

  /**
   * Releases the lock.
   */
  async release(tenantId: string, companyId: string, sourceEventId: string): Promise<void> {
    const lockKey = `${tenantId}:${companyId}:${sourceEventId}`;
    this.locks.delete(lockKey);
    this.logger.debug(`Lock released for key: ${lockKey}`);
  }
}
