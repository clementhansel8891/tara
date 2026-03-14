import { IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber } from "class-validator";

export class ScheduleInterviewDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @IsString()
  @IsNotEmpty()
  interviewerId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
