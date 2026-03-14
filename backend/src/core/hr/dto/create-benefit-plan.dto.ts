import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateBenefitPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['HEALTH', 'RETIREMENT', 'PERK', 'INSURANCE'])
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  employerContribution?: number;

  @IsNumber()
  @IsOptional()
  employeeContribution?: number;

  @IsEnum(['MONTHLY', 'ANNUALLY'])
  @IsOptional()
  frequency?: string;
}
