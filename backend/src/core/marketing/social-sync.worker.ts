import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../persistence/prisma.service";
import { SocialSyncService } from "./social-sync.service";

@Injectable()
export class SocialSyncWorker {
  private readonly logger = new Logger(SocialSyncWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly socialSync: SocialSyncService,
  ) {}

  /**
   * Sync Ads data for all connected accounts every 4 hours
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async handleAdsSync() {
    this.logger.log("Starting scheduled Ads synchronization...");

    const accounts = await this.prisma.marketing_accounts.findMany({
      where: { status: "CONNECTED" },
    });

    for (const account of accounts) {
      const ctx = { tenant_id: account.tenant_id } as any;
      try {
        await this.socialSync.syncAccount(ctx, account.id, "system");
      } catch (err) {
        this.logger.error(`Failed to sync account ${account.id}: ${err.message}`);
      }
    }

    this.logger.log(`Ads sync completed for ${accounts.length} accounts.`);
  }
}
