import { IsString, IsNotEmpty, IsDateString } from "class-validator";

export class CreatePerformanceCycleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsDateString()
  dueDate: string;
}
