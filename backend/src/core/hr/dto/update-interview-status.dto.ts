import { IsEnum, IsNotEmpty } from "class-validator";

export enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export class UpdateInterviewStatusDto {
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  status: InterviewStatus;
}
