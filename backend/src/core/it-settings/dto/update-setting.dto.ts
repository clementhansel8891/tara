import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum SettingCategory {
  GENERAL = 'general',
  FINANCE = 'finance',
  HR = 'hr',
  SECURITY = 'security',
  INTEGRATION = 'integration',
}

export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsEnum(SettingCategory)
  @IsOptional()
  category?: SettingCategory;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
