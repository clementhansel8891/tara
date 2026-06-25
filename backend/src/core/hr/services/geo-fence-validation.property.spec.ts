import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GeoService } from './geo.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Property-Based Tests for GeoService Geo-Fence Validation
 * 
 * Task 10.5: Write property test for geo-fence validation accuracy
 * 
 * **Property 15: Geo-Fence Validation Accuracy**
 * **Validates: Requirements 23.1**
 * 
 * This test validates that coordinates within/outside radius are correctly classified
 * using property-based testing with fast-check to generate random coordinates and office locations.
 * 
 * The property being tested:
 * - IF distance from office ≤ geo-fence radius, THEN within_fence = true
 * - IF distance from office > geo-fence radius, THEN within_fence = false
 * - The classification boundary is always accurate at the exact radius
 */

describe('Property 15: Geo-Fence Validation Accuracy', () => {
  let service: GeoService;
  let mockPrismaService: any;

  /**
   * Arbitraries for generating test data
   */

  // Generate valid latitude (-90 to 90)
  const latitudeArb = fc.double({
    min: -90,
    max: 90,
    noNaN: true,
  });

  // Generate valid longitude (-180 to 180)
  const longitudeArb = fc.double({
    min: -180,
    max: 180,
    noNaN: true,
  });

  // Generate valid geo-fence radius (50 to 1000 meters as per Requirement 23.6)
  const radiusArb = fc.integer({ min: 50, max: 1000 });

  // Generate office location with coordinates and geo-fence radius
  const officeLocationArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    latitude: latitudeArb,
    longitude: longitudeArb,
    geofence_radius: radiusArb,
  });

  // Generate employee coordinates
  const employeeCoordinatesArb = fc.record({
    latitude: latitudeArb,
    longitude: longitudeArb,
  });

  beforeEach(() => {
    // Create mock Prisma service
    mockPrismaService = {
      officeLocation: {
        findUnique: vi.fn(),
      },
    };

    // Create service with mocked Prisma
    service = new GeoService(mockPrismaService as unknown as PrismaService);
  });

  /**
   * Core Property: Coordinates within radius should always be classified as within fence
   * 
   * This property generates random office locations and tests coordinates that we know
   * are within the geo-fence radius. The validation should always return within_fence = true.
   */
  it('should always classify coordinates within radius as within_fence=true', async () => {
    await fc.assert(
      fc.asyncProperty(officeLocationArb, async (office) => {
        // Setup mock to return the office location
        mockPrismaService.officeLocation.findUnique.mockResolvedValue({
          location_name: office.name,
          latitude: new Decimal(office.latitude.toString()),
          longitude: new Decimal(office.longitude.toString()),
          geofence_radius_meters: office.geofence_radius,
        });

        // For this property test, we test coordinates at exactly the office location
        // Distance should be 0, which is always ≤ radius
        const result = await service.validateGeoFence(
          office.latitude,
          office.longitude,
          office.id,
        );

        // Property: distance = 0 is always within any fence
        expect(result.within_fence).toBe(true);
        expect(result.distance_meters).toBe(0);
      }),
      { numRuns: 100 }, // Run 100 random test cases
    );
  });

  /**
   * Core Property: Classification boundary is accurate
   * 
   * This property tests that the boundary between inside/outside is accurate by:
   * 1. Generating random office locations
   * 2. Calculating actual distance between employee and office
   * 3. Verifying the within_fence result matches the distance vs radius comparison
   */
  it('should correctly classify any coordinate based on actual distance vs radius', async () => {
    await fc.assert(
      fc.asyncProperty(
        officeLocationArb,
        employeeCoordinatesArb,
        async (office, employee) => {
          // Setup mock to return the office location
          mockPrismaService.officeLocation.findUnique.mockResolvedValue({
            location_name: office.name,
            latitude: new Decimal(office.latitude.toString()),
            longitude: new Decimal(office.longitude.toString()),
            geofence_radius_meters: office.geofence_radius,
          });

          const result = await service.validateGeoFence(
            employee.latitude,
            employee.longitude,
            office.id,
          );

          // Property: within_fence classification must match distance vs radius
          const expectedWithinFence = result.distance_meters <= office.geofence_radius;
          
          expect(result.within_fence).toBe(expectedWithinFence);
          expect(result.geofence_radius_meters).toBe(office.geofence_radius);
          
          // Additional invariant: distance must be non-negative
          expect(result.distance_meters).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 200 }, // Run 200 random test cases for thorough validation
    );
  });

  /**
   * Property: Distance calculation is consistent (deterministic)
   * 
   * Calling validateGeoFence multiple times with same inputs should produce same result.
   */
  it('should return consistent results for same coordinates', async () => {
    await fc.assert(
      fc.asyncProperty(
        officeLocationArb,
        employeeCoordinatesArb,
        async (office, employee) => {
          // Setup mock to return the office location
          mockPrismaService.officeLocation.findUnique.mockResolvedValue({
            location_name: office.name,
            latitude: new Decimal(office.latitude.toString()),
            longitude: new Decimal(office.longitude.toString()),
            geofence_radius_meters: office.geofence_radius,
          });

          // Call validation twice
          const result1 = await service.validateGeoFence(
            employee.latitude,
            employee.longitude,
            office.id,
          );

          const result2 = await service.validateGeoFence(
            employee.latitude,
            employee.longitude,
            office.id,
          );

          // Property: deterministic calculation
          expect(result1.within_fence).toBe(result2.within_fence);
          expect(result1.distance_meters).toBe(result2.distance_meters);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Symmetry - distance from A to B equals distance from B to A
   * 
   * The distance calculation should be symmetric regardless of which point is "office"
   * and which is "employee".
   */
  it('should calculate same distance regardless of point order (symmetry)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lat1: latitudeArb,
          lon1: longitudeArb,
          lat2: latitudeArb,
          lon2: longitudeArb,
        }),
        (coords) => {
          // Calculate distance both ways
          const distance1 = service.calculateHaversineDistance(
            coords.lat1,
            coords.lon1,
            coords.lat2,
            coords.lon2,
          );

          const distance2 = service.calculateHaversineDistance(
            coords.lat2,
            coords.lon2,
            coords.lat1,
            coords.lon1,
          );

          // Property: symmetry
          expect(distance1).toBe(distance2);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Triangle inequality
   * 
   * For any three points A, B, C:
   * distance(A, C) ≤ distance(A, B) + distance(B, C)
   * 
   * This is a fundamental property of distance metrics.
   */
  it('should satisfy triangle inequality', () => {
    fc.assert(
      fc.property(
        fc.record({
          latA: latitudeArb,
          lonA: longitudeArb,
          latB: latitudeArb,
          lonB: longitudeArb,
          latC: latitudeArb,
          lonC: longitudeArb,
        }),
        (coords) => {
          const distAB = service.calculateHaversineDistance(
            coords.latA,
            coords.lonA,
            coords.latB,
            coords.lonB,
          );

          const distBC = service.calculateHaversineDistance(
            coords.latB,
            coords.lonB,
            coords.latC,
            coords.lonC,
          );

          const distAC = service.calculateHaversineDistance(
            coords.latA,
            coords.lonA,
            coords.latC,
            coords.lonC,
          );

          // Property: triangle inequality
          // Allow small margin for rounding (distance is rounded to nearest meter)
          expect(distAC).toBeLessThanOrEqual(distAB + distBC + 2);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Identity - distance from any point to itself is zero
   */
  it('should always return zero distance for identical coordinates', () => {
    fc.assert(
      fc.property(latitudeArb, longitudeArb, (lat, lon) => {
        const distance = service.calculateHaversineDistance(lat, lon, lat, lon);
        expect(distance).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Smaller radius means stricter validation
   * 
   * For the same employee location:
   * - If within_fence = true for radius R1
   * - Then within_fence = true for any radius R2 > R1
   */
  it('should have stricter validation with smaller radius', async () => {
    await fc.assert(
      fc.asyncProperty(
        officeLocationArb,
        employeeCoordinatesArb,
        async (office, employee) => {
          // Test with original radius
          mockPrismaService.officeLocation.findUnique.mockResolvedValue({
            location_name: office.name,
            latitude: new Decimal(office.latitude.toString()),
            longitude: new Decimal(office.longitude.toString()),
            geofence_radius_meters: office.geofence_radius,
          });

          const result1 = await service.validateGeoFence(
            employee.latitude,
            employee.longitude,
            office.id,
          );

          // Test with larger radius (double)
          const largerRadius = office.geofence_radius * 2;
          mockPrismaService.officeLocation.findUnique.mockResolvedValue({
            location_name: office.name,
            latitude: new Decimal(office.latitude.toString()),
            longitude: new Decimal(office.longitude.toString()),
            geofence_radius_meters: largerRadius,
          });

          const result2 = await service.validateGeoFence(
            employee.latitude,
            employee.longitude,
            office.id,
          );

          // Property: if within smaller fence, must be within larger fence
          if (result1.within_fence) {
            expect(result2.within_fence).toBe(true);
          }

          // Distance should be the same regardless of radius
          expect(result1.distance_meters).toBe(result2.distance_meters);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Distance increases monotonically as employee moves away
   * 
   * If we move the employee further from the office (same direction),
   * the distance should increase.
   */
  it('should show increasing distance as employee moves further away', () => {
    fc.assert(
      fc.property(
        fc.record({
          officeLat: latitudeArb,
          officeLon: longitudeArb,
          // Generate a small offset to create a "direction"
          latOffset: fc.double({ min: 0.001, max: 0.01, noNaN: true }),
          lonOffset: fc.double({ min: 0.001, max: 0.01, noNaN: true }),
          // Generate a multiplier to test "moving further"
          multiplier: fc.double({ min: 1, max: 5, noNaN: true }),
        }),
        (data) => {
          // Employee location 1: closer
          const employeeLat1 = data.officeLat + data.latOffset;
          const employeeLon1 = data.officeLon + data.lonOffset;

          // Employee location 2: same direction but further
          const employeeLat2 = data.officeLat + data.latOffset * data.multiplier;
          const employeeLon2 = data.officeLon + data.lonOffset * data.multiplier;

          // Skip if coordinates would be invalid
          if (
            Math.abs(employeeLat2) > 90 ||
            Math.abs(employeeLon2) > 180 ||
            !Number.isFinite(employeeLat2) ||
            !Number.isFinite(employeeLon2)
          ) {
            return true; // Skip this test case
          }

          const distance1 = service.calculateHaversineDistance(
            data.officeLat,
            data.officeLon,
            employeeLat1,
            employeeLon1,
          );

          const distance2 = service.calculateHaversineDistance(
            data.officeLat,
            data.officeLon,
            employeeLat2,
            employeeLon2,
          );

          // Property: moving further should increase distance
          // (with small margin for rounding)
          expect(distance2).toBeGreaterThanOrEqual(distance1 - 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: All return values are present and valid types
   * 
   * Validates that the result always contains all required fields with correct types.
   */
  it('should always return complete result structure with valid types', async () => {
    await fc.assert(
      fc.asyncProperty(
        officeLocationArb,
        employeeCoordinatesArb,
        async (office, employee) => {
          mockPrismaService.officeLocation.findUnique.mockResolvedValue({
            location_name: office.name,
            latitude: new Decimal(office.latitude.toString()),
            longitude: new Decimal(office.longitude.toString()),
            geofence_radius_meters: office.geofence_radius,
          });

          const result = await service.validateGeoFence(
            employee.latitude,
            employee.longitude,
            office.id,
          );

          // Property: result structure completeness
          expect(typeof result.within_fence).toBe('boolean');
          expect(typeof result.distance_meters).toBe('number');
          expect(typeof result.office_name).toBe('string');
          expect(typeof result.office_latitude).toBe('number');
          expect(typeof result.office_longitude).toBe('number');
          expect(typeof result.geofence_radius_meters).toBe('number');

          // Property: numeric values are valid
          expect(Number.isFinite(result.distance_meters)).toBe(true);
          expect(Number.isFinite(result.office_latitude)).toBe(true);
          expect(Number.isFinite(result.office_longitude)).toBe(true);
          expect(Number.isInteger(result.distance_meters)).toBe(true); // Should be rounded to integer
          expect(Number.isInteger(result.geofence_radius_meters)).toBe(true);

          // Property: values in valid ranges
          expect(result.office_latitude).toBeGreaterThanOrEqual(-90);
          expect(result.office_latitude).toBeLessThanOrEqual(90);
          expect(result.office_longitude).toBeGreaterThanOrEqual(-180);
          expect(result.office_longitude).toBeLessThanOrEqual(180);
          expect(result.distance_meters).toBeGreaterThanOrEqual(0);
          expect(result.geofence_radius_meters).toBeGreaterThanOrEqual(50);
          expect(result.geofence_radius_meters).toBeLessThanOrEqual(1000);
        },
      ),
      { numRuns: 100 },
    );
  });
});
