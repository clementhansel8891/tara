import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * ConfigurationValidationService for TARA HR System
 *
 * Provides domain-specific validation for system configuration settings before
 * they are persisted. Each configuration category has dedicated validation rules
 * that ensure only valid, safe changes are applied to the system.
 *
 * - Geo-fence radius: 50–1000 meters (Requirement 8.8, 25.17)
 * - Working hours: valid HH:MM format (Requirement 8.8, 25.19)
 * - Public holidays: valid date values (Requirement 15.8)
 * - Generic: descriptive error messages on rejection (Requirement 15.8)
 *
 * Task: 20.5
 */
@Injectable()
export class ConfigurationValidationService {
  /** Minimum geo-fence radius in meters. */
  static readonly MIN_GEOFENCE_RADIUS = 50;
  /** Maximum geo-fence radius in meters. */
  static readonly MAX_GEOFENCE_RADIUS = 1000;

  /**
   * Validate a setting value based on its category and key.
   *
   * Called by SystemSettingsService before upserting or updating a setting.
   * Throws a BadRequestException with a descriptive message if validation fails.
   *
   * @param category - The setting category (e.g., 'geo-fence', 'attendance', 'public_holidays')
   * @param key - The setting key
   * @param value - The setting value to validate
   * @throws BadRequestException with a descriptive error if the value is invalid
   */
  validate(category: string, key: string, value: any): void {
    switch (category) {
      case 'geo-fence':
        this.validateGeoFenceSetting(key, value);
        break;
      case 'attendance':
        this.validateAttendanceSetting(key, value);
        break;
      case 'public_holidays':
        this.validatePublicHolidaySetting(key, value);
        break;
      default:
        // Categories without domain-specific rules pass through.
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Geo-fence validation
  // ---------------------------------------------------------------------------

  /**
   * Validate geo-fence configuration settings.
   *
   * When the key relates to a geo-fence radius, the value must be a number
   * between 50 and 1000 (inclusive). This prevents accidental misconfiguration
   * that could result in either too-tight or too-loose attendance boundaries.
   */
  private validateGeoFenceSetting(key: string, value: any): void {
    // Accept both a plain number and an object with a radius property.
    const radius = this.extractGeoFenceRadius(key, value);
    if (radius !== undefined) {
      this.assertGeoFenceRadius(radius);
    }

    // If value is an object, check for nested radius fields.
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if ('geofence_radius_meters' in value) {
        this.assertGeoFenceRadius(value.geofence_radius_meters);
      }
      if ('radius' in value) {
        this.assertGeoFenceRadius(value.radius);
      }
    }
  }

  /**
   * Extract a radius number from the value, based on key name heuristics.
   * Returns undefined if the key/value combination does not represent a radius.
   */
  private extractGeoFenceRadius(key: string, value: any): number | undefined {
    const radiusKeys = [
      'geofence_radius',
      'geofence_radius_meters',
      'radius',
      'geo_fence_radius',
    ];

    const normalizedKey = key.toLowerCase().replace(/[-.\s]/g, '_');
    if (radiusKeys.some((rk) => normalizedKey.includes(rk))) {
      // Value may be a raw number or an object wrapping it.
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
        return parseInt(value.trim(), 10);
      }
    }

    return undefined;
  }

