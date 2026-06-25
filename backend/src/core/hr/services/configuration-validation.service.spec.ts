import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ConfigurationValidationService } from './configuration-validation.service';

/**
 * Unit tests for ConfigurationValidationService (Task 20.5)
 *
 * Validates:
 * - Geo-fence radius: 50–1000 meters (Requirement 8.8, 25.17)
 * - Working hours: HH:MM format (Requirement 8.8, 25.19)
 * - Public holiday dates: valid dates (Requirement 15.8)
 * - Descriptive error messages on rejection (Requirement 15.8)
 */
describe('ConfigurationValidationService (Task 20.5)', () => {
  let service: ConfigurationValidationService;

  beforeEach(() => {
    service = new ConfigurationValidationService();
  });

  // ---------------------------------------------------------------------------
  // Geo-fence radius validation
  // ---------------------------------------------------------------------------

  describe('geo-fence radius validation', () => {
    it('accepts radius at minimum boundary (50m)', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', 50),
      ).not.toThrow();
    });

    it('accepts radius at maximum boundary (1000m)', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', 1000),
      ).not.toThrow();
    });

    it('accepts radius within valid range (200m)', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', 200),
      ).not.toThrow();
    });

    it('rejects radius below minimum (49m)', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', 49),
      ).toThrow(BadRequestException);
    });

    it('rejects radius above maximum (1001m)', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', 1001),
      ).toThrow(BadRequestException);
    });

    it('rejects non-integer radius', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', 100.5),
      ).toThrow(BadRequestException);
    });

    it('rejects negative radius', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', -100),
      ).toThrow(BadRequestException);
    });

    it('rejects zero radius', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', 0),
      ).toThrow(BadRequestException);
    });

    it('validates radius inside an object with geofence_radius_meters field', () => {
      expect(() =>
        service.validate('geo-fence', 'office_location', {
          geofence_radius_meters: 150,
        }),
      ).not.toThrow();
    });

    it('rejects invalid radius inside an object', () => {
      expect(() =>
        service.validate('geo-fence', 'office_location', {
          geofence_radius_meters: 2000,
        }),
      ).toThrow(BadRequestException);
    });

    it('validates radius property inside an object', () => {
      expect(() =>
        service.validate('geo-fence', 'office_location', { radius: 500 }),
      ).not.toThrow();
    });

    it('provides descriptive error message for invalid radius', () => {
      try {
        service.validate('geo-fence', 'geofence_radius', 30);
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('50');
        expect(e.message).toContain('1000');
        expect(e.message).toContain('30');
      }
    });

    it('accepts string-encoded radius when key matches', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', '200'),
      ).not.toThrow();
    });

    it('rejects string-encoded radius below minimum', () => {
      expect(() =>
        service.validate('geo-fence', 'geofence_radius', '10'),
      ).toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // Working hours (attendance) validation
  // ---------------------------------------------------------------------------

  describe('working hours format validation', () => {
    it('accepts valid HH:MM time "09:00"', () => {
      expect(() =>
        service.validate('attendance', 'work_start', '09:00'),
      ).not.toThrow();
    });

    it('accepts valid HH:MM time "23:59"', () => {
      expect(() =>
        service.validate('attendance', 'work_end', '23:59'),
      ).not.toThrow();
    });

    it('accepts "00:00"', () => {
      expect(() =>
        service.validate('attendance', 'work_start', '00:00'),
      ).not.toThrow();
    });

    it('rejects invalid hour "24:00"', () => {
      expect(() =>
        service.validate('attendance', 'work_start', '24:00'),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid minute "09:60"', () => {
      expect(() =>
        service.validate('attendance', 'work_start', '09:60'),
      ).toThrow(BadRequestException);
    });

    it('rejects non-time format "9:00"', () => {
      expect(() =>
        service.validate('attendance', 'work_start', '9:00'),
      ).toThrow(BadRequestException);
    });

    it('rejects text value "morning"', () => {
      expect(() =>
        service.validate('attendance', 'work_start', 'morning'),
      ).toThrow(BadRequestException);
    });

    it('validates tardiness_threshold key', () => {
      expect(() =>
        service.validate('attendance', 'tardiness_threshold', '09:00'),
      ).not.toThrow();
    });

    it('rejects invalid tardiness_threshold', () => {
      expect(() =>
        service.validate('attendance', 'tardiness_threshold', '25:00'),
      ).toThrow(BadRequestException);
    });

    it('validates time in an object with time property', () => {
      expect(() =>
        service.validate('attendance', 'work_start', { time: '08:30' }),
      ).not.toThrow();
    });

    it('rejects invalid time in object', () => {
      expect(() =>
        service.validate('attendance', 'work_start', { time: '25:00' }),
      ).toThrow(BadRequestException);
    });

    it('validates nested time fields in working_hours object', () => {
      expect(() =>
        service.validate('attendance', 'working_hours', {
          start_time: '08:00',
          end_time: '17:00',
          break_start: '12:00',
          break_end: '13:00',
        }),
      ).not.toThrow();
    });

    it('rejects invalid nested time field', () => {
      expect(() =>
        service.validate('attendance', 'working_hours', {
          start_time: '08:00',
          end_time: '99:00',
        }),
      ).toThrow(BadRequestException);
    });

    it('provides descriptive error for invalid time', () => {
      try {
        service.validate('attendance', 'work_start', 'bad');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('HH:MM');
        expect(e.message).toContain('bad');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Public holiday date validation
  // ---------------------------------------------------------------------------

  describe('public holiday date validation', () => {
    it('accepts valid YYYY-MM-DD date', () => {
      expect(() =>
        service.validate('public_holidays', 'holiday_2025_01', '2025-01-01'),
      ).not.toThrow();
    });

    it('accepts valid date in object with date field', () => {
      expect(() =>
        service.validate('public_holidays', 'hari_raya', {
          date: '2025-04-10',
          name: 'Hari Raya Idul Fitri',
        }),
      ).not.toThrow();
    });

    it('accepts valid date in object with holiday_date field', () => {
      expect(() =>
        service.validate('public_holidays', 'independence_day', {
          holiday_date: '2025-08-17',
        }),
      ).not.toThrow();
    });

    it('rejects invalid date format "2025-13-01" (month 13)', () => {
      expect(() =>
        service.validate('public_holidays', 'bad_month', '2025-13-01'),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid day "2025-02-30"', () => {
      expect(() =>
        service.validate('public_holidays', 'bad_day', '2025-02-30'),
      ).toThrow(BadRequestException);
    });

    it('rejects non-date string "not-a-date"', () => {
      expect(() =>
        service.validate('public_holidays', 'garbage', 'not-a-date'),
      ).toThrow(BadRequestException);
    });

    it('validates array of holiday dates', () => {
      expect(() =>
        service.validate('public_holidays', 'holidays_list', {
          holidays: ['2025-01-01', '2025-12-25'],
        }),
      ).not.toThrow();
    });

    it('rejects invalid date in array', () => {
      expect(() =>
        service.validate('public_holidays', 'holidays_list', {
          holidays: ['2025-01-01', 'invalid-date'],
        }),
      ).toThrow(BadRequestException);
    });

    it('validates array of holiday objects', () => {
      expect(() =>
        service.validate('public_holidays', 'holidays_list', {
          holidays: [
            { date: '2025-01-01', name: 'New Year' },
            { date: '2025-12-25', name: 'Christmas' },
          ],
        }),
      ).not.toThrow();
    });

    it('rejects invalid date in array of objects', () => {
      expect(() =>
        service.validate('public_holidays', 'holidays_list', {
          holidays: [{ date: '2025-02-29' }],
        }),
      ).toThrow(BadRequestException);
    });

    it('accepts Feb 29 on leap year', () => {
      expect(() =>
        service.validate('public_holidays', 'leap_day', '2024-02-29'),
      ).not.toThrow();
    });

    it('provides descriptive error for invalid date', () => {
      try {
        service.validate('public_holidays', 'bad', 'not-a-date');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('not-a-date');
        expect(e.message).toContain('YYYY-MM-DD');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Pass-through for unrelated categories
  // ---------------------------------------------------------------------------

  describe('non-validated categories', () => {
    it('passes through leave_policy category without additional validation', () => {
      expect(() =>
        service.validate('leave_policy', 'annual_entitlement', 12),
      ).not.toThrow();
    });

    it('passes through notifications category without additional validation', () => {
      expect(() =>
        service.validate('notifications', 'template_clock_in', {
          body: 'Hello {name}',
        }),
      ).not.toThrow();
    });

    it('passes through aws_integration category', () => {
      expect(() =>
        service.validate('aws_integration', 'webhook_url', 'https://example.com'),
      ).not.toThrow();
    });
  });
});
