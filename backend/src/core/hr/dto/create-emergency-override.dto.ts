import { IsString, IsDateString, IsUUID } from "class-validator";

export class CreateEmergencyOverrideDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  reason: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
