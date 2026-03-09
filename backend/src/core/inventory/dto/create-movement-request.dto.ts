import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNumber,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateMovementRequestLineDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  uom: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateMovementRequestDto {
  @IsEnum(["PO", "TRANSFER"])
  type: "PO" | "TRANSFER";

  @IsString()
  requestingLocationId: string;

  @IsOptional()
  @IsString()
  requestingAddress?: string;

  @IsEnum(["EXTERNAL", "INTERNAL"])
  sourceType: "EXTERNAL" | "INTERNAL";

  @IsOptional()
  @IsString()
  sourceLocationId?: string;

  @IsOptional()
  @IsString()
  supplierReference?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMovementRequestLineDto)
  lines: CreateMovementRequestLineDto[];

  @IsString()
  reason: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;
}
