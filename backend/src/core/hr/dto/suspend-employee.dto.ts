import { IsString } from 'class-validator';

export class SuspendEmployeeDto {
  @IsString()
  reason: string;
}
