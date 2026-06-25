import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { TaraEmployeeService } from './tara-employee.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from '../../../shared/events/event-bus.service';

/**
 * Property-Based Tests for Tardiness Detection
 * 
 * Task 11.5: Write property test for tardiness detection
 * 
 * **Property 5: Tardiness Detection Accuracy**
 * **Validates: Requirements 2.3**
 * 
 * This test validates that tardiness flag is set correctly based on threshold
 * using property-based testing with fast-check to generate clock-in times before/after threshold.
 * 
 * The property being tested:
 * - IF clock-in time <= threshold, THEN is_tardy = false AND tardiness_minutes = 0
 * - IF clock-in time > threshold, THEN is_tardy = true AND tardiness_minutes = (clock_in - threshold)
 * - Tardiness calculation is always accurate to the minute
 */

describe('Property 5: Tardiness Detection Accuracy', () => {
  let service: TaraEmployeeService;
  let mockPrismaService: any;
  let mockEventBusService: any;

  /**
   * Arbitraries for generating test data
   */

  // Generate valid hour for clock-in (typically 6:00 - 12:00 for office arrival)
  const hourArb = fc.integer({ min: 6, max: 12 });

  // Generate valid minute (0-59)
  const minuteArb = fc.integer({ min: 0, max: 59 });

  // Generate threshold time string in HH:mm format
  const thresholdTimeArb = fc.record({
    hour: fc.integer({ min: 7, max: 10 }), // Typical office hours: 7am-10am
    minute: fc.integer({ min: 0, max: 59 }),
  }).map((time) => {
    const hour = time.hour.toString().padStart(2, '0');
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  });

  // Generate date for testing (uses a fixed year/month/day, varies time)
  const dateArb = fc.record({
    hour: hourArb,
    minute: minuteArb,
    second: fc.integer({ min: 0, max: 59 }),
  }).map((time) => {
    const date = new Date('2025-01-15T00:00:00Z');
    date.setUTCHours(time.hour, time.minute, time.second, 0);
    return date;
  });

  // Generate employee ID
  const employeeIdArb = fc.uuid();

  beforeEach(() => {
    // Create mock Prisma service
    mockPrismaService = {
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

    // Create mock Event Bus service
    mockEventBusService = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    // Create service with mocked dependencies
    service = new TaraEmployeeService(
      mockPrismaService as unknown as PrismaService,
      mockEventBusService as unknown as EventBusService,
    );
  });

  /**
   * Core Property: Clock-in before threshold should never be marked as tardy
   * 
   * This property generates random clock-in times before the threshold and verifies
   * that they are never marked as tardy and have 0 tardiness minutes.
   */
  it('should never mark clock-in before threshold as tardy', async () => {
    await fc.assert(
      fc.asyncProperty(
        thresholdTimeArb,
        fc.integer({ min: 1, max: 120 }), // Minutes before threshold (1-120 minutes)
        employeeIdArb,
        async (threshold, minutesBefore, employeeId) => {
          // Reset mocks before each test run
          mockEventBusService.publish.mockClear();
          
          // Parse threshold
          const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);

          // Create clock-in time before threshold
          const clockInTime = new Date('2025-01-15T00:00:00Z');
          clockInTime.setUTCHours(thresholdHour, thresholdMinute - minutesBefore, 0, 0);

          // Setup mocks
          mockPrismaService.systemSettings.findUnique.mockResolvedValue({
            setting_key: 'tardiness_threshold',
            setting_value: threshold,
          });

          const mockAttendance = {
            id: 'att-test',
            employee_id: employeeId,
            attendance_date: new Date('2025-01-15T00:00:00Z'),
            clock_in_time: clockInTime,
            clock_in_source: 'phone',
            is_tardy: false,
            tardiness_minutes: 0,
          };

          mockPrismaService.attendance.create.mockResolvedValue(mockAttendance);

          // Execute
          const result = await service.recordClockIn(employeeId, clockInTime);

          // Property: clock-in before threshold should NOT be tardy
          expect(result.is_tardy).toBe(false);
          expect(result.tardiness_minutes).toBe(0);

          // Should only emit clock-in event, not tardiness event
          expect(mockEventBusService.publish).toHaveBeenCalledTimes(1);
          expect(mockEventBusService.publish).toHaveBeenCalledWith(
            expect.objectContaining({
              event_type: 'attendance.clock_in',
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Core Property: Clock-in after threshold should always be marked as tardy
   * 
   * This property generates random clock-in times after the threshold and verifies
   * that they are marked as tardy with correct tardiness minutes.
   */
  it('should always mark clock-in after threshold as tardy with correct minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        thresholdTimeArb,
        fc.integer({ min: 1, max: 120 }), // Minutes after threshold (1-120 minutes)
        employeeIdArb,
        async (threshold, minutesAfter, employeeId) => {
          // Reset mocks before each test run
          mockEventBusService.publish.mockClear();
          
          // Parse threshold
          const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);

          // Create clock-in time after threshold
          const clockInTime = new Date('2025-01-15T00:00:00Z');
          clockInTime.setUTCHours(thresholdHour, thresholdMinute + minutesAfter, 0, 0);

          // Setup mocks
          mockPrismaService.systemSettings.findUnique.mockResolvedValue({
            setting_key: 'tardiness_threshold',
            setting_value: threshold,
          });

          const mockAttendance = {
            id: 'att-test',
            employee_id: employeeId,
            attendance_date: new Date('2025-01-15T00:00:00Z'),
            clock_in_time: clockInTime,
            clock_in_source: 'phone',
            is_tardy: true,
            tardiness_minutes: minutesAfter,
          };

          mockPrismaService.attendance.create.mockResolvedValue(mockAttendance);

          // Execute
          const result = await service.recordClockIn(employeeId, clockInTime);

          // Property: clock-in after threshold MUST be tardy
          expect(result.is_tardy).toBe(true);
          expect(result.tardiness_minutes).toBe(minutesAfter);

          // Should emit both clock-in and tardiness events (Requirement 2.4)
          expect(mockEventBusService.publish).toHaveBeenCalledTimes(2);

          // Verify clock-in event
          expect(mockEventBusService.publish).toHaveBeenCalledWith(
            expect.objectContaining({
              event_type: 'attendance.clock_in',
              payload: expect.objectContaining({
                is_tardy: true,
                tardiness_minutes: minutesAfter,
              }),
            })
          );

          // Verify tardiness event
          expect(mockEventBusService.publish).toHaveBeenCalledWith(
            expect.objectContaining({
              event_type: 'attendance.tardiness_detected',
              payload: expect.objectContaining({
                employee_id: employeeId,
                tardiness_minutes: minutesAfter,
                threshold: threshold,
              }),
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Core Property: Clock-in exactly at threshold should not be marked as tardy
   * 
   * Edge case: arrival exactly at the threshold time should be considered on-time.
   */
  it('should not mark clock-in exactly at threshold as tardy', async () => {
    await fc.assert(
      fc.asyncProperty(
        thresholdTimeArb,
        employeeIdArb,
        async (threshold, employeeId) => {
          // Parse threshold
          const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);

          // Create clock-in time exactly at threshold
          const clockInTime = new Date('2025-01-15T00:00:00Z');
          clockInTime.setUTCHours(thresholdHour, thresholdMinute, 0, 0);

          // Setup mocks
          mockPrismaService.systemSettings.findUnique.mockResolvedValue({
            setting_key: 'tardiness_threshold',
            setting_value: threshold,
          });

          const mockAttendance = {
            id: 'att-test',
            employee_id: employeeId,
            attendance_date: new Date('2025-01-15T00:00:00Z'),
            clock_in_time: clockInTime,
            clock_in_source: 'phone',
            is_tardy: false,
            tardiness_minutes: 0,
          };

          mockPrismaService.attendance.create.mockResolvedValue(mockAttendance);

          // Execute
          const result = await service.recordClockIn(employeeId, clockInTime);

          // Property: exact threshold time is NOT tardy
          expect(result.is_tardy).toBe(false);
          expect(result.tardiness_minutes).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Tardiness minutes calculation is accurate
   * 
   * The calculated tardiness minutes should match the actual time difference
   * between clock-in and threshold (only when tardy).
   */
  it('should calculate exact tardiness minutes correctly', () => {
    fc.assert(
      fc.property(
        thresholdTimeArb,
        dateArb,
        (threshold, clockInTime) => {
          // Calculate tardiness using service method
          const tardinessMinutes = service.calculateTardinessMinutes(
            clockInTime,
            threshold
          );

          // Manually calculate expected tardiness
          const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);
          const thresholdDate = new Date(clockInTime);
          thresholdDate.setUTCHours(thresholdHour, thresholdMinute, 0, 0);

          const diffMs = clockInTime.getTime() - thresholdDate.getTime();
          const expectedMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

          // Property: calculated tardiness must match expected
          expect(tardinessMinutes).toBe(expectedMinutes);

          // Property: non-negative
          expect(tardinessMinutes).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * Property: Tardiness calculation is deterministic
   * 
   * Calling calculateTardinessMinutes multiple times with same inputs
   * should always produce the same result.
   */
  it('should return consistent tardiness calculation for same inputs', () => {
    fc.assert(
      fc.property(thresholdTimeArb, dateArb, (threshold, clockInTime) => {
        // Calculate twice
        const result1 = service.calculateTardinessMinutes(clockInTime, threshold);
        const result2 = service.calculateTardinessMinutes(clockInTime, threshold);

        // Property: deterministic calculation
        expect(result1).toBe(result2);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tardiness increases monotonically with later clock-in times
   * 
   * If employee arrives later, tardiness should be equal or greater
   * (assuming both are after threshold).
   */
  it('should show increasing tardiness for later clock-in times', () => {
    fc.assert(
      fc.property(
        thresholdTimeArb,
        fc.integer({ min: 1, max: 60 }),
        fc.integer({ min: 1, max: 30 }),
        (threshold, minutesAfter1, additionalMinutes) => {
          const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);

          // First clock-in time (after threshold)
          const clockInTime1 = new Date('2025-01-15T00:00:00Z');
          clockInTime1.setUTCHours(thresholdHour, thresholdMinute + minutesAfter1, 0, 0);

          // Second clock-in time (even later)
          const clockInTime2 = new Date('2025-01-15T00:00:00Z');
          clockInTime2.setUTCHours(
            thresholdHour,
            thresholdMinute + minutesAfter1 + additionalMinutes,
            0,
            0
          );

          const tardiness1 = service.calculateTardinessMinutes(clockInTime1, threshold);
          const tardiness2 = service.calculateTardinessMinutes(clockInTime2, threshold);

          // Property: later arrival means more tardiness
          expect(tardiness2).toBeGreaterThanOrEqual(tardiness1);
          expect(tardiness2 - tardiness1).toBe(additionalMinutes);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different thresholds produce different tardiness results
   * 
   * For the same clock-in time, an earlier threshold should result in
   * more tardiness minutes than a later threshold.
   */
  it('should show more tardiness with earlier thresholds', () => {
    fc.assert(
      fc.property(
        dateArb,
        fc.integer({ min: 0, max: 59 }), // Threshold offset in minutes
        (clockInTime, thresholdOffsetMinutes) => {
          // Earlier threshold
          const hour = clockInTime.getUTCHours();
          const minute = clockInTime.getUTCMinutes();
          
          // Calculate two thresholds: one before clock-in, one even earlier
          if (minute >= thresholdOffsetMinutes + 10) {
            const threshold1 = `${hour.toString().padStart(2, '0')}:${(minute - thresholdOffsetMinutes).toString().padStart(2, '0')}`;
            const threshold2 = `${hour.toString().padStart(2, '0')}:${(minute - thresholdOffsetMinutes - 10).toString().padStart(2, '0')}`;

            const tardiness1 = service.calculateTardinessMinutes(clockInTime, threshold1);
            const tardiness2 = service.calculateTardinessMinutes(clockInTime, threshold2);

            // Property: earlier threshold means more tardiness
            expect(tardiness2).toBeGreaterThanOrEqual(tardiness1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tardiness minutes is always an integer
   * 
   * Seconds are not considered in tardiness calculation, only minutes.
   */
  it('should always return integer tardiness minutes', () => {
    fc.assert(
      fc.property(thresholdTimeArb, dateArb, (threshold, clockInTime) => {
        const tardinessMinutes = service.calculateTardinessMinutes(
          clockInTime,
          threshold
        );

        // Property: result is an integer
        expect(Number.isInteger(tardinessMinutes)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getTardinessThreshold falls back to default on error
   * 
   * If SystemSettings is unavailable or returns invalid data,
   * the service should always return the default threshold.
   */
  it('should always return valid threshold even on database errors', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(null, undefined, {}), async (invalidValue) => {
        // Setup mock to return invalid value
        mockPrismaService.systemSettings.findUnique.mockResolvedValue(invalidValue);

        const threshold = await service.getTardinessThreshold();

        // Property: always returns a valid threshold string
        expect(typeof threshold).toBe('string');
        expect(threshold).toMatch(/^\d{2}:\d{2}$/);
        
        // Should be default value
        expect(threshold).toBe('09:00');
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Threshold format validation
   * 
   * The threshold should always be in HH:mm format (24-hour).
   */
  it('should handle various threshold formats correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hour: fc.integer({ min: 0, max: 23 }),
          minute: fc.integer({ min: 0, max: 59 }),
        }),
        async (time) => {
          const threshold = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;

          mockPrismaService.systemSettings.findUnique.mockResolvedValue({
            setting_key: 'tardiness_threshold',
            setting_value: threshold,
          });

          const result = await service.getTardinessThreshold();

          // Property: threshold is returned as-is when valid
          expect(result).toBe(threshold);
          expect(result).toMatch(/^\d{2}:\d{2}$/);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Extreme tardiness values are handled correctly
   * 
   * Test with employees who arrive very late (hours after threshold).
   */
  it('should handle extreme tardiness correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        thresholdTimeArb,
        fc.integer({ min: 120, max: 480 }), // 2-8 hours late
        employeeIdArb,
        async (threshold, minutesAfter, employeeId) => {
          const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);

          // Create clock-in time very late
          const clockInTime = new Date('2025-01-15T00:00:00Z');
          const totalMinutes = thresholdMinute + minutesAfter;
          const additionalHours = Math.floor(totalMinutes / 60);
          const finalMinutes = totalMinutes % 60;
          clockInTime.setUTCHours(thresholdHour + additionalHours, finalMinutes, 0, 0);

          // Setup mocks
          mockPrismaService.systemSettings.findUnique.mockResolvedValue({
            setting_key: 'tardiness_threshold',
            setting_value: threshold,
          });

          const mockAttendance = {
            id: 'att-test',
            employee_id: employeeId,
            attendance_date: new Date('2025-01-15T00:00:00Z'),
            clock_in_time: clockInTime,
            clock_in_source: 'phone',
            is_tardy: true,
            tardiness_minutes: minutesAfter,
          };

          mockPrismaService.attendance.create.mockResolvedValue(mockAttendance);

          // Execute
          const result = await service.recordClockIn(employeeId, clockInTime);

          // Property: extreme tardiness is still correctly calculated
          expect(result.is_tardy).toBe(true);
          expect(result.tardiness_minutes).toBe(minutesAfter);
          expect(result.tardiness_minutes).toBeGreaterThan(100);
        }
      ),
      { numRuns: 50 }
    );
  });
});
