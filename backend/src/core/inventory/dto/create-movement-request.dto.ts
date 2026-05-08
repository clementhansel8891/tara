import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class CreateMovementRequestDto {
  @IsString()
  product_id: string;

  @IsString()
  from_location_id: string;

  @IsString()
  to_location_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  priority?: string;
  
  @IsString()
  reason: string;
}
