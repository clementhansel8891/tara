import { IsString, IsInt, IsNumber, IsDateString } from "class-validator";

export class CreateHeadcountPlanDto {
  @IsString()
  scenarioId: string;

  @IsString()
  departmentId: string;

  @IsString()
  positionTitle: string;

  @IsInt()
  targetHeadcount: number;

  @IsNumber()
  projectedSalary: number;

  @IsDateString()
  plannedHireDate: string;
}
