import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from "class-validator";
import { EmploymentStatus, EmploymentType } from "./create-employee.dto";

/**
 * Update Employee DTO
 * Partial update for employee records
 */
export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  managerId?: string;

  @IsString()
  @IsOptional()
  roleTitle?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  employmentType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  baseSalary?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @IsOptional()
  documentsMetadata?: any;

  @IsDateString()
  @IsOptional()
  terminationDate?: string;
}
