import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService, TaraEvent } from '../services/event-bus.service';
import { WeeklyCheckinService } from '../services/weekly-checkin.service';

/**
 * Weekly Checkin Agent
 *
 * Autonomous service for TARA HR System that handles the scheduled distribution
 * of the weekly productivity check-in form and the follow-up reminder for
 * employees who did not submit it.
 *
 * Scheduled tasks:
 * - Friday 16:00 WIB: broadcast the productivity check-in form to all active
 *   employees as a private notification (each employee receives their own form).
 * - Monday 08:00 WIB: send a reminder to every employee that did not submit the
 *   previous week's check-in by the end of Friday.
 *
 * Submission handling itself is owned by {@link WeeklyCheckinService}
 * (`submitCheckin`), which this agent reuses to determine who has / has not
 * submitted.
 *
 * On Monday 08:00 WIB the agent also generates a weekly summary report. The
 * report aggregates the collected responses by department for trend analysis
 * and is delivered to HR_Team and Supervisors only (never to regular
 * employees), per the notification privacy rules.
 *
 * Requirements:
 * - 4.1: Send a productivity check-in form to all Employees every Friday at 16:00 WIB
 * - 4.3: Generate a summary report every Monday once forms are collected
 * - 4.4: Send the summary report to HR_Team and Supervisors only
 * - 4.6: IF an Employee does not submit the form by end of Friday, THEN send a
 *        reminder on Monday morning
 * - 4.7: Aggregate responses by department for trend analysis
 * - 4.8: Operate on a scheduled basis without manual activation
 *
 * Design: Task 15.2 / 15.3 - Implement Weekly Checkin Agent scheduled tasks
 */
