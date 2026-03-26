import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class JournalLineDto {
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value?.toString())
  debit: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value?.toString())
  credit: number;
}

export class CreateJournalDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  ref?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
