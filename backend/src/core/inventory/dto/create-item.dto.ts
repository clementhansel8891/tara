import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export enum InventoryCategory {
  RAW_MATERIAL = "raw_material",
  FINISHED_GOOD = "finished_good",
  CONSUMABLE = "consumable",
  ASSET = "asset",
  SPARE_PART = "spare_part",
}

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @IsString()
  @IsNotEmpty()
  uom: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsOptional()
  basePrice?: number;

  @IsOptional()
  taxRate?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString({ each: true })
  @IsOptional()
  moduleTags?: string[];

  @IsString()
  @IsOptional()
  status?: string;
}
