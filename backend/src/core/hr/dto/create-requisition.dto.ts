import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class CreateRequisitionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsNumber()
  @Min(1)
  openings: number;
}
