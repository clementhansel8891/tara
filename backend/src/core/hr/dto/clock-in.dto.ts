import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";

/**
 * Clock In DTO
 * Validation for employee clock-in
 * Requirements: 27.14 (input sanitization and validation)
 */
export class ClockInDto {
  @IsUUID('4', { message: 'employee_id must be a valid UUID' })
  @IsNotEmpty()
  employee_id: string;

  @IsString()
  @IsOptional()
  location_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
