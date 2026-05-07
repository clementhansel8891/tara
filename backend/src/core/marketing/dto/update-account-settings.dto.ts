import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateAccountSettingsDto {
  @IsNumber()
  @IsOptional()
  daily_budget_limit?: number;

  @IsString()
  @IsOptional()
  sync_frequency?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  metadata?: any;
}
