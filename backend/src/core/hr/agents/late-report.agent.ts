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
 * Late Report Agent
 *
 * Autonomous service for TARA HR System that generates and distributes the
 * daily tardiness report.
 *
 * Scheduled task:
 * - Every workday (Mon-Fri) at 09:05 WIB: query the Attendance table for the
 *   current day's tardy records (is_tardy = true), build a report listing each
 *   tardy employee's name, actual arrival time, and minutes late, then:
 *     1. Broadcast a Public_Announcement to all employees (Req 5.3).
 *     2. Send a detailed recap to the HR_Team (Req 5.4).
 *
 * The report content includes employee names, actual arrival times, and minutes
 * late (Req 5.5). After distribution the agent emits
 * `report.tardiness_generated` and `announcement.tardiness_published` events to
 * the Event Bus for downstream consumers.
 *
 * Requirements:
 * - 5.1: Generate a tardiness report every workday at 09:05 WIB
 * - 5.2: Include all employees who arrived after 09:00 WIB that day
 * - 5.3: Send the report as a Public_Announcement to all employees
 * - 5.4: Send a detailed recap to the HR_Team
 * - 5.5: Include employee names, actual arrival times, and minutes late
 * - 5.6: Exclude weekends and public holidays from report generation
 * - 5.7: When no employees are tardy, send a positive acknowledgment to all
 *
 * Design: Task 16.1 / 16.2 - Implement Late Report Agent scheduled task
 */
