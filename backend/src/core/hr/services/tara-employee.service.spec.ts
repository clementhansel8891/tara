import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaraEmployeeService } from './tara-employee.service';
import type { PrismaService } from '../../../persistence/prisma.service';
import type { EventBusService } from '../../../shared/events/event-bus.service';

describe('TaraEmployeeService', () => {
  let service: TaraEmployeeService;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {
      systemSettings: {
        findUnique: vi.fn(),
      },
      attendance: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    };

    eventBus = {
      publish: vi.fn(),
    };

    service = new TaraEmployeeService(
      prisma as unknown as PrismaService,
      eventBus as unknown as EventBusService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTardinessThreshold', () => {
    test('should return threshold from SystemSettings when configured', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue({
        id: '1',
        setting_key: 'tardiness_threshold',
        setting_value: '09:00',
        setting_category: 'attendance',
        description: 'Tardiness threshold time',
        last_modified_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const threshold = await service.getTardinessThreshold();
      expect(threshold).toBe('09:00');
      expect(prisma.systemSettings.findUnique).toHaveBeenCalledWith({
        where: { setting_key: 'tardiness_threshold' },
      });
    });

    test('should return default 09:00 when setting not found', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue(null);

      const threshold = await service.getTardinessThreshold();
      expect(threshold).toBe('09:00');
    });

    test('should handle JSON setting_value format', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue({
        id: '1',
        setting_key: 'tardiness_threshold',
        setting_value: { threshold: '08:30' },
        setting_category: 'attendance',
        description: 'Tardiness threshold time',
        last_modified_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const threshold = await service.getTardinessThreshold();
      expect(threshold).toBe('08:30');
    });

    test('should return default on database error', async () => {
      prisma.systemSettings.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const threshold = await service.getTardinessThreshold();
      expect(threshold).toBe('09:00');
    });
  });

  describe('calculateTardinessMinutes', () => {
    test('should return 0 for clock-in before threshold', () => {
      // 08:45 UTC (not WIB) - before 09:00 threshold
      const clockInTime = new Date('2025-01-15T08:45:00Z');
      const threshold = '09:00';

      const minutes = service.calculateTardinessMinutes(clockInTime, threshold);
      expect(minutes).toBe(0);
    });

    test('should calculate tardiness minutes for clock-in after threshold', () => {
      // 09:15 UTC - 15 minutes after 09:00 threshold
      const clockInTime = new Date('2025-01-15T09:15:00Z');
      const threshold = '09:00';

      const minutes = service.calculateTardinessMinutes(clockInTime, threshold);
      expect(minutes).toBe(15);
    });

    test('should handle exact threshold time as not tardy', () => {
      // 09:00 UTC exact
      const clockInTime = new Date('2025-01-15T09:00:00Z');
      const threshold = '09:00';

      const minutes = service.calculateTardinessMinutes(clockInTime, threshold);
      expect(minutes).toBe(0);
    });

    test('should handle large tardiness (hours late)', () => {
      // 11:30 UTC - 2.5 hours after 09:00 threshold
      const clockInTime = new Date('2025-01-15T11:30:00Z');
      const threshold = '09:00';

      const minutes = service.calculateTardinessMinutes(clockInTime, threshold);
      expect(minutes).toBe(150); // 2.5 hours = 150 minutes
    });

    test('should handle different threshold times', () => {
      // 08:45 UTC - 15 minutes after 08:30 threshold
      const clockInTime = new Date('2025-01-15T08:45:00Z');
      const threshold = '08:30';

      const minutes = service.calculateTardinessMinutes(clockInTime, threshold);
      expect(minutes).toBe(15);
    });
  });

  describe('recordClockIn', () => {
    test('should create attendance record with is_tardy=false when on time', async () => {
      const employeeId = 'emp-123';
      // 08:45 UTC - before 09:00 threshold
      const clockInTime = new Date('2025-01-15T08:45:00Z');
      const expectedAttendanceDate = new Date('2025-01-15T00:00:00Z');

      prisma.systemSettings.findUnique.mockResolvedValue({
        id: '1',
        setting_key: 'tardiness_threshold',
        setting_value: '09:00',
        setting_category: 'attendance',
        description: null,
        last_modified_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const mockAttendance = {
        id: 'att-1',
        employee_id: employeeId,
        attendance_date: expectedAttendanceDate,
        clock_in_time: clockInTime,
        clock_in_source: 'phone',
        clock_in_location: null,
        clock_out_time: null,
        clock_out_source: 'phone',
        clock_out_location: null,
        is_tardy: false,
        tardiness_minutes: 0,
        office_location_id: null,
        override_reason: null,
        override_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.attendance.create.mockResolvedValue(mockAttendance);
      eventBus.publish.mockResolvedValue(undefined);

      const result = await service.recordClockIn(employeeId, clockInTime);

      expect(result).toEqual(mockAttendance);
      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employee_id: employeeId,
          clock_in_time: clockInTime,
          is_tardy: false,
          tardiness_minutes: 0,
          clock_in_source: 'phone',
        }),
      });

      // Should emit clock-in event
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.clock_in',
          payload: expect.objectContaining({
            employee_id: employeeId,
            is_tardy: false,
            tardiness_minutes: 0,
          }),
        })
      );

      // Should NOT emit tardiness event
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });

    test('should create attendance record with is_tardy=true when late', async () => {
      const employeeId = 'emp-456';
      // 09:30 UTC - 30 minutes after 09:00 threshold
      const clockInTime = new Date('2025-01-15T09:30:00Z');

      prisma.systemSettings.findUnique.mockResolvedValue({
        id: '1',
        setting_key: 'tardiness_threshold',
        setting_value: '09:00',
        setting_category: 'attendance',
        description: null,
        last_modified_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const mockAttendance = {
        id: 'att-2',
        employee_id: employeeId,
        attendance_date: new Date('2025-01-15T00:00:00Z'),
        clock_in_time: clockInTime,
        clock_in_source: 'phone',
        clock_in_location: null,
        clock_out_time: null,
        clock_out_source: 'phone',
        clock_out_location: null,
        is_tardy: true,
        tardiness_minutes: 30,
        office_location_id: null,
        override_reason: null,
        override_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.attendance.create.mockResolvedValue(mockAttendance);
      eventBus.publish.mockResolvedValue(undefined);

      const result = await service.recordClockIn(employeeId, clockInTime);

      expect(result.is_tardy).toBe(true);
      expect(result.tardiness_minutes).toBe(30);

      // Should emit both clock-in and tardiness events (Requirement 2.4)
      expect(eventBus.publish).toHaveBeenCalledTimes(2);

      // Verify clock-in event
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.clock_in',
          payload: expect.objectContaining({
            is_tardy: true,
            tardiness_minutes: 30,
          }),
        })
      );

      // Verify tardiness event (triggers Late_Report_Agent)
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.tardiness_detected',
          payload: expect.objectContaining({
            employee_id: employeeId,
            tardiness_minutes: 30,
            threshold: '09:00',
          }),
        })
      );
    });

    test('should support different clock-in sources', async () => {
      const employeeId = 'emp-789';
      // 08:30 UTC - before 09:00 threshold
      const clockInTime = new Date('2025-01-15T08:30:00Z');

      prisma.systemSettings.findUnique.mockResolvedValue(null);

      const mockAttendance = {
        id: 'att-3',
        employee_id: employeeId,
        attendance_date: new Date('2025-01-15T00:00:00Z'),
        clock_in_time: clockInTime,
        clock_in_source: 'aws',
        clock_in_location: null,
        clock_out_time: null,
        clock_out_source: 'phone',
        clock_out_location: null,
        is_tardy: false,
        tardiness_minutes: 0,
        office_location_id: null,
        override_reason: null,
        override_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.attendance.create.mockResolvedValue(mockAttendance);
      eventBus.publish.mockResolvedValue(undefined);

      const result = await service.recordClockIn(
        employeeId,
        clockInTime,
        'aws'
      );

      expect(result.clock_in_source).toBe('aws');
      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clock_in_source: 'aws',
        }),
      });
    });
  });

  describe('recordClockOut', () => {
    test('should update attendance record with clock-out time', async () => {
      const employeeId = 'emp-123';
      const clockOutTime = new Date('2025-01-15T17:00:00Z');
      const attendanceDate = new Date('2025-01-15T00:00:00Z');

      const existingAttendance = {
        id: 'att-1',
        employee_id: employeeId,
        attendance_date: attendanceDate,
        clock_in_time: new Date('2025-01-15T08:45:00Z'),
        clock_in_source: 'phone',
        clock_in_location: null,
        clock_out_time: null,
        clock_out_source: 'phone',
        clock_out_location: null,
        is_tardy: false,
        tardiness_minutes: 0,
        office_location_id: null,
        override_reason: null,
        override_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.attendance.findUnique.mockResolvedValue(existingAttendance);

      const updatedAttendance = {
        ...existingAttendance,
        clock_out_time: clockOutTime,
        clock_out_source: 'phone',
        updated_at: new Date(),
      };

      prisma.attendance.update.mockResolvedValue(updatedAttendance);
      eventBus.publish.mockResolvedValue(undefined);

      const result = await service.recordClockOut(employeeId, clockOutTime);

      expect(result.clock_out_time).toEqual(clockOutTime);
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: existingAttendance.id },
        data: expect.objectContaining({
          clock_out_time: clockOutTime,
          clock_out_source: 'phone',
        }),
      });

      // Should emit clock-out event
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.clock_out',
          payload: expect.objectContaining({
            employee_id: employeeId,
          }),
        })
      );
    });

    test('should throw error when no clock-in record exists', async () => {
      const employeeId = 'emp-999';
      const clockOutTime = new Date('2025-01-15T17:00:00Z');

      prisma.attendance.findUnique.mockResolvedValue(null);

      await expect(
        service.recordClockOut(employeeId, clockOutTime)
      ).rejects.toThrow('No clock-in record found');
    });
  });

  describe('getTardyEmployeesForDate', () => {
    test('should return all tardy employees for a specific date', async () => {
      const testDate = new Date('2025-01-15T00:00:00Z');

      const mockTardyAttendances = [
        {
          id: 'att-1',
          employee_id: 'emp-1',
          attendance_date: testDate,
          clock_in_time: new Date('2025-01-15T09:15:00Z'),
          is_tardy: true,
          tardiness_minutes: 15,
          employee: {
            id: 'emp-1',
            full_name: 'John Doe',
            employee_code: 'EMP001',
          },
        },
        {
          id: 'att-2',
          employee_id: 'emp-2',
          attendance_date: testDate,
          clock_in_time: new Date('2025-01-15T09:30:00Z'),
          is_tardy: true,
          tardiness_minutes: 30,
          employee: {
            id: 'emp-2',
            full_name: 'Jane Smith',
            employee_code: 'EMP002',
          },
        },
      ];

      prisma.attendance.findMany.mockResolvedValue(mockTardyAttendances as any);

      const result = await service.getTardyEmployeesForDate(testDate);

      expect(result).toHaveLength(2);
      expect(result[0].employee.full_name).toBe('John Doe');
      expect(result[1].tardiness_minutes).toBe(30);
      
      // Check that findMany was called (don't check exact date due to timezone normalization)
      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_tardy: true,
          }),
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
        })
      );
    });

    test('should return empty array when no tardy employees', async () => {
      const testDate = new Date('2025-01-15T00:00:00Z');

      prisma.attendance.findMany.mockResolvedValue([]);

      const result = await service.getTardyEmployeesForDate(testDate);

      expect(result).toHaveLength(0);
    });
  });
});
