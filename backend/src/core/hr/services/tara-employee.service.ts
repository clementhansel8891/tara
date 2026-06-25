// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

/**
 * TARA Employee Service
 * Handles TARA-specific employee operations including attendance and tardiness detection
 * 
 * Requirements:
 * - 2.3: Tardiness detection when clock-in after threshold
 * - 2.4: Trigger Late_Report_Agent when tardiness detected
 * - 8.3: Use configurable tardiness threshold from SystemSettings
 */
@Injectable()
export class TaraEmployeeService {
  private readonly logger = new Logger(TaraEmployeeService.name);
  private readonly DEFAULT_TARDINESS_THRESHOLD = '09:00'; // Default 09:00 WIB

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Get tardiness threshold from SystemSettings
   * Falls back to default 09:00 WIB if not configured
   * 
   * @returns Tardiness threshold in HH:mm format (e.g., "09:00")
   * Requirement 8.2, 8.3
   */
  async getTardinessThreshold(): Promise<string> {
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { setting_key: 'tardiness_threshold' },
      });

      if (setting && setting.setting_value) {
        const threshold = typeof setting.setting_value === 'string' 
          ? setting.setting_value 
          : (setting.setting_value as any).threshold || this.DEFAULT_TARDINESS_THRESHOLD;
        
        this.logger.debug(`Tardiness threshold from settings: ${threshold}`);
        return threshold;
      }

      this.logger.debug(`Using default tardiness threshold: ${this.DEFAULT_TARDINESS_THRESHOLD}`);
      return this.DEFAULT_TARDINESS_THRESHOLD;
    } catch (error) {
      this.logger.error('Error fetching tardiness threshold from SystemSettings', error);
      return this.DEFAULT_TARDINESS_THRESHOLD;
    }
  }

  /**
   * Calculate tardiness in minutes based on clock-in time and threshold
   * 
   * @param clockInTime The actual clock-in timestamp
   * @param thresholdTime The tardiness threshold time string (HH:mm)
   * @returns Number of minutes late (0 if not late)
   */
  calculateTardinessMinutes(clockInTime: Date, thresholdTime: string): number {
    // Parse threshold time (e.g., "09:00")
    const [thresholdHour, thresholdMinute] = thresholdTime.split(':').map(Number);
    
    // Create threshold date on the same day as clock-in, using UTC methods
    const thresholdDate = new Date(clockInTime);
    thresholdDate.setUTCHours(thresholdHour, thresholdMinute, 0, 0);

    // Calculate difference in milliseconds
    const diffMs = clockInTime.getTime() - thresholdDate.getTime();
    
    // Convert to minutes (only positive values indicate tardiness)
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    return diffMinutes > 0 ? diffMinutes : 0;
  }

  /**
   * Record clock-in with tardiness detection
   * 
   * Requirements:
   * - 2.1: Record exact timestamp in WIB
   * - 2.3: Flag as tardy if after threshold
   * - 2.4: Trigger Late_Report_Agent when tardy
   * - 8.3: Use configured tardiness threshold
   * 
   * @param employeeId Employee ID
   * @param clockInTime Clock-in timestamp
   * @param clockInSource Source of clock-in ('phone' or 'aws')
   * @param clockInLocation GPS coordinates (optional)
   * @param officeLocationId Office location reference (optional)
   * @returns Created attendance record
   */
  async recordClockIn(
    employeeId: string,
    clockInTime: Date,
    clockInSource: string = 'phone',
    clockInLocation?: any,
    officeLocationId?: string,
  ) {
    // Get tardiness threshold from SystemSettings
    const threshold = await this.getTardinessThreshold();
    
    // Calculate tardiness
    const tardinessMinutes = this.calculateTardinessMinutes(clockInTime, threshold);
    const isTardy = tardinessMinutes > 0;

    // Get attendance date (date only, without time) using UTC
    const attendanceDate = new Date(clockInTime);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    this.logger.log(
      `Clock-in for employee ${employeeId}: ${clockInTime.toISOString()}, ` +
      `Threshold: ${threshold}, Tardy: ${isTardy}, Minutes late: ${tardinessMinutes}`
    );

    // Create attendance record
    const attendance = await this.prisma.attendance.create({
      data: {
        employee_id: employeeId,
        attendance_date: attendanceDate,
        clock_in_time: clockInTime,
        clock_in_source: clockInSource,
        clock_in_location: clockInLocation,
        is_tardy: isTardy,
        tardiness_minutes: tardinessMinutes,
        office_location_id: officeLocationId,
      },
    });

    // Emit clock-in event to Event Bus
    await this.eventBus.publish({
      event_type: 'attendance.clock_in',
      tenant_id: 'default', // TODO: Get from context when multi-tenancy is implemented
      entity_id: attendance.id,
      entity_type: 'Attendance',
      source_module: 'HR',
      event_reference_id: `clock-in-${attendance.id}`,
      payload: {
        employee_id: employeeId,
        clock_in_time: clockInTime.toISOString(),
        is_tardy: isTardy,
        tardiness_minutes: tardinessMinutes,
        source: clockInSource,
      },
    });

    // If tardy, trigger Late_Report_Agent by emitting tardiness event
    // Requirement 2.4: Trigger Late_Report_Agent when tardiness detected
    if (isTardy) {
      await this.eventBus.publish({
        event_type: 'attendance.tardiness_detected',
        tenant_id: 'default',
        entity_id: attendance.id,
        entity_type: 'Attendance',
        source_module: 'HR',
        event_reference_id: `tardiness-${attendance.id}`,
        payload: {
          employee_id: employeeId,
          clock_in_time: clockInTime.toISOString(),
          tardiness_minutes: tardinessMinutes,
          threshold: threshold,
        },
      });

      this.logger.warn(
        `Tardiness detected for employee ${employeeId}: ${tardinessMinutes} minutes late`
      );
    }

    return attendance;
  }

  /**
   * Record clock-out
   * 
   * Requirement 2.2: Record exact timestamp in WIB
   * 
   * @param employeeId Employee ID
   * @param clockOutTime Clock-out timestamp
   * @param clockOutSource Source of clock-out ('phone' or 'aws')
   * @param clockOutLocation GPS coordinates (optional)
   * @returns Updated attendance record
   */
  async recordClockOut(
    employeeId: string,
    clockOutTime: Date,
    clockOutSource: string = 'phone',
    clockOutLocation?: any,
  ) {
    // Get today's attendance date using UTC
    const attendanceDate = new Date(clockOutTime);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    this.logger.log(`Clock-out for employee ${employeeId}: ${clockOutTime.toISOString()}`);

    // Find today's attendance record for this employee
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employee_id_attendance_date: {
          employee_id: employeeId,
          attendance_date: attendanceDate,
        },
      },
    });

    if (!attendance) {
      throw new Error(
        `No clock-in record found for employee ${employeeId} on ${attendanceDate.toDateString()}`
      );
    }

    // Update with clock-out information
    const updatedAttendance = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clock_out_time: clockOutTime,
        clock_out_source: clockOutSource,
        clock_out_location: clockOutLocation,
        updated_at: new Date(),
      },
    });

    // Emit clock-out event to Event Bus
    await this.eventBus.publish({
      event_type: 'attendance.clock_out',
      tenant_id: 'default',
      entity_id: updatedAttendance.id,
      entity_type: 'Attendance',
      source_module: 'HR',
      event_reference_id: `clock-out-${updatedAttendance.id}`,
      payload: {
        employee_id: employeeId,
        clock_out_time: clockOutTime.toISOString(),
        source: clockOutSource,
      },
    });

    return updatedAttendance;
  }

  /**
   * Get attendance records for an employee
   * 
   * @param employeeId Employee ID
   * @param startDate Start date (optional)
   * @param endDate End date (optional)
   * @returns List of attendance records
   */
  async getAttendanceRecords(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = { employee_id: employeeId };

    if (startDate || endDate) {
      where.attendance_date = {};
      if (startDate) where.attendance_date.gte = startDate;
      if (endDate) where.attendance_date.lte = endDate;
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { attendance_date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            employee_code: true,
          },
        },
      },
    });
  }

  /**
   * Get tardy employees for a specific date
   * Used by Late_Report_Agent to generate tardiness reports
   * 
   * @param date Date to check (defaults to today)
   * @returns List of attendance records where is_tardy=true
   */
  async getTardyEmployeesForDate(date: Date = new Date()) {
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.attendance.findMany({
      where: {
        attendance_date: attendanceDate,
        is_tardy: true,
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            employee_code: true,
          },
        },
      },
      orderBy: {
        clock_in_time: 'asc',
      },
    });
  }
}
