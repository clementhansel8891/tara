import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService, TaraEvent } from '../services/event-bus.service';

/**
 * Clock Confirmation Agent
 *
 * Autonomous service for TARA HR System that handles:
 * - Sending automatic attendance confirmations to employees after clock-in/out
 * - Including exact timestamp (HH:mm in WIB), employee name, and tardiness status
 * - Operating automatically without manual triggers
 * - Responding within 30 seconds of attendance action
 *
 * It listens to `attendance.clock_in` and `attendance.clock_out` events emitted
 * onto the Event Bus by the Absensi Agent / Attendance Service. When such an
 * event is observed it sends a Private_Notification back to the employee who
 * performed the clock action.
 *
 * Requirements:
 * - 3.1: Send a Private_Notification to the Employee within 30 seconds of Clock_In
 * - 3.2: Send a Private_Notification to the Employee within 30 seconds of Clock_Out
 * - 3.3: Include the exact timestamp (hours and minutes in WIB) in the message
 * - 3.4: Include the Employee's name in the confirmation message
 * - 3.5: Include tardiness status if Clock_In occurs after the threshold (09:00 WIB)
 * - 3.6: Operate automatically without manual triggers
 * - 3.7: Send confirmations only to the Employee who performed the clock action (private)
 *
 * Design: Task 13.3 - Implement Clock Confirmation Agent
 */
