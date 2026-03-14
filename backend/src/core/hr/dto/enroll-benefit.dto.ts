import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class EnrollBenefitDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsNumber()
  @IsOptional()
  coverageAmount?: number;
}
