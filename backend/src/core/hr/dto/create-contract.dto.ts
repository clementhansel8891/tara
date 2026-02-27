import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from "class-validator";

export class CreateContractDto {
  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  url?: string;
}
