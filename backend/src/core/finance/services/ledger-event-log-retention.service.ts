import { Injectable, Logger, Inject } from '@nestjs/common';

@Injectable()
export class LedgerEventLogRetentionService {
  private readonly logger = new Logger(LedgerEventLogRetentionService.name);

  constructor(
    @Inject('ILedgerEventLogRepository')
    private readonly eventLogRepo: any,
    @Inject('ILedgerEventLogArchiveRepository')
    private readonly archiveRepo: any,
  ) {}

  /**
   * Archives processed events older than 30 days and deletes them from the primary table.
   */
  async runRetentionCycle(): Promise<void> {
    this.logger.log('Starting Ledger Event Log retention cycle...');

    const retentionLimit = new Date();
    retentionLimit.setDate(retentionLimit.getDate() - 30);

    try {
      // 1. Fetch old processed events
      const oldEvents = await this.eventLogRepo.findProcessedBefore(retentionLimit);
      
      if (oldEvents.length === 0) {
        this.logger.log('No logs found for archival.');
        return;
      }

      this.logger.log(`Archiving ${oldEvents.length} events...`);

      // 2. Batch Move to Archive
      // In a real DB, this would be a transaction: 
      // INSERT INTO archive SELECT * FROM logs WHERE ...; DELETE FROM logs WHERE ...;
      await this.archiveRepo.createArchiveEntries(oldEvents);

      // 3. Delete from primary
      const eventIds = oldEvents.map((e: any) => e.id);
      await this.eventLogRepo.deleteMany(eventIds);

      this.logger.log(`Retention cycle completed. ${oldEvents.length} events archived and deleted.`);
    } catch (error) {
      this.logger.error(`Retention cycle failed: ${error.message}`);
    }
  }
}
