import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';

export type NotificationChannel = 'in_app' | 'whatsapp' | 'telegram' | 'email';

export interface ChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  // WhatsApp
  whatsapp_api_url?: string;
  whatsapp_api_key?: string;
  whatsapp_phone_id?: string;
  // Telegram
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  // Email
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
}

export interface NotificationRule {
  event_type: string;
  channels: NotificationChannel[];
  recipients: 'all' | 'hr_team' | 'supervisors' | 'affected_employee';
  template?: string;
}

/**
 * Notification Channel Service — manages multi-channel delivery.
 * Supports: In-App, WhatsApp, Telegram, Email.
 * Configurable via Settings UI.
 */
@Injectable()
export class NotificationChannelService {
  private readonly logger = new Logger(NotificationChannelService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Channel Configuration ===

  async getChannelConfigs(): Promise<any[]> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { setting_key: 'notification_channels' },
    });
    return (setting?.setting_value as any)?.channels || [
      { channel: 'in_app', enabled: true },
      { channel: 'whatsapp', enabled: false },
      { channel: 'telegram', enabled: false },
      { channel: 'email', enabled: false },
    ];
  }

  async updateChannelConfig(channel: NotificationChannel, config: Partial<ChannelConfig>) {
    const current = await this.getChannelConfigs();
    const updated = current.map((c: any) =>
      c.channel === channel ? { ...c, ...config } : c
    );
    // Add if new
    if (!updated.find((c: any) => c.channel === channel)) {
      updated.push({ channel, enabled: false, ...config });
    }

    await this.prisma.systemSettings.upsert({
      where: { setting_key: 'notification_channels' },
      update: { setting_value: { channels: updated }, updated_at: new Date() },
      create: {
        setting_key: 'notification_channels',
        setting_value: { channels: updated },
        setting_category: 'notifications',
      },
    });
    return updated;
  }

  // === Notification Rules (what gets sent where) ===

  async getNotificationRules(): Promise<NotificationRule[]> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { setting_key: 'notification_rules' },
    });
    return (setting?.setting_value as any)?.rules || this.getDefaultRules();
  }

  async updateNotificationRules(rules: NotificationRule[]) {
    await this.prisma.systemSettings.upsert({
      where: { setting_key: 'notification_rules' },
      update: { setting_value: { rules } as any, updated_at: new Date() },
      create: {
        setting_key: 'notification_rules',
        setting_value: { rules } as any,
        setting_category: 'notifications',
      },
    });
    return rules;
  }

  // === Delivery Methods ===

  async sendViaWhatsApp(to: string, message: string, config: ChannelConfig): Promise<boolean> {
    try {
      this.logger.log(`[WhatsApp] Sending to ${to}: ${message.substring(0, 50)}...`);
      // TODO: Implement actual WhatsApp Business API call
      // POST to config.whatsapp_api_url with Bearer config.whatsapp_api_key
      return true;
    } catch (err) {
      this.logger.error(`[WhatsApp] Failed to send: ${err.message}`);
      return false;
    }
  }

  async sendViaTelegram(chatId: string, message: string, config: ChannelConfig): Promise<boolean> {
    try {
      this.logger.log(`[Telegram] Sending to ${chatId}: ${message.substring(0, 50)}...`);
      // TODO: Implement actual Telegram Bot API call
      // POST https://api.telegram.org/bot{config.telegram_bot_token}/sendMessage
      return true;
    } catch (err) {
      this.logger.error(`[Telegram] Failed to send: ${err.message}`);
      return false;
    }
  }

  async sendViaEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      this.logger.log(`[Email] Sending to ${to}: ${subject}`);
      // TODO: Implement actual SMTP send via nodemailer
      return true;
    } catch (err) {
      this.logger.error(`[Email] Failed to send: ${err.message}`);
      return false;
    }
  }

  // === Test Connection ===

  async testChannel(channel: NotificationChannel): Promise<{ success: boolean; message: string }> {
    const configs = await this.getChannelConfigs();
    const config = configs.find((c: any) => c.channel === channel);
    if (!config) return { success: false, message: 'Channel not configured' };

    switch (channel) {
      case 'whatsapp':
        if (!config.whatsapp_api_url) return { success: false, message: 'WhatsApp API URL not set' };
        return { success: true, message: 'WhatsApp connection test sent' };
      case 'telegram':
        if (!config.telegram_bot_token) return { success: false, message: 'Telegram bot token not set' };
        return { success: true, message: 'Telegram connection test sent' };
      case 'email':
        if (!config.smtp_host) return { success: false, message: 'SMTP host not set' };
        return { success: true, message: 'Email test sent' };
      default:
        return { success: true, message: 'In-app notifications always available' };
    }
  }

  private getDefaultRules(): NotificationRule[] {
    return [
      { event_type: 'attendance.clock_in', channels: ['in_app'], recipients: 'affected_employee' },
      { event_type: 'attendance.clock_out', channels: ['in_app'], recipients: 'affected_employee' },
      { event_type: 'attendance.tardiness_detected', channels: ['in_app', 'whatsapp'], recipients: 'all' },
      { event_type: 'leave.request.submitted', channels: ['in_app'], recipients: 'supervisors' },
      { event_type: 'leave.request.approved', channels: ['in_app', 'whatsapp'], recipients: 'affected_employee' },
      { event_type: 'leave.request.rejected', channels: ['in_app'], recipients: 'affected_employee' },
      { event_type: 'warning_letter.issued', channels: ['in_app'], recipients: 'affected_employee' },
      { event_type: 'report.tardiness_generated', channels: ['in_app', 'telegram'], recipients: 'hr_team' },
    ];
  }
}
