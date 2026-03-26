import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class CreateMovementRequestDto {
  @IsString()
  productId: string;

  @IsString()
  fromLocationId: string;

  @IsString()
  toLocationId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  priority?: string;
  
  @IsString()
  reason: string;
}
