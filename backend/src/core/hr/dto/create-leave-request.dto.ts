import { IsString, IsNotEmpty, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  UNPAID = 'unpaid',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  EMERGENCY = 'emergency',
}

/**
 * Create Leave Request DTO
 * Validation for leave request creation
 */
export class CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0.5)
  totalDays: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
