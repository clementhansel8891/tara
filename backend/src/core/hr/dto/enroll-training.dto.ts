import { IsString, IsNotEmpty } from 'class-validator';

export class EnrollTrainingDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  programId: string;
}
