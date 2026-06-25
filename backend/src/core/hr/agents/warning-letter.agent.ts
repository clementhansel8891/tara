import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService, TaraEvent } from '../services/event-bus.service';

/**
 * Warning Letter Agent (Surat Peringatan Agent)
 *
 * Autonomous service for TARA HR System that handles:
 * - Auto-escalation: tardiness/violation thresholds → SP1 → SP2 → SP3
 * - Warning letter expiry tracking and automatic status updates
 * - Compliance monitoring (ensures all active SPs are tracked)
 * - Disciplinary action recommendations based on accumulated violations
 * - Notification reminders before SP expiry for HR awareness
 *
 * Escalation rules:
 * - 3 tardiness incidents in 30 days → recommend SP1
 * - Active SP1 + 3 more incidents → recommend SP2
 * - Active SP2 + 2 more incidents → recommend SP3
 * - Active SP3 violations → recommend termination review
 *
 * Scheduled tasks:
 * - Daily at 08:30 WIB: check for expiring warning letters (30-day notice)
 * - Daily at 09:30 WIB: evaluate escalation candidates
 * - Weekly Monday 08:00 WIB: generate compliance summary report
 *
 * Event-driven:
 * - warning_letter.issued: track and confirm delivery
 * - attendance.tardiness_detected: increment violation counter
 */
@Injectable()
export class WarningLetterAgent {
  private readonly logger = new Logger(WarningLetterAgent.name);

