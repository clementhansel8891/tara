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
 * Scheduling Agent
 *
 * Autonomous service for TARA HR System that handles:
 * - Shift conflict detection and resolution suggestions
 * - Upcoming shift reminder notifications to employees
 * - Overtime threshold alerts (for labor law compliance)
 * - Under-staffing detection per department per day
 * - Schedule change notifications
 *
 * Scheduled tasks:
 * - Daily at 18:00 WIB: send next-day shift reminders to employees
 * - Daily at 07:00 WIB: detect conflicts and under-staffing for the week
 * - Weekly Sunday 20:00 WIB: generate weekly schedule overview for supervisors
 *
 * Event-driven:
 * - schedule.assignment.created: check for conflicts with existing assignments
 * - schedule.assignment.updated: notify affected employee of changes
 */
@Injectable()
export class SchedulingAgent {
  private readonly logger = new Logger(SchedulingAgent.name);

  /** Maximum weekly hours before overtime alert (Indonesian labor law: 40h/week) */
  private readonly MAX_WEEKLY_HOURS = 40;
  /** Minimum staff per department for under-staffing detection */
  private readonly MIN_STAFF_RATIO = 0.5; // Alert if less than 50% of department is scheduled

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
  ) {
    this.logger.log('Scheduling Agent initialized');
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  /**
   * Handle new schedule assignment — detect conflicts.
   */
  @OnEvent('schedule.assignment.created')
  async handleAssignmentCreated(event: TaraEvent | any): Promise<void> {
    const payload = event?.payload || event;
    const { assignment_id, employee_id, shift_date, shift_start, shift_end } = payload;

    this.logger.log(`New schedule assignment ${assignment_id} for employee ${employee_id} on ${shift_date}`);

    try {
      // Check for overlapping assignments on the same day
      const conflicts = await this.prisma.$queryRaw<any[]>`
        SELECT sa.id, sa.shift_date, sa.shift_start, sa.shift_end
        FROM schedule_assignments sa
        WHERE sa.employee_id = ${employee_id}
          AND sa.shift_date = ${shift_date}::date
          AND sa.id != ${assignment_id}
          AND (
            (sa.shift_start < ${shift_end}::time AND sa.shift_end > ${shift_start}::time)
          )
      `;

      if (conflicts.length > 0) {
        await this.emitScheduleEvent('schedule.conflict_detected', {
          assignment_id,
          employee_id,
          shift_date,
          conflicting_assignments: conflicts.map((c) => c.id),
        });

        this.logger.warn(
          `Shift conflict detected for employee ${employee_id} on ${shift_date}: ` +
            `${conflicts.length} overlapping assignment(s)`,
        );
      }

      // Check weekly hours threshold
      await this.checkWeeklyHoursForEmployee(employee_id, new Date(shift_date));
    } catch (error) {
      this.logger.error(`Failed to process assignment ${assignment_id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle schedule assignment updates — notify affected employee.
   */
  @OnEvent('schedule.assignment.updated')
  async handleAssignmentUpdated(event: TaraEvent | any): Promise<void> {
    const payload = event?.payload || event;
    const { assignment_id, employee_id, shift_date, changes } = payload;

    this.logger.log(`Schedule assignment ${assignment_id} updated for employee ${employee_id}`);

    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employee_id },
        select: { full_name: true },
      });

      await this.notificationService.sendNotification({
        recipient_id: employee_id,
        type: TaraNotificationType.GENERAL_NOTIFICATION,
        title: 'Perubahan Jadwal Kerja',
        content: `Halo ${employee?.full_name ?? 'Karyawan'}, jadwal kerja Anda pada tanggal ${shift_date} telah diubah. Silakan cek jadwal terbaru di aplikasi.`,
      });

      await this.emitScheduleEvent('schedule.employee_notified', {
        assignment_id,
        employee_id,
        shift_date,
        changes,
      });
    } catch (error) {
      this.logger.error(`Failed to notify schedule change: ${error.message}`, error.stack);
    }
  }

  // ─── Scheduled Tasks ──────────────────────────────────────────────────────

  /**
   * Next-day shift reminders — daily at 18:00 WIB (11:00 UTC).
   */
  @Cron('0 11 * * *') // 18:00 WIB daily
  async sendNextDayShiftReminders(): Promise<void> {
    this.logger.log('Sending next-day shift reminders');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().substring(0, 10);

      const assignments = await this.prisma.$queryRaw<any[]>`
        SELECT 
          sa.id, sa.employee_id, sa.shift_start, sa.shift_end,
          e.full_name
        FROM schedule_assignments sa
        JOIN employees e ON e.id = sa.employee_id
        WHERE sa.shift_date = ${tomorrowStr}::date
          AND e.employment_status = 'active'
      `;

      for (const assignment of assignments) {
        await this.notificationService.sendNotification({
          recipient_id: assignment.employee_id,
          type: TaraNotificationType.GENERAL_NOTIFICATION,
          title: 'Pengingat Jadwal Besok',
          content: `Halo ${assignment.full_name}, besok Anda dijadwalkan kerja dari ${assignment.shift_start} sampai ${assignment.shift_end}. Selamat beristirahat!`,
        });
      }

      if (assignments.length > 0) {
        this.logger.log(`Sent ${assignments.length} next-day shift reminder(s)`);
        await this.emitScheduleEvent('schedule.reminders_sent', {
          date: tomorrowStr,
          count: assignments.length,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send shift reminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Detect conflicts and under-staffing — daily at 07:00 WIB (00:00 UTC).
   */
  @Cron('0 0 * * 1-5') // 07:00 WIB, Mon-Fri
  async detectStaffingIssues(): Promise<void> {
    this.logger.log('Detecting staffing issues for the upcoming week');

    try {
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get department sizes
      const departments = await this.prisma.department.findMany({
        include: {
          employees: {
            where: { employment_status: 'active' },
            select: { id: true },
          },
        },
      });

      const understaffedDays: any[] = [];

      for (const dept of departments) {
        const deptSize = dept.employees.length;
        if (deptSize === 0) continue;

        const employeeIds = dept.employees.map((e) => e.id);

        // Check scheduled staff per day for the week
        for (let d = 0; d < 7; d++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() + d);
          const dow = checkDate.getDay();
          if (dow === 0 || dow === 6) continue; // Skip weekends

          const dateStr = checkDate.toISOString().substring(0, 10);

          const scheduledCount = await this.prisma.$queryRaw<any[]>`
            SELECT COUNT(DISTINCT employee_id)::int as count
            FROM schedule_assignments
            WHERE shift_date = ${dateStr}::date
              AND employee_id = ANY(${employeeIds})
          `.then((r) => r[0]?.count ?? 0);

          const staffRatio = Number(scheduledCount) / deptSize;
          if (staffRatio < this.MIN_STAFF_RATIO) {
            understaffedDays.push({
              department: dept.name,
              date: dateStr,
              scheduled: Number(scheduledCount),
              total: deptSize,
              ratio: Math.round(staffRatio * 100),
            });
          }
        }
      }

      if (understaffedDays.length > 0) {
        await this.emitScheduleEvent('schedule.understaffing_detected', {
          count: understaffedDays.length,
          details: understaffedDays,
        });

        this.logger.warn(`Detected ${understaffedDays.length} understaffed day(s) in the upcoming week`);
      }
    } catch (error) {
      this.logger.error(`Failed to detect staffing issues: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly schedule overview for supervisors — Sunday 20:00 WIB (13:00 UTC).
   */
  @Cron('0 13 * * 0') // Sunday 20:00 WIB
  async generateWeeklyScheduleOverview(): Promise<void> {
    this.logger.log('Generating weekly schedule overview');

    try {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
      const nextFriday = new Date(nextMonday);
      nextFriday.setDate(nextFriday.getDate() + 4);

      const mondayStr = nextMonday.toISOString().substring(0, 10);
      const fridayStr = nextFriday.toISOString().substring(0, 10);

      const totalAssignments = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count
        FROM schedule_assignments
        WHERE shift_date BETWEEN ${mondayStr}::date AND ${fridayStr}::date
      `.then((r) => r[0]?.count ?? 0);

      const uniqueEmployees = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT employee_id)::int as count
        FROM schedule_assignments
        WHERE shift_date BETWEEN ${mondayStr}::date AND ${fridayStr}::date
      `.then((r) => r[0]?.count ?? 0);

      await this.emitScheduleEvent('schedule.weekly_overview', {
        week_start: mondayStr,
        week_end: fridayStr,
        total_assignments: Number(totalAssignments),
        unique_employees_scheduled: Number(uniqueEmployees),
      });

      this.logger.log(
        `Weekly overview: ${totalAssignments} assignments for ${uniqueEmployees} employees ` +
          `(${mondayStr} to ${fridayStr})`,
      );
    } catch (error) {
      this.logger.error(`Failed to generate weekly overview: ${error.message}`, error.stack);
    }
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private async checkWeeklyHoursForEmployee(employeeId: string, referenceDate: Date): Promise<void> {
    // Get the start of the week (Monday)
    const weekStart = new Date(referenceDate);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekStartStr = weekStart.toISOString().substring(0, 10);
    const weekEndStr = weekEnd.toISOString().substring(0, 10);

    try {
      const totalHours = await this.prisma.$queryRaw<any[]>`
        SELECT COALESCE(
          SUM(EXTRACT(EPOCH FROM (shift_end::time - shift_start::time)) / 3600), 0
        )::float as total_hours
        FROM schedule_assignments
        WHERE employee_id = ${employeeId}
          AND shift_date BETWEEN ${weekStartStr}::date AND ${weekEndStr}::date
      `.then((r) => r[0]?.total_hours ?? 0);

      if (Number(totalHours) > this.MAX_WEEKLY_HOURS) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: employeeId },
          select: { full_name: true },
        });

        await this.emitScheduleEvent('schedule.overtime_threshold_exceeded', {
          employee_id: employeeId,
          employee_name: employee?.full_name,
          weekly_hours: Number(totalHours),
          max_allowed: this.MAX_WEEKLY_HOURS,
          week_start: weekStartStr,
          week_end: weekEndStr,
        });

        this.logger.warn(
          `Overtime alert: ${employee?.full_name} scheduled for ${totalHours}h (max: ${this.MAX_WEEKLY_HOURS}h)`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to check weekly hours for ${employeeId}: ${error.message}`);
    }
  }

  private async emitScheduleEvent(eventType: string, payload: any): Promise<void> {
    try {
      const event: Partial<TaraEvent> = {
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: { id: 'scheduling_agent', type: 'agent' },
        entity: { id: payload.assignment_id || 'system', type: 'schedule' },
        payload,
      };
      await this.eventBusService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to emit schedule event ${eventType}: ${error.message}`);
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
      assignments_this_week: number;
      conflicts_detected_today: number;
      overtime_alerts_today: number;
    };
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const todayStr = today.toISOString().substring(0, 10);
      const weekEndStr = weekEnd.toISOString().substring(0, 10);

      const assignmentsThisWeek = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM schedule_assignments
        WHERE shift_date BETWEEN ${todayStr}::date AND ${weekEndStr}::date
      `.then((r) => r[0]?.count ?? 0);

      const conflictsToday = await this.prisma.eventBusLog.count({
        where: {
          event_type: 'schedule.conflict_detected',
          event_timestamp: { gte: today },
        },
      });

      const overtimeToday = await this.prisma.eventBusLog.count({
        where: {
          event_type: 'schedule.overtime_threshold_exceeded',
          event_timestamp: { gte: today },
        },
      });

      return {
        agent_name: 'Scheduling_Agent',
        status: 'healthy',
        last_check: new Date().toISOString(),
        metrics: {
          assignments_this_week: Number(assignmentsThisWeek),
          conflicts_detected_today: conflictsToday,
          overtime_alerts_today: overtimeToday,
        },
      };
    } catch (error) {
      return {
        agent_name: 'Scheduling_Agent',
        status: 'unhealthy',
        last_check: new Date().toISOString(),
        metrics: { assignments_this_week: 0, conflicts_detected_today: 0, overtime_alerts_today: 0 },
      };
    }
  }
}
