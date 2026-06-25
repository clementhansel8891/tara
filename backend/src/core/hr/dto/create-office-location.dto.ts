import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Create Office Location DTO
 * 
 * Task 10.3: Implement OfficeLocation management in Settings
 * 
 * Validates office location creation data including GPS coordinates
 * and geo-fence radius configuration.
 * 
 * References:
 * - Requirement 23.5: Store office coordinates and geo-fence radius
 * - Requirement 23.6: Geo-fence radius between 50-1000 meters
 */
export class CreateOfficeLocationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Location name must be at least 2 characters' })
  @MaxLength(255, { message: 'Location name must be at most 255 characters' })
  location_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Address must be at most 500 characters' })
  address?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(-90, { message: 'Latitude must be between -90 and 90 degrees' })
  @Max(90, { message: 'Latitude must be between -90 and 90 degrees' })
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(-180, { message: 'Longitude must be between -180 and 180 degrees' })
  @Max(180, { message: 'Longitude must be between -180 and 180 degrees' })
  longitude: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(50, { message: 'Geo-fence radius must be at least 50 meters (Requirement 23.6)' })
  @Max(1000, { message: 'Geo-fence radius must be at most 1000 meters (Requirement 23.6)' })
  geofence_radius_meters: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
