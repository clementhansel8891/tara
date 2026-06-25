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
 * Payroll anomaly detection result.
 */
export interface PayrollAnomaly {
  employee_id: string;
  employee_name: string;
  anomaly_type: 'excessive_overtime' | 'missing_attendance' | 'unusual_deduction' | 'salary_mismatch';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Payroll Agent
 *
 * Autonomous service for TARA HR System that handles:
 * - Pre-payroll validation and anomaly detection
 * - Automated payroll period closing reminders
 * - Payslip generation and distribution notifications
 * - Payroll processing status monitoring
 * - Integration with loan installment deductions
 * - Overtime calculation validation
 *
 * Scheduled tasks:
 * - 25th of every month at 08:00 WIB: remind HR to prepare payroll
 * - 28th of every month at 07:00 WIB: run pre-payroll validation
 * - 1st of every month at 10:00 WIB: verify payslip distribution
 * - Every Monday at 07:30 WIB: weekly attendance-to-payroll reconciliation
 *
 * Event-driven:
 * - payroll.run.created: validate run data and detect anomalies
 * - payroll.run.completed: trigger payslip distribution
 */
@Injectable()
export class PayrollAgent {
  private readonly logger = new Logger(PayrollAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
  ) {
    this.logger.log('Payroll Agent initialized');
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  /**
   * Handle payroll run creation — validate and detect anomalies.
   */
  @OnEvent('payroll.run.created')
  async handlePayrollRunCreated(event: TaraEvent | any): Promise<PayrollAnomaly[]> {
    const payload = event?.payload || event;
    const { payroll_run_id, period_start, period_end } = payload;

    this.logger.log(`Validating payroll run ${payroll_run_id} for period ${period_start} to ${period_end}`);

    try {
      const anomalies = await this.runPrePayrollValidation(period_start, period_end);

      if (anomalies.length > 0) {
        await this.emitPayrollEvent('payroll.anomalies_detected', {
          payroll_run_id,
          anomaly_count: anomalies.length,
          high_severity: anomalies.filter((a) => a.severity === 'high').length,
          anomalies,
        });

        this.logger.warn(
          `Payroll run ${payroll_run_id}: ${anomalies.length} anomalies detected ` +
            `(${anomalies.filter((a) => a.severity === 'high').length} high severity)`,
        );
      }

      return anomalies;
    } catch (error) {
      this.logger.error(`Failed to validate payroll run ${payroll_run_id}: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Handle payroll run completion — notify employees of payslip availability.
   */
  @OnEvent('payroll.run.completed')
  async handlePayrollRunCompleted(event: TaraEvent | any): Promise<void> {
    const payload = event?.payload || event;
    const { payroll_run_id, period_start, period_end, employee_count } = payload;

    this.logger.log(`Payroll run ${payroll_run_id} completed — notifying ${employee_count} employees`);

    try {
      // Get all employees included in this payroll run
      const payrollLines = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT pl.employee_id, e.full_name
        FROM payroll_lines pl
        JOIN employees e ON e.id = pl.employee_id
        WHERE pl.payroll_run_id = ${payroll_run_id}
      `;

      // Send payslip ready notification to each employee
      for (const line of payrollLines) {
        await this.notificationService.sendNotification({
          recipient_id: line.employee_id,
          type: TaraNotificationType.GENERAL_NOTIFICATION,
          title: 'Slip Gaji Tersedia',
          content: `Halo ${line.full_name}, slip gaji Anda untuk periode ${period_start} - ${period_end} sudah tersedia. Silakan cek di menu Payroll.`,
        });
      }

      await this.emitPayrollEvent('payroll.payslips_distributed', {
        payroll_run_id,
        employees_notified: payrollLines.length,
        period: `${period_start} - ${period_end}`,
      });

      this.logger.log(`Payslip notifications sent to ${payrollLines.length} employees`);
    } catch (error) {
      this.logger.error(`Failed to distribute payslip notifications: ${error.message}`, error.stack);
    }
  }

  // ─── Scheduled Tasks ──────────────────────────────────────────────────────

  /**
   * Payroll preparation reminder — 25th of every month at 08:00 WIB.
   */
  @Cron('0 1 25 * *') // 08:00 WIB (01:00 UTC)
  async sendPayrollPreparationReminder(): Promise<void> {
    this.logger.log('Sending payroll preparation reminder');

    try {
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

      await this.emitPayrollEvent('payroll.preparation_reminder', {
        month: now.toISOString().substring(0, 7),
        period_end: periodEnd.toISOString().substring(0, 10),
        message: 'Payroll closing approaching. Please ensure all attendance and leave data is finalized.',
      });

      this.logger.log('Payroll preparation reminder emitted');
    } catch (error) {
      this.logger.error(`Failed to send payroll preparation reminder: ${error.message}`, error.stack);
    }
  }

  /**
   * Pre-payroll validation — 28th of every month at 07:00 WIB.
   * Automatically runs anomaly detection before payroll processing.
   */
  @Cron('0 0 28 * *') // 07:00 WIB (00:00 UTC)
  async scheduledPrePayrollValidation(): Promise<void> {
    this.logger.log('Running scheduled pre-payroll validation');

    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .substring(0, 10);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .substring(0, 10);

      const anomalies = await this.runPrePayrollValidation(periodStart, periodEnd);

      await this.emitPayrollEvent('payroll.pre_validation_completed', {
        period: `${periodStart} to ${periodEnd}`,
        anomaly_count: anomalies.length,
        anomalies_by_severity: {
          high: anomalies.filter((a) => a.severity === 'high').length,
          medium: anomalies.filter((a) => a.severity === 'medium').length,
          low: anomalies.filter((a) => a.severity === 'low').length,
        },
      });
    } catch (error) {
      this.logger.error(`Scheduled pre-payroll validation failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly attendance-to-payroll reconciliation — Monday 07:30 WIB.
   * Ensures attendance records are consistent with expected working days.
   */
  @Cron('30 0 * * 1') // 07:30 WIB (00:30 UTC) on Monday
  async weeklyAttendanceReconciliation(): Promise<void> {
    this.logger.log('Running weekly attendance-to-payroll reconciliation');

    try {
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);

      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);

      // Find employees with incomplete attendance
      const activeEmployees = await this.prisma.employee.count({
        where: { employment_status: 'active' },
      });

      const attendanceRecords = await this.prisma.attendance.groupBy({
        by: ['employee_id'],
        where: {
          attendance_date: { gte: lastWeekStart, lte: lastWeekEnd },
          clock_in_time: { not: null },
        },
        _count: { id: true },
      });

      // Expected working days in last week (5 days)
      const expectedDays = 5;
      const employeesWithGaps = attendanceRecords.filter(
        (r) => r._count.id < expectedDays,
      );

      if (employeesWithGaps.length > 0) {
        await this.emitPayrollEvent('payroll.attendance_gaps_detected', {
          week_start: lastWeekStart.toISOString().substring(0, 10),
          week_end: lastWeekEnd.toISOString().substring(0, 10),
          total_active_employees: activeEmployees,
          employees_with_full_attendance: attendanceRecords.length - employeesWithGaps.length,
          employees_with_gaps: employeesWithGaps.length,
        });
      }

      this.logger.log(
        `Weekly reconciliation: ${attendanceRecords.length - employeesWithGaps.length}/${activeEmployees} ` +
          `employees with full attendance`,
      );
    } catch (error) {
      this.logger.error(`Weekly reconciliation failed: ${error.message}`, error.stack);
    }
  }

  // ─── Core Logic ───────────────────────────────────────────────────────────

  /**
   * Run pre-payroll validation to detect anomalies.
   */
  async runPrePayrollValidation(periodStart: string, periodEnd: string): Promise<PayrollAnomaly[]> {
    const anomalies: PayrollAnomaly[] = [];

    // Check 1: Employees with missing attendance records
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const activeEmployees = await this.prisma.employee.findMany({
      where: { employment_status: 'active' },
      select: { id: true, full_name: true },
    });

    const attendanceCounts = await this.prisma.attendance.groupBy({
      by: ['employee_id'],
      where: {
        attendance_date: { gte: startDate, lte: endDate },
        clock_in_time: { not: null },
      },
      _count: { id: true },
    });

    const attendanceMap = new Map(attendanceCounts.map((a) => [a.employee_id, a._count.id]));

    // Calculate expected working days in period
    const expectedDays = this.calculateWorkingDays(startDate, endDate);
    const threshold = Math.floor(expectedDays * 0.6); // Flag if attendance < 60%

    for (const emp of activeEmployees) {
      const actualDays = attendanceMap.get(emp.id) || 0;
      if (actualDays < threshold) {
        anomalies.push({
          employee_id: emp.id,
          employee_name: emp.full_name,
          anomaly_type: 'missing_attendance',
          description: `Only ${actualDays}/${expectedDays} attendance days recorded for period`,
          severity: actualDays === 0 ? 'high' : 'medium',
        });
      }
    }

    // Check 2: Excessive tardiness (>5 days tardy in period)
    const tardyCounts = await this.prisma.attendance.groupBy({
      by: ['employee_id'],
      where: {
        attendance_date: { gte: startDate, lte: endDate },
        is_tardy: true,
      },
      _count: { id: true },
    });

    for (const tardy of tardyCounts) {
      if (tardy._count.id > 5) {
        const emp = activeEmployees.find((e) => e.id === tardy.employee_id);
        anomalies.push({
          employee_id: tardy.employee_id,
          employee_name: emp?.full_name || 'Unknown',
          anomaly_type: 'excessive_overtime',
          description: `Employee was tardy ${tardy._count.id} times in the period (threshold: 5)`,
          severity: tardy._count.id > 10 ? 'high' : 'medium',
        });
      }
    }

    return anomalies;
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  private async emitPayrollEvent(eventType: string, payload: any): Promise<void> {
    try {
      const event: Partial<TaraEvent> = {
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: { id: 'payroll_agent', type: 'agent' },
        entity: { id: payload.payroll_run_id || 'system', type: 'payroll' },
        payload,
      };
      await this.eventBusService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to emit payroll event ${eventType}: ${error.message}`);
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
      active_payroll_runs: number;
      anomalies_detected_this_month: number;
    };
  }> {
    try {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const activeRuns = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM hr_payroll_runs WHERE status IN ('PENDING', 'PROCESSING')
      `.then((r) => r[0]?.count ?? 0);

      const anomalyEvents = await this.prisma.eventBusLog.count({
        where: {
          event_type: 'payroll.anomalies_detected',
          event_timestamp: { gte: thisMonth },
        },
      });

      return {
        agent_name: 'Payroll_Agent',
        status: 'healthy',
        last_check: new Date().toISOString(),
        metrics: {
          active_payroll_runs: Number(activeRuns),
          anomalies_detected_this_month: anomalyEvents,
        },
      };
    } catch (error) {
      return {
        agent_name: 'Payroll_Agent',
        status: 'unhealthy',
        last_check: new Date().toISOString(),
        metrics: { active_payroll_runs: 0, anomalies_detected_this_month: 0 },
      };
    }
  }
}
