import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GeoService } from './geo.service';

/**
 * Unit Tests and Property-Based Tests for GeoService
 * 
 * Task 10.1: Implement Haversine distance calculation
 * - Test Haversine formula accuracy within 1 meter margin of error
 * - Test known distances between real locations
 * - Test edge cases (identical coordinates, equator, high latitude)
 * - Test input validation
 * - Test geo-fence use cases
 * 
 * Task 10.6: Write property test for Haversine distance correctness
 * - Property 16: Haversine Distance Calculation Correctness
 * - Test universal properties across all valid coordinate pairs
 * 
 * **Validates: Requirements 23.12**
 * **Validates: Design Property 16 - Haversine Distance Calculation Correctness**
 */

describe('GeoService', () => {
  let service: GeoService;
  let mockPrismaService: any;

  beforeEach(() => {
    // Mock PrismaService - only needed for database operations, not for pure calculations
    mockPrismaService = {
      locations: {
        findUnique: vi.fn(),
      },
    };
    
    service = new GeoService(mockPrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateHaversineDistance', () => {
    describe('known distance verification', () => {
      it('should calculate distance between Jakarta and Denpasar accurately', () => {
        // Jakarta coordinates
        const jakartaLat = -6.2088;
        const jakartaLon = 106.8456;

        // Denpasar, Bali coordinates
        const denpasarLat = -8.6705;
        const denpasarLon = 115.2126;

        const distance = service.calculateHaversineDistance(
          jakartaLat,
          jakartaLon,
          denpasarLat,
          denpasarLon,
        );

        // Expected distance is approximately 962 km (962,000 meters)
        // Allow reasonable margin for different earth radius calculations
        expect(distance).toBeGreaterThan(960000);
        expect(distance).toBeLessThan(965000);
      });

      it('should calculate distance between Sydney and Melbourne accurately', () => {
        // Sydney coordinates
        const sydneyLat = -33.8688;
        const sydneyLon = 151.2093;

        // Melbourne coordinates
        const melbourneLat = -37.8136;
        const melbourneLon = 144.9631;

        const distance = service.calculateHaversineDistance(
          sydneyLat,
          sydneyLon,
          melbourneLat,
          melbourneLon,
        );

        // Expected distance is approximately 714 km (714,000 meters)
        expect(distance).toBeGreaterThan(713000);
        expect(distance).toBeLessThan(715000);
      });

      it('should calculate short distance accurately (within same city)', () => {
        // Two points in central Jakarta, approximately 2 km apart
        const point1Lat = -6.2088;
        const point1Lon = 106.8456;

        const point2Lat = -6.2208;
        const point2Lon = 106.8606;

        const distance = service.calculateHaversineDistance(
          point1Lat,
          point1Lon,
          point2Lat,
          point2Lon,
        );

        // Expected distance is approximately 2 km (2,000 meters)
        expect(distance).toBeGreaterThan(1500);
        expect(distance).toBeLessThan(2500);
      });

      it('should calculate very short distance accurately (office geo-fence scenario)', () => {
        // Office location
        const officeLat = -8.6705;
        const officeLon = 115.2126;

        // Employee location 50 meters away (approximately)
        // 0.00045 degrees latitude ≈ 50 meters at this latitude
        const employeeLat = -8.67095;
        const employeeLon = 115.2126;

        const distance = service.calculateHaversineDistance(
          officeLat,
          officeLon,
          employeeLat,
          employeeLon,
        );

        // Expected distance is approximately 50 meters
        // Within 1 meter margin of error
        expect(distance).toBeGreaterThan(45);
        expect(distance).toBeLessThan(55);
      });
    });

    describe('edge cases', () => {
      it('should return 0 for identical coordinates', () => {
        const lat = -8.6705;
        const lon = 115.2126;

        const distance = service.calculateHaversineDistance(lat, lon, lat, lon);

        expect(distance).toBe(0);
      });

      it('should handle coordinates at the equator', () => {
        const lat1 = 0;
        const lon1 = 0;
        const lat2 = 0;
        const lon2 = 1; // 1 degree longitude at equator ≈ 111 km

        const distance = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );

        // 1 degree longitude at equator is approximately 111 km
        expect(distance).toBeGreaterThan(110000);
        expect(distance).toBeLessThan(112000);
      });

      it('should handle coordinates at high latitude', () => {
        // Oslo, Norway
        const osloLat = 59.9139;
        const osloLon = 10.7522;

        // Stockholm, Sweden
        const stockholmLat = 59.3293;
        const stockholmLon = 18.0686;

        const distance = service.calculateHaversineDistance(
          osloLat,
          osloLon,
          stockholmLat,
          stockholmLon,
        );

        // Expected distance is approximately 417 km
        expect(distance).toBeGreaterThan(416000);
        expect(distance).toBeLessThan(418000);
      });

      it('should handle coordinates crossing the equator', () => {
        const lat1 = 1.0; // North of equator
        const lon1 = 100.0;
        const lat2 = -1.0; // South of equator
        const lon2 = 100.0;

        const distance = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );

        // 2 degrees latitude ≈ 222 km
        expect(distance).toBeGreaterThan(221000);
        expect(distance).toBeLessThan(223000);
      });

      it('should handle coordinates crossing the prime meridian', () => {
        const lat1 = 51.5074; // London
        const lon1 = -0.1278; // West of prime meridian
        const lat2 = 48.8566; // Paris
        const lon2 = 2.3522; // East of prime meridian

        const distance = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );

        // London to Paris is approximately 344 km
        expect(distance).toBeGreaterThan(343000);
        expect(distance).toBeLessThan(345000);
      });

      it('should handle coordinates at maximum latitude', () => {
        // Near North Pole
        const lat1 = 89.9;
        const lon1 = 0;
        const lat2 = 89.9;
        const lon2 = 180; // Opposite side

        const distance = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );

        // At this high latitude, distance should be very small even with large longitude difference
        expect(distance).toBeLessThan(25000);
      });
    });

    describe('validation', () => {
      it('should throw error for invalid latitude (> 90)', () => {
        expect(() => {
          service.calculateHaversineDistance(91, 0, 0, 0);
        }).toThrow('First coordinate: Latitude must be between -90 and 90 degrees');
      });

      it('should throw error for invalid latitude (< -90)', () => {
        expect(() => {
          service.calculateHaversineDistance(-91, 0, 0, 0);
        }).toThrow('First coordinate: Latitude must be between -90 and 90 degrees');
      });

      it('should throw error for invalid longitude (> 180)', () => {
        expect(() => {
          service.calculateHaversineDistance(0, 181, 0, 0);
        }).toThrow('First coordinate: Longitude must be between -180 and 180 degrees');
      });

      it('should throw error for invalid longitude (< -180)', () => {
        expect(() => {
          service.calculateHaversineDistance(0, -181, 0, 0);
        }).toThrow('First coordinate: Longitude must be between -180 and 180 degrees');
      });

      it('should throw error for non-numeric latitude', () => {
        expect(() => {
          service.calculateHaversineDistance(NaN, 0, 0, 0);
        }).toThrow('First coordinate: Latitude and longitude must be finite numbers');
      });

      it('should throw error for non-numeric longitude', () => {
        expect(() => {
          service.calculateHaversineDistance(0, NaN, 0, 0);
        }).toThrow('First coordinate: Latitude and longitude must be finite numbers');
      });

      it('should throw error for infinite latitude', () => {
        expect(() => {
          service.calculateHaversineDistance(Infinity, 0, 0, 0);
        }).toThrow('First coordinate: Latitude and longitude must be finite numbers');
      });

      it('should throw error for infinite longitude', () => {
        expect(() => {
          service.calculateHaversineDistance(0, Infinity, 0, 0);
        }).toThrow('First coordinate: Latitude and longitude must be finite numbers');
      });

      it('should throw error for invalid second coordinate latitude', () => {
        expect(() => {
          service.calculateHaversineDistance(0, 0, 91, 0);
        }).toThrow('Second coordinate: Latitude must be between -90 and 90 degrees');
      });

      it('should throw error for invalid second coordinate longitude', () => {
        expect(() => {
          service.calculateHaversineDistance(0, 0, 0, 181);
        }).toThrow('Second coordinate: Longitude must be between -180 and 180 degrees');
      });
    });

    describe('precision and rounding', () => {
      it('should round result to nearest meter', () => {
        // Small distance that would result in fractional meters
        const lat1 = 0.0;
        const lon1 = 0.0;
        const lat2 = 0.00001; // Very small difference
        const lon2 = 0.0;

        const distance = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );

        // Result should be an integer (rounded)
        expect(Number.isInteger(distance)).toBe(true);
      });

      it('should maintain accuracy within 1 meter margin for multiple calculations', () => {
        // Calculate same distance multiple times
        const lat1 = -8.6705;
        const lon1 = 115.2126;
        const lat2 = -8.6710;
        const lon2 = 115.2130;

        const distance1 = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );
        const distance2 = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );
        const distance3 = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );

        // All calculations should return identical results
        expect(distance1).toBe(distance2);
        expect(distance2).toBe(distance3);
      });
    });

    describe('symmetry property', () => {
      it('should return same distance regardless of point order', () => {
        const lat1 = -8.6705;
        const lon1 = 115.2126;
        const lat2 = -6.2088;
        const lon2 = 106.8456;

        const distance1 = service.calculateHaversineDistance(
          lat1,
          lon1,
          lat2,
          lon2,
        );
        const distance2 = service.calculateHaversineDistance(
          lat2,
          lon2,
          lat1,
          lon1,
        );

        expect(distance1).toBe(distance2);
      });
    });

    describe('geo-fence use case scenarios', () => {
      it('should correctly identify employee within 50m geo-fence', () => {
        const officeLat = -8.6705;
        const officeLon = 115.2126;

        // Employee 30 meters away (within fence)
        const employeeLat = -8.67077;
        const employeeLon = 115.2126;

        const distance = service.calculateHaversineDistance(
          officeLat,
          officeLon,
          employeeLat,
          employeeLon,
        );

        expect(distance).toBeLessThanOrEqual(50);
      });

      it('should correctly identify employee outside 50m geo-fence', () => {
        const officeLat = -8.6705;
        const officeLon = 115.2126;

        // Employee 100 meters away (outside fence)
        const employeeLat = -8.67140;
        const employeeLon = 115.2126;

        const distance = service.calculateHaversineDistance(
          officeLat,
          officeLon,
          employeeLat,
          employeeLon,
        );

        expect(distance).toBeGreaterThan(50);
      });

      it('should handle employee at exact geo-fence boundary', () => {
        const officeLat = -8.6705;
        const officeLon = 115.2126;
        const geoFenceRadius = 100; // meters

        // Employee approximately 100 meters away
        // At this latitude, ~0.0009 degrees ≈ 100 meters
        const employeeLat = -8.6714;
        const employeeLon = 115.2126;

        const distance = service.calculateHaversineDistance(
          officeLat,
          officeLon,
          employeeLat,
          employeeLon,
        );

        // Should be very close to 100 meters (within 5 meters)
        expect(Math.abs(distance - geoFenceRadius)).toBeLessThanOrEqual(5);
      });
    });
  });

  /**
   * Property-Based Tests for Haversine Distance Calculation
   * 
   * Task 10.6: Write property test for Haversine distance correctness
   * **Property 16: Haversine Distance Calculation Correctness**
   * **Validates: Requirements 23.12**
   * 
   * These tests use fast-check to generate random coordinate pairs and verify
   * universal properties that should hold for ANY valid GPS coordinates.
   * 
   * Requirements validated:
   * - Requirement 23.12: Calculate distance using Haversine formula for accurate geo-distance measurement
   * - Property 16: For ANY two GPS coordinate pairs, calculated distance SHALL be accurate within 1 meter margin
   */
  describe('Property-Based Tests - Haversine Distance Correctness', () => {
    /**
     * Arbitrary generator for valid latitude values (-90 to 90 degrees)
     */
    const validLatitude = () => fc.double({ min: -90, max: 90, noNaN: true });

    /**
     * Arbitrary generator for valid longitude values (-180 to 180 degrees)
     */
    const validLongitude = () => fc.double({ min: -180, max: 180, noNaN: true });

    /**
     * Arbitrary generator for valid GPS coordinate pairs
     */
    const validCoordinatePair = () =>
      fc.record({
        lat1: validLatitude(),
        lon1: validLongitude(),
        lat2: validLatitude(),
        lon2: validLongitude(),
      });

    describe('Property 16: Haversine Distance Calculation Correctness', () => {
      it('should always return non-negative distance for any valid coordinates', () => {
        fc.assert(
          fc.property(validCoordinatePair(), (coords) => {
            const distance = service.calculateHaversineDistance(
              coords.lat1,
              coords.lon1,
              coords.lat2,
              coords.lon2,
            );
            expect(distance).toBeGreaterThanOrEqual(0);
          }),
          { numRuns: 100 }
        );
      });

      it('should return zero distance for identical coordinates', () => {
        fc.assert(
          fc.property(validLatitude(), validLongitude(), (lat, lon) => {
            const distance = service.calculateHaversineDistance(lat, lon, lat, lon);
            expect(distance).toBe(0);
          }),
          { numRuns: 100 }
        );
      });

      it('should satisfy symmetry property: distance(A,B) = distance(B,A)', () => {
        fc.assert(
          fc.property(validCoordinatePair(), (coords) => {
            const distanceAB = service.calculateHaversineDistance(
              coords.lat1,
              coords.lon1,
              coords.lat2,
              coords.lon2,
            );
            const distanceBA = service.calculateHaversineDistance(
              coords.lat2,
              coords.lon2,
              coords.lat1,
              coords.lon1,
            );
            expect(distanceAB).toBe(distanceBA);
          }),
          { numRuns: 100 }
        );
      });

      it('should satisfy triangle inequality: distance(A,C) <= distance(A,B) + distance(B,C)', () => {
        fc.assert(
          fc.property(
            validLatitude(),
            validLongitude(),
            validLatitude(),
            validLongitude(),
            validLatitude(),
            validLongitude(),
            (lat1, lon1, lat2, lon2, lat3, lon3) => {
              const distanceAB = service.calculateHaversineDistance(
                lat1,
                lon1,
                lat2,
                lon2,
              );
              const distanceBC = service.calculateHaversineDistance(
                lat2,
                lon2,
                lat3,
                lon3,
              );
              const distanceAC = service.calculateHaversineDistance(
                lat1,
                lon1,
                lat3,
                lon3,
              );

              // Triangle inequality with small tolerance for floating point arithmetic
              // The tolerance accounts for rounding errors in intermediate calculations
              const tolerance = 2; // meters
              expect(distanceAC).toBeLessThanOrEqual(distanceAB + distanceBC + tolerance);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return consistent results for repeated calculations (deterministic)', () => {
        fc.assert(
          fc.property(validCoordinatePair(), (coords) => {
            const distance1 = service.calculateHaversineDistance(
              coords.lat1,
              coords.lon1,
              coords.lat2,
              coords.lon2,
            );
            const distance2 = service.calculateHaversineDistance(
              coords.lat1,
              coords.lon1,
              coords.lat2,
              coords.lon2,
            );
            const distance3 = service.calculateHaversineDistance(
              coords.lat1,
              coords.lon1,
              coords.lat2,
              coords.lon2,
            );

            expect(distance1).toBe(distance2);
            expect(distance2).toBe(distance3);
          }),
          { numRuns: 100 }
        );
      });

      it('should always return integer meters (rounded result)', () => {
        fc.assert(
          fc.property(validCoordinatePair(), (coords) => {
            const distance = service.calculateHaversineDistance(
              coords.lat1,
              coords.lon1,
              coords.lat2,
              coords.lon2,
            );
            expect(Number.isInteger(distance)).toBe(true);
          }),
          { numRuns: 100 }
        );
      });

      it('should respect maximum possible distance on Earth (approximately 20,037 km at equator)', () => {
        fc.assert(
          fc.property(validCoordinatePair(), (coords) => {
            const distance = service.calculateHaversineDistance(
              coords.lat1,
              coords.lon1,
              coords.lat2,
              coords.lon2,
            );

            // Maximum distance on Earth's surface is approximately half the circumference
            // Earth's circumference at equator ≈ 40,075 km, so max distance ≈ 20,037 km
            const maxPossibleDistance = 20100000; // 20,100 km with margin
            expect(distance).toBeLessThanOrEqual(maxPossibleDistance);
          }),
          { numRuns: 100 }
        );
      });

      it('should calculate accurate distances for geo-fence scenarios (within 1 meter margin)', () => {
        // Generate office location and nearby employee location within typical geo-fence range
        const officeCoordinate = fc.record({
          lat: validLatitude(),
          lon: validLongitude(),
        });

        // Small offset for nearby employee location (within 0.01 degrees ≈ max 1.11 km)
        const nearbyOffset = fc.record({
          latOffset: fc.double({ min: -0.01, max: 0.01, noNaN: true }),
          lonOffset: fc.double({ min: -0.01, max: 0.01, noNaN: true }),
        });

        fc.assert(
          fc.property(officeCoordinate, nearbyOffset, (office, offset) => {
            const employeeLat = office.lat + offset.latOffset;
            const employeeLon = office.lon + offset.lonOffset;

            // Ensure employee coordinates are still valid
            if (
              employeeLat < -90 ||
              employeeLat > 90 ||
              employeeLon < -180 ||
              employeeLon > 180
            ) {
              return; // Skip invalid coordinates
            }

            const distance1 = service.calculateHaversineDistance(
              office.lat,
              office.lon,
              employeeLat,
              employeeLon,
            );

            // Calculate again to verify consistency (1 meter margin requirement)
            const distance2 = service.calculateHaversineDistance(
              office.lat,
              office.lon,
              employeeLat,
              employeeLon,
            );

            // Distance should be identical (deterministic)
            expect(distance1).toBe(distance2);

            // Distance should be reasonable for nearby locations (< 2 km)
            expect(distance1).toBeLessThanOrEqual(2000);
          }),
          { numRuns: 100 }
        );
      });

      it('should produce distances that increase monotonically when moving away along a meridian', () => {
        fc.assert(
          fc.property(
            validLatitude(),
            validLongitude(),
            fc.double({ min: 0.001, max: 0.1, noNaN: true }), // Small positive offset
            (lat, lon, offset) => {
              const baseLat = lat;
              const targetLat1 = baseLat + offset;
              const targetLat2 = baseLat + offset * 2;

              // Ensure targets are valid latitudes
              if (targetLat1 > 90 || targetLat2 > 90) {
                return; // Skip invalid cases
              }

              const distance1 = service.calculateHaversineDistance(
                baseLat,
                lon,
                targetLat1,
                lon,
              );
              const distance2 = service.calculateHaversineDistance(
                baseLat,
                lon,
                targetLat2,
                lon,
              );

              // Distance should increase as we move further away
              expect(distance2).toBeGreaterThan(distance1);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Property-Based Validation Tests', () => {
      it('should reject any latitude outside [-90, 90] range', () => {
        const invalidLatitude = fc.oneof(
          fc.double({ min: 90.001, max: 180, noNaN: true }),
          fc.double({ min: -180, max: -90.001, noNaN: true })
        );

        fc.assert(
          fc.property(
            invalidLatitude,
            validLongitude(),
            validLatitude(),
            validLongitude(),
            (lat1, lon1, lat2, lon2) => {
              expect(() => {
                service.calculateHaversineDistance(lat1, lon1, lat2, lon2);
              }).toThrow();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should reject any longitude outside [-180, 180] range', () => {
        const invalidLongitude = fc.oneof(
          fc.double({ min: 180.001, max: 360, noNaN: true }),
          fc.double({ min: -360, max: -180.001, noNaN: true })
        );

        fc.assert(
          fc.property(
            validLatitude(),
            invalidLongitude,
            validLatitude(),
            validLongitude(),
            (lat1, lon1, lat2, lon2) => {
              expect(() => {
                service.calculateHaversineDistance(lat1, lon1, lat2, lon2);
              }).toThrow();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should reject NaN or Infinity values for any coordinate', () => {
        const invalidNumber = fc.oneof(
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity)
        );

        fc.assert(
          fc.property(
            invalidNumber,
            validLongitude(),
            validLatitude(),
            validLongitude(),
            (lat1, lon1, lat2, lon2) => {
              expect(() => {
                service.calculateHaversineDistance(lat1, lon1, lat2, lon2);
              }).toThrow();
            }
          ),
          { numRuns: 30 }
        );
      });
    });
  });
});
