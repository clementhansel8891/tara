import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

/**
 * DTO for incoming AWS fingerprint device webhook payloads.
 *
 * Validates:
 * - aws_employee_id: required string identifying the employee in the AWS device system
 * - aws_device_id: required string identifying the physical fingerprint device
 * - timestamp: required ISO 8601 formatted timestamp of the attendance event
 * - device_location: optional string describing the physical location of the device
 *
 * Requirements: 24.1, 24.3, 24.5
 */
export class AwsDeviceWebhookDto {
  @IsString()
  @IsNotEmpty({ message: 'aws_employee_id is required' })
  aws_employee_id: string;

  @IsString()
  @IsNotEmpty({ message: 'aws_device_id is required' })
  aws_device_id: string;

  @IsISO8601({}, { message: 'timestamp must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'timestamp is required' })
  timestamp: string;

  @IsString()
  @IsOptional()
  device_location?: string;
}
