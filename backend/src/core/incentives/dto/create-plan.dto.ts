import { IsString, IsOptional, IsEnum, IsBoolean, IsDate, IsArray, IsJSON } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIncentivePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  tenant_id: string;

  @IsString()
  company_id: string;

  @IsOptional()
  @IsString()
  branch_id?: string;

  @IsBoolean()
  is_active: boolean;

  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @IsEnum(['PRIORITY', 'COMBINE_ALL', 'MAX_VALUE'])
  conflict_strategy: 'PRIORITY' | 'COMBINE_ALL' | 'MAX_VALUE';

  @IsOptional()
  @IsJSON()
  metadata?: any;
}
