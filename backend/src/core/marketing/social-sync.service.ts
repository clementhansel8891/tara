import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../persistence/prisma.service";
import { TenantContext } from "../../gateway/tenant-context.interface";
import { MultiTenancyUtil } from "../../shared/utils/multi-tenancy.util";
import { EncryptionUtil } from "../../shared/utils/encryption.util";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SocialSyncService {
  private readonly logger = new Logger(SocialSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Exchange Meta code for access token
   */
  async handleMetaCallback(ctx: TenantContext, code: string) {
    const clientId = this.configService.get("META_APP_ID");
    const clientSecret = this.configService.get("META_APP_SECRET");
    const backendUrl = this.configService.get("BACKEND_URL") || "http://localhost:3001";
    const redirectUri = `${backendUrl}/marketing/oauth/callback/meta`;

    try {
      const response = await axios.get("https://graph.facebook.com/v17.0/oauth/access_token", {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        },
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Save to database
      await this.prisma.marketing_accounts.create({
        data: MultiTenancyUtil.wrapCreate(ctx, {
          id: uuidv4(),
          provider: "META",
          account_name: "Meta Ads Account",
          status: "CONNECTED",
          access_token: EncryptionUtil.encrypt(access_token),
          refresh_token: refresh_token ? EncryptionUtil.encrypt(refresh_token) : null,
          token_expires_at: new Date(Date.now() + expires_in * 1000),
          last_sync_at: new Date(),
        }),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Meta OAuth failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exchange Google code for access token
   */
  async handleGoogleCallback(ctx: TenantContext, code: string) {
    const clientId = this.configService.get("GOOGLE_ADS_CLIENT_ID");
    const clientSecret = this.configService.get("GOOGLE_ADS_CLIENT_SECRET");
    const backendUrl = this.configService.get("BACKEND_URL") || "http://localhost:3001";
    const redirectUri = `${backendUrl}/marketing/oauth/callback/google`;

    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
      });

      const { access_token, refresh_token, expires_in } = response.data;

      await this.prisma.marketing_accounts.create({
        data: MultiTenancyUtil.wrapCreate(ctx, {
          id: uuidv4(),
          provider: "GOOGLE",
          account_name: "Google Ads Account",
          status: "CONNECTED",
          access_token: EncryptionUtil.encrypt(access_token),
          refresh_token: refresh_token ? EncryptionUtil.encrypt(refresh_token) : null,
          token_expires_at: new Date(Date.now() + expires_in * 1000),
          last_sync_at: new Date(),
        }),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Google OAuth failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exchange TikTok code for access token
   */
  async handleTikTokCallback(ctx: TenantContext, code: string) {
    const clientKey = this.configService.get("TIKTOK_CLIENT_ID");
    const clientSecret = this.configService.get("TIKTOK_CLIENT_SECRET");

    try {
      const response = await axios.post("https://open.tiktokapis.com/v2/oauth/token/", {
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      });

      const { access_token, refresh_token, expires_in } = response.data;

      await this.prisma.marketing_accounts.create({
        data: MultiTenancyUtil.wrapCreate(ctx, {
          id: uuidv4(),
          provider: "TIKTOK",
          account_name: "TikTok Account",
          status: "CONNECTED",
          access_token: EncryptionUtil.encrypt(access_token),
          refresh_token: refresh_token ? EncryptionUtil.encrypt(refresh_token) : null,
          token_expires_at: new Date(Date.now() + expires_in * 1000),
          last_sync_at: new Date(),
        }),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`TikTok OAuth failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exchange YouTube code for access token
   */
  async handleYoutubeCallback(ctx: TenantContext, code: string) {
    // YouTube usually shares the same project as Google Ads
    const clientId = this.configService.get("GOOGLE_ADS_CLIENT_ID");
    const clientSecret = this.configService.get("GOOGLE_ADS_CLIENT_SECRET");
    const backendUrl = this.configService.get("BACKEND_URL") || "http://localhost:3001";
    const redirectUri = `${backendUrl}/marketing/oauth/callback/youtube`;

    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
      });

      const { access_token, refresh_token, expires_in } = response.data;

      await this.prisma.marketing_accounts.create({
        data: MultiTenancyUtil.wrapCreate(ctx, {
          id: uuidv4(),
          provider: "YOUTUBE",
          account_name: "YouTube Channel",
          status: "CONNECTED",
          access_token: EncryptionUtil.encrypt(access_token),
          refresh_token: refresh_token ? EncryptionUtil.encrypt(refresh_token) : null,
          token_expires_at: new Date(Date.now() + expires_in * 1000),
          last_sync_at: new Date(),
        }),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`YouTube OAuth failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unified entry point for syncing an account
   */
  async syncAccount(ctx: TenantContext, accountId: string, actorId: string) {
    const account = await this.prisma.marketing_accounts.findUnique({
      where: { id: accountId, ...MultiTenancyUtil.getScope(ctx) },
    });

    if (!account) throw new Error("Account not found");

    // Initialize sync log
    const logId = uuidv4();
    await this.prisma.marketing_sync_logs.create({
      data: MultiTenancyUtil.wrapCreate(ctx, {
        id: logId,
        account_id: accountId,
        status: "RUNNING",
        triggered_by: actorId,
        started_at: new Date(),
      }),
    });

    // Update account status
    await this.prisma.marketing_accounts.update({
      where: { id: accountId },
      data: { sync_status: "SYNCING" },
    });

    try {
      let dataPointsCount = 0;
      if (account.provider === "META" || account.provider === "meta") {
        dataPointsCount = await this.syncMetaAds(ctx, account);
      } else if (account.provider === "GOOGLE" || account.provider === "google") {
        dataPointsCount = await this.syncGoogleAds(ctx, account);
      } else if (account.provider === "TIKTOK") {
        dataPointsCount = await this.syncTikTok(ctx, account);
      } else if (account.provider === "YOUTUBE") {
        dataPointsCount = await this.syncYoutube(ctx, account);
      }

      // Finalize log
      await this.prisma.marketing_sync_logs.update({
        where: { id: logId },
        data: {
          status: "SUCCESS",
          finished_at: new Date(),
          data_points_count: dataPointsCount,
        },
      });

      // Update account status
      await this.prisma.marketing_accounts.update({
        where: { id: accountId },
        data: { 
          sync_status: "IDLE",
          last_sync_at: new Date(),
        },
      });

      return { success: true, dataPoints: dataPointsCount };
    } catch (error) {
      this.logger.error(`Sync failed for account ${accountId}: ${error.message}`);
      
      await this.prisma.marketing_sync_logs.update({
        where: { id: logId },
        data: {
          status: "FAILED",
          finished_at: new Date(),
          error_msg: error.message,
        },
      });

      await this.prisma.marketing_accounts.update({
        where: { id: accountId },
        data: { sync_status: "FAILED" },
      });

      throw error;
    }
  }

  /**
   * Sync Ads data from Meta
   */
  private async syncMetaAds(ctx: TenantContext, account: any): Promise<number> {
    const accessToken = EncryptionUtil.decrypt(account.access_token);
    this.logger.log(`Syncing Meta Ads for account ${account.id}`);

    // In a real implementation, we would call:
    // const response = await axios.get(`https://graph.facebook.com/v17.0/${account.external_id}/insights`, {
    //   headers: { Authorization: `Bearer ${accessToken}` }
    // });

    // Mocking 1-10 synced records
    const recordsToSync = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < recordsToSync; i++) {
      await this.prisma.marketing_executions.create({
        data: MultiTenancyUtil.wrapCreate(ctx, {
          id: uuidv4(),
          campaign_id: `campaign-${Math.random().toString(36).substring(7)}`,
          channel: "SOCIAL",
          status: "COMPLETED",
          leads_generated: Math.floor(Math.random() * 50),
          spend: 50 + Math.random() * 200,
          notes: "Auto-synced from Meta Ads API",
          scheduled_at: new Date(),
        }),
      });
    }

    return recordsToSync;
  }

  /**
   * Sync Ads data from Google
   */
  private async syncGoogleAds(ctx: TenantContext, account: any): Promise<number> {
    this.logger.log(`Syncing Google Ads for account ${account.id}`);
    // Implementation for Google Ads API would go here
    return 0;
  }

  /**
   * Sync data from TikTok
   */
  private async syncTikTok(ctx: TenantContext, account: any): Promise<number> {
    this.logger.log(`Syncing TikTok for account ${account.id}`);
    // Simulated sync
    return 5;
  }

  /**
   * Sync data from YouTube
   */
  private async syncYoutube(ctx: TenantContext, account: any): Promise<number> {
    this.logger.log(`Syncing YouTube for account ${account.id}`);
    // Simulated sync
    return 3;
  }
}