@Injectable()
export class WeeklyCheckinAgent {
  private readonly logger = new Logger(WeeklyCheckinAgent.name);
  private readonly TIME_ZONE = 'Asia/Jakarta'; // WIB (UTC+7)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
    private readonly weeklyCheckinService: WeeklyCheckinService,
  ) {
    this.logger.log('Weekly Checkin Agent initialized');
  }

  /**
   * Scheduled task: distribute the weekly check-in form.
   *
   * Runs every Friday at 16:00 WIB (Requirement 4.1, 4.8). Broadcasts the
   * productivity check-in form to all active employees. The form notification
   * is private per the notification privacy rules (each employee submits their
   * own check-in).
   *
   * Requirements: 4.1, 4.8
   */
  @Cron('0 16 * * 5', { timeZone: 'Asia/Jakarta' }) // Friday 16:00 WIB
  async distributeCheckinForms(): Promise<void> {
    this.logger.log('Distributing weekly check-in forms (Friday 16:00 WIB)');

    try {
      const weekStartDate = this.getMondayOfWeek(this.nowWIB());

      const employees = await this.prisma.employee.findMany({
        where: { employment_status: 'active' },
        select: { id: true, full_name: true, department_id: true },
      });

      if (employees.length === 0) {
        this.logger.warn('No active employees found for check-in distribution');
        return;
      }

      let sent = 0;
      for (const employee of employees) {
        try {
          await this.notificationService.sendPrivateNotification({
            recipient_id: employee.id,
            type: TaraNotificationType.WEEKLY_CHECKIN_FORM,
            title: 'Check-in Mingguan',
            content:
              `Halo ${employee.full_name ?? 'Karyawan'}, saatnya mengisi check-in produktivitas mingguan Anda. ` +
              'Mohon ceritakan: (1) pencapaian Anda minggu ini, (2) tantangan yang dihadapi, ' +
              'dan (3) target Anda untuk minggu depan. Terima kasih!',
            metadata: {
              form_type: 'weekly_checkin',
              week_start_date: this.formatDate(weekStartDate),
              questions: ['accomplishments', 'challenges', 'next_week_goals'],
            },
          });
          sent++;
        } catch (error: any) {
          this.logger.error(
            `Failed to send check-in form to employee ${employee.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Weekly check-in forms distributed to ${sent}/${employees.length} employees ` +
          `for week starting ${this.formatDate(weekStartDate)}`,
      );

      await this.emitAgentEvent('checkin.form_distributed', {
        week_start_date: this.formatDate(weekStartDate),
        recipients_count: sent,
        total_employees: employees.length,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to distribute weekly check-in forms: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Scheduled task: send Monday reminders for missing check-ins.
   *
   * Runs every Monday at 08:00 WIB. Determines which active employees did not
   * submit a check-in for the week that just ended (the form was distributed
   * the previous Friday) and sends each of them a private reminder.
   *
   * Requirements: 4.6, 4.8
   */
  @Cron('0 8 * * 1', { timeZone: 'Asia/Jakarta' }) // Monday 08:00 WIB
  async sendMondayReminders(): Promise<void> {
    this.logger.log('Sending Monday check-in reminders (08:00 WIB)');

    try {
      // The check-ins we are chasing belong to the week that just ended, i.e.
      // the week whose Friday distribution already happened. That week's start
      // (Monday) is 7 days before this Monday.
      const previousWeekStart = this.getMondayOfWeek(
        this.addDays(this.nowWIB(), -7),
      );

      const employees = await this.prisma.employee.findMany({
        where: { employment_status: 'active' },
        select: { id: true, full_name: true },
      });

      if (employees.length === 0) {
        this.logger.warn('No active employees found for check-in reminders');
        return;
      }

      // Build the set of employees who already submitted for the target week.
      const submitted = await this.prisma.weeklyCheckin.findMany({
        where: { week_start_date: previousWeekStart },
        select: { employee_id: true },
      });
      const submittedIds = new Set(submitted.map((c) => c.employee_id));

      const pending = employees.filter((e) => !submittedIds.has(e.id));

      let reminded = 0;
      for (const employee of pending) {
        try {
          await this.notificationService.sendPrivateNotification({
            recipient_id: employee.id,
            type: TaraNotificationType.WEEKLY_CHECKIN_REMINDER,
            title: 'Pengingat Check-in Mingguan',
            content:
              `Halo ${employee.full_name ?? 'Karyawan'}, kami mencatat Anda belum mengisi check-in ` +
              'produktivitas untuk minggu lalu. Mohon segera melengkapinya. Terima kasih!',
            metadata: {
              reminder_type: 'weekly_checkin',
              week_start_date: this.formatDate(previousWeekStart),
            },
          });
          reminded++;
        } catch (error: any) {
          this.logger.error(
            `Failed to send check-in reminder to employee ${employee.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Weekly check-in reminders sent to ${reminded} employees ` +
          `(of ${pending.length} pending) for week starting ${this.formatDate(previousWeekStart)}`,
      );

      await this.emitAgentEvent('checkin.reminder_sent', {
        week_start_date: this.formatDate(previousWeekStart),
        reminders_sent: reminded,
        pending_count: pending.length,
        total_employees: employees.length,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send Monday check-in reminders: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Scheduled task: generate the weekly check-in summary report.
   *
   * Runs every Monday at 08:00 WIB. Aggregates the previous week's collected
   * check-in responses by department for trend analysis and delivers a summary
   * report to HR_Team and Supervisors only (regular employees never receive the
   * report). Finally emits a `checkin.report_generated` event for downstream
   * consumers.
   *
   * The report covers the same week the Monday reminders chase, i.e. the week
   * whose forms were distributed the previous Friday. That week's Monday is 7
   * days before the current (report) Monday.
   *
   * Requirements:
   * - 4.3: Generate a summary report every Monday once forms are collected
   * - 4.4: Send the report to HR_Team and Supervisors only
   * - 4.7: Aggregate responses by department for trend analysis
   * - 4.8: Operate on a scheduled basis without manual activation
   */
  @Cron('0 8 * * 1', { timeZone: 'Asia/Jakarta' }) // Monday 08:00 WIB
  async generateWeeklyReport(): Promise<void> {
    this.logger.log('Generating weekly check-in report (Monday 08:00 WIB)');

    try {
      const reportWeekStart = this.getMondayOfWeek(
        this.addDays(this.nowWIB(), -7),
      );

      // Active employees with their department, used to compute per-department
      // participation (how many were expected to submit vs. how many did).
      const employees = await this.prisma.employee.findMany({
        where: { employment_status: 'active' },
        select: {
          id: true,
          department_id: true,
          department: { select: { name: true } },
        },
      });

      if (employees.length === 0) {
        this.logger.warn('No active employees found for weekly report');
        return;
      }

      // Collected check-in responses for the target week, joined to the
      // submitting employee's department.
      const checkins = await this.prisma.weeklyCheckin.findMany({
        where: { week_start_date: reportWeekStart },
        select: {
          id: true,
          employee_id: true,
          accomplishments: true,
          challenges: true,
          next_week_goals: true,
          employee: {
            select: {
              department_id: true,
              department: { select: { name: true } },
            },
          },
        },
      });

      const departmentBreakdown = this.aggregateByDepartment(
        employees,
        checkins,
      );

      const totalResponses = checkins.length;
      const totalEmployees = employees.length;
      const participationRate =
        totalEmployees > 0
          ? Math.round((totalResponses / totalEmployees) * 100)
          : 0;

      const content = this.buildReportContent(
        reportWeekStart,
        totalResponses,
        totalEmployees,
        participationRate,
        departmentBreakdown,
      );

      // Deliver to HR_Team and Supervisors only (Req 4.4). The notification
      // type WEEKLY_CHECKIN_REPORT is HR_Team-only by privacy rule, and
      // include_supervisors extends delivery to Supervisors. Regular employees
      // never receive this notification.
      const recipients = await this.notificationService.sendHRTeamNotification({
        type: TaraNotificationType.WEEKLY_CHECKIN_REPORT,
        title: `Laporan Check-in Mingguan (${this.formatDate(reportWeekStart)})`,
        content,
        include_supervisors: true,
        metadata: {
          report_type: 'weekly_checkin',
          week_start_date: this.formatDate(reportWeekStart),
          total_responses: totalResponses,
          total_employees: totalEmployees,
          participation_rate: participationRate,
          department_breakdown: departmentBreakdown,
        },
      });

      this.logger.log(
        `Weekly check-in report generated for week starting ${this.formatDate(
          reportWeekStart,
        )}: ${totalResponses}/${totalEmployees} responses across ` +
          `${departmentBreakdown.length} departments, delivered to ${recipients.length} recipients`,
      );

      await this.emitAgentEvent('checkin.report_generated', {
        week_start_date: this.formatDate(reportWeekStart),
        total_responses: totalResponses,
        total_employees: totalEmployees,
        participation_rate: participationRate,
        department_breakdown: departmentBreakdown,
        recipients_count: recipients.length,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to generate weekly check-in report: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Aggregate check-in responses by department for trend analysis (Req 4.7).
   *
   * Produces one entry per department that has at least one active employee,
   * capturing how many employees were expected to submit, how many actually
   * did, the participation rate, and how many responses contained content for
   * each of the three standard questions.
   */
  private aggregateByDepartment(
    employees: Array<{
      department_id: string | null;
      department?: { name: string | null } | null;
    }>,
    checkins: Array<{
      accomplishments: string | null;
      challenges: string | null;
      next_week_goals: string | null;
      employee?: {
        department_id: string | null;
        department?: { name: string | null } | null;
      } | null;
    }>,
  ): Array<{
    department_id: string;
    department_name: string;
    total_employees: number;
    responses: number;
    participation_rate: number;
    accomplishments_count: number;
    challenges_count: number;
    goals_count: number;
  }> {
    const UNASSIGNED = '__unassigned__';

    const buckets = new Map<
      string,
      {
        department_id: string;
        department_name: string;
        total_employees: number;
        responses: number;
        accomplishments_count: number;
        challenges_count: number;
        goals_count: number;
      }
    >();

    const bucketFor = (
      departmentId: string | null | undefined,
      departmentName: string | null | undefined,
    ) => {
      const key = departmentId ?? UNASSIGNED;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          department_id: departmentId ?? UNASSIGNED,
          department_name: departmentName ?? 'Tidak Ada Departemen',
          total_employees: 0,
          responses: 0,
          accomplishments_count: 0,
          challenges_count: 0,
          goals_count: 0,
        };
        buckets.set(key, bucket);
      }
      return bucket;
    };

    // Headcount per department (denominator for participation).
    for (const employee of employees) {
      const bucket = bucketFor(
        employee.department_id,
        employee.department?.name,
      );
      bucket.total_employees += 1;
    }

    // Responses per department (numerator + content breakdown).
    for (const checkin of checkins) {
      const bucket = bucketFor(
        checkin.employee?.department_id,
        checkin.employee?.department?.name,
      );
      bucket.responses += 1;
      if (checkin.accomplishments && checkin.accomplishments.trim()) {
        bucket.accomplishments_count += 1;
      }
      if (checkin.challenges && checkin.challenges.trim()) {
        bucket.challenges_count += 1;
      }
      if (checkin.next_week_goals && checkin.next_week_goals.trim()) {
        bucket.goals_count += 1;
      }
    }

    return Array.from(buckets.values())
      .map((bucket) => ({
        ...bucket,
        participation_rate:
          bucket.total_employees > 0
            ? Math.round((bucket.responses / bucket.total_employees) * 100)
            : 0,
      }))
      .sort((a, b) => a.department_name.localeCompare(b.department_name));
  }

  /**
   * Build the human-readable summary report content from the aggregated data.
   */
  private buildReportContent(
    weekStart: Date,
    totalResponses: number,
    totalEmployees: number,
    participationRate: number,
    departmentBreakdown: Array<{
      department_name: string;
      total_employees: number;
      responses: number;
      participation_rate: number;
    }>,
  ): string {
    const lines: string[] = [];
    lines.push(
      `Laporan Check-in Produktivitas Mingguan untuk minggu yang dimulai ${this.formatDate(
        weekStart,
      )}.`,
    );
    lines.push('');
    lines.push(
      `Ringkasan: ${totalResponses} dari ${totalEmployees} karyawan mengisi check-in ` +
        `(${participationRate}% partisipasi).`,
    );
    lines.push('');
    lines.push('Rincian per Departemen:');

    if (departmentBreakdown.length === 0) {
      lines.push('- Tidak ada data departemen.');
    } else {
      for (const dept of departmentBreakdown) {
        lines.push(
          `- ${dept.department_name}: ${dept.responses}/${dept.total_employees} ` +
            `respons (${dept.participation_rate}%).`,
        );
      }
    }

    return lines.join('\n');
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
          id: 'weekly_checkin_agent',
          type: 'agent',
        },
        entity: {
          id: payload.week_start_date ?? new Date().toISOString(),
          type: 'weekly_checkin_cycle',
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
   * Get the current time expressed in WIB (Asia/Jakarta).
   *
   * Returns a Date whose local-getter components (getFullYear, getDay, etc.)
   * reflect WIB, so day-of-week and week boundaries are computed in WIB
   * regardless of the server's timezone.
   */
  private nowWIB(): Date {
    const now = new Date();
    const wib = new Date(
      now.toLocaleString('en-US', { timeZone: this.TIME_ZONE }),
    );
    return wib;
  }

  /**
   * Return the Monday (00:00) of the week containing the given date.
   * Weeks are treated as Monday-Friday workweeks (Requirement 8.4).
   */
  private getMondayOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    // Days to subtract to reach Monday. For Sunday (0) go back 6 days.
    const diff = day === 0 ? 6 : day - 1;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Add (or subtract, with a negative value) a number of days to a date.
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
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
}
