import { IsString, IsUUID } from "class-validator";

export class CreateShiftSwapRequestDto {
  @IsUUID()
  requester_id: string;

  @IsUUID()
  target_id: string;

  @IsUUID()
  shift_id: string;

  @IsString()
  status: string;
}
