import { IsString, IsNotEmpty, IsObject } from "class-validator";

export class CreateAgenticEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsObject()
  @IsNotEmpty()
  payload: any;
}
