import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictResolutionService } from './conflict-resolution.service';

/**
 * Unit tests for ConflictResolutionService (Task 22.3)
 *
 * Validates:
 * - Req 13.5: Data synchronization conflicts resolved using most recent timestamp
 * - Req 24.6: AWS/phone clock-in conflicts resolved by earliest timestamp
 * - Req 24.7: AWS/phone clock-out conflicts resolved by latest timestamp
 * - Conflicts logged in AuditLog for review
 */
describe('ConflictResolutionService', () => {
  let service: ConflictResolutionService;
  let mockPrisma: any;
  let mockAuditService: any;
  let mockEventBusService: any;

  beforeEach(() => {
    mockPrisma = {
      attendance: {
        update: vi.fn().mockResolvedValue({ id: 'att-1' }),
      },
    };

    mockAuditService = {
      log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    mockEventBusService = {
      emit: vi.fn().mockResolvedValue({ event_id: 'evt-1' }),
    };

    service = new ConflictResolutionService(
      mockPrisma,
      mockAuditService,
      mockEventBusService,
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Req 13.5: Generic data conflict resolution - most recent timestamp wins
  // ─────────────────────────────────────────────────────────────────────────────
  describe('resolveByTimestamp (Req 13.5)', () => {
    it('should resolve in favor of incoming when incoming is more recent', async () => {
      const result = await service.resolveByTimestamp({
        entity_type: 'employee',
        entity_id: 'emp-1',
        incoming_timestamp: new Date('2025-07-15T10:00:00Z'),
        existing_timestamp: new Date('2025-07-15T09:00:00Z'),
        incoming_data: { full_name: 'Updated Name' },
        existing_data: { full_name: 'Original Name' },
        actor_id: 'system',
      });

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('incoming');
      expect(result.reason).toContain('more recent');
    });

    it('should resolve in favor of existing when existing is more recent', async () => {
      const result = await service.resolveByTimestamp({
        entity_type: 'leave_balance',
        entity_id: 'lb-1',
        incoming_timestamp: new Date('2025-07-15T08:00:00Z'),
        existing_timestamp: new Date('2025-07-15T09:30:00Z'),
        incoming_data: { remaining_days: 10 },
        existing_data: { remaining_days: 8 },
        actor_id: 'sync-agent',
      });

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('existing');
      expect(result.reason).toContain('more recent');
    });

    it('should resolve in favor of incoming when timestamps are equal', async () => {
      const sameTimestamp = new Date('2025-07-15T10:00:00Z');

      const result = await service.resolveByTimestamp({
        entity_type: 'attendance',
        entity_id: 'att-1',
        incoming_timestamp: sameTimestamp,
        existing_timestamp: sameTimestamp,
        incoming_data: { is_tardy: true },
        existing_data: { is_tardy: false },
      });

      // Equal timestamps: incoming wins (tie-breaker)
      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('incoming');
    });

    it('should log the conflict in AuditLog', async () => {
      await service.resolveByTimestamp({
        entity_type: 'employee',
        entity_id: 'emp-1',
        incoming_timestamp: new Date('2025-07-15T10:00:00Z'),
        existing_timestamp: new Date('2025-07-15T09:00:00Z'),
        incoming_data: { phone: '+62123' },
        existing_data: { phone: '+62456' },
        actor_id: 'hr-user-1',
      });

      expect(mockAuditService.log).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DATA_SYNC_CONFLICT_RESOLVED',
          entity_type: 'employee',
          entity_id: 'emp-1',
          user_id: 'hr-user-1',
          actor_role: 'system',
          changes: expect.objectContaining({
            conflict_type: 'timestamp_based',
            winner: 'incoming',
          }),
        }),
      );
    });

    it('should default actor_id to system when not provided', async () => {
      await service.resolveByTimestamp({
        entity_type: 'notification',
        entity_id: 'notif-1',
        incoming_timestamp: new Date('2025-07-15T10:00:00Z'),
        existing_timestamp: new Date('2025-07-15T09:00:00Z'),
        incoming_data: {},
        existing_data: {},
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'system',
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Req 24.6: Attendance clock-in conflict - earliest wins
  // ─────────────────────────────────────────────────────────────────────────────
  describe('resolveAttendanceConflict - clock-in (Req 24.6)', () => {
    it('should keep phone clock-in when phone is earlier than AWS', async () => {
      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        phone_clock_in: new Date('2025-07-15T01:45:00Z'), // 08:45 WIB
        aws_clock_in: new Date('2025-07-15T01:50:00Z'), // 08:50 WIB
      });

      expect(result.resolved).toBe(true);
      expect(result.clock_in_resolved).not.toBeNull();
      expect(result.clock_in_resolved!.winner_source).toBe('phone');
      expect(result.clock_in_resolved!.winner_time).toEqual(
        new Date('2025-07-15T01:45:00Z'),
      );
      expect(result.clock_in_resolved!.loser_source).toBe('aws_device');
    });

    it('should keep AWS clock-in when AWS is earlier than phone', async () => {
      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-2',
        attendance_date: '2025-07-15',
        phone_clock_in: new Date('2025-07-15T02:10:00Z'), // 09:10 WIB
        aws_clock_in: new Date('2025-07-15T01:55:00Z'), // 08:55 WIB
      });

      expect(result.resolved).toBe(true);
      expect(result.clock_in_resolved).not.toBeNull();
      expect(result.clock_in_resolved!.winner_source).toBe('aws_device');
      expect(result.clock_in_resolved!.winner_time).toEqual(
        new Date('2025-07-15T01:55:00Z'),
      );
      expect(result.clock_in_resolved!.loser_source).toBe('phone');
    });

    it('should keep phone clock-in when both are at same time (phone wins tie)', async () => {
      const sameTime = new Date('2025-07-15T02:00:00Z');

      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-3',
        attendance_date: '2025-07-15',
        phone_clock_in: sameTime,
        aws_clock_in: sameTime,
      });

      // Equal time: phone <= aws, so phone wins
      expect(result.clock_in_resolved!.winner_source).toBe('phone');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Req 24.7: Attendance clock-out conflict - latest wins
  // ─────────────────────────────────────────────────────────────────────────────
  describe('resolveAttendanceConflict - clock-out (Req 24.7)', () => {
    it('should keep phone clock-out when phone is later than AWS', async () => {
      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        phone_clock_out: new Date('2025-07-15T10:30:00Z'), // 17:30 WIB
        aws_clock_out: new Date('2025-07-15T10:15:00Z'), // 17:15 WIB
      });

      expect(result.resolved).toBe(true);
      expect(result.clock_out_resolved).not.toBeNull();
      expect(result.clock_out_resolved!.winner_source).toBe('phone');
      expect(result.clock_out_resolved!.winner_time).toEqual(
        new Date('2025-07-15T10:30:00Z'),
      );
      expect(result.clock_out_resolved!.loser_source).toBe('aws_device');
    });

    it('should keep AWS clock-out when AWS is later than phone', async () => {
      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-2',
        attendance_date: '2025-07-15',
        phone_clock_out: new Date('2025-07-15T10:00:00Z'), // 17:00 WIB
        aws_clock_out: new Date('2025-07-15T10:45:00Z'), // 17:45 WIB
      });

      expect(result.resolved).toBe(true);
      expect(result.clock_out_resolved).not.toBeNull();
      expect(result.clock_out_resolved!.winner_source).toBe('aws_device');
      expect(result.clock_out_resolved!.winner_time).toEqual(
        new Date('2025-07-15T10:45:00Z'),
      );
      expect(result.clock_out_resolved!.loser_source).toBe('phone');
    });

    it('should keep phone clock-out when both are at same time (phone wins tie)', async () => {
      const sameTime = new Date('2025-07-15T10:00:00Z');

      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-3',
        attendance_date: '2025-07-15',
        phone_clock_out: sameTime,
        aws_clock_out: sameTime,
      });

      // Equal time: phone >= aws, so phone wins
      expect(result.clock_out_resolved!.winner_source).toBe('phone');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Combined clock-in and clock-out conflicts
  // ─────────────────────────────────────────────────────────────────────────────
  describe('resolveAttendanceConflict - combined conflicts', () => {
    it('should resolve both clock-in and clock-out independently', async () => {
      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        phone_clock_in: new Date('2025-07-15T02:10:00Z'), // phone later
        aws_clock_in: new Date('2025-07-15T01:50:00Z'), // AWS earlier → AWS wins clock-in
        phone_clock_out: new Date('2025-07-15T10:30:00Z'), // phone later → phone wins clock-out
        aws_clock_out: new Date('2025-07-15T10:00:00Z'), // AWS earlier
      });

      expect(result.resolved).toBe(true);
      // Clock-in: AWS is earlier, so AWS wins
      expect(result.clock_in_resolved!.winner_source).toBe('aws_device');
      // Clock-out: Phone is later, so phone wins
      expect(result.clock_out_resolved!.winner_source).toBe('phone');
    });

    it('should handle only clock-in conflict (no clock-out conflict)', async () => {
      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        phone_clock_in: new Date('2025-07-15T01:45:00Z'),
        aws_clock_in: new Date('2025-07-15T02:00:00Z'),
        // No clock-out conflict
      });

      expect(result.clock_in_resolved).not.toBeNull();
      expect(result.clock_out_resolved).toBeNull();
    });

    it('should handle only clock-out conflict (no clock-in conflict)', async () => {
      const result = await service.resolveAttendanceConflict({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        // No clock-in conflict
        phone_clock_out: new Date('2025-07-15T10:30:00Z'),
        aws_clock_out: new Date('2025-07-15T10:15:00Z'),
      });

      expect(result.clock_in_resolved).toBeNull();
      expect(result.clock_out_resolved).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Audit logging verification
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Audit logging for conflicts', () => {
    it('should log attendance conflict in AuditLog with detailed changes', async () => {
      await service.resolveAttendanceConflict({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        phone_clock_in: new Date('2025-07-15T01:45:00Z'),
        aws_clock_in: new Date('2025-07-15T02:00:00Z'),
        phone_clock_out: new Date('2025-07-15T10:30:00Z'),
        aws_clock_out: new Date('2025-07-15T10:00:00Z'),
        actor_id: 'sync-service',
      });

      expect(mockAuditService.log).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTENDANCE_CONFLICT_RESOLVED',
          entity_type: 'attendance',
          entity_id: 'emp-1_2025-07-15',
          user_id: 'sync-service',
          actor_role: 'system',
          changes: expect.objectContaining({
            conflict_type: 'attendance_source',
            employee_id: 'emp-1',
            attendance_date: '2025-07-15',
            clock_in_conflict: expect.objectContaining({
              rule: 'earliest_clock_in',
            }),
            clock_out_conflict: expect.objectContaining({
              rule: 'latest_clock_out',
            }),
          }),
        }),
      );
    });

    it('should emit attendance.conflict_resolved event to Event Bus', async () => {
      await service.resolveAttendanceConflict({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        phone_clock_in: new Date('2025-07-15T01:45:00Z'),
        aws_clock_in: new Date('2025-07-15T02:00:00Z'),
      });

      expect(mockEventBusService.emit).toHaveBeenCalledTimes(1);
      expect(mockEventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.conflict_resolved',
          event_version: '1.0',
          actor: expect.objectContaining({ type: 'system' }),
          entity: expect.objectContaining({
            id: 'emp-1',
            type: 'attendance',
          }),
          payload: expect.objectContaining({
            employee_id: 'emp-1',
            attendance_date: '2025-07-15',
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // applyAttendanceResolution
  // ─────────────────────────────────────────────────────────────────────────────
  describe('applyAttendanceResolution', () => {
    it('should update attendance record with resolved clock-in time and source', async () => {
      const resolution = {
        resolved: true,
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        clock_in_resolved: {
          winner_source: 'aws_device' as const,
          winner_time: new Date('2025-07-15T01:50:00Z'),
          loser_source: 'phone' as const,
          loser_time: new Date('2025-07-15T02:10:00Z'),
        },
        clock_out_resolved: null,
      };

      await service.applyAttendanceResolution({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        resolution,
      });

      expect(mockPrisma.attendance.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.attendance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            employee_id_attendance_date: {
              employee_id: 'emp-1',
              attendance_date: new Date('2025-07-15'),
            },
          },
          data: expect.objectContaining({
            clock_in_time: new Date('2025-07-15T01:50:00Z'),
            clock_in_source: 'aws_device',
          }),
        }),
      );
    });

    it('should update both clock-in and clock-out when both are resolved', async () => {
      const resolution = {
        resolved: true,
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        clock_in_resolved: {
          winner_source: 'aws_device' as const,
          winner_time: new Date('2025-07-15T01:50:00Z'),
          loser_source: 'phone' as const,
          loser_time: new Date('2025-07-15T02:10:00Z'),
        },
        clock_out_resolved: {
          winner_source: 'phone' as const,
          winner_time: new Date('2025-07-15T10:30:00Z'),
          loser_source: 'aws_device' as const,
          loser_time: new Date('2025-07-15T10:00:00Z'),
        },
      };

      await service.applyAttendanceResolution({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        resolution,
      });

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clock_in_time: new Date('2025-07-15T01:50:00Z'),
            clock_in_source: 'aws_device',
            clock_out_time: new Date('2025-07-15T10:30:00Z'),
            clock_out_source: 'phone',
          }),
        }),
      );
    });

    it('should return null when no resolution data to apply', async () => {
      const resolution = {
        resolved: true,
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        clock_in_resolved: null,
        clock_out_resolved: null,
      };

      const result = await service.applyAttendanceResolution({
        employee_id: 'emp-1',
        attendance_date: '2025-07-15',
        resolution,
      });

      expect(result).toBeNull();
      expect(mockPrisma.attendance.update).not.toHaveBeenCalled();
    });
  });
});