  /** Tardiness incidents threshold for SP1 recommendation */
  private readonly SP1_TARDINESS_THRESHOLD = 3;
  /** Additional incidents after SP1 for SP2 recommendation */
  private readonly SP2_ESCALATION_THRESHOLD = 3;
  /** Additional incidents after SP2 for SP3 recommendation */
  private readonly SP3_ESCALATION_THRESHOLD = 2;
  /** Days to look back when counting violations */
  private readonly VIOLATION_WINDOW_DAYS = 30;
  /** Days before expiry to send reminder */
  private readonly EXPIRY_REMINDER_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
  ) {
    this.logger.log('Warning Letter Agent initialized');
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  /**
   * Track tardiness events for escalation evaluation.
   */
  @OnEvent('attendance.tardiness_detected')
  async handleTardinessDetected(event: TaraEvent | any): Promise<void> {
    const payload = event?.payload || event;
    const { employee_id, employee_name } = payload;

    this.logger.debug(`Tardiness detected for ${employee_name} (${employee_id})`);

    try {
      // Count recent tardiness incidents
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - this.VIOLATION_WINDOW_DAYS);

      const recentTardiness = await this.prisma.attendance.count({
        where: {
          employee_id,
          is_tardy: true,
          attendance_date: { gte: windowStart },
        },
      });

      // Check current active warning letters
      const activeWarnings = await this.prisma.warningLetter.findMany({
        where: {
          employee_id,
          status: 'active',
        },
        orderBy: { issue_date: 'desc' },
      });

      const highestLevel = this.getHighestWarningLevel(activeWarnings);
      const recommendation = this.evaluateEscalation(recentTardiness, highestLevel);

      if (recommendation) {
        await this.emitWarningEvent('warning_letter.escalation_recommended', {
          employee_id,
          employee_name,
          current_level: highestLevel,
          recommended_level: recommendation,
          tardiness_count_in_window: recentTardiness,
          window_days: this.VIOLATION_WINDOW_DAYS,
        });

        this.logger.log(
          `Escalation recommended for ${employee_name}: ${highestLevel || 'none'} → ${recommendation}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to evaluate escalation for ${employee_id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Track warning letter issuance for audit/compliance.
   */
  @OnEvent('warning_letter.issued')
  async handleWarningLetterIssued(event: TaraEvent | any): Promise<void> {
    const payload = event?.payload || event;
    const { warning_letter_id, employee_id, warning_level } = payload;

    this.logger.log(`Warning letter ${warning_level} issued to employee ${employee_id}`);

    try {
      await this.emitWarningEvent('warning_letter.tracked', {
        warning_letter_id,
        employee_id,
        warning_level,
        tracked_at: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to track warning letter: ${error.message}`, error.stack);
    }
  }

  // ─── Scheduled Tasks ──────────────────────────────────────────────────────

  /**
   * Check for expiring warning letters — daily at 08:30 WIB (01:30 UTC).
   * Notifies HR of warning letters expiring within 30 days.
   */
  @Cron('30 1 * * 1-5') // 08:30 WIB, Mon-Fri
  async checkExpiringWarnings(): Promise<void> {
    this.logger.log('Checking for expiring warning letters');

    try {
      const expiryWindow = new Date();
      expiryWindow.setDate(expiryWindow.getDate() + this.EXPIRY_REMINDER_DAYS);

      const expiringWarnings = await this.prisma.warningLetter.findMany({
        where: {
          status: 'active',
          expiry_date: {
            not: null,
            lte: expiryWindow,
            gte: new Date(),
          },
        },
        include: {
          employee: { select: { id: true, full_name: true } },
        },
      });

      if (expiringWarnings.length === 0) {
        this.logger.debug('No warning letters expiring soon');
        return;
      }

      this.logger.log(`Found ${expiringWarnings.length} warning letter(s) expiring within ${this.EXPIRY_REMINDER_DAYS} days`);

      await this.emitWarningEvent('warning_letter.expiry_reminder', {
        count: expiringWarnings.length,
        warnings: expiringWarnings.map((w) => ({
          id: w.id,
          employee_name: w.employee.full_name,
          warning_level: w.warning_level,
          expiry_date: w.expiry_date?.toISOString()?.substring(0, 10),
        })),
      });
    } catch (error) {
      this.logger.error(`Failed to check expiring warnings: ${error.message}`, error.stack);
    }
  }

  /**
   * Auto-expire warning letters past their expiry date — daily at 00:00 UTC.
   */
  @Cron('0 0 * * *') // Daily midnight UTC
  async autoExpireWarnings(): Promise<void> {
    this.logger.log('Auto-expiring past-due warning letters');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expired = await this.prisma.warningLetter.updateMany({
        where: {
          status: 'active',
          expiry_date: { lt: today, not: null },
        },
        data: { status: 'expired', updated_at: new Date() },
      });

      if (expired.count > 0) {
        this.logger.log(`Auto-expired ${expired.count} warning letter(s)`);
        await this.emitWarningEvent('warning_letter.auto_expired', {
          count: expired.count,
          expired_at: today.toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to auto-expire warnings: ${error.message}`, error.stack);
    }
  }

  /**
   * Evaluate escalation candidates — daily at 09:30 WIB (02:30 UTC).
   * Looks for employees approaching escalation thresholds.
   */
  @Cron('30 2 * * 1-5') // 09:30 WIB, Mon-Fri
  async evaluateEscalationCandidates(): Promise<void> {
    this.logger.log('Evaluating escalation candidates');

    try {
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - this.VIOLATION_WINDOW_DAYS);

      // Get tardiness counts per employee in the window
      const tardinessCounts = await this.prisma.attendance.groupBy({
        by: ['employee_id'],
        where: {
          is_tardy: true,
          attendance_date: { gte: windowStart },
        },
        _count: { id: true },
      });

      const candidates: any[] = [];

      for (const record of tardinessCounts) {
        if (record._count.id < this.SP1_TARDINESS_THRESHOLD) continue;

        const activeWarnings = await this.prisma.warningLetter.findMany({
          where: { employee_id: record.employee_id, status: 'active' },
        });

        const highestLevel = this.getHighestWarningLevel(activeWarnings);
        const recommendation = this.evaluateEscalation(record._count.id, highestLevel);

        if (recommendation) {
          const employee = await this.prisma.employee.findUnique({
            where: { id: record.employee_id },
            select: { full_name: true },
          });

          candidates.push({
            employee_id: record.employee_id,
            employee_name: employee?.full_name,
            current_level: highestLevel,
            recommended_level: recommendation,
            tardiness_count: record._count.id,
          });
        }
      }

      if (candidates.length > 0) {
        await this.emitWarningEvent('warning_letter.escalation_candidates', {
          count: candidates.length,
          candidates,
        });

        this.logger.log(`Found ${candidates.length} escalation candidate(s)`);
      }
    } catch (error) {
      this.logger.error(`Failed to evaluate escalation candidates: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly compliance summary — Monday 08:00 WIB (01:00 UTC).
   */
  @Cron('0 1 * * 1') // Monday 08:00 WIB
  async generateComplianceSummary(): Promise<void> {
    this.logger.log('Generating weekly warning letter compliance summary');

    try {
      const [activeSP1, activeSP2, activeSP3, total] = await Promise.all([
        this.prisma.warningLetter.count({ where: { status: 'active', warning_level: 'SP1' } }),
        this.prisma.warningLetter.count({ where: { status: 'active', warning_level: 'SP2' } }),
        this.prisma.warningLetter.count({ where: { status: 'active', warning_level: 'SP3' } }),
        this.prisma.warningLetter.count({ where: { status: 'active' } }),
      ]);

      // Count new warnings issued this week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const newThisWeek = await this.prisma.warningLetter.count({
        where: { issue_date: { gte: lastWeek } },
      });

      await this.emitWarningEvent('warning_letter.weekly_compliance_summary', {
        active_warnings: { total, SP1: activeSP1, SP2: activeSP2, SP3: activeSP3 },
        new_this_week: newThisWeek,
        generated_at: new Date().toISOString(),
      });

      this.logger.log(
        `Compliance summary: ${total} active (SP1:${activeSP1}, SP2:${activeSP2}, SP3:${activeSP3}), ` +
          `${newThisWeek} new this week`,
      );
    } catch (error) {
      this.logger.error(`Failed to generate compliance summary: ${error.message}`, error.stack);
    }
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private getHighestWarningLevel(warnings: any[]): string | null {
    if (warnings.some((w) => w.warning_level === 'SP3')) return 'SP3';
    if (warnings.some((w) => w.warning_level === 'SP2')) return 'SP2';
    if (warnings.some((w) => w.warning_level === 'SP1')) return 'SP1';
    return null;
  }

  private evaluateEscalation(
    tardinesCount: number,
    currentLevel: string | null,
  ): string | null {
    if (!currentLevel && tardinesCount >= this.SP1_TARDINESS_THRESHOLD) {
      return 'SP1';
    }
    if (currentLevel === 'SP1' && tardinesCount >= this.SP1_TARDINESS_THRESHOLD + this.SP2_ESCALATION_THRESHOLD) {
      return 'SP2';
    }
    if (currentLevel === 'SP2' && tardinesCount >= this.SP1_TARDINESS_THRESHOLD + this.SP2_ESCALATION_THRESHOLD + this.SP3_ESCALATION_THRESHOLD) {
      return 'SP3';
    }
    if (currentLevel === 'SP3') {
      return 'TERMINATION_REVIEW';
    }
    return null;
  }

  private async emitWarningEvent(eventType: string, payload: any): Promise<void> {
    try {
      const event: Partial<TaraEvent> = {
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: { id: 'warning_letter_agent', type: 'agent' },
        entity: { id: payload.warning_letter_id || 'system', type: 'warning_letter' },
        payload,
      };
      await this.eventBusService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to emit warning event ${eventType}: ${error.message}`);
    }
  }

  /**
   * Get agent health status.
   */
  async getHealthStatus(): Promise<{
    agent_name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    last_check: string;
    metrics: {
      active_warnings_total: number;
      escalation_candidates: number;
      expired_this_week: number;
    };
  }> {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [activeTotal, expiredThisWeek] = await Promise.all([
        this.prisma.warningLetter.count({ where: { status: 'active' } }),
        this.prisma.warningLetter.count({
          where: { status: 'expired', updated_at: { gte: lastWeek } },
        }),
      ]);

      return {
        agent_name: 'Warning_Letter_Agent',
        status: 'healthy',
        last_check: new Date().toISOString(),
        metrics: {
          active_warnings_total: activeTotal,
          escalation_candidates: 0,
          expired_this_week: expiredThisWeek,
        },
      };
    } catch (error) {
      return {
        agent_name: 'Warning_Letter_Agent',
        status: 'unhealthy',
        last_check: new Date().toISOString(),
        metrics: { active_warnings_total: 0, escalation_candidates: 0, expired_this_week: 0 },
      };
    }
  }
}
