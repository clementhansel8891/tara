import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class StockIntakeDto {
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @IsString()
  @IsNotEmpty()
  location_id: string;

  @IsString()
  @IsOptional()
  department_id?: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_cost: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  reference_type?: string;

  @IsString()
  @IsOptional()
  reference_id?: string;

  @IsString()
  @IsOptional()
  created_by?: string;
}
