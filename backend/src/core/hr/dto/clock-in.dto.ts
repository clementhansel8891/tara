import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Clock In DTO
 * Validation for employee clock-in
 */
export class ClockInDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
