import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * GeoService
 * 
 * Service for geographic calculations and geo-fence validation.
 * Implements Haversine formula for accurate distance calculation between GPS coordinates.
 * 
 * References:
 * - Requirements 23.1, 23.2, 23.3, 23.4: Geo-fence validation
 * - Requirements 23.12: Haversine distance calculation with 1 meter accuracy
 * - Design Property 15: Geo-Fence Validation Accuracy
 * - Design Property 16: Haversine Distance Calculation Correctness
 */
@Injectable()
export class GeoService {
  // Earth's radius in meters (mean radius)
  private readonly EARTH_RADIUS_METERS = 6371000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate if employee's location is within the geo-fence of their assigned office.
   * 
   * This method:
   * 1. Queries the office location data for the specified location_id
   * 2. Calculates distance using Haversine formula
   * 3. Validates if distance is within the geo-fence radius
   * 
   * @param employeeLatitude - Employee's current latitude in degrees
   * @param employeeLongitude - Employee's current longitude in degrees
   * @param locationId - The office location ID to validate against
   * @returns Validation result with distance and within_fence status
   * 
   * @throws Error if location not found or coordinates are invalid
   * 
   * @example
   * const result = await geoService.validateGeoFence(
   *   -8.6705, 115.2126,  // Employee GPS coordinates
   *   'location-uuid-123'  // Office location ID
   * );
   * // Returns: { 
   * //   within_fence: true, 
   * //   distance_meters: 45,
   * //   office_name: 'Jakarta HQ',
   * //   geofence_radius_meters: 200
   * // }
   * 
   * Requirements validated:
   * - Requirement 23.1: GPS coordinate validation for attendance
   * - Requirement 23.2: Distance calculation from office
   * - Requirement 23.3: Comparison against geo-fence radius
   * - Requirement 23.4: Return validation result with distance
   */
  async validateGeoFence(
    employeeLatitude: number,
    employeeLongitude: number,
    locationId: string,
  ): Promise<{
    within_fence: boolean;
    distance_meters: number;
    office_name: string;
    office_latitude: number;
    office_longitude: number;
    geofence_radius_meters: number;
  }> {
    // Query office location data
    const location = await this.prisma.officeLocation.findUnique({
      where: { id: locationId },
      select: {
        location_name: true,
        latitude: true,
        longitude: true,
        geofence_radius_meters: true,
      },
    });

    if (!location) {
      throw new Error(`Location not found: ${locationId}`);
    }

    if (!location.latitude || !location.longitude) {
      throw new Error(
        `Location ${locationId} does not have GPS coordinates configured`,
      );
    }

    if (!location.geofence_radius_meters) {
      throw new Error(
        `Location ${locationId} does not have geo-fence radius configured`,
      );
    }

    // Convert Decimal to number for calculation
    const officeLatitude = this.decimalToNumber(location.latitude);
    const officeLongitude = this.decimalToNumber(location.longitude);
    const geofenceRadius = location.geofence_radius_meters;

    // Calculate distance using Haversine formula
    const distanceMeters = this.calculateHaversineDistance(
      employeeLatitude,
      employeeLongitude,
      officeLatitude,
      officeLongitude,
    );

    // Check if within geo-fence
    const withinFence = distanceMeters <= geofenceRadius;

    return {
      within_fence: withinFence,
      distance_meters: distanceMeters,
      office_name: location.location_name,
      office_latitude: officeLatitude,
      office_longitude: officeLongitude,
      geofence_radius_meters: geofenceRadius,
    };
  }

