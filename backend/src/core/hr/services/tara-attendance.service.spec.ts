import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TaraAttendanceService } from './tara-attendance.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { GeoService } from './geo.service';
import { EventBusService } from './event-bus.service';

describe('TaraAttendanceService', () => {
  let service: TaraAttendanceService;
  let prismaService: jest.Mocked<PrismaService>;
  let geoService: jest.Mocked<GeoService>;
  let eventBusService: jest.Mocked<EventBusService>;

  const mockEmployee = {
    id: 'emp-123',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    employment_status: 'active',
  };

  const mockOfficeLocation = {
    id: 'office-123',
    location_name: 'Jakarta HQ',
    address: 'Jl. Sudirman No. 1',
    latitude: -6.2088,
    longitude: 106.8456,
    geofence_radius_meters: 200,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAttendance = {
    id: 'att-123',
    employee_id: 'emp-123',
    attendance_date: new Date('2024-01-15'),
    clock_in_time: new Date('2024-01-15T08:30:00Z'),
    clock_in_location: null,
    clock_in_source: 'phone',
    clock_out_time: null,
    clock_out_location: null,
    clock_out_source: 'phone',
    is_tardy: false,
    tardiness_minutes: 0,
    office_location_id: 'office-123',
    override_reason: null,
    override_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      $transaction: jest.fn(),
      employee: {
        findUnique: jest.fn(),
      },
      officeLocation: {
        findFirst: jest.fn(),
      },
      attendance: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      systemSettings: {
        findUnique: jest.fn(),
      },
      $executeRawUnsafe: jest.fn(),
    };

    const mockGeo = {
      calculateHaversineDistance: jest.fn(),
      validateGeoFence: jest.fn(),
    };

    const mockEventBus = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaraAttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeoService, useValue: mockGeo },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<TaraAttendanceService>(TaraAttendanceService);
    prismaService = module.get(PrismaService);
    geoService = module.get(GeoService);
    eventBusService = module.get(EventBusService);
  });

  describe('recordClockIn', () => {
    it('should successfully record clock-in when within geo-fence', async () => {
      const clockInTime = new Date('2024-01-15T08:30:00Z');
      const gpsLat = -6.2085;
      const gpsLon = 106.8450;

      // Mock transaction
      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(mockEmployee),
        },
        officeLocation: {
          findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
        },
        attendance: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        systemSettings: {
          findUnique: jest.fn().mockResolvedValue(null), // Use default 09:00
        },
        $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      };

      // Mock second findUnique call to return the created attendance
      mockTx.attendance.findUnique
        .mockResolvedValueOnce(null) // First call: no existing attendance
        .mockResolvedValueOnce(mockAttendance); // Second call: return created attendance

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      geoService.calculateHaversineDistance.mockReturnValue(50); // Within 200m fence

      eventBusService.emit.mockResolvedValue(undefined);

      const result = await service.recordClockIn(
        'emp-123',
        clockInTime,
        gpsLat,
        gpsLon,
        true,
        'phone',
      );

      expect(result).toBeDefined();
      expect(mockTx.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-123' },
        select: {
          id: true,
          full_name: true,
          email: true,
          employment_status: true,
        },
      });
      expect(geoService.calculateHaversineDistance).toHaveBeenCalled();
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.clock_in',
          actor: { id: 'emp-123', type: 'employee' },
        }),
      );
    });

    it('should reject clock-in when outside geo-fence', async () => {
      const clockInTime = new Date('2024-01-15T08:30:00Z');
      const gpsLat = -6.3000; // Far from office
      const gpsLon = 106.9000;

      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(mockEmployee),
        },
        officeLocation: {
          findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      geoService.calculateHaversineDistance.mockReturnValue(15000); // 15km away

      await expect(
        service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect tardiness when clock-in after 09:00 WIB', async () => {
      const lateClockInTime = new Date('2024-01-15T02:15:00Z'); // 09:15 WIB (UTC+7)
      const gpsLat = -6.2085;
      const gpsLon = 106.8450;

      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(mockEmployee),
        },
        officeLocation: {
          findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
        },
        attendance: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        systemSettings: {
          findUnique: jest.fn().mockResolvedValue(null), // Use default 09:00
        },
        $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      };

      const tardyAttendance = { ...mockAttendance, is_tardy: true, tardiness_minutes: 15 };
      mockTx.attendance.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(tardyAttendance);

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      geoService.calculateHaversineDistance.mockReturnValue(50);
      eventBusService.emit.mockResolvedValue(undefined);

      await service.recordClockIn('emp-123', lateClockInTime, gpsLat, gpsLon, true, 'phone');

      // Should emit both clock_in and tardiness_detected events
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.clock_in',
        }),
      );
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.tardiness_detected',
        }),
      );
    });

    it('should reject duplicate clock-in for the same day', async () => {
      const clockInTime = new Date('2024-01-15T08:30:00Z');
      const gpsLat = -6.2085;
      const gpsLon = 106.8450;

      const existingAttendance = { ...mockAttendance };

      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(mockEmployee),
        },
        officeLocation: {
          findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
        },
        attendance: {
          findUnique: jest.fn().mockResolvedValue(existingAttendance),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      geoService.calculateHaversineDistance.mockReturnValue(50);

      await expect(
        service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject clock-in for inactive employee', async () => {
      const clockInTime = new Date('2024-01-15T08:30:00Z');
      const gpsLat = -6.2085;
      const gpsLon = 106.8450;

      const inactiveEmployee = { ...mockEmployee, employment_status: 'terminated' };

      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(inactiveEmployee),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await expect(
        service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordClockOut', () => {
    it('should successfully record clock-out when within geo-fence', async () => {
      const clockOutTime = new Date('2024-01-15T09:00:00Z'); // 17:00 WIB
      const gpsLat = -6.2085;
      const gpsLon = 106.8450;

      const existingAttendance = { ...mockAttendance, clock_out_time: null };

      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(mockEmployee),
        },
        officeLocation: {
          findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
        },
        attendance: {
          findUnique: jest.fn().mockResolvedValue(existingAttendance),
        },
        $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      };

      const clockedOutAttendance = { ...existingAttendance, clock_out_time: clockOutTime };
      mockTx.attendance.findUnique
        .mockResolvedValueOnce(existingAttendance)
        .mockResolvedValueOnce(clockedOutAttendance);

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      geoService.calculateHaversineDistance.mockReturnValue(50);
      eventBusService.emit.mockResolvedValue(undefined);

      const result = await service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone');

      expect(result).toBeDefined();
      expect(result.clock_out_time).toEqual(clockOutTime);
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.clock_out',
        }),
      );
    });

    it('should reject clock-out when no clock-in exists', async () => {
      const clockOutTime = new Date('2024-01-15T09:00:00Z');
      const gpsLat = -6.2085;
      const gpsLon = 106.8450;

      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(mockEmployee),
        },
        officeLocation: {
          findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
        },
        attendance: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      geoService.calculateHaversineDistance.mockReturnValue(50);

      await expect(
        service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate clock-out', async () => {
      const clockOutTime = new Date('2024-01-15T09:00:00Z');
      const gpsLat = -6.2085;
      const gpsLon = 106.8450;

      const existingAttendance = { ...mockAttendance, clock_out_time: new Date() };

      const mockTx = {
        employee: {
          findUnique: jest.fn().mockResolvedValue(mockEmployee),
        },
        officeLocation: {
          findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
        },
        attendance: {
          findUnique: jest.fn().mockResolvedValue(existingAttendance),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      geoService.calculateHaversineDistance.mockReturnValue(50);

      await expect(
        service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAttendanceHistory', () => {
    it('should return attendance history for an employee', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockHistory = [mockAttendance];
      prismaService.attendance.findMany.mockResolvedValue(mockHistory);

      const result = await service.getAttendanceHistory('emp-123', startDate, endDate);

      expect(result).toEqual(mockHistory);
      expect(prismaService.attendance.findMany).toHaveBeenCalledWith({
        where: {
          employee_id: 'emp-123',
          attendance_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          attendance_date: 'desc',
        },
        include: {
          employee: {
            select: {
              full_name: true,
              email: true,
            },
          },
          office_location: {
            select: {
              location_name: true,
              address: true,
            },
          },
        },
      });
    });
  });

  describe('getRealtimeAttendanceStatus', () => {
    it('should return real-time attendance status for all employees', async () => {
      const today = new Date('2024-01-15');
      today.setHours(0, 0, 0, 0);

      const mockStatus = [mockAttendance];
      prismaService.attendance.findMany.mockResolvedValue(mockStatus);

      const result = await service.getRealtimeAttendanceStatus(today);

      expect(result).toEqual(mockStatus);
      expect(prismaService.attendance.findMany).toHaveBeenCalledWith({
        where: {
          attendance_date: today,
          employee: {
            employment_status: 'active',
          },
        },
        include: {
          employee: {
            select: {
              full_name: true,
              email: true,
              department_id: true,
            },
          },
        },
        orderBy: {
          clock_in_time: 'asc',
        },
      });
    });
  });

  // Task 11.6: Unit tests for attendance recording
  describe('Task 11.6: Comprehensive Attendance Recording Tests', () => {
    describe('Geo-fence Validation During Clock-In', () => {
      it('should accept clock-in when exactly at geo-fence boundary', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockAttendance);

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        // Exactly at boundary (200m)
        geoService.calculateHaversineDistance.mockReturnValue(200);
        eventBusService.emit.mockResolvedValue(undefined);

        const result = await service.recordClockIn(
          'emp-123',
          clockInTime,
          gpsLat,
          gpsLon,
          true,
          'phone',
        );

        expect(result).toBeDefined();
        expect(geoService.calculateHaversineDistance).toHaveBeenCalled();
      });

      it('should reject clock-in when just outside geo-fence boundary', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.3000;
        const gpsLon = 106.9000;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
        };

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        // Just outside boundary (201m)
        geoService.calculateHaversineDistance.mockReturnValue(201);

        await expect(
          service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(/Clock-in rejected.*201m/);
      });

      it('should reject clock-in when no office location is configured', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(null), // No office configured
          },
        };

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        await expect(
          service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(/No active office location configured/);
      });

      it('should include detailed error message with distance and office name on rejection', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.3000;
        const gpsLon = 106.9000;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
        };

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(5000);

        await expect(
          service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(/5000m from Jakarta HQ.*within 200m/);
      });

      it('should validate geo-fence for AWS device clock-in', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ ...mockAttendance, clock_in_source: 'aws_device' });

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        const result = await service.recordClockIn(
          'emp-123',
          clockInTime,
          gpsLat,
          gpsLon,
          true,
          'aws_device',
        );

        expect(result).toBeDefined();
        expect(result.clock_in_source).toBe('aws_device');
      });
    });

    describe('Duplicate Clock-In Prevention', () => {
      it('should prevent duplicate clock-in on same date', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const existingAttendance = {
          ...mockAttendance,
          clock_in_time: new Date('2024-01-15T01:00:00Z'), // Earlier clock-in
        };

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(existingAttendance),
          },
        };

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);

        await expect(
          service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(/Clock-in already recorded for today/);
      });

      it('should enforce unique constraint on employee_id and attendance_date', async () => {
        const firstClockIn = new Date('2024-01-15T08:00:00Z');
        const secondClockIn = new Date('2024-01-15T09:00:00Z'); // Same day, different time

        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        // First clock-in succeeds
        const mockTx1 = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx1.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockAttendance);

        prismaService.$transaction.mockImplementationOnce(async (callback) => {
          return callback(mockTx1);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        await service.recordClockIn('emp-123', firstClockIn, gpsLat, gpsLon, true, 'phone');

        // Second clock-in on same day should fail
        const existingAttendance = { ...mockAttendance, clock_in_time: firstClockIn };

        const mockTx2 = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(existingAttendance),
          },
        };

        prismaService.$transaction.mockImplementationOnce(async (callback) => {
          return callback(mockTx2);
        });

        await expect(
          service.recordClockIn('emp-123', secondClockIn, gpsLat, gpsLon, true, 'phone'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should allow clock-in on different dates for same employee', async () => {
        const day1ClockIn = new Date('2024-01-15T08:30:00Z');
        const day2ClockIn = new Date('2024-01-16T08:30:00Z'); // Next day

        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        // Day 1 clock-in
        const mockTx1 = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx1.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockAttendance);

        // Day 2 clock-in
        const mockTx2 = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        const day2Attendance = { ...mockAttendance, attendance_date: new Date('2024-01-16') };
        mockTx2.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(day2Attendance);

        prismaService.$transaction
          .mockImplementationOnce(async (callback) => callback(mockTx1))
          .mockImplementationOnce(async (callback) => callback(mockTx2));

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        const result1 = await service.recordClockIn('emp-123', day1ClockIn, gpsLat, gpsLon, true, 'phone');
        const result2 = await service.recordClockIn('emp-123', day2ClockIn, gpsLat, gpsLon, true, 'phone');

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
      });
    });

    describe('Clock-Out Without Clock-In Rejection', () => {
      it('should reject clock-out when no clock-in exists for the day', async () => {
        const clockOutTime = new Date('2024-01-15T09:00:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null), // No record at all
          },
        };

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);

        await expect(
          service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone'),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone'),
        ).rejects.toThrow(/No clock-in record found/);
      });

      it('should reject clock-out when attendance record exists but clock_in_time is null', async () => {
        const clockOutTime = new Date('2024-01-15T09:00:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const incompleteAttendance = { ...mockAttendance, clock_in_time: null };

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(incompleteAttendance),
          },
        };

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);

        await expect(
          service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone'),
        ).rejects.toThrow(/No clock-in record found/);
      });

      it('should reject duplicate clock-out for the same day', async () => {
        const clockOutTime = new Date('2024-01-15T09:00:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const existingAttendance = {
          ...mockAttendance,
          clock_in_time: new Date('2024-01-15T01:00:00Z'),
          clock_out_time: new Date('2024-01-15T08:00:00Z'), // Already clocked out
        };

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(existingAttendance),
          },
        };

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);

        await expect(
          service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone'),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone'),
        ).rejects.toThrow(/Clock-out already recorded for today/);
      });

      it('should successfully clock-out after valid clock-in', async () => {
        const clockOutTime = new Date('2024-01-15T09:00:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const existingAttendance = {
          ...mockAttendance,
          clock_in_time: new Date('2024-01-15T01:00:00Z'),
          clock_out_time: null, // Not yet clocked out
        };

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(existingAttendance),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        const clockedOutAttendance = { ...existingAttendance, clock_out_time: clockOutTime };
        mockTx.attendance.findUnique
          .mockResolvedValueOnce(existingAttendance)
          .mockResolvedValueOnce(clockedOutAttendance);

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        const result = await service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone');

        expect(result).toBeDefined();
        expect(result.clock_out_time).toEqual(clockOutTime);
      });
    });

    describe('GPS Coordinate Storage in PostGIS Format', () => {
      it('should store clock-in GPS coordinates in PostGIS GEOGRAPHY format', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockAttendance);

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        await service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone');

        // Verify PostGIS format: POINT(longitude latitude) - note the order!
        expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('ST_GeogFromText'),
          'emp-123',
          expect.any(Date),
          clockInTime,
          `POINT(${gpsLon} ${gpsLat})`, // Longitude first, then latitude
          'phone',
          false,
          0,
          'office-123',
        );
      });

      it('should store clock-out GPS coordinates in PostGIS GEOGRAPHY format', async () => {
        const clockOutTime = new Date('2024-01-15T09:00:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const existingAttendance = {
          ...mockAttendance,
          clock_in_time: new Date('2024-01-15T01:00:00Z'),
          clock_out_time: null,
        };

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(existingAttendance),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        const clockedOutAttendance = { ...existingAttendance, clock_out_time: clockOutTime };
        mockTx.attendance.findUnique
          .mockResolvedValueOnce(existingAttendance)
          .mockResolvedValueOnce(clockedOutAttendance);

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        await service.recordClockOut('emp-123', clockOutTime, gpsLat, gpsLon, 'phone');

        // Verify PostGIS format in UPDATE statement
        expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('ST_GeogFromText'),
          clockOutTime,
          `POINT(${gpsLon} ${gpsLat})`, // Longitude first, then latitude
          'phone',
          'emp-123',
          expect.any(Date),
        );
      });

      it('should handle GPS coordinates with high precision', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        // High precision coordinates (8 decimal places)
        const gpsLat = -6.20851234;
        const gpsLon = 106.84567890;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockAttendance);

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        await service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone');

        // Verify high precision is preserved
        expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith(
          expect.any(String),
          'emp-123',
          expect.any(Date),
          clockInTime,
          `POINT(${gpsLon} ${gpsLat})`, // Full precision preserved
          'phone',
          false,
          0,
          'office-123',
        );
      });

      it('should handle GPS coordinates at extreme locations (equator, prime meridian)', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        // Coordinates near equator and prime meridian
        const gpsLat = 0.0;
        const gpsLon = 0.0;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockAttendance);

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        await service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone');

        // Verify zero coordinates are handled correctly
        expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith(
          expect.any(String),
          'emp-123',
          expect.any(Date),
          clockInTime,
          'POINT(0 0)',
          'phone',
          false,
          0,
          'office-123',
        );
      });

      it('should include GPS coordinates in emitted events', async () => {
        const clockInTime = new Date('2024-01-15T08:30:00Z');
        const gpsLat = -6.2085;
        const gpsLon = 106.8450;

        const mockTx = {
          employee: {
            findUnique: jest.fn().mockResolvedValue(mockEmployee),
          },
          officeLocation: {
            findFirst: jest.fn().mockResolvedValue(mockOfficeLocation),
          },
          attendance: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          systemSettings: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        };

        mockTx.attendance.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockAttendance);

        prismaService.$transaction.mockImplementation(async (callback) => {
          return callback(mockTx);
        });

        geoService.calculateHaversineDistance.mockReturnValue(50);
        eventBusService.emit.mockResolvedValue(undefined);

        await service.recordClockIn('emp-123', clockInTime, gpsLat, gpsLon, true, 'phone');

        // Verify GPS coordinates are included in event payload
        expect(eventBusService.emit).toHaveBeenCalledWith(
          expect.objectContaining({
            event_type: 'attendance.clock_in',
            payload: expect.objectContaining({
              gps_coordinates: {
                latitude: gpsLat,
                longitude: gpsLon,
              },
            }),
          }),
        );
      });
    });
  });
});