@Injectable()
export class ClockConfirmationAgent {
  private readonly logger = new Logger(ClockConfirmationAgent.name);
  private readonly CONFIRMATION_SLA_SECONDS = 30; // Requirement 3.1, 3.2

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
  ) {
    this.logger.log('Clock Confirmation Agent initialized');
  }

  /**
   * Handle clock-in events.
   *
   * Triggered automatically whenever an `attendance.clock_in` event is emitted
   * onto the Event Bus (Requirement 3.6 - no manual trigger). Sends a private
   * clock-in confirmation to the employee.
   *
   * Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7
   *
   * @param event Clock-in event from the Event Bus
   */
  @OnEvent('attendance.clock_in')
  async handleClockIn(event: TaraEvent | any): Promise<void> {
    await this.processConfirmation('clock_in', event);
  }

  /**
   * Handle clock-out events.
   *
   * Triggered automatically whenever an `attendance.clock_out` event is emitted
   * onto the Event Bus (Requirement 3.6 - no manual trigger). Sends a private
   * clock-out confirmation to the employee.
   *
   * Requirements: 3.2, 3.3, 3.4, 3.6, 3.7
   *
   * @param event Clock-out event from the Event Bus
   */
  @OnEvent('attendance.clock_out')
  async handleClockOut(event: TaraEvent | any): Promise<void> {
    await this.processConfirmation('clock_out', event);
  }

  /**
   * Core confirmation pipeline shared by clock-in and clock-out handlers.
   *
   * Normalises the incoming event, validates it, sends the appropriate private
   * notification and tracks SLA / delivery via the Event Bus.
   *
   * @param actionType The clock action that occurred
   * @param event The raw event (full TaraEvent or bare payload)
   */
  private async processConfirmation(
    actionType: 'clock_in' | 'clock_out',
    event: TaraEvent | any,
  ): Promise<void> {
    const startTime = Date.now();

    // Support both a full TaraEvent (with .payload) and a bare payload object.
    const payload = event?.payload ?? event ?? {};
    const attendanceId = event?.entity?.id ?? payload.attendance_id;
    const employeeId = payload.employee_id;
    const employeeName = payload.employee_name;

    this.logger.log(
      `Processing ${actionType} confirmation for employee ${employeeId}`,
    );

    // Validate required fields (Requirement 3.7 - need the recipient)
    const timestamp = this.resolveTimestamp(actionType, payload, event);
    if (!employeeId || !timestamp) {
      this.logger.error(
        `Invalid ${actionType} event: missing employee_id or timestamp`,
      );
      return;
    }

    try {
      if (actionType === 'clock_in') {
        await this.sendClockInConfirmation(
          employeeId,
          employeeName,
          timestamp,
          payload,
          attendanceId,
        );
      } else {
        await this.sendClockOutConfirmation(
          employeeId,
          employeeName,
          timestamp,
          payload,
          attendanceId,
        );
      }

      const processingTime = Date.now() - startTime;
      const processingSeconds = (processingTime / 1000).toFixed(2);

      this.logger.log(
        `Clock confirmation sent for employee ${employeeName ?? employeeId} ` +
          `(${actionType}) in ${processingSeconds}s`,
      );

      // Requirement 3.1, 3.2: alert when the 30s SLA is exceeded
      if (processingTime > this.CONFIRMATION_SLA_SECONDS * 1000) {
        this.logger.warn(
          `[SLA_EXCEEDED] ${actionType} confirmation took ${processingSeconds}s ` +
            `(SLA: ${this.CONFIRMATION_SLA_SECONDS}s)`,
        );
      }

      await this.emitConfirmationEvent(
        'notification.clock_confirmation_sent',
        actionType,
        employeeId,
        employeeName,
        payload,
        processingTime,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process ${actionType} confirmation for employee ${employeeId}: ${error.message}`,
        error.stack,
      );

      await this.emitConfirmationEvent(
        'notification.clock_confirmation_failed',
        actionType,
        employeeId,
        employeeName,
        payload,
        0,
        error.message,
      );
    }
  }

  /**
   * Send a private clock-in confirmation notification.
   *
   * Requirements: 3.1, 3.3, 3.4, 3.5, 3.7
   */
  private async sendClockInConfirmation(
    employeeId: string,
    employeeName: string | undefined,
    timestamp: Date,
    payload: any,
    attendanceId?: string,
  ): Promise<void> {
    // Requirement 3.3: include the exact timestamp (HH:mm in WIB)
    const timeString = this.formatTimeWIB(timestamp);

    // Requirement 3.4: include the employee's name
    const name = employeeName ?? 'Karyawan';
    let content = `Halo ${name}, Anda telah berhasil clock-in pada pukul ${timeString} WIB.`;

    // Requirement 3.5: include tardiness status if late
    const isTardy = payload.is_tardy === true;
    const tardinessMinutes = payload.tardiness_minutes ?? 0;
    if (isTardy && tardinessMinutes > 0) {
      content += ` Anda tercatat terlambat ${tardinessMinutes} menit dari jadwal yang ditentukan.`;
    } else if (isTardy) {
      content += ` Anda tercatat terlambat dari jadwal yang ditentukan.`;
    } else {
      content += ` Anda tepat waktu. Selamat bekerja!`;
    }

    // Requirement 3.7: private notification sent only to the acting employee
    await this.notificationService.sendPrivateNotification({
      recipient_id: employeeId,
      type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
      title: 'Konfirmasi Clock-In',
      content,
      metadata: {
        attendance_id: attendanceId,
        action_type: 'clock_in',
        timestamp: timestamp.toISOString(),
        clock_time_wib: timeString,
        is_tardy: isTardy,
        tardiness_minutes: tardinessMinutes,
        attendance_date: payload.attendance_date,
      },
    });

    this.logger.log(
      `Clock-in confirmation sent to ${name}. Time: ${timeString} WIB, Tardy: ${isTardy}`,
    );
  }

  /**
   * Send a private clock-out confirmation notification.
   *
   * Requirements: 3.2, 3.3, 3.4, 3.7
   */
  private async sendClockOutConfirmation(
    employeeId: string,
    employeeName: string | undefined,
    timestamp: Date,
    payload: any,
    attendanceId?: string,
  ): Promise<void> {
    // Requirement 3.3: include the exact timestamp (HH:mm in WIB)
    const timeString = this.formatTimeWIB(timestamp);

    // Requirement 3.4: include the employee's name
    const name = employeeName ?? 'Karyawan';
    const content =
      `Halo ${name}, Anda telah berhasil clock-out pada pukul ${timeString} WIB. ` +
      `Terima kasih atas kerja keras Anda hari ini!`;

    // Requirement 3.7: private notification sent only to the acting employee
    await this.notificationService.sendPrivateNotification({
      recipient_id: employeeId,
      type: TaraNotificationType.CLOCK_OUT_CONFIRMATION,
      title: 'Konfirmasi Clock-Out',
      content,
      metadata: {
        attendance_id: attendanceId,
        action_type: 'clock_out',
        timestamp: timestamp.toISOString(),
        clock_time_wib: timeString,
        attendance_date: payload.attendance_date,
      },
    });

    this.logger.log(
      `Clock-out confirmation sent to ${name}. Time: ${timeString} WIB`,
    );
  }

  /**
   * Resolve the action timestamp from the event payload.
   *
   * Prefers the action-specific time recorded by the attendance service
   * (`clock_in_time` / `clock_out_time`), then falls back to a generic
   * `timestamp` field or the event's own timestamp.
   *
   * @returns A valid Date, or null when no usable timestamp is present
   */
  private resolveTimestamp(
    actionType: 'clock_in' | 'clock_out',
    payload: any,
    event: TaraEvent | any,
  ): Date | null {
    const candidate =
      actionType === 'clock_in'
        ? payload.clock_in_time
        : payload.clock_out_time;

    const raw = candidate ?? payload.timestamp ?? event?.event_timestamp;
    if (!raw) {
      return null;
    }

    const date = raw instanceof Date ? raw : new Date(raw);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Format a timestamp to WIB (Asia/Jakarta) in 24-hour HH:mm format.
   *
   * Requirement 3.3: include the exact timestamp (hours and minutes in WIB)
   *
   * @param date Date object to format
   * @returns Formatted time string in HH:mm (WIB)
   */
  private formatTimeWIB(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  /**
   * Emit a confirmation delivery event to the Event Bus for monitoring/audit.
   *
   * Failures are swallowed so event emission never blocks confirmation delivery.
   */
  private async emitConfirmationEvent(
    eventType: string,
    actionType: 'clock_in' | 'clock_out',
    employeeId: string,
    employeeName: string | undefined,
    payload: any,
    processingTime: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: {
          id: 'clock_confirmation_agent',
          type: 'agent',
        },
        entity: {
          id: employeeId,
          type: 'employee',
        },
        payload: {
          employee_id: employeeId,
          employee_name: employeeName,
          action_type: actionType,
          is_tardy: payload.is_tardy ?? false,
          tardiness_minutes: payload.tardiness_minutes ?? 0,
          processing_time_ms: processingTime,
          ...(errorMessage && { error_message: errorMessage }),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit confirmation event: ${error.message}`,
        error.stack,
      );
      // Don't throw - event emission failure should not block confirmation
    }
  }

  /**
   * Get agent health status.
   *
   * Provides health-check information for the monitoring dashboard, including
   * how many confirmations were sent today and the average processing time.
   */
  async getHealthStatus(): Promise<{
    agent_name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    last_check: string;
    metrics: {
      confirmations_sent_today: number;
      clock_in_confirmations: number;
      clock_out_confirmations: number;
      failed_confirmations: number;
      average_processing_time_ms: number;
      sla_breaches_today: number;
    };
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [clockInConfirmations, clockOutConfirmations, failedEvents] =
        await Promise.all([
          this.prisma.notification.count({
            where: {
              notification_type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
              created_at: { gte: today },
            },
          }),
          this.prisma.notification.count({
            where: {
              notification_type: TaraNotificationType.CLOCK_OUT_CONFIRMATION,
              created_at: { gte: today },
            },
          }),
          this.prisma.eventBusLog.count({
            where: {
              event_type: 'notification.clock_confirmation_failed',
              event_timestamp: { gte: today },
              actor_id: 'clock_confirmation_agent',
            },
          }),
        ]);

      const totalConfirmations = clockInConfirmations + clockOutConfirmations;

      // Derive processing-time statistics from emitted "sent" events
      const eventLogs = await this.prisma.eventBusLog.findMany({
        where: {
          event_type: 'notification.clock_confirmation_sent',
          event_timestamp: { gte: today },
          actor_id: 'clock_confirmation_agent',
        },
        select: { event_payload: true },
      });

      let totalProcessingTime = 0;
      let slaBreaches = 0;
      const slaThresholdMs = this.CONFIRMATION_SLA_SECONDS * 1000;

      for (const log of eventLogs) {
        const processingTime =
          (log.event_payload as any)?.processing_time_ms || 0;
        totalProcessingTime += processingTime;
        if (processingTime > slaThresholdMs) {
          slaBreaches++;
        }
      }

      const averageProcessingTime =
        eventLogs.length > 0 ? totalProcessingTime / eventLogs.length : 0;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (totalConfirmations > 0 && failedEvents > totalConfirmations * 0.1) {
        status = 'unhealthy';
      } else if (
        totalConfirmations > 0 &&
        slaBreaches > totalConfirmations * 0.2
      ) {
        status = 'degraded';
      }

      return {
        agent_name: 'Clock_Confirmation_Agent',
        status,
        last_check: new Date().toISOString(),
        metrics: {
          confirmations_sent_today: totalConfirmations,
          clock_in_confirmations: clockInConfirmations,
          clock_out_confirmations: clockOutConfirmations,
          failed_confirmations: failedEvents,
          average_processing_time_ms: Math.round(averageProcessingTime),
          sla_breaches_today: slaBreaches,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get health status: ${error.message}`,
        error.stack,
      );

      return {
        agent_name: 'Clock_Confirmation_Agent',
        status: 'unhealthy',
        last_check: new Date().toISOString(),
        metrics: {
          confirmations_sent_today: 0,
          clock_in_confirmations: 0,
          clock_out_confirmations: 0,
          failed_confirmations: 0,
          average_processing_time_ms: 0,
          sla_breaches_today: 0,
        },
      };
    }
  }
}
