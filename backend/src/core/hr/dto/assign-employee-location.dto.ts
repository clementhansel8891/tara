import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Assign Employee to Office Location DTO
 * 
 * Task 10.3: Implement OfficeLocation management in Settings
 * 
 * Validates employee assignment to office location.
 * 
 * References:
 * - Requirement 23.8: Assign employees to specific office locations
 */
export class AssignEmployeeLocationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'Employee ID must be a valid UUID' })
  employee_id: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'Location ID must be a valid UUID' })
  location_id: string;
}
