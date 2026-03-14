import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PromoteEmployeeDto {
  @IsString()
  newRoleTitle: string;

  @IsNumber()
  @IsOptional()
  newBaseSalary?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
