import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

/**
 * DTOs for AWS Device Mapping CRUD endpoints.
 *
 * Used by HR_Team in the Settings Page to manage mappings
 * between AWS fingerprint device employee IDs and TARA employee IDs.
 *
 * Requirements: 20.11, 24.4, 24.5
 * Task: 24.2
 */

/**
 * Body for creating a new AWS device mapping.
 */
export class CreateAwsDeviceMappingDto {
  /** Employee ID in the AWS fingerprint device system. */
  @IsString()
  @IsNotEmpty({ message: 'aws_employee_id is required' })
  aws_employee_id: string;

  /** TARA Employee UUID to map to. Must reference a real employee. */
  @IsUUID('4', { message: 'tara_employee_id must be a valid UUID' })
  @IsNotEmpty({ message: 'tara_employee_id is required' })
  tara_employee_id: string;

  /** Optional AWS device ID associated with this mapping. */
  @IsString()
  @IsOptional()
  aws_device_id?: string;

  /** Whether this mapping is active. Defaults to true. */
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * Body for updating an existing AWS device mapping.
 */
export class UpdateAwsDeviceMappingDto {
  /** Update the AWS employee ID. */
  @IsString()
  @IsOptional()
  aws_employee_id?: string;

  /** Update the TARA employee reference. Must reference a real employee. */
  @IsUUID('4', { message: 'tara_employee_id must be a valid UUID' })
  @IsOptional()
  tara_employee_id?: string;

  /** Update the AWS device ID. */
  @IsString()
  @IsOptional()
  aws_device_id?: string;

  /** Enable/disable this mapping. */
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
