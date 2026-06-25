import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';

export type AttendanceSource = 'phone' | 'aws_device' | 'hybrid';

export interface AttendanceConfig {
  source: AttendanceSource;
  aws_sync_enabled: boolean;
  aws_sync_cron: string;  // e.g. "*/15 * * * *" (every 15 min)
  aws_sync_interval_minutes: number;
  aws_webhook_url: string;
  aws_api_key: string;
  phone_biometric_required: boolean;
  phone_geofence_required: boolean;
  allow_manual_override: boolean;
}

/**
 * Attendance Configuration Service — controls how attendance is recorded.
 * Manages: phone-only, AWS-only, or hybrid mode.
 * AWS cron job scheduling for history sync.
 */
@Injectable()
export class AttendanceConfigService {
  private readonly logger = new Logger(AttendanceConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfig(): Promise<AttendanceConfig> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { setting_key: 'attendance_config' },
    });
    return (setting?.setting_value as any) || this.getDefaultConfig();
  }

  async updateConfig(config: Partial<AttendanceConfig>) {
    const current = await this.getConfig();
    const merged = { ...current, ...config };

    await this.prisma.systemSettings.upsert({
      where: { setting_key: 'attendance_config' },
      update: { setting_value: merged as any, updated_at: new Date() },
      create: {
        setting_key: 'attendance_config',
        setting_value: merged as any,
        setting_category: 'attendance',
      },
    });

    this.logger.log(`Attendance config updated: source=${merged.source}, aws_sync=${merged.aws_sync_enabled}`);
    return merged;
  }

  async setAttendanceSource(source: AttendanceSource) {
    return this.updateConfig({ source });
  }

  async setAwsSyncSchedule(cronExpression: string, intervalMinutes: number) {
    return this.updateConfig({
      aws_sync_cron: cronExpression,
      aws_sync_interval_minutes: intervalMinutes,
    });
  }

  async toggleAwsSync(enabled: boolean) {
    return this.updateConfig({ aws_sync_enabled: enabled });
  }

  private getDefaultConfig(): AttendanceConfig {
    return {
      source: 'phone',
      aws_sync_enabled: false,
      aws_sync_cron: '*/15 * * * *',
      aws_sync_interval_minutes: 15,
      aws_webhook_url: '',
      aws_api_key: '',
      phone_biometric_required: true,
      phone_geofence_required: true,
      allow_manual_override: true,
    };
  }
}
