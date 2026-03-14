import { IsString, IsInt, IsOptional, IsNumber, IsEnum } from "class-validator";

export class CreateBudgetScenarioDto {
  @IsString()
  name: string;

  @IsInt()
  fiscalYear: number;

  @IsEnum(["DRAFT", "ACTIVE", "ARCHIVED"])
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  totalBudget?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
