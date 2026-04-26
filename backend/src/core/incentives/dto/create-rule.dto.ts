import { IsString, IsOptional, IsEnum, IsNumber, IsJSON, IsInt } from 'class-validator';

export class CreateIncentiveRuleDto {
  @IsString()
  plan_id: string;

  @IsInt()
  priority: number;

  @IsEnum(['SKU', 'CATEGORY', 'GLOBAL', 'TRANSACTION_TOTAL', 'TOTAL_VOLUME'])
  dimension: 'SKU' | 'CATEGORY' | 'GLOBAL' | 'TRANSACTION_TOTAL' | 'TOTAL_VOLUME';

  @IsOptional()
  @IsString()
  dimension_value?: string;

  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT', 'SLIDING_SCALE'])
  base_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'SLIDING_SCALE';

  @IsNumber()
  value: number;

  @IsOptional()
  @IsJSON()
  conditions?: any;

  @IsOptional()
  @IsJSON()
  scales?: { threshold: number; value: number }[];
}