@Injectable()
export class LateReportAgent {
  private readonly logger = new Logger(LateReportAgent.name);
  private readonly TIME_ZONE = 'Asia/Jakarta'; // WIB (UTC+7)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
  ) {
    this.logger.log('Late Report Agent initialized');
  }

  /**
   * Scheduled task: generate and distribute the daily tardiness report.
   *
   * Runs every workday (Monday-Friday) at 09:05 WIB. Queries the Attendance
   * table for the current day's tardy records and distributes the report as a
   * Public_Announcement to all employees and as a detailed recap to the
   * HR_Team. Weekends and active public holidays are excluded entirely
   * (Req 5.6). When no employees are tardy, a positive acknowledgment is sent
   * to all employees instead of the tardiness report (Req 5.7).
   *
   * @param referenceDate Optional explicit WIB calendar day to report on.
   *   Defaults to the current day in WIB. Primarily used for manual invocation
   *   and testing; the scheduled run always uses the current day.
   *
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
   */
  @Cron('5 9 * * 1-5', { timeZone: 'Asia/Jakarta' }) // 09:05 WIB, Monday-Friday
  async generateDailyTardinessReport(referenceDate?: Date): Promise<void> {
    this.logger.log(
      'Generating daily tardiness report (09:05 WIB, weekdays)',
    );

    try {
      const reportDate = referenceDate
        ? this.startOfDay(referenceDate)
        : this.todayWIB();

      // Req 5.6: exclude weekends from report generation. The cron expression
      // already restricts execution to Mon-Fri, but we guard here as well so
      // manual invocations behave correctly.
      if (this.isWeekend(reportDate)) {
        this.logger.log(
          `${this.formatDate(reportDate)} falls on a weekend; skipping report generation`,
        );
        return;
      }

      // Req 5.6 / Req 8.7: exclude active public holidays from report
      // generation. The Late_Report_Agent is effectively disabled for any
      // configured public holiday.
      if (await this.isActivePublicHoliday(reportDate)) {
        this.logger.log(
          `${this.formatDate(reportDate)} is a configured public holiday; skipping report generation`,
        );
        return;
      }

      // Req 5.2: include all employees flagged tardy for the current day.
      const tardyRecords = await this.prisma.attendance.findMany({
        where: {
          attendance_date: reportDate,
          is_tardy: true,
        },
        select: {
          id: true,
          employee_id: true,
          clock_in_time: true,
          tardiness_minutes: true,
          employee: {
            select: {
              id: true,
              full_name: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { tardiness_minutes: 'desc' },
      });

      // Build the structured list used in both the public announcement and the
      // HR recap. Each entry carries the employee name, actual arrival time
      // (WIB) and minutes late (Req 5.5).
      const tardyEntries = tardyRecords.map((record) => ({
        employee_id: record.employee_id,
        employee_name: record.employee?.full_name ?? 'Karyawan',
        department_name: record.employee?.department?.name ?? null,
        arrival_time: this.formatTimeWIB(record.clock_in_time),
        minutes_late: record.tardiness_minutes ?? 0,
      }));

      // Req 5.7: when there are no tardy employees on a valid workday, send a
      // positive acknowledgment to all employees instead of skipping.
      if (tardyEntries.length === 0) {
        await this.sendPositiveAcknowledgment(reportDate);
        return;
      }

      const publicContent = this.buildPublicAnnouncementContent(
        reportDate,
        tardyEntries,
      );
      const hrContent = this.buildHRRecapContent(reportDate, tardyEntries);

      const reportMetadata = {
        report_type: 'daily_tardiness',
        report_date: this.formatDate(reportDate),
        tardy_count: tardyEntries.length,
        tardy_employees: tardyEntries,
      };

      // Req 5.3: broadcast as a Public_Announcement to all employees. The
      // TARDINESS_ANNOUNCEMENT type is public per the notification privacy rules.
      const publicRecipients =
        await this.notificationService.sendPublicAnnouncement({
          type: TaraNotificationType.TARDINESS_ANNOUNCEMENT,
          title: `Laporan Keterlambatan Harian (${this.formatDate(reportDate)})`,
          content: publicContent,
          metadata: reportMetadata,
        });

      // Req 5.4: send a detailed recap to the HR_Team only. The
      // WEEKLY_ATTENDANCE_RECAP type is HR_Team-only per the privacy rules.
      const hrRecipients =
        await this.notificationService.sendHRTeamNotification({
          type: TaraNotificationType.WEEKLY_ATTENDANCE_RECAP,
          title: `Rekap Keterlambatan HR (${this.formatDate(reportDate)})`,
          content: hrContent,
          metadata: reportMetadata,
        });

      this.logger.log(
        `Daily tardiness report for ${this.formatDate(reportDate)}: ` +
          `${tardyEntries.length} tardy employee(s), ` +
          `announced to ${publicRecipients.length} employee(s), ` +
          `recap delivered to ${hrRecipients.length} HR member(s)`,
      );

      // Emit report-generated event for downstream consumers (Hermes, etc).
      await this.emitAgentEvent('report.tardiness_generated', {
        report_date: this.formatDate(reportDate),
        tardy_count: tardyEntries.length,
        tardy_employees: tardyEntries,
        hr_recipients_count: hrRecipients.length,
      });

      // Emit announcement-published event.
      await this.emitAgentEvent('announcement.tardiness_published', {
        report_date: this.formatDate(reportDate),
        tardy_count: tardyEntries.length,
        public_recipients_count: publicRecipients.length,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to generate daily tardiness report: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Build the public announcement content (visible to all employees).
   *
   * Lists each tardy employee with their actual arrival time and minutes late
   * (Req 5.5).
   */
  private buildPublicAnnouncementContent(
    reportDate: Date,
    entries: Array<{
      employee_name: string;
      arrival_time: string;
      minutes_late: number;
    }>,
  ): string {
    const lines: string[] = [];
    lines.push(
      `Laporan Keterlambatan untuk tanggal ${this.formatDate(reportDate)}.`,
    );
    lines.push('');
    lines.push(
      `Berikut ${entries.length} karyawan yang tercatat datang setelah pukul 09:00 WIB:`,
    );
    lines.push('');
    for (const entry of entries) {
      lines.push(
        `- ${entry.employee_name}: tiba pukul ${entry.arrival_time} WIB ` +
          `(terlambat ${entry.minutes_late} menit).`,
      );
    }
    return lines.join('\n');
  }

  /**
   * Build the detailed HR recap content (HR_Team only).
   *
   * Includes a summary plus the same per-employee breakdown with department
   * context for HR follow-up.
   */
  private buildHRRecapContent(
    reportDate: Date,
    entries: Array<{
      employee_name: string;
      department_name: string | null;
      arrival_time: string;
      minutes_late: number;
    }>,
  ): string {
    const totalMinutesLate = entries.reduce(
      (sum, entry) => sum + entry.minutes_late,
      0,
    );

    const lines: string[] = [];
    lines.push(
      `Rekap Keterlambatan HR untuk tanggal ${this.formatDate(reportDate)}.`,
    );
    lines.push('');
    lines.push(
      `Total karyawan terlambat: ${entries.length}. ` +
        `Total akumulasi keterlambatan: ${totalMinutesLate} menit.`,
    );
    lines.push('');
    lines.push('Rincian:');
    for (const entry of entries) {
      const dept = entry.department_name
        ? ` [${entry.department_name}]`
        : '';
      lines.push(
        `- ${entry.employee_name}${dept}: tiba pukul ${entry.arrival_time} WIB ` +
          `(terlambat ${entry.minutes_late} menit).`,
      );
    }
    return lines.join('\n');
  }

  /**
   * Send a positive acknowledgment to all employees when no one was tardy on a
   * valid workday (Req 5.7).
   *
   * Uses the ATTENDANCE_ANNOUNCEMENT public notification type so the message is
   * visible to every employee, and emits the standard report/announcement
   * events with a tardy_count of 0 so downstream consumers stay in sync.
   */
  private async sendPositiveAcknowledgment(reportDate: Date): Promise<void> {
    const content = this.buildPositiveAcknowledgmentContent(reportDate);
    const metadata = {
      report_type: 'daily_tardiness',
      report_date: this.formatDate(reportDate),
      tardy_count: 0,
      tardy_employees: [],
      no_tardiness: true,
    };

    const recipients = await this.notificationService.sendPublicAnnouncement({
      type: TaraNotificationType.ATTENDANCE_ANNOUNCEMENT,
      title: `Apresiasi Kehadiran (${this.formatDate(reportDate)})`,
      content,
      metadata,
    });

    this.logger.log(
      `No tardy employees for ${this.formatDate(reportDate)}; ` +
        `positive acknowledgment sent to ${recipients.length} employee(s)`,
    );

    await this.emitAgentEvent('report.tardiness_generated', {
      report_date: this.formatDate(reportDate),
      tardy_count: 0,
      tardy_employees: [],
      no_tardiness: true,
    });

    await this.emitAgentEvent('announcement.tardiness_published', {
      report_date: this.formatDate(reportDate),
      tardy_count: 0,
      no_tardiness: true,
      public_recipients_count: recipients.length,
    });
  }

  /**
   * Build the positive acknowledgment content broadcast to all employees on a
   * day with zero tardiness (Req 5.7).
   */
  private buildPositiveAcknowledgmentContent(reportDate: Date): string {
    const lines: string[] = [];
    lines.push(
      `Kabar baik untuk tanggal ${this.formatDate(reportDate)}!`,
    );
    lines.push('');
    lines.push(
      'Tidak ada karyawan yang tercatat terlambat hari ini. ' +
        'Terima kasih atas kedisiplinan dan kehadiran tepat waktu seluruh tim. ' +
        'Pertahankan semangat ini!',
    );
    return lines.join('\n');
  }

  /**
   * Determine whether the given date falls on a weekend (Saturday or Sunday).
   * Workdays are Monday-Friday (Req 8.4 / Req 5.6).
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  }

  /**
   * Determine whether the given date is a configured, active public holiday
   * (Req 5.6 / Req 8.7). Matches the PublicHoliday.holiday_date DATE column by
   * the WIB calendar day.
   */
  private async isActivePublicHoliday(date: Date): Promise<boolean> {
    const holiday = await this.prisma.publicHoliday.findFirst({
      where: {
        holiday_date: this.startOfDay(date),
        is_active: true,
      },
      select: { id: true },
    });
    return holiday !== null;
  }

  /**
   * Return a copy of the given date normalized to 00:00:00 (local).
   */
  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  /**
   * Emit an agent event to the Event Bus for monitoring / downstream consumers.
   * Failures are swallowed so event emission never blocks the scheduled task.
   */
  private async emitAgentEvent(
    eventType: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      const event: Partial<TaraEvent> = {
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: {
          id: 'late_report_agent',
          type: 'agent',
        },
        entity: {
          id: payload.report_date ?? new Date().toISOString(),
          type: 'tardiness_report',
        },
        payload,
      };

      await this.eventBusService.emit(event as TaraEvent);
    } catch (error: any) {
      this.logger.error(
        `Failed to emit event ${eventType}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get the current date (00:00) expressed in WIB (Asia/Jakarta).
   *
   * The Attendance.attendance_date column is a DATE, so the query matches
   * records by the WIB calendar day.
   */
  private todayWIB(): Date {
    const now = new Date();
    const wib = new Date(
      now.toLocaleString('en-US', { timeZone: this.TIME_ZONE }),
    );
    wib.setHours(0, 0, 0, 0);
    return wib;
  }

  /**
   * Format a timestamp as HH:mm in WIB. Returns '--:--' when the timestamp is
   * missing.
   */
  private formatTimeWIB(date: Date | null | undefined): string {
    if (!date) {
      return '--:--';
    }
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: this.TIME_ZONE,
    });
  }

  /**
   * Format a date as YYYY-MM-DD.
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ---------------------------------------------------------------------------
  // Real-Time Data Sync (Requirement 13.2)
  // ---------------------------------------------------------------------------

  /**
   * React to attendance clock-in events in real time.
   *
   * This listener is triggered synchronously (in-process EventEmitter2) the
   * instant the Absensi Agent / TaraAttendanceService emits
   * `attendance.clock_in`. The Late Report Agent therefore has immediate access
   * to the new attendance record — comfortably satisfying Requirement 13.2
   * ("available immediately").
   *
   * When the clock-in is tardy, the agent logs the tardiness so the daily
   * report (09:05 WIB) can include the data. The underlying data source is the
   * single PostgreSQL attendance table (Req 13.4), so the scheduled report will
   * always see the most current records regardless of this listener.
   *
   * @param event - The attendance.clock_in TaraEvent
   *
   * Requirements: 13.2 - Attendance updates available to Late Report Agent
   *   immediately.
   */
  @OnEvent('attendance.clock_in')
  async handleAttendanceClockIn(event: TaraEvent | any): Promise<void> {
    const employeeId =
      event?.payload?.employee_id ??
      event?.entity?.id ??
      event?.actor?.id;

    const isTardy = event?.payload?.is_tardy ?? false;
    const tardinessMinutes = event?.payload?.tardiness_minutes ?? 0;

    if (!employeeId) {
      this.logger.warn(
        '[LATE_REPORT] attendance.clock_in received without employee identifier; ignoring',
      );
      return;
    }

    if (isTardy) {
      this.logger.log(
        `[LATE_REPORT] Tardiness detected in real time — employee ${employeeId} ` +
          `is ${tardinessMinutes} minute(s) late. Will be included in the daily report.`,
      );
    } else {
      this.logger.debug(
        `[LATE_REPORT] On-time clock-in received for employee ${employeeId}.`,
      );
    }
  }
}
