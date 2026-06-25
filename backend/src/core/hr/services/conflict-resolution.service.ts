import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { AuditService } from '../../../shared/audit/audit.service';
import { EventBusService } from './event-bus.service';

/**
 * Conflict Resolution Result for generic data updates.
 */
export interface ConflictResolutionResult {
  resolved: boolean;
  winner: 'incoming' | 'existing';
  reason: string;
  incoming_timestamp: Date;
  existing_timestamp: Date;
}

/**
 * Attendance Conflict Resolution Result.
 * Returned when AWS/phone attendance records conflict.
 */
export interface AttendanceConflictResult {
  resolved: boolean;
  employee_id: string;
  attendance_date: string;
  clock_in_resolved: {
    winner_source: 'phone' | 'aws_device';
    winner_time: Date;
    loser_source: 'phone' | 'aws_device';
    loser_time: Date;
  } | null;
  clock_out_resolved: {
    winner_source: 'phone' | 'aws_device';
    winner_time: Date;
    loser_source: 'phone' | 'aws_device';
    loser_time: Date;
  } | null;
}

/**
 * ConflictResolutionService
 *
 * Handles synchronization conflicts in the TARA HR system:
 *
 * 1. Generic Data Conflicts (Req 13.5):
 *    - Resolved using most-recent-timestamp wins strategy.
 *    - All conflicts are logged in AuditLog for HR review.
 *
 * 2. AWS/Phone Attendance Conflicts (Req 24.6, 24.7):
 *    - For clock-in: earliest timestamp is authoritative.
 *    - For clock-out: latest timestamp is authoritative.
 *    - Conflicts emit an event to Event Bus for Hermes agents to review (Req 24.9).
 *    - All conflicts are logged in AuditLog.
 *
 * Requirements: 13.5, 24.6, 24.7
 * Task: 22.3
 */