  /**
   * Assert that a radius value is a valid integer in the 50–1000 meter range.
   */
  private assertGeoFenceRadius(radius: any): void {
    const num = typeof radius === 'string' ? parseInt(radius, 10) : radius;

    if (typeof num !== 'number' || isNaN(num)) {
      throw new BadRequestException(
        `Geo-fence radius must be a number. Received: ${JSON.stringify(radius)}`,
      );
    }

    if (!Number.isInteger(num)) {
      throw new BadRequestException(
        `Geo-fence radius must be a whole number of meters. Received: ${radius}`,
      );
    }

    if (
      num < ConfigurationValidationService.MIN_GEOFENCE_RADIUS ||
      num > ConfigurationValidationService.MAX_GEOFENCE_RADIUS
    ) {
      throw new BadRequestException(
        `Geo-fence radius must be between ${ConfigurationValidationService.MIN_GEOFENCE_RADIUS} and ${ConfigurationValidationService.MAX_GEOFENCE_RADIUS} meters. Received: ${num}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Attendance / working hours validation
  // ---------------------------------------------------------------------------

  /**
   * Validate attendance configuration settings.
   *
   * Working hours values must be in HH:MM format (00:00–23:59).
   * The tardiness threshold must also be a valid HH:MM time.
   */
  private validateAttendanceSetting(key: string, value: any): void {
    const timeKeys = [
      'work_start',
      'work_end',
      'break_start',
      'break_end',
      'tardiness_threshold',
      'working_hours_start',
      'working_hours_end',
    ];

    const normalizedKey = key.toLowerCase().replace(/[-.\s]/g, '_');

    // Direct time value for a known time-related key
    if (timeKeys.some((tk) => normalizedKey.includes(tk))) {
      if (typeof value === 'string') {
        this.assertValidTimeFormat(value, key);
      } else if (value !== null && typeof value === 'object') {
        // Object with a 'time' property
        if ('time' in value && typeof value.time === 'string') {
          this.assertValidTimeFormat(value.time, key);
        }
      }
    }

    // If value is an object with known time fields, validate each
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const timeFieldsInObject = [
        'start_time',
        'end_time',
        'break_start',
        'break_end',
        'tardiness_threshold',
      ];

      for (const field of timeFieldsInObject) {
        if (field in value && typeof value[field] === 'string') {
          this.assertValidTimeFormat(value[field], `${key}.${field}`);
        }
      }
    }
  }

  /**
   * Assert that a string is a valid HH:MM time format.
   * Accepts 00:00 through 23:59.
   */
  private assertValidTimeFormat(time: string, fieldName: string): void {
    const trimmed = time.trim();
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(trimmed)) {
      throw new BadRequestException(
        `Working hours value for '${fieldName}' must be in HH:MM format (00:00–23:59). Received: '${time}'`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Public holiday validation
  // ---------------------------------------------------------------------------

  /**
   * Validate public holiday configuration settings.
   *
   * Holiday dates must be valid calendar dates in YYYY-MM-DD format or as
   * parseable date strings. Rejects invalid or nonsensical dates.
   */
  private validatePublicHolidaySetting(key: string, value: any): void {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Object with a date field
      if ('date' in value) {
        this.assertValidDate(value.date, `${key}.date`);
      }
      if ('holiday_date' in value) {
        this.assertValidDate(value.holiday_date, `${key}.holiday_date`);
      }
      // Object with an array of dates
      if ('dates' in value && Array.isArray(value.dates)) {
        value.dates.forEach((d: any, i: number) => {
          this.assertValidDate(d, `${key}.dates[${i}]`);
        });
      }
      if ('holidays' in value && Array.isArray(value.holidays)) {
        value.holidays.forEach((h: any, i: number) => {
          if (typeof h === 'string') {
            this.assertValidDate(h, `${key}.holidays[${i}]`);
          } else if (h && typeof h === 'object') {
            if ('date' in h) {
              this.assertValidDate(h.date, `${key}.holidays[${i}].date`);
            }
            if ('holiday_date' in h) {
              this.assertValidDate(
                h.holiday_date,
                `${key}.holidays[${i}].holiday_date`,
              );
            }
          }
        });
      }
    } else if (typeof value === 'string') {
      // Direct date string value
      this.assertValidDate(value, key);
    } else if (Array.isArray(value)) {
      value.forEach((item: any, i: number) => {
        if (typeof item === 'string') {
          this.assertValidDate(item, `${key}[${i}]`);
        } else if (item && typeof item === 'object' && 'date' in item) {
          this.assertValidDate(item.date, `${key}[${i}].date`);
        }
      });
    }
  }

  /**
   * Assert that a value is a valid date.
   * Accepts YYYY-MM-DD format or any value parseable to a valid Date object.
   */
  private assertValidDate(dateValue: any, fieldName: string): void {
    if (dateValue === null || dateValue === undefined) {
      throw new BadRequestException(
        `Public holiday date for '${fieldName}' is required`,
      );
    }

    const strValue = String(dateValue).trim();

    // Prefer strict YYYY-MM-DD format
    const isoDateRegex = /^\d{4}-(\d{2})-(\d{2})$/;
    const match = strValue.match(isoDateRegex);

    if (match) {
      const month = parseInt(match[1], 10);
      const day = parseInt(match[2], 10);

      if (month < 1 || month > 12) {
        throw new BadRequestException(
          `Public holiday date for '${fieldName}' has an invalid month (${month}). Must be 01–12. Received: '${strValue}'`,
        );
      }

      // Validate day is within range for the month
      const year = parseInt(strValue.substring(0, 4), 10);
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day < 1 || day > daysInMonth) {
        throw new BadRequestException(
          `Public holiday date for '${fieldName}' has an invalid day (${day}) for month ${month}. Max: ${daysInMonth}. Received: '${strValue}'`,
        );
      }

      return;
    }

    // Fallback: try to parse as a Date
    const parsed = new Date(strValue);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException(
        `Public holiday date for '${fieldName}' is not a valid date. Use YYYY-MM-DD format. Received: '${strValue}'`,
      );
    }
  }
}