  /**
   * Validate geo-fence for multiple locations (for employees who can clock in at multiple offices).
   * Returns the closest office and whether employee is within any geo-fence.
   * 
   * @param employeeLatitude - Employee's current latitude in degrees
   * @param employeeLongitude - Employee's current longitude in degrees
   * @param locationIds - Array of office location IDs to check
   * @returns Validation result with closest office information
   * 
   * @example
   * const result = await geoService.validateGeoFenceMultiple(
   *   -8.6705, 115.2126,
   *   ['office-1', 'office-2', 'office-3']
   * );
   * 
   * Requirements validated:
   * - Requirement 23.8: Support for employees assigned to multiple office locations
   */
  async validateGeoFenceMultiple(
    employeeLatitude: number,
    employeeLongitude: number,
    locationIds: string[],
  ): Promise<{
    within_any_fence: boolean;
    closest_office: {
      location_id: string;
      office_name: string;
      distance_meters: number;
      within_fence: boolean;
      geofence_radius_meters: number;
    };
    all_offices: Array<{
      location_id: string;
      office_name: string;
      distance_meters: number;
      within_fence: boolean;
      geofence_radius_meters: number;
    }>;
  }> {
    if (!locationIds || locationIds.length === 0) {
      throw new Error('At least one location ID must be provided');
    }

    // Validate against all locations
    const validationResults = await Promise.all(
      locationIds.map(async (locationId) => {
        try {
          const result = await this.validateGeoFence(
            employeeLatitude,
            employeeLongitude,
            locationId,
          );
          return {
            location_id: locationId,
            office_name: result.office_name,
            distance_meters: result.distance_meters,
            within_fence: result.within_fence,
            geofence_radius_meters: result.geofence_radius_meters,
          };
        } catch (error) {
          // Skip locations that don't exist or have invalid data
          return null;
        }
      }),
    );

    // Filter out null results (failed validations)
    const validResults = validationResults.filter((r) => r !== null);

    if (validResults.length === 0) {
      throw new Error('No valid locations found for geo-fence validation');
    }

    // Find closest office
    const closestOffice = validResults.reduce((closest, current) =>
      current.distance_meters < closest.distance_meters ? current : closest,
    );

    // Check if within any fence
    const withinAnyFence = validResults.some((r) => r.within_fence);

    return {
      within_any_fence: withinAnyFence,
      closest_office: closestOffice,
      all_offices: validResults,
    };
  }

  /**
   * Convert Prisma Decimal to JavaScript number
   * @param decimal - Prisma Decimal value
   * @returns JavaScript number
   */
  private decimalToNumber(decimal: Decimal): number {
    return parseFloat(decimal.toString());
  }

  /**
   * Calculate distance between two GPS coordinate pairs using the Haversine formula.
   * 
   * The Haversine formula calculates the great-circle distance between two points
   * on a sphere given their longitudes and latitudes. This is the shortest distance
   * over the earth's surface.
   * 
   * Formula:
   * a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
   * c = 2 × atan2(√a, √(1−a))
   * d = R × c
   * 
   * Where:
   * - φ is latitude in radians
   * - λ is longitude in radians
   * - R is earth's radius (6,371,000 meters)
   * - d is the distance in meters
   * 
   * @param lat1 - Latitude of first point in degrees (-90 to 90)
   * @param lon1 - Longitude of first point in degrees (-180 to 180)
   * @param lat2 - Latitude of second point in degrees (-90 to 90)
   * @param lon2 - Longitude of second point in degrees (-180 to 180)
   * @returns Distance in meters, accurate within 1 meter margin of error
   * 
   * @example
   * // Calculate distance between two offices
   * const distance = geoService.calculateHaversineDistance(
   *   -8.6705, 115.2126,  // Denpasar, Bali
   *   -6.2088, 106.8456   // Jakarta
   * );
   * // Returns approximately 983,000 meters (983 km)
   */
  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Input validation
    this.validateCoordinate(lat1, lon1, 'First coordinate');
    this.validateCoordinate(lat2, lon2, 'Second coordinate');

    // Convert degrees to radians
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    // Haversine formula
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in meters
    const distance = this.EARTH_RADIUS_METERS * c;

    // Round to nearest meter for consistent precision
    return Math.round(distance);
  }

  /**
   * Convert degrees to radians
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate that coordinates are within valid ranges
   * @param lat - Latitude to validate
   * @param lon - Longitude to validate
   * @param label - Label for error message
   * @throws Error if coordinates are invalid
   */
  private validateCoordinate(lat: number, lon: number, label: string): void {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error(`${label}: Latitude and longitude must be numbers`);
    }

    if (!isFinite(lat) || !isFinite(lon)) {
      throw new Error(`${label}: Latitude and longitude must be finite numbers`);
    }

    if (lat < -90 || lat > 90) {
      throw new Error(
        `${label}: Latitude must be between -90 and 90 degrees (got ${lat})`,
      );
    }

    if (lon < -180 || lon > 180) {
      throw new Error(
        `${label}: Longitude must be between -180 and 180 degrees (got ${lon})`,
      );
    }
  }
}
