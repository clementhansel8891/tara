import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryCategory } from './create-item.dto';

export class ImportItemDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @IsString()
  uom: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moduleTags?: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;
}
