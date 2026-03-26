import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreatePricingRuleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  priority: number;

  @IsNotEmpty()
  @IsString()
  logic: string;

  @IsOptional()
  @IsNumber()
  floorPrice?: number;

  @IsOptional()
  @IsNumber()
  ceilingPrice?: number;

  @IsOptional()
  conditions?: any;

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