@Injectable()
export class ConflictResolutionService {
  private readonly logger = new Logger(ConflictResolutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * Resolve a generic data synchronization conflict using most-recent-timestamp wins.
   *
   * When two updates target the same entity, the one with the most recent
   * timestamp is kept as authoritative. The conflict is logged in AuditLog.
   *
   * @param params - Conflict parameters
   * @returns Resolution result indicating which update won
   */
  async resolveByTimestamp(params: {
    entity_type: string;
    entity_id: string;
    incoming_timestamp: Date;
    existing_timestamp: Date;
    incoming_data: Record<string, any>;
    existing_data: Record<string, any>;
    actor_id?: string;
  }): Promise<ConflictResolutionResult> {
    const { entity_type, entity_id, incoming_timestamp, existing_timestamp } = params;

    const incomingTime = incoming_timestamp.getTime();
    const existingTime = existing_timestamp.getTime();

    // Most recent timestamp wins (Req 13.5)
    const winner: 'incoming' | 'existing' =
      incomingTime >= existingTime ? 'incoming' : 'existing';

    const reason =
      winner === 'incoming'
        ? `Incoming update (${incoming_timestamp.toISOString()}) is more recent than existing (${existing_timestamp.toISOString()})`
        : `Existing data (${existing_timestamp.toISOString()}) is more recent than incoming (${incoming_timestamp.toISOString()})`;

    this.logger.log(
      `Conflict resolved for ${entity_type}/${entity_id}: winner=${winner}`,
    );

    // Log the conflict in AuditLog for review
    await this.auditService.log({
      user_id: params.actor_id ?? 'system',
      action: 'DATA_SYNC_CONFLICT_RESOLVED',
      entity_type,
      entity_id,
      actor_role: 'system',
      changes: {
        conflict_type: 'timestamp_based',
        winner,
        reason,
        incoming_timestamp: incoming_timestamp.toISOString(),
        existing_timestamp: existing_timestamp.toISOString(),
        incoming_data: params.incoming_data,
        existing_data: params.existing_data,
      },
    });

    return {
      resolved: true,
      winner,
      reason,
      incoming_timestamp,
      existing_timestamp,
    };
  }

  /**
   * Resolve attendance conflicts between AWS fingerprint device and phone-based records.
   *
   * Rules (Req 24.6, 24.7):
   * - Clock-in: Keep the EARLIEST timestamp as authoritative.
   * - Clock-out: Keep the LATEST timestamp as authoritative.
   *
   * This handles the case where an employee clocks in via both AWS device and
   * phone on the same day.
   *
   * @param params - Attendance conflict parameters
   * @returns Resolution result with winning sources
   */
  async resolveAttendanceConflict(params: {
    employee_id: string;
    attendance_date: string;
    phone_clock_in?: Date;
    aws_clock_in?: Date;
    phone_clock_out?: Date;
    aws_clock_out?: Date;
    actor_id?: string;
  }): Promise<AttendanceConflictResult> {
    const { employee_id, attendance_date } = params;

    let clock_in_resolved: AttendanceConflictResult['clock_in_resolved'] = null;
    let clock_out_resolved: AttendanceConflictResult['clock_out_resolved'] = null;

    // Resolve clock-in conflict: earliest wins (Req 24.6)
    if (params.phone_clock_in && params.aws_clock_in) {
      const phoneTime = params.phone_clock_in.getTime();
      const awsTime = params.aws_clock_in.getTime();

      if (phoneTime <= awsTime) {
        clock_in_resolved = {
          winner_source: 'phone',
          winner_time: params.phone_clock_in,
          loser_source: 'aws_device',
          loser_time: params.aws_clock_in,
        };
      } else {
        clock_in_resolved = {
          winner_source: 'aws_device',
          winner_time: params.aws_clock_in,
          loser_source: 'phone',
          loser_time: params.phone_clock_in,
        };
      }
    }

    // Resolve clock-out conflict: latest wins (Req 24.7)
    if (params.phone_clock_out && params.aws_clock_out) {
      const phoneTime = params.phone_clock_out.getTime();
      const awsTime = params.aws_clock_out.getTime();

      if (phoneTime >= awsTime) {
        clock_out_resolved = {
          winner_source: 'phone',
          winner_time: params.phone_clock_out,
          loser_source: 'aws_device',
          loser_time: params.aws_clock_out,
        };
      } else {
        clock_out_resolved = {
          winner_source: 'aws_device',
          winner_time: params.aws_clock_out,
          loser_source: 'phone',
          loser_time: params.phone_clock_out,
        };
      }
    }

    this.logger.log(
      `Attendance conflict resolved for employee=${employee_id}, date=${attendance_date}` +
        (clock_in_resolved ? ` | clock_in winner=${clock_in_resolved.winner_source}` : '') +
        (clock_out_resolved ? ` | clock_out winner=${clock_out_resolved.winner_source}` : ''),
    );

    // Log conflict in AuditLog for HR review
    await this.auditService.log({
      user_id: params.actor_id ?? 'system',
      action: 'ATTENDANCE_CONFLICT_RESOLVED',
      entity_type: 'attendance',
      entity_id: `${employee_id}_${attendance_date}`,
      actor_role: 'system',
      changes: {
        conflict_type: 'attendance_source',
        employee_id,
        attendance_date,
        clock_in_conflict: clock_in_resolved
          ? {
              winner_source: clock_in_resolved.winner_source,
              winner_time: clock_in_resolved.winner_time.toISOString(),
              loser_source: clock_in_resolved.loser_source,
              loser_time: clock_in_resolved.loser_time.toISOString(),
              rule: 'earliest_clock_in',
            }
          : null,
        clock_out_conflict: clock_out_resolved
          ? {
              winner_source: clock_out_resolved.winner_source,
              winner_time: clock_out_resolved.winner_time.toISOString(),
              loser_source: clock_out_resolved.loser_source,
              loser_time: clock_out_resolved.loser_time.toISOString(),
              rule: 'latest_clock_out',
            }
          : null,
      },
    });

    // Emit event to Event Bus for Hermes agents (Req 24.9)
    await this.eventBusService.emit({
      event_type: 'attendance.conflict_resolved',
      event_version: '1.0',
      event_timestamp: new Date(),
      actor: {
        id: params.actor_id ?? 'system',
        type: 'system',
      },
      entity: {
        id: employee_id,
        type: 'attendance',
      },
      payload: {
        employee_id,
        attendance_date,
        clock_in_resolved,
        clock_out_resolved,
      },
    });

    return {
      resolved: true,
      employee_id,
      attendance_date,
      clock_in_resolved,
      clock_out_resolved,
    };
  }

  /**
   * Apply the resolved attendance conflict to the database.
   *
   * Updates the attendance record with the winning clock-in/out times and sources.
   *
   * @param params - Resolution to apply
   * @returns Updated attendance record
   */
  async applyAttendanceResolution(params: {
    employee_id: string;
    attendance_date: string;
    resolution: AttendanceConflictResult;
  }): Promise<any> {
    const { employee_id, attendance_date, resolution } = params;

    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (resolution.clock_in_resolved) {
      updateData.clock_in_time = resolution.clock_in_resolved.winner_time;
      updateData.clock_in_source = resolution.clock_in_resolved.winner_source;
    }

    if (resolution.clock_out_resolved) {
      updateData.clock_out_time = resolution.clock_out_resolved.winner_time;
      updateData.clock_out_source = resolution.clock_out_resolved.winner_source;
    }

    // Only update if there's something to change
    if (Object.keys(updateData).length <= 1) {
      return null;
    }

    const parsedDate = new Date(attendance_date);

    const result = await this.prisma.attendance.update({
      where: {
        employee_id_attendance_date: {
          employee_id,
          attendance_date: parsedDate,
        },
      },
      data: updateData,
    });

    this.logger.log(
      `Applied attendance conflict resolution for employee=${employee_id}, date=${attendance_date}`,
    );

    return result;
  }
}
