import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsNumber,
  IsUUID,
  Min,
} from "class-validator";

export enum LeaveType {
  ANNUAL = "annual",
  SICK = "sick",
  PERSONAL = "personal",
  UNPAID = "unpaid",
  MATERNITY = "maternity",
  PATERNITY = "paternity",
  EMERGENCY = "emergency",
}

/**
 * Create Leave Request DTO
 * Validation for leave request creation
 */
export class CreateLeaveRequestDto {
  @IsUUID('4', { message: 'employee_id must be a valid UUID' })
  @IsNotEmpty()
  employee_id: string;

  @IsUUID('4', { message: 'department_id must be a valid UUID' })
  @IsNotEmpty()
  department_id: string;

  @IsEnum(LeaveType)
  leave_type: LeaveType;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @IsNumber()
  @Min(0.5)
  total_days: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
