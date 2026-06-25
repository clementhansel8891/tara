import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AbsensiAgent } from './absensi.agent';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from '../services/event-bus.service';
import { TaraAttendanceService } from '../services/tara-attendance.service';

describe('AbsensiAgent', () => {
  let agent: AbsensiAgent;
  let prismaService: any;
  let eventBusService: any;
  let attendanceService: any;

  beforeEach(() => {
    const mockPrismaService = {
      employee: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      attendance: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      eventBusLog: {
        count: vi.fn(),
      },
    };

    const mockEventBusService = {
      emit: vi.fn().mockResolvedValue({ id: 'event-id' }),
    };

    const mockAttendanceService = {
      recordClockIn: vi.fn(),
      recordClockOut: vi.fn(),
      getRealtimeAttendanceStatus: vi.fn(),
    };

    prismaService = mockPrismaService;
    eventBusService = mockEventBusService;
    attendanceService = mockAttendanceService;

    agent = new AbsensiAgent(
      prismaService as PrismaService,
      eventBusService as EventBusService,
      attendanceService as TaraAttendanceService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processClockIn', () => {
    it('should process clock-in successfully and emit events', async () => {
      // Arrange
      const employeeId = 'employee-123';
      const timestamp = new Date('2024-01-15T08:30:00Z');
      const gpsLatitude = -6.2088;
      const gpsLongitude = 106.8456;
      const biometricVerified = true;
      const attendanceSource = 'phone';

      const mockAttendanceRecord = {
        id: 'attendance-123',
        employee_id: employeeId,
        attendance_date: new Date('2024-01-15'),
        clock_in_time: timestamp,
        is_tardy: false,
        tardiness_minutes: 0,
      };

      const mockEmployee = {
        id: employeeId,
        full_name: 'John Doe',
        email: 'john.doe@example.com',
      };

      attendanceService.recordClockIn.mockResolvedValue(mockAttendanceRecord);
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee as any);

      // Act
      const result = await agent.processClockIn(
        employeeId,
        timestamp,
        gpsLatitude,
        gpsLongitude,
        biometricVerified,
        attendanceSource,
      );

      // Assert
      expect(result).toEqual(mockAttendanceRecord);
      expect(attendanceService.recordClockIn).toHaveBeenCalledWith(
        employeeId,
        timestamp,
        gpsLatitude,
        gpsLongitude,
        biometricVerified,
        attendanceSource,
      );

      // Verify Clock_Confirmation_Agent event was triggered
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.confirmation_required',
          actor: expect.objectContaining({
            id: 'absensi_agent',
            type: 'agent',
          }),
          payload: expect.objectContaining({
            employee_id: employeeId,
            employee_name: 'John Doe',
            action_type: 'clock_in',
            is_tardy: false,
          }),
        }),
      );
    });

    it('should handle clock-in with tardiness', async () => {
      // Arrange
      const employeeId = 'employee-123';
      const timestamp = new Date('2024-01-15T09:15:00Z'); // Late
      const gpsLatitude = -6.2088;
      const gpsLongitude = 106.8456;

      const mockAttendanceRecord = {
        id: 'attendance-123',
        employee_id: employeeId,
        attendance_date: new Date('2024-01-15'),
        clock_in_time: timestamp,
        is_tardy: true,
        tardiness_minutes: 15,
      };

      const mockEmployee = {
        id: employeeId,
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      attendanceService.recordClockIn.mockResolvedValue(mockAttendanceRecord);
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee as any);

      // Act
      const result = await agent.processClockIn(
        employeeId,
        timestamp,
        gpsLatitude,
        gpsLongitude,
        true,
        'phone',
      );

      // Assert
      expect(result.is_tardy).toBe(true);
      expect(result.tardiness_minutes).toBe(15);

      // Verify confirmation event includes tardiness info
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            is_tardy: true,
            tardiness_minutes: 15,
          }),
        }),
      );
    });

    it('should throw error when clock-in fails', async () => {
      // Arrange
      const employeeId = 'employee-123';
      const timestamp = new Date();
      const error = new Error('Geo-fence validation failed');

      attendanceService.recordClockIn.mockRejectedValue(error);

      // Act & Assert
      await expect(
        agent.processClockIn(employeeId, timestamp, -6.2088, 106.8456, true),
      ).rejects.toThrow('Geo-fence validation failed');
    });
  });

  describe('processClockOut', () => {
    it('should process clock-out successfully and emit events', async () => {
      // Arrange
      const employeeId = 'employee-123';
      const timestamp = new Date('2024-01-15T17:30:00Z');
      const gpsLatitude = -6.2088;
      const gpsLongitude = 106.8456;
      const attendanceSource = 'phone';

      const mockAttendanceRecord = {
        id: 'attendance-123',
        employee_id: employeeId,
        attendance_date: new Date('2024-01-15'),
        clock_in_time: new Date('2024-01-15T08:30:00Z'),
        clock_out_time: timestamp,
        is_tardy: false,
      };

      const mockEmployee = {
        id: employeeId,
        full_name: 'John Doe',
        email: 'john.doe@example.com',
      };

      attendanceService.recordClockOut.mockResolvedValue(mockAttendanceRecord);
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee as any);

      // Act
      const result = await agent.processClockOut(
        employeeId,
        timestamp,
        gpsLatitude,
        gpsLongitude,
        attendanceSource,
      );

      // Assert
      expect(result).toEqual(mockAttendanceRecord);
      expect(attendanceService.recordClockOut).toHaveBeenCalledWith(
        employeeId,
        timestamp,
        gpsLatitude,
        gpsLongitude,
        attendanceSource,
      );

      // Verify Clock_Confirmation_Agent event was triggered
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.confirmation_required',
          actor: expect.objectContaining({
            id: 'absensi_agent',
            type: 'agent',
          }),
          payload: expect.objectContaining({
            employee_id: employeeId,
            action_type: 'clock_out',
          }),
        }),
      );
    });
  });

  describe('getRealtimeAttendanceStatus', () => {
    it('should return real-time attendance status', async () => {
      // Arrange
      const today = new Date('2024-01-15');
      today.setHours(0, 0, 0, 0);

      const mockEmployees = [
        { id: '1', full_name: 'Employee 1', email: 'emp1@test.com', department_id: 'dept-1' },
        { id: '2', full_name: 'Employee 2', email: 'emp2@test.com', department_id: 'dept-1' },
        { id: '3', full_name: 'Employee 3', email: 'emp3@test.com', department_id: 'dept-2' },
      ];

      const mockAttendanceRecords = [
        {
          id: 'att-1',
          employee_id: '1',
          clock_in_time: new Date('2024-01-15T08:00:00Z'),
          clock_out_time: null,
          is_tardy: false,
        },
        {
          id: 'att-2',
          employee_id: '2',
          clock_in_time: new Date('2024-01-15T09:15:00Z'),
          clock_out_time: new Date('2024-01-15T17:00:00Z'),
          is_tardy: true,
        },
      ];

      prismaService.employee.findMany.mockResolvedValue(mockEmployees as any);
      attendanceService.getRealtimeAttendanceStatus.mockResolvedValue(
        mockAttendanceRecords as any,
      );

      // Act
      const result = await agent.getRealtimeAttendanceStatus(today);

      // Assert
      expect(result).toMatchObject({
        total_employees: 3,
        clocked_in: 2,
        clocked_out: 1,
        tardy: 1,
        absent: 1,
      });
      expect(result.attendance_records).toHaveLength(2);
    });
  });

  describe('checkMissingClockOuts', () => {
    it('should detect missing clock-outs and emit event', async () => {
      // Arrange
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockMissingClockOuts = [
        {
          id: 'att-1',
          employee_id: 'emp-1',
          clock_in_time: new Date(),
          clock_out_time: null,
          employee: {
            id: 'emp-1',
            full_name: 'John Doe',
            email: 'john@test.com',
          },
        },
        {
          id: 'att-2',
          employee_id: 'emp-2',
          clock_in_time: new Date(),
          clock_out_time: null,
          employee: {
            id: 'emp-2',
            full_name: 'Jane Smith',
            email: 'jane@test.com',
          },
        },
      ];

      prismaService.attendance.findMany.mockResolvedValue(
        mockMissingClockOuts as any,
      );

      // Act
      await agent.checkMissingClockOuts();

      // Assert
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.missing_clock_out_detected',
          payload: expect.objectContaining({
            count: 2,
            employees: expect.arrayContaining([
              expect.objectContaining({
                employee_name: 'John Doe',
              }),
              expect.objectContaining({
                employee_name: 'Jane Smith',
              }),
            ]),
          }),
        }),
      );
    });

    it('should not emit event when no missing clock-outs', async () => {
      // Arrange
      prismaService.attendance.findMany.mockResolvedValue([]);

      // Act
      await agent.checkMissingClockOuts();

      // Assert
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });
  });

  describe('generateDailyAttendanceSummary', () => {
    it('should generate daily summary and emit event', async () => {
      // Arrange
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockEmployees = [
        { id: '1', full_name: 'Emp 1', email: 'emp1@test.com', department_id: 'dept-1' },
        { id: '2', full_name: 'Emp 2', email: 'emp2@test.com', department_id: 'dept-1' },
      ];

      const mockAttendanceRecords = [
        {
          id: 'att-1',
          clock_in_time: new Date(),
          clock_out_time: new Date(),
          is_tardy: false,
        },
      ];

      prismaService.employee.findMany.mockResolvedValue(mockEmployees as any);
      attendanceService.getRealtimeAttendanceStatus.mockResolvedValue(
        mockAttendanceRecords as any,
      );

      // Act
      await agent.generateDailyAttendanceSummary();

      // Assert
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.daily_summary',
          payload: expect.objectContaining({
            summary: expect.objectContaining({
              total_employees: 2,
              clocked_in: 1,
            }),
          }),
          metadata: expect.objectContaining({
            summary_type: 'daily',
            for_agents: expect.arrayContaining([
              'late_report_agent',
              'weekly_checkin_agent',
            ]),
          }),
        }),
      );
    });
  });

  describe('getAttendanceStatistics', () => {
    it('should calculate attendance statistics correctly', async () => {
      // Arrange
      const startDate = new Date('2024-01-15'); // Monday
      const endDate = new Date('2024-01-19'); // Friday
      const employeeId = 'employee-123';

      const mockAttendanceRecords = [
        {
          attendance_date: new Date('2024-01-15'),
          clock_in_time: new Date(),
          is_tardy: false,
        },
        {
          attendance_date: new Date('2024-01-16'),
          clock_in_time: new Date(),
          is_tardy: true,
        },
        {
          attendance_date: new Date('2024-01-17'),
          clock_in_time: new Date(),
          is_tardy: false,
        },
      ];

      prismaService.attendance.findMany.mockResolvedValue(
        mockAttendanceRecords as any,
      );

      // Act
      const result = await agent.getAttendanceStatistics(
        startDate,
        endDate,
        employeeId,
      );

      // Assert
      expect(result).toMatchObject({
        total_days: 5, // 5 working days
        present_days: 3,
        tardy_days: 1,
        absent_days: 2,
        attendance_rate: 60, // 3/5 * 100
        punctuality_rate: 66.67, // (3-1)/3 * 100
      });
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status with metrics', async () => {
      // Arrange
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockAttendanceRecords = [
        { clock_in_time: new Date(), clock_out_time: null, is_tardy: false },
        { clock_in_time: new Date(), clock_out_time: new Date(), is_tardy: true },
      ];

      prismaService.attendance.findMany.mockResolvedValue(
        mockAttendanceRecords as any,
      );
      prismaService.eventBusLog.count.mockResolvedValue(5);

      // Act
      const result = await agent.getHealthStatus();

      // Assert
      expect(result).toMatchObject({
        agent_name: 'Absensi_Agent',
        status: 'healthy',
        metrics: {
          total_clock_ins_today: 2,
          total_clock_outs_today: 1,
          tardy_today: 1,
          events_emitted_today: 5,
        },
      });
    });

    it('should return unhealthy status on error', async () => {
      // Arrange
      prismaService.attendance.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act
      const result = await agent.getHealthStatus();

      // Assert
      expect(result).toMatchObject({
        agent_name: 'Absensi_Agent',
        status: 'unhealthy',
      });
    });
  });
});
