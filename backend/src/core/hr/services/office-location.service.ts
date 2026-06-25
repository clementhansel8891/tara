import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { CreateOfficeLocationDto } from '../dto/create-office-location.dto';
import { UpdateOfficeLocationDto } from '../dto/update-office-location.dto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * OfficeLocationService
 * 
 * Service for managing office locations and geo-fence configurations.
 * Supports CRUD operations for office locations with GPS coordinates and geo-fence radius.
 * 
 * Task 10.3: Implement OfficeLocation management in Settings
 * 
 * References:
 * - Requirement 23.5: Store office coordinates (latitude, longitude) and geo-fence radius
 * - Requirement 23.6: Geo-fence radius configuration (50-1000 meters)
 * - Requirement 23.7: Support multiple office locations for multi-site organizations
 * - Requirement 23.8: Assign employees to specific office locations
 */
@Injectable()
export class OfficeLocationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new office location
   * 
   * @param createDto - Office location data
   * @returns Created office location
   * 
   * Validates:
   * - Geo-fence radius is between 50-1000 meters (Requirement 23.6)
   * - Latitude is between -90 and 90
   * - Longitude is between -180 and 180
   */
  async create(createDto: CreateOfficeLocationDto) {
    // Validate geo-fence radius (Requirement 23.6)
    if (createDto.geofence_radius_meters < 50 || createDto.geofence_radius_meters > 1000) {
      throw new BadRequestException(
        'Geo-fence radius must be between 50 and 1000 meters (Requirement 23.6)'
      );
    }

    // Validate coordinates
    this.validateCoordinates(createDto.latitude, createDto.longitude);

    // Create office location
    const officeLocation = await this.prisma.officeLocation.create({
      data: {
        location_name: createDto.location_name,
        address: createDto.address,
        latitude: new Decimal(createDto.latitude),
        longitude: new Decimal(createDto.longitude),
        geofence_radius_meters: createDto.geofence_radius_meters,
        is_active: createDto.is_active ?? true,
      },
    });

    return this.mapToResponse(officeLocation);
  }

  /**
   * Get all office locations
   * 
   * @param includeInactive - Whether to include inactive locations
   * @returns List of office locations
   * 
   * Supports multi-site organizations (Requirement 23.7)
   */
  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { is_active: true };

    const locations = await this.prisma.officeLocation.findMany({
      where,
      orderBy: {
        location_name: 'asc',
      },
    });

    return locations.map(loc => this.mapToResponse(loc));
  }

  /**
   * Get a single office location by ID
   * 
   * @param id - Office location ID
   * @returns Office location
   * @throws NotFoundException if location not found
   */
  async findOne(id: string) {
    const location = await this.prisma.officeLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Office location with ID ${id} not found`);
    }

    return this.mapToResponse(location);
  }

  /**
   * Update an office location
   * 
   * @param id - Office location ID
   * @param updateDto - Updated office location data
   * @returns Updated office location
   * @throws NotFoundException if location not found
   * 
   * Validates geo-fence radius and coordinates if provided
   */
  async update(id: string, updateDto: UpdateOfficeLocationDto) {
    // Check if location exists
    const existing = await this.prisma.officeLocation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Office location with ID ${id} not found`);
    }

    // Validate geo-fence radius if provided (Requirement 23.6)
    if (updateDto.geofence_radius_meters !== undefined) {
      if (updateDto.geofence_radius_meters < 50 || updateDto.geofence_radius_meters > 1000) {
        throw new BadRequestException(
          'Geo-fence radius must be between 50 and 1000 meters (Requirement 23.6)'
        );
      }
    }

    // Validate coordinates if provided
    if (updateDto.latitude !== undefined && updateDto.longitude !== undefined) {
      this.validateCoordinates(updateDto.latitude, updateDto.longitude);
    } else if (updateDto.latitude !== undefined || updateDto.longitude !== undefined) {
      throw new BadRequestException(
        'Both latitude and longitude must be provided together'
      );
    }

    // Build update data
    const updateData: any = {};
    if (updateDto.location_name !== undefined) updateData.location_name = updateDto.location_name;
    if (updateDto.address !== undefined) updateData.address = updateDto.address;
    if (updateDto.latitude !== undefined) updateData.latitude = new Decimal(updateDto.latitude);
    if (updateDto.longitude !== undefined) updateData.longitude = new Decimal(updateDto.longitude);
    if (updateDto.geofence_radius_meters !== undefined) {
      updateData.geofence_radius_meters = updateDto.geofence_radius_meters;
    }
    if (updateDto.is_active !== undefined) updateData.is_active = updateDto.is_active;
    updateData.updated_at = new Date();

    // Update office location
    const updated = await this.prisma.officeLocation.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(updated);
  }

  /**
   * Delete (soft delete by marking inactive) an office location
   * 
   * @param id - Office location ID
   * @throws NotFoundException if location not found
   * 
   * Note: We mark as inactive rather than hard delete to preserve
   * historical attendance records that reference this location
   */
  async remove(id: string) {
    const existing = await this.prisma.officeLocation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Office location with ID ${id} not found`);
    }

    await this.prisma.officeLocation.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return { message: 'Office location marked as inactive' };
  }

  /**
   * Assign an employee to an office location
   * 
   * @param employeeId - Employee ID
   * @param locationId - Office location ID
   * 
   * Implements Requirement 23.8: Assign employees to specific office locations
   */
  async assignEmployeeToLocation(employeeId: string, locationId: string) {
    // Verify location exists and is active
    const location = await this.prisma.officeLocation.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException(`Office location with ID ${locationId} not found`);
    }

    if (!location.is_active) {
      throw new BadRequestException('Cannot assign employee to inactive office location');
    }

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Update employee's office location
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        office_location_id: locationId,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Employee assigned to office location successfully',
      employee_id: employeeId,
      location_id: locationId,
      location_name: location.location_name,
    };
  }

  /**
   * Get employees assigned to an office location
   * 
   * @param locationId - Office location ID
   * @returns List of employees assigned to this location
   */
  async getEmployeesByLocation(locationId: string) {
    // Verify location exists
    const location = await this.prisma.officeLocation.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException(`Office location with ID ${locationId} not found`);
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        office_location_id: locationId,
      },
      select: {
        id: true,
        employee_code: true,
        full_name: true,
        email: true,
        department_id: true,
        employment_status: true,
      },
    });

    return {
      location_id: locationId,
      location_name: location.location_name,
      employee_count: employees.length,
      employees,
    };
  }

  /**
   * Validate GPS coordinates
   * 
   * @param latitude - Latitude in degrees
   * @param longitude - Longitude in degrees
   * @throws BadRequestException if coordinates are invalid
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new BadRequestException('Latitude and longitude must be numbers');
    }

    if (!isFinite(latitude) || !isFinite(longitude)) {
      throw new BadRequestException('Latitude and longitude must be finite numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException(
        `Latitude must be between -90 and 90 degrees (got ${latitude})`
      );
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException(
        `Longitude must be between -180 and 180 degrees (got ${longitude})`
      );
    }
  }

  /**
   * Map Prisma OfficeLocation to response format
   * 
   * @param location - Prisma OfficeLocation entity
   * @returns Formatted office location response
   */
  private mapToResponse(location: any) {
    return {
      id: location.id,
      location_name: location.location_name,
      address: location.address,
      latitude: parseFloat(location.latitude.toString()),
      longitude: parseFloat(location.longitude.toString()),
      geofence_radius_meters: location.geofence_radius_meters,
      is_active: location.is_active,
      created_at: location.created_at,
      updated_at: location.updated_at,
    };
  }
}
