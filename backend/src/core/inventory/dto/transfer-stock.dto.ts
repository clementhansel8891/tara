import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class TransferStockDto {
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @IsString()
  @IsNotEmpty()
  from_location_id: string;

  @IsString()
  @IsOptional()
  from_department_id?: string;

  @IsString()
  @IsNotEmpty()
  to_location_id: string;

  @IsString()
  @IsOptional()
  to_department_id?: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

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
